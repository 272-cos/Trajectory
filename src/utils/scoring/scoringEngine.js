/**
 * PFA Scoring Engine - Pure functions for score calculation
 * Supports partial component testing and exemptions
 */

import { getScoringTable } from './scoringTables.js'
import {
  COMPONENT_WEIGHTS,
  COMPONENTS_WITH_CHART_FLOOR_MINIMUM,
  PASSING_COMPOSITE,
  EXERCISES,
  getWalkTimeLimit,
} from './constants.js'

// Per DAFMAN 36-2905 §3.7.4: a component passes its floor minimum when points > 0.
// Below the * row = 0 external points = component failure.
// DAFMAN §3.7.1: Body Composition has no per-component minimum → always passes here.
function componentMinimumMet(type, points) {
  if (!COMPONENTS_WITH_CHART_FLOOR_MINIMUM.has(type)) return true
  return points > 0
}

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

  // SL-05 / EC-06: WHtR is TRUNCATED (not rounded) to 2 decimals before lookup.
  // DAFMAN 36-2905 §3.15.4.2: "WHtR results are truncated (not rounded) to the
  // first two [decimals]". e.g. 0.494 → 0.49 (20.0 pts), 0.499 → 0.49 (20.0 pts),
  // 0.559 → 0.55 (passing), 0.560 → 0.56.
  const lookupValue =
    exercise === EXERCISES.WHTR ? Math.floor(value * 100) / 100 : value

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

  // Two-number model (boss directive 2026-04-16, `docs/SCORING-STRATEGY-DISCUSSION.md`):
  //   `points`         — DAFMAN-literal external value. Display/composite/PDF/S-code.
  //                      0 when performance is below the chart's required minimum
  //                      threshold, per DAFMAN 36-2905 §3.7.4: "Repetition/durations
  //                      below the required minimum receive a component score of zero."
  //   `internalPoints` — continuous tracking value for projection/ROI/training math.
  //                      Chart-minimum clamp on off-chart-low (the old clamp behavior).
  //                      NEVER rendered to users; full D1 spec (linear extrapolation
  //                      below floor) lands in the D1 PR.
  // WHtR is exempt from the §3.7.4 sub-min rule (BC has no component minimum per
  // §3.7.1); its chart already encodes 0 points for ≥0.60, so the two values coincide.

  let points = 0
  let internalPoints = 0
  let matched = false

  if (isTimeBasedExercise || exercise === EXERCISES.WHTR) {
    // Lower is better - table sorted ascending (fastest/lowest first = max points)
    for (let i = 0; i < table.length; i++) {
      if (lookupValue <= table[i].threshold) {
        points = table[i].points
        internalPoints = table[i].points
        matched = true
        break
      }
    }
    if (!matched) {
      const chartMin = table[table.length - 1].points
      internalPoints = chartMin // continuous tracking number
      // External: WHtR uses chart-last (which is 0 for ≥0.60); run/walk → 0 per §3.7.4.
      points = exercise === EXERCISES.WHTR ? chartMin : 0
    }
  } else if (isRepsBasedExercise || isPlank) {
    // Higher is better - table sorted descending (highest reps/time first = max points)
    for (let i = 0; i < table.length; i++) {
      if (lookupValue >= table[i].threshold) {
        points = table[i].points
        internalPoints = table[i].points
        matched = true
        break
      }
    }
    if (!matched) {
      // External 0 per DAFMAN §3.7.4; internal preserves chart-minimum for trajectory math.
      internalPoints = table[table.length - 1].points
      points = 0
    }
  }

  const maxPoints = table[0].points
  const percentage = (points / maxPoints) * 100

  return { points, maxPoints, percentage, internalPoints }
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
      internalPoints: 0,
      maxPoints: getMaxPointsForComponent(type),
      percentage: 0,
      pass: false,
      error: 'Unable to calculate score',
    }
  }

  const { points, percentage, internalPoints } = scoreResult
  const maxPoints = getMaxPointsForComponent(type)
  // §3.7.4: component passes only when points > 0 (at or above the * row).
  // §3.7.1: Body Comp has no floor minimum - componentMinimumMet returns true.
  const pass = componentMinimumMet(type, points)
  // belowMinimum: component was tested but scored 0 pts (below * row).
  // Preserves upstream display/cascade semantics (shows "FAIL - 0 toward composite").
  const belowMinimum = !pass

  return {
    tested: true,
    exempt: false,
    walkOnly, // SL-07: true when exercise is 2km walk
    points, // DAFMAN-literal external, 0 when below * row per §3.7.4
    internalPoints, // continuous tracking number; NEVER rendered (boss directive)
    maxPoints,
    percentage,
    pass,
    belowMinimum,
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
  const belowMinimumComponents = []

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

    // Below-minimum: component scored but failed per-component minimum.
    // Tracked separately for UI hints and pass cascade, but earned points
    // STILL contribute to composite (DAFMAN composite is sum of earned points).
    if (result.belowMinimum) {
      belowMinimumComponents.push(result)
      failedComponents.push(result)
      allComponentsPass = false
    } else if (!result.pass) {
      failedComponents.push(result)
      allComponentsPass = false
    }

    testedComponents.push(result)
    totalEarned += result.points
    totalPossible += result.maxPoints
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
      belowMinimumComponents,
      partialAssessment: true,
    }
  }

  // All exempt/walk = no scorable components (EC-03)
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
      belowMinimumComponents: [],
      allExempt: true,
    }
  }

  // SL-06: composite = round((earned/possible)*100, 1) - official rounding.
  // All tested components contribute, including below-min (DAFMAN composite is
  // sum of earned points). Below-min is gated separately via allComponentsPass.
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
    belowMinimumComponents, // Components that failed per-component minimum (0 to composite)
    compositePass,
    allComponentsPass,
  }
}

/**
 * Calculate WHtR from height and waist measurements
 * @param {number} waistInches - Waist measurement in inches
 * @param {number} heightInches - Height in inches
 * @returns {number} WHtR truncated to 2 decimals (DAFMAN 36-2905 §3.15.4.2)
 */
export function calculateWHtR(waistInches, heightInches) {
  if (!waistInches || !heightInches || heightInches === 0) {
    return null
  }
  const ratio = waistInches / heightInches
  return Math.floor(ratio * 100) / 100
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
