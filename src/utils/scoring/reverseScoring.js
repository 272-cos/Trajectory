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
import { EXERCISES, COMPONENTS, COMPONENT_WEIGHTS, COMPONENTS_WITH_CHART_FLOOR_MINIMUM } from './constants.js'
import { computeOptimalAllocation } from './optimalAllocation.js'

// Map exercise to its parent component type
const EXERCISE_TO_COMPONENT = {
  [EXERCISES.RUN_2MILE]: COMPONENTS.CARDIO,
  [EXERCISES.HAMR]:      COMPONENTS.CARDIO,
  [EXERCISES.WALK_2KM]:  COMPONENTS.CARDIO,
  [EXERCISES.PUSHUPS]:   COMPONENTS.STRENGTH,
  [EXERCISES.HRPU]:      COMPONENTS.STRENGTH,
  [EXERCISES.SITUPS]:    COMPONENTS.CORE,
  [EXERCISES.CLRC]:      COMPONENTS.CORE,
  [EXERCISES.PLANK]:     COMPONENTS.CORE,
  [EXERCISES.WHTR]:      COMPONENTS.BODY_COMP,
}

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
 *   - currentScores: (optional) per-component current data for personalized mode
 *
 * Returns an array of component rows, each with exercise results.
 *
 * When currentScores is null (default): uses equal-percentage distribution.
 * When currentScores is provided: uses optimal allocation (minimum-effort path)
 * to compute personalized per-component targets.
 */
export function generateTargetTable(targetComposite, gender, ageBracket, currentScores = null) {
  // When we have current scores, use the optimal allocation engine
  if (currentScores) {
    return generatePersonalizedTable(targetComposite, gender, ageBracket, currentScores)
  }

  // Fallback: equal-percentage distribution (legacy behavior)
  return generateEqualPercentageTable(targetComposite, gender, ageBracket)
}

/**
 * Equal-percentage distribution (original behavior).
 * Target % = targetComposite / 100, applied to each component equally.
 */
function generateEqualPercentageTable(targetComposite, gender, ageBracket) {
  const target = Math.max(60, Math.min(100, targetComposite))
  const targetPct = target / 100

  const rows = []

  for (const [component, exercises] of Object.entries(COMPONENT_EXERCISES)) {
    const maxPts = COMPONENT_WEIGHTS[component]
    const targetPts = targetPct * maxPts

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
      isOptimized: false,
    })
  }

  return rows
}

/**
 * Personalized optimal allocation.
 * Uses greedy marginal-cost algorithm to find the minimum-effort path
 * from current scores to the target composite.
 */
function generatePersonalizedTable(targetComposite, gender, ageBracket, currentScores) {
  const target = Math.max(60, Math.min(100, targetComposite))

  const allocation = computeOptimalAllocation(currentScores, target, { gender, ageBracket })

  const rows = []

  for (const [component, exercises] of Object.entries(COMPONENT_EXERCISES)) {
    const maxPts = COMPONENT_WEIGHTS[component]
    const compAlloc = allocation.components[component]

    // Use optimized target points if available, otherwise fall back to equal pct
    const targetPts = (compAlloc && !compAlloc.exempt)
      ? compAlloc.targetPts
      : (target / 100) * maxPts

    const currentPts = (compAlloc && !compAlloc.exempt) ? compAlloc.currentPts : null
    const ptsGain = (compAlloc && !compAlloc.exempt) ? compAlloc.ptsGain : null
    const effortWeeks = (compAlloc && !compAlloc.exempt) ? compAlloc.effortWeeks : null

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
      currentPts,
      ptsGain: ptsGain !== null ? Math.round(ptsGain * 10) / 10 : null,
      effortWeeks: effortWeeks !== null ? Math.round(effortWeeks * 10) / 10 : null,
      exercises: exerciseResults,
      isOptimized: true,
      belowMinimum: compAlloc?.belowMinimum ?? false,
      isBestBangForBuck: allocation.bestBangForBuck === component,
    })
  }

  // Attach summary metadata to the array (non-enumerable to not break iteration)
  rows.totalEffortWeeks = allocation.totalEffortWeeks
  rows.achievable = allocation.achievable
  rows.currentComposite = allocation.currentComposite

  return rows
}

/**
 * Get the minimum performance required to register points for a component.
 *
 * Per DAFMAN 36-2905 §3.7.4, the asterisk (*) row is the chart floor.
 * Performance at or above the * row earns points; below earns 0 and fails
 * the component. This returns the * row threshold (last row in the table).
 *
 * Body Composition has no per-component minimum (§3.7.1) - returns null.
 * 2km Walk is pass/fail only - returns null.
 *
 * @param {string} exercise - Exercise type constant (EXERCISES.*)
 * @param {string} ageBracket - Age bracket constant (AGE_BRACKETS.*)
 * @param {string} gender - 'M' or 'F'
 * @returns {{ threshold: number, points: number, displayValue: string, unit: string }|null}
 */
export function getMinimumToPass(exercise, ageBracket, gender) {
  const component = EXERCISE_TO_COMPONENT[exercise]
  if (!component) return null

  // Walk has no point scoring (pass/fail only) - no minimum threshold concept
  if (exercise === EXERCISES.WALK_2KM) return null

  // Body Composition has no per-component minimum (DAFMAN 36-2905 §3.7.1)
  if (!COMPONENTS_WITH_CHART_FLOOR_MINIMUM.has(component)) return null

  const table = getScoringTable(gender, ageBracket, exercise)
  if (!table || table.length === 0) return null

  // The * row is the last row - the lowest threshold that still earns any points
  const lastRow = table[table.length - 1]
  return {
    threshold: lastRow.threshold,
    points: lastRow.points,
    displayValue: formatReverseValue(exercise, lastRow.threshold),
    unit: EXERCISE_UNITS[exercise],
  }
}
