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
} from './constants.js'

/**
 * Look up points for a given performance
 * @param {string} exercise - Exercise type
 * @param {number} value - Performance value (reps, seconds, ratio)
 * @param {string} gender - 'M' or 'F'
 * @param {string} ageGroup - Age group constant
 * @returns {{points: number, maxPoints: number, percentage: number}|null}
 */
export function lookupScore(exercise, value, gender, ageGroup) {
  if (value === null || value === undefined) {
    return null // Not tested
  }

  const table = getScoringTable(gender, ageGroup, exercise)
  if (!table || table.length === 0) {
    console.error(`No scoring table found for ${exercise}`)
    return null
  }

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

  // SL-02: 0 reps/seconds = did not attempt → 0 points
  // (distinct from null = untested, and from below-min = minimum chart points)
  if ((isRepsBasedExercise || isPlank) && value === 0) {
    return { points: 0, maxPoints: table[0].points, percentage: 0 }
  }

  let points = 0
  let matched = false

  if (isTimeBasedExercise || exercise === EXERCISES.WHTR) {
    // Lower is better – table sorted ascending (fastest/lowest first = max points)
    for (let i = 0; i < table.length; i++) {
      if (value <= table[i].threshold) {
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
    // Higher is better – table sorted descending (highest reps/time first = max points)
    for (let i = 0; i < table.length; i++) {
      if (value >= table[i].threshold) {
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
 * @param {string} ageGroup - Age group constant
 * @returns {object} Component score result
 */
export function calculateComponentScore(component, gender, ageGroup) {
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

  // Calculate score
  const scoreResult = lookupScore(exercise, value, gender, ageGroup)
  if (!scoreResult) {
    return {
      tested: true,
      exempt: false,
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
  const pass = percentage >= minimum

  return {
    tested: true,
    exempt: false,
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
  const failedComponents = []

  componentResults.forEach(result => {
    if (result.exempt) {
      exemptComponents.push(result)
      // Exempt: 0 earned, 0 possible
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

  // Can't calculate composite without all 4 components (unless exempt)
  const totalComponents = componentResults.length
  const testedOrExempt = testedComponents.length + exemptComponents.length

  if (testedOrExempt < totalComponents) {
    return {
      composite: null,
      pass: null,
      totalEarned,
      totalPossible,
      testedComponents,
      exemptComponents,
      failedComponents,
      partialAssessment: true,
    }
  }

  // All exempt = special case
  if (totalPossible === 0) {
    return {
      composite: null,
      pass: null,
      totalEarned: 0,
      totalPossible: 0,
      testedComponents: [],
      exemptComponents,
      failedComponents: [],
      allExempt: true,
    }
  }

  const composite = (totalEarned / totalPossible) * 100
  const compositePass = composite >= PASSING_COMPOSITE
  const overallPass = compositePass && allComponentsPass

  return {
    composite: Math.round(composite * 10) / 10, // Round to 1 decimal
    pass: overallPass,
    totalEarned,
    totalPossible,
    testedComponents,
    exemptComponents,
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
export function parseTime(timeStr) {
  if (!timeStr) return null

  // If it contains a colon, parse as mm:ss
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':')
    const mins = parseInt(parts[0], 10) || 0
    const secs = parseInt(parts[1], 10) || 0
    return mins * 60 + secs
  }

  // No colon: treat as whole minutes (e.g. "18" → 18:00 → 1080 s)
  const mins = parseInt(timeStr, 10)
  return mins ? mins * 60 : null
}
