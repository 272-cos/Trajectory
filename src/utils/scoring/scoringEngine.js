/**
 * PFA Scoring Engine - Pure functions for score calculation
 * Supports partial component testing and exemptions
 */

import { getScoringTable } from './scoringTables.js'
import {
  COMPONENT_WEIGHTS,
  COMPONENT_MINIMUMS,
  PASSING_COMPOSITE,
  EXERCISES,
  getWalkTimeLimit,
} from './constants.js'

/**
 * Look up points for a given performance
 * @param {string} exercise - Exercise type
 * @param {number} value - Performance value (reps, seconds, ratio)
 * @param {string} gender - 'M' or 'F'
 * @param {string} ageBracket - Age bracket constant
 * @returns {{points: number, maxPoints: number, percentage: number}|null}
 */
export function lookupScore(exercise, value, gender, ageBracket) {
  if (value === null || value === undefined) {
    return null // Not tested
  }

  // Negative values are physically impossible for any exercise
  if (value < 0) {
    return null
  }

  // Zero time/ratio is physically impossible for lower-is-better exercises
  // (0-second run, 0 WHtR). Zero reps are valid per SL-10 (chart minimum).
  if (value === 0 && (
    exercise === EXERCISES.RUN_2MILE ||
    exercise === EXERCISES.WALK_2KM ||
    exercise === EXERCISES.WHTR
  )) {
    return null
  }

  const table = getScoringTable(gender, ageBracket, exercise)
  if (!table || table.length === 0) {
    console.error(`No scoring table found for ${exercise}`)
    return null
  }

  // SL-05 / EC-06: WHtR is rounded to 2 decimals before lookup
  // e.g. raw ratio 0.494 → 0.49 (20.0 pts), 0.495 → 0.50 (19.0 pts)
  const lookupValue =
    exercise === EXERCISES.WHTR ? Math.round(value * 100) / 100 : value

  // For times (run, plank): lower is better, threshold is MAX time
  // For reps (pushups, situps): higher is better, threshold is MIN reps
  // For WHtR: lower is better, threshold is MAX ratio

  const isTimeBasedExercise =
    exercise === EXERCISES.RUN_2MILE ||
    exercise === EXERCISES.WALK_2KM ||
    exercise === EXERCISES.WHTR

  const isRepsBasedExercise =
    exercise === EXERCISES.PUSHUPS ||
    exercise === EXERCISES.HRPU ||
    exercise === EXERCISES.SITUPS ||
    exercise === EXERCISES.CLRC ||
    exercise === EXERCISES.HAMR

  const isPlank = exercise === EXERCISES.PLANK

  // SL-10/EC-10: 0 reps/seconds on a non-exempt component → chart minimum
  // points (same clamp as EC-01 below-chart-min), never 0.
  // (distinct from null = untested; pass:false is enforced at component level)

  let points = 0
  let matched = false

  if (isTimeBasedExercise || exercise === EXERCISES.WHTR) {
    // Lower is better - table sorted ascending (fastest/lowest first = max points)
    for (let i = 0; i < table.length; i++) {
      if (lookupValue <= table[i].threshold) {
        points = table[i].points
        matched = true
        break
      }
    }
    // Worse than every chart entry → clamp to minimum chart points (never 0)
    if (!matched) {
      points = table[table.length - 1].points
    }
  } else if (isRepsBasedExercise || isPlank) {
    // Higher is better - table sorted descending (highest reps/time first = max points)
    for (let i = 0; i < table.length; i++) {
      if (lookupValue >= table[i].threshold) {
        points = table[i].points
        matched = true
        break
      }
    }
    // Worse than every chart entry → clamp to minimum chart points (never 0)
    if (!matched) {
      points = table[table.length - 1].points
    }
  }

  const maxPoints = table[0].points
  const percentage = (points / maxPoints) * 100

  return { points, maxPoints, percentage }
}

/**
 * Calculate component score
 * @param {object} component - Component data
 * @param {string} gender - 'M' or 'F'
 * @param {string} ageBracket - Age bracket constant
 * @returns {object} Component score result
 */
