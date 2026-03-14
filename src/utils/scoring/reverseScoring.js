/**
 * Reverse scoring lookup - "What raw performance do I need to score X points?"
 *
 * Given a target composite score and a gender/age bracket, compute the raw
 * exercise performance needed for each component at the implied percentage.
 *
 * Strategy: equal-percentage distribution - each component is targeted at
 * the same percentage of its maximum. E.g., target 85 means each component
 * at 85% of its max points. This is the fairest default baseline.
 */

import { getScoringTable } from './scoringTables.js'
import { EXERCISES, COMPONENT_WEIGHTS } from './constants.js'

// ── Exercises included per component (user-selectable alternatives shown) ────

export const COMPONENT_EXERCISES = {
  cardio:   [EXERCISES.RUN_2MILE, EXERCISES.HAMR],
  strength: [EXERCISES.PUSHUPS, EXERCISES.HRPU],
  core:     [EXERCISES.SITUPS, EXERCISES.CLRC, EXERCISES.PLANK],
  bodyComp: [EXERCISES.WHTR],
}

// Friendly labels for display
export const EXERCISE_DISPLAY = {
  [EXERCISES.RUN_2MILE]: '2-Mile Run',
  [EXERCISES.HAMR]:      'HAMR Shuttle',
  [EXERCISES.PUSHUPS]:   'Push-ups',
  [EXERCISES.HRPU]:      'Hand-Release Push-ups (HRPU)',
  [EXERCISES.SITUPS]:    'Sit-ups',
  [EXERCISES.CLRC]:      'Reverse Crunches (CLRC)',
  [EXERCISES.PLANK]:     'Forearm Plank',
  [EXERCISES.WHTR]:      'Waist-to-Height Ratio (WHtR)',
}

// Unit labels for display
export const EXERCISE_UNITS = {
  [EXERCISES.RUN_2MILE]: 'mm:ss',
  [EXERCISES.HAMR]:      'shuttles',
  [EXERCISES.PUSHUPS]:   'reps',
  [EXERCISES.HRPU]:      'reps',
  [EXERCISES.SITUPS]:    'reps',
  [EXERCISES.CLRC]:      'reps',
  [EXERCISES.PLANK]:     'mm:ss',
  [EXERCISES.WHTR]:      'ratio',
}

/**
 * Determine if an exercise is "lower is better" (time/ratio).
 */
function isLowerBetter(exercise) {
  return (
    exercise === EXERCISES.RUN_2MILE ||
    exercise === EXERCISES.WALK_2KM ||
    exercise === EXERCISES.WHTR
  )
}

/**
 * Format seconds to mm:ss string.
 */
function fmtTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

/**
 * Format a raw value for display depending on exercise type.
 */
export function formatReverseValue(exercise, rawValue) {
  if (rawValue === null || rawValue === undefined) return 'N/A'
  switch (exercise) {
    case EXERCISES.RUN_2MILE:
    case EXERCISES.PLANK:
      return fmtTime(rawValue)
    case EXERCISES.WHTR:
      return rawValue.toFixed(2)
    case EXERCISES.HAMR:
      return `${Math.round(rawValue)} shuttles`
    default:
      return `${Math.round(rawValue)} reps`
  }
}

/**
 * Reverse lookup: find the raw performance threshold that achieves
 * at least `targetPts` points for a given exercise/gender/ageBracket.
 *
 * Returns { threshold, points } or null if not achievable.
 *
 * For lower-is-better (run, whtr): threshold is the LARGEST allowed value
 *   that still earns >= targetPts. The user can be AT or BELOW this value.
 *
 * For higher-is-better (reps, plank, HAMR): threshold is the MINIMUM value
 *   that earns >= targetPts. The user must reach AT LEAST this value.
 */
export function reverseLookup(exercise, targetPts, gender, ageBracket) {
  const table = getScoringTable(gender, ageBracket, exercise)
  if (!table || table.length === 0) return null

  const lower = isLowerBetter(exercise)

  if (lower) {
    // Table sorted ascending by threshold (best/fastest first = most pts).
    // Find the LARGEST threshold (worst time/ratio) where points >= targetPts.
    let bestThreshold = null
    let bestPoints = null
    for (const row of table) {
      if (row.points >= targetPts) {
        bestThreshold = row.threshold
        bestPoints = row.points
      }
    }
    if (bestThreshold === null) return null
    return { threshold: bestThreshold, points: bestPoints }
  } else {
    // Reps/plank/HAMR: table sorted descending (most reps first = most pts).
    // Find the SMALLEST threshold (minimum reps) where points >= targetPts.
    let bestThreshold = null
    let bestPoints = null
    for (let i = table.length - 1; i >= 0; i--) {
      if (table[i].points >= targetPts) {
        bestThreshold = table[i].threshold
        bestPoints = table[i].points
      }
    }
    if (bestThreshold === null) return null
    return { threshold: bestThreshold, points: bestPoints }
  }
}

/**
 * Generate a full "what do I need?" target table given:
 *   - targetComposite: number (e.g. 85)
 *   - gender: 'M' | 'F'
 *   - ageBracket: age bracket constant
 *
 * Returns an array of component rows, each with exercise results.
 *
 * Uses equal-percentage distribution: target % = targetComposite / 100,
 * then multiply by component max points to get target component points.
 */
export function generateTargetTable(targetComposite, gender, ageBracket) {
  // Clamp to valid range
  const target = Math.max(60, Math.min(100, targetComposite))
  const targetPct = target / 100 // e.g. 0.85 for score of 85

  const rows = []

  for (const [component, exercises] of Object.entries(COMPONENT_EXERCISES)) {
    const maxPts = COMPONENT_WEIGHTS[component] // e.g. 50 for cardio
    const targetPts = targetPct * maxPts        // e.g. 42.5 for cardio at 85%

    const exerciseResults = exercises.map(exercise => {
      const result = reverseLookup(exercise, targetPts, gender, ageBracket)
      return {
        exercise,
        label: EXERCISE_DISPLAY[exercise],
        unit: EXERCISE_UNITS[exercise],
        rawValue: result ? result.threshold : null,
        displayValue: result ? formatReverseValue(exercise, result.threshold) : 'Off chart',
        achievedPts: result ? result.points : null,
        lowerIsBetter: isLowerBetter(exercise),
      }
    })

    rows.push({
      component,
      maxPts,
      targetPts: Math.round(targetPts * 10) / 10,
      exercises: exerciseResults,
    })
  }

  return rows
}