export function calculateComponentScore(component, gender, ageBracket) {
  const {
    type, // 'cardio', 'strength', 'core', 'bodyComp'
    exercise, // specific exercise
    value, // performance value
    exempt = false,
  } = component

  // Handle exemption
  if (exempt) {
    return {
      tested: false,
      exempt: true,
      points: 0,
      maxPoints: 0,
      percentage: null,
      pass: true, // Exempt components don't fail
    }
  }

  // Handle not tested (partial assessment)
  if (value === null || value === undefined) {
    return {
      tested: false,
      exempt: false,
      points: null,
      maxPoints: getMaxPointsForComponent(type),
      percentage: null,
      pass: null,
    }
  }

  // SL-07: 2km walk contributes 0 earned / 0 possible to composite.
  // Walk has no scoring table (it is pass/fail, not point-scored); skip
  // the lookup entirely so no spurious table-missing warnings are emitted.
  if (exercise === EXERCISES.WALK_2KM) {
    // Determine pass/fail: explicit walkPass overrides, otherwise check time limit
    let walkPass = true
    const timeLimit = getWalkTimeLimit(gender, ageBracket)

    if (component.walkPass !== undefined && component.walkPass !== null) {
      // Explicit pass/fail from user input or S-code
      walkPass = component.walkPass
    } else if (timeLimit && value) {
      // Auto-determine from time limit table
      walkPass = value <= timeLimit
    }

    return {
      tested: true,
      exempt: false,
      walkOnly: true,
      points: 0,
      maxPoints: getMaxPointsForComponent(type),
      percentage: 0,
      pass: walkPass, // EC-05: walk fail = overall FAIL
      walkTimeLimit: timeLimit,
    }
  }

  // Calculate score
  const scoreResult = lookupScore(exercise, value, gender, ageBracket)
  const walkOnly = false

  if (!scoreResult) {
    return {
      tested: true,
      exempt: false,
      walkOnly,
      points: 0,
      maxPoints: getMaxPointsForComponent(type),
      percentage: 0,
      pass: false,
      error: 'Unable to calculate score',
    }
  }

  const { points, percentage } = scoreResult
  const maxPoints = getMaxPointsForComponent(type)
  const minimum = COMPONENT_MINIMUMS[type] || 0
  // SL-10: 0 reps/seconds always fails the component regardless of points
  const pass = value === 0 ? false : percentage >= minimum

  return {
    tested: true,
    exempt: false,
    walkOnly, // SL-07: true when exercise is 2km walk
    points,
    maxPoints,
    percentage,
    pass,
    minimum,
  }
}

/**
 * Get max points for a component type
 * @param {string} type - Component type
 * @returns {number}
 */
function getMaxPointsForComponent(type) {
  return COMPONENT_WEIGHTS[type] || 0
}

/**
 * Calculate composite score from all components
 * @param {Array} componentResults - Array of component score results
 * @returns {object} Composite score result
 */
export function calculateCompositeScore(componentResults) {
  let totalEarned = 0
  let totalPossible = 0
  let allComponentsPass = true
  const testedComponents = []
  const exemptComponents = []
  const walkComponents = []
  const failedComponents = []

  componentResults.forEach(result => {
    if (result.exempt) {
      exemptComponents.push(result)
      // Exempt: 0 earned, 0 possible
      return
    }

    // SL-07: 2km walk → 0 earned, 0 possible; does not affect pass gate
    if (result.walkOnly) {
      walkComponents.push(result)
      return
    }

    if (!result.tested || result.points === null) {
      // Not tested - don't include in composite
      return
    }

    testedComponents.push(result)
    totalEarned += result.points
    totalPossible += result.maxPoints

    if (!result.pass) {
      allComponentsPass = false
      failedComponents.push(result)
    }
  })

  // Can't calculate composite without all components accounted for (tested/exempt/walk)
  const totalComponents = componentResults.length
  const testedOrExempt =
    testedComponents.length + exemptComponents.length + walkComponents.length

  if (testedOrExempt < totalComponents) {
    return {
      composite: null,
      pass: null,
      totalEarned,
      totalPossible,
      testedComponents,
      exemptComponents,
      walkComponents,
      failedComponents,
      partialAssessment: true,
    }
  }

  // All exempt/walk = special case (no scorable components)
  if (totalPossible === 0) {
    return {
      composite: null,
      pass: null,
      totalEarned: 0,
      totalPossible: 0,
      testedComponents: [],
      exemptComponents,
      walkComponents,
      failedComponents: [],
      allExempt: true,
    }
  }

  // SL-06: composite = round((earned/possible)*100, 1) - official rounding
  // Round BEFORE the pass check so the displayed value matches the decision.
  const composite = Math.round((totalEarned / totalPossible) * 1000) / 10
  const compositePass = composite >= PASSING_COMPOSITE
  // EC-05: Walk failed = overall FAIL regardless of composite
  const walkFailed = walkComponents.some(w => w.pass === false)
  const overallPass = compositePass && allComponentsPass && !walkFailed

  return {
    composite, // SL-06: already rounded to 1 decimal
    pass: overallPass,
    totalEarned,
    totalPossible,
    testedComponents,
    exemptComponents,
    walkComponents, // SL-07: walk results tracked but excluded from composite
    failedComponents,
    compositePass,
    allComponentsPass,
  }
}

/**
 * Calculate WHtR from height and waist measurements
 * @param {number} waistInches - Waist measurement in inches
 * @param {number} heightInches - Height in inches
 * @returns {number} WHtR rounded to 2 decimals
 */
export function calculateWHtR(waistInches, heightInches) {
  if (!waistInches || !heightInches || heightInches === 0) {
    return null
  }
  const ratio = waistInches / heightInches
  return Math.round(ratio * 100) / 100
}

/**
 * Format time in seconds to mm:ss
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
export function formatTime(seconds) {
  if (!seconds && seconds !== 0) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse time string to seconds
 * @param {string} timeStr - Time in "mm:ss" or "seconds" format
 * @returns {number|null} Time in seconds
 */
/**
 * Check if a time string is still being typed (incomplete but not invalid)
 * @param {string} timeStr - Raw input string
 * @returns {boolean} True if input looks incomplete (e.g. "18:", "1:")
 */
export function isTimeIncomplete(timeStr) {
  if (!timeStr) return false
  // Trailing colon means user just typed the separator, waiting for seconds
  if (timeStr.endsWith(':')) return true
  // Single digit after colon means user is still typing seconds (e.g. "18:3")
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':')
    if (parts[1] && parts[1].length === 1) return true
  }
  return false
}

/**
 * IV-12: Convert HAMR time (mm:ss) to shuttle count
 * Based on standard 20m shuttle run Leger protocol
 * Round down to last completed shuttle
 * @param {string} timeStr - Time in "mm:ss" format
 * @returns {number|null} Shuttle count
 */
export function hamrTimeToShuttles(timeStr) {
  const seconds = parseTime(timeStr)
  if (seconds === null || seconds <= 0) return null

  // Standard Leger 20m shuttle run protocol
  // Level 1 starts at 8.0 km/h, level 2 at 9.0, then +0.5 per level
  const levels = [
    { speed: 8.0,  shuttles: 7  },
    { speed: 9.0,  shuttles: 8  },
    { speed: 9.5,  shuttles: 8  },
    { speed: 10.0, shuttles: 9  },
    { speed: 10.5, shuttles: 9  },
    { speed: 11.0, shuttles: 10 },
    { speed: 11.5, shuttles: 10 },
    { speed: 12.0, shuttles: 11 },
    { speed: 12.5, shuttles: 11 },
    { speed: 13.0, shuttles: 11 },
    { speed: 13.5, shuttles: 12 },
    { speed: 14.0, shuttles: 12 },
    { speed: 14.5, shuttles: 13 },
    { speed: 15.0, shuttles: 13 },
    { speed: 15.5, shuttles: 13 },
    { speed: 16.0, shuttles: 14 },
    { speed: 16.5, shuttles: 14 },
    { speed: 17.0, shuttles: 15 },
    { speed: 17.5, shuttles: 15 },
    { speed: 18.0, shuttles: 16 },
    { speed: 18.5, shuttles: 16 },
  ]

  let elapsed = 0
  let totalShuttles = 0

  for (const level of levels) {
    const timePerShuttle = 72 / level.speed // 20m / (speed in m/s)
    for (let s = 0; s < level.shuttles; s++) {
      elapsed += timePerShuttle
      if (elapsed > seconds) return totalShuttles
      totalShuttles++
    }
  }

  return totalShuttles
}

export function parseTime(timeStr) {
  if (!timeStr) return null

  // If it contains a colon, parse as mm:ss
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':')
    if (parts.length !== 2) return null
    const mins = parseInt(parts[0], 10)
    const secs = parseInt(parts[1], 10)
    if (isNaN(mins) || isNaN(secs) || mins < 0 || mins > 99 || secs < 0 || secs >= 60) return null
    const total = mins * 60 + secs
    return total > 0 ? total : null
  }

  // No colon: 1-2 digit number treated as minutes (e.g. "19" -> 19:00 = 1140s)
  // 3+ digit number treated as total seconds (e.g. "810" -> 810s = 13:30)
  const n = parseInt(timeStr, 10)
  if (isNaN(n) || n <= 0) return null
  return timeStr.trim().length <= 2 ? n * 60 : n
}
