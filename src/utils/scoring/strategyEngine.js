/**
 * Effort-Weighted Score Strategy Engine (Task 8.1)
 *
 * Analyzes PFA component performance and recommends training priorities based on
 * marginal score gain per unit of training effort - not just raw score potential.
 *
 * Core concept: the slope of the scoring curve at the user's current level
 * determines ROI. Near a scoring cliff (e.g., 30 push-ups = 0.8 pts), a single
 * rep yields 2.2 pts. Near the ceiling (e.g., 60 push-ups), 5 more reps = 0.6 pts.
 *
 * Effort factors sourced from docs/RESEARCH-FITNESS-PROGRAMS.md
 */

import { getScoringTable } from './scoringTables.js'
import { lookupScore } from './scoringEngine.js'
import {
  EXERCISES,
  COMPONENTS,
  COMPONENT_WEIGHTS,
  IMPROVEMENT_UNITS,
  EFFORT_WEEKS_PER_UNIT,
} from './constants.js'

// Exercises available per component (walk excluded - pass/fail only, no strategy)
export const COMPONENT_EXERCISES = {
  [COMPONENTS.CARDIO]: [EXERCISES.RUN_2MILE, EXERCISES.HAMR],
  [COMPONENTS.STRENGTH]: [EXERCISES.PUSHUPS, EXERCISES.HRPU],
  [COMPONENTS.CORE]: [EXERCISES.SITUPS, EXERCISES.CLRC, EXERCISES.PLANK],
  [COMPONENTS.BODY_COMP]: [EXERCISES.WHTR],
}

// Human-readable exercise names
export const EXERCISE_NAMES = {
  [EXERCISES.RUN_2MILE]: '2-Mile Run',
  [EXERCISES.HAMR]: 'HAMR Shuttle',
  [EXERCISES.PUSHUPS]: 'Push-ups',
  [EXERCISES.HRPU]: 'Hand-Release Push-ups',
  [EXERCISES.SITUPS]: 'Sit-ups',
  [EXERCISES.CLRC]: 'Reverse Crunches',
  [EXERCISES.PLANK]: 'Forearm Plank',
  [EXERCISES.WHTR]: 'Body Comp (WHtR)',
}

// Human-readable unit descriptions per exercise
export const IMPROVEMENT_UNIT_LABELS = {
  [EXERCISES.RUN_2MILE]: '10s faster',
  [EXERCISES.HAMR]: '+2 shuttles',
  [EXERCISES.PUSHUPS]: '+5 reps',
  [EXERCISES.HRPU]: '+5 reps',
  [EXERCISES.SITUPS]: '+5 reps',
  [EXERCISES.CLRC]: '+5 reps',
  [EXERCISES.PLANK]: '+15s',
  [EXERCISES.WHTR]: '-0.01 ratio',
}

/**
 * Whether improvement means reducing the value (run time, WHtR)
 * vs increasing it (all reps-based, plank)
 */
function isLowerBetter(exercise) {
  return exercise === EXERCISES.RUN_2MILE || exercise === EXERCISES.WHTR
}

/**
 * Effort scale factor - diminishing returns near performance ceiling.
 * Sourced from principle #7 in docs/RESEARCH-FITNESS-PROGRAMS.md:
 * "Going from 80% to 90% requires exponentially more effort than 60% to 80%."
 *
 * @param {number} scorePct - currentPts / maxPts (0-1)
 * @returns {number} Multiplier applied to base EFFORT_WEEKS_PER_UNIT
 */
function effortScaleFactor(scorePct) {
  if (scorePct < 0.60) return 0.8   // Below minimum - gains come faster from low base
  if (scorePct < 0.75) return 1.0   // Marginal zone - baseline effort calibrated here
  if (scorePct < 0.87) return 1.5   // Above passing - appreciably harder
  if (scorePct < 0.95) return 2.5   // Strong performance - significantly harder
  return 5.0                         // Near ceiling (>95%) - very diminishing returns
}

/**
 * analyzeNextGain - find the next scoring threshold and compute gain/effort to reach it.
 *
 * Unlike a simple per-unit calculation (which can return 0 when the improvement unit
 * doesn't cross a threshold row), this finds the NEXT actual scoring improvement and
 * computes how many units it takes to get there.
 *
 * @param {string} exercise - Exercise type constant
 * @param {number} currentValue - Current performance (seconds, reps, or ratio)
 * @param {string} gender - 'M' or 'F'
 * @param {string} ageBracket - Age bracket constant
 * @returns {object|null}
 */
export function analyzeNextGain(exercise, currentValue, gender, ageBracket) {
  if (currentValue === null || currentValue === undefined) return null

  const table = getScoringTable(gender, ageBracket, exercise)
  if (!table || table.length === 0) return null

  const lower = isLowerBetter(exercise)
  const unit = IMPROVEMENT_UNITS[exercise]
  if (!unit) return null

  // Locate the current row in the scoring table.
  // Tables are sorted so that index 0 = best score (highest points).
  // lower-is-better (run, WHtR): ascending threshold, find first row where value <= threshold
  // higher-is-better (reps, plank): descending threshold, find first row where value >= threshold
  let currentIdx = -1
  if (lower) {
    for (let i = 0; i < table.length; i++) {
      if (currentValue <= table[i].threshold) {
        currentIdx = i
        break
      }
    }
    if (currentIdx === -1) currentIdx = table.length - 1 // Worse than all rows
  } else {
    for (let i = 0; i < table.length; i++) {
      if (currentValue >= table[i].threshold) {
        currentIdx = i
        break
      }
    }
    if (currentIdx === -1) currentIdx = table.length - 1 // Worse than all rows
  }

  const maxPts = table[0].points
  const currentPts = table[currentIdx].points
  const scorePct = currentPts / maxPts

  // Already at the best row = maxed out
  if (currentIdx === 0) {
    return {
      alreadyMaxed: true,
      currentPts,
      maxPts,
      scorePct: 1.0,
      ptsGain: 0,
      improvementNeeded: 0,
      unitsNeeded: 0,
      effortWeeks: 0,
      roi: 0,
    }
  }

  // Next better row is always at index currentIdx - 1 (better performance = lower index)
  const nextIdx = currentIdx - 1
  const nextPts = table[nextIdx].points
  const nextThreshold = table[nextIdx].threshold

  // How much improvement is needed to reach the next threshold?
  let improvementNeeded
  if (lower) {
    // Must reduce value to <= nextThreshold
    improvementNeeded = currentValue - nextThreshold
  } else {
    // Must increase value to >= nextThreshold
    improvementNeeded = nextThreshold - currentValue
  }

  // Guard: if already past the next threshold (floating point edge), ensure 1 unit minimum
  if (improvementNeeded <= 0) improvementNeeded = unit

  const unitsNeeded = Math.ceil(improvementNeeded / unit)

  // Compute adjusted effort (scaled for current performance level)
  const baseEffort = EFFORT_WEEKS_PER_UNIT[exercise] || 1.0
  const scale = effortScaleFactor(scorePct)
  const effortWeeksPerUnit = Math.round(baseEffort * scale * 10) / 10
  const effortWeeks = Math.round(unitsNeeded * effortWeeksPerUnit * 10) / 10

  // ROI: points gained per week of training
  const roi = effortWeeks > 0 ? Math.round((nextPts - currentPts) / effortWeeks * 100) / 100 : 0

  return {
    alreadyMaxed: false,
    currentPts,
    maxPts,
    scorePct,
    ptsGain: Math.round((nextPts - currentPts) * 10) / 10,
    nextThreshold,
    improvementNeeded: Math.round(improvementNeeded * 100) / 100,
    unitsNeeded,
    effortWeeksPerUnit,
    effortWeeks,
    roi,
  }
}

/**
 * marginalReturn - points gained per single unit of improvement at current performance.
 * This is the "slope" of the scoring curve at the user's current position.
 * Note: may return 0 if the unit doesn't cross a threshold row; use analyzeNextGain
 * for the next meaningful scoring improvement.
 *
 * @param {string} exercise - Exercise type constant
 * @param {number} currentValue - Current performance value
 * @param {string} gender - 'M' or 'F'
 * @param {string} ageBracket - Age bracket constant
 * @returns {{marginalPts, currentPts, maxPts, scorePct, alreadyMaxed}|null}
 */
export function marginalReturn(exercise, currentValue, gender, ageBracket) {
  if (currentValue === null || currentValue === undefined) return null

  const currentResult = lookupScore(exercise, currentValue, gender, ageBracket)
  if (!currentResult) return null

  const { points: currentPts, maxPoints: maxPts } = currentResult
  const scorePct = currentPts / maxPts

  if (currentPts >= maxPts) {
    return { marginalPts: 0, currentPts, maxPts, scorePct: 1.0, alreadyMaxed: true }
  }

  const unit = IMPROVEMENT_UNITS[exercise]
  if (!unit) return null

  const improvedValue = isLowerBetter(exercise) ? currentValue - unit : currentValue + unit
  const improvedResult = lookupScore(exercise, improvedValue, gender, ageBracket)

  const marginalPts = improvedResult ? Math.max(0, improvedResult.points - currentPts) : 0

  return {
    marginalPts: Math.round(marginalPts * 10) / 10,
    currentPts,
    maxPts,
    scorePct,
    alreadyMaxed: false,
  }
}

/**
 * effortEstimate - estimated training weeks to bridge a performance gap.
 *
 * Simulates improvement unit by unit, applying diminishing-returns scaling
 * at each step, to estimate how many weeks it takes to go from currentValue
 * to targetValue.
 *
 * @param {string} exercise - Exercise type constant
 * @param {number} currentValue - Starting performance value
 * @param {number} targetValue - Goal performance value
 * @param {string} gender - 'M' or 'F'
 * @param {string} ageBracket - Age bracket constant
 * @returns {number} Estimated weeks (rounded to 1 decimal)
 */
export function effortEstimate(exercise, currentValue, targetValue, gender, ageBracket) {
  const lower = isLowerBetter(exercise)
  const unit = IMPROVEMENT_UNITS[exercise]
  if (!unit) return 0

  // Already there
  if (lower ? currentValue <= targetValue : currentValue >= targetValue) return 0

  let value = currentValue
  let totalWeeks = 0

  // Simulate step-by-step improvement (cap at 200 iterations)
  for (let i = 0; i < 200; i++) {
    const nextValue = lower ? value - unit : value + unit

    // Compute effort for this unit at current performance level
    const result = lookupScore(exercise, value, gender, ageBracket)
    if (!result) break

    const scorePct = result.points / result.maxPoints
    const baseEffort = EFFORT_WEEKS_PER_UNIT[exercise] || 1.0
    const scale = effortScaleFactor(scorePct)
    totalWeeks += baseEffort * scale

    value = nextValue

    // Check if we've reached target
    if (lower ? value <= targetValue : value >= targetValue) break
  }

  return Math.round(totalWeeks * 10) / 10
}

/**
 * Find the scoring table row whose threshold puts a user at the given score percentage.
 * Used to compare exercises at "equivalent performance level."
 *
 * @param {string} exercise - Exercise type constant
 * @param {number} targetScorePct - Score percentage to match (0-1)
 * @param {string} gender - 'M' or 'F'
 * @param {string} ageBracket - Age bracket constant
 * @returns {number|null} Performance value (threshold) closest to target percentage
 */
export function findValueAtScorePct(exercise, targetScorePct, gender, ageBracket) {
  const table = getScoringTable(gender, ageBracket, exercise)
  if (!table || table.length === 0) return null

  const maxPts = table[0].points
  const targetPts = targetScorePct * maxPts

  // Find the row whose points are closest to targetPts
  let closestRow = table[table.length - 1]
  let minDiff = Math.abs(closestRow.points - targetPts)

  for (const row of table) {
    const diff = Math.abs(row.points - targetPts)
    if (diff < minDiff) {
      minDiff = diff
      closestRow = row
    }
  }

  return closestRow.threshold
}

/**
 * Analyze a single component/exercise for strategy recommendation.
 * Returns null if the component has no testable data.
 */
function analyzeComponent(componentType, exercise, currentValue, gender, ageBracket) {
  if (currentValue === null || currentValue === undefined) return null

  const gain = analyzeNextGain(exercise, currentValue, gender, ageBracket)
  if (!gain) return null

  const maxPts = COMPONENT_WEIGHTS[componentType] || gain.maxPts
  const ptsToMax = Math.round((gain.maxPts - gain.currentPts) * 10) / 10

  let status = 'improvable'
  if (gain.alreadyMaxed) {
    status = 'maxed'
  } else if (gain.roi < 0.05 && ptsToMax < 0.5) {
    status = 'ceiling' // Effectively maxed (near-zero gains)
  }

  return {
    component: componentType,
    exercise,
    currentPts: gain.currentPts,
    maxPts: gain.maxPts,
    componentMaxPts: maxPts,
    scorePct: gain.scorePct,
    ptsGain: gain.ptsGain,
    improvementNeeded: gain.improvementNeeded,
    unitsNeeded: gain.unitsNeeded,
    effortWeeks: gain.effortWeeks,
    roi: gain.roi,
    ptsToMax,
    status,
  }
}

/**
 * strategyEngine - Effort-weighted score optimization engine.
 *
 * Analyzes each tested, non-exempt component and ranks them by ROI
 * (points gained per week of training). Respects locked exercise preferences.
 *
 * @param {object} demographics - { gender: 'M'|'F', ageBracket: string }
 * @param {object} rawInputs - Per-component inputs:
 *   {
 *     cardio:    { exercise, value, exempt, isWalk? },
 *     strength:  { exercise, value, exempt },
 *     core:      { exercise, value, exempt },
 *     bodyComp:  { exercise, value, exempt }
 *   }
 * @param {object} preferences - Locked exercise choices: { cardio: 'hamr', ... }
 * @returns {object} { ranked, topPriority, hasAnyImprovable, summary }
 */
export function strategyEngine(demographics, rawInputs, preferences = {}) {
  const { gender, ageBracket } = demographics
  const analyses = []

  const componentOrder = [
    COMPONENTS.CARDIO,
    COMPONENTS.STRENGTH,
    COMPONENTS.CORE,
    COMPONENTS.BODY_COMP,
  ]

  for (const comp of componentOrder) {
    const input = rawInputs[comp]
    if (!input) continue
    if (input.exempt) continue
    if (input.isWalk) continue // 2km walk is pass/fail - no point strategy
    if (input.value === null || input.value === undefined || input.value === '') continue

    const exercise = input.exercise
    const value = typeof input.value === 'number' ? input.value : parseFloat(input.value)
    if (isNaN(value)) continue

    const primary = analyzeComponent(comp, exercise, value, gender, ageBracket)
    if (!primary) continue

    // Analyze alternative exercises within the same component for comparison.
    // We use the equivalent score percentage to place the user on the alternative table.
    const alternativeExercises = (COMPONENT_EXERCISES[comp] || []).filter(ex => ex !== exercise)
    const alternatives = []

    for (const altEx of alternativeExercises) {
      const altValue = findValueAtScorePct(altEx, primary.scorePct, gender, ageBracket)
      if (altValue === null) continue
      const altAnalysis = analyzeComponent(comp, altEx, altValue, gender, ageBracket)
      if (!altAnalysis) continue
      alternatives.push(altAnalysis)
    }

    // Preference locking: note trade-off when a non-locked alternative has better ROI
    const isPreferenceLocked = preferences[comp] === exercise
    let preferenceNote = null

    if (isPreferenceLocked && alternatives.length > 0) {
      const bestAlt = alternatives.reduce(
        (best, a) => (a.roi > best.roi ? a : best),
        alternatives[0]
      )
      const roiDiff = Math.round((bestAlt.roi - primary.roi) * 100) / 100
      if (roiDiff > 0.1) {
        preferenceNote = {
          alternativeExercise: bestAlt.exercise,
          alternativeName: EXERCISE_NAMES[bestAlt.exercise],
          alternativeROI: bestAlt.roi,
          roiDiff,
          message: `${EXERCISE_NAMES[bestAlt.exercise]} would yield +${roiDiff.toFixed(1)} pts/week more at your performance level.`,
        }
      }
    }

    analyses.push({
      ...primary,
      alternatives,
      isPreferenceLocked,
      preferenceNote,
    })
  }

  // Rank by ROI (points per week) descending; maxed/ceiling components sorted last
  analyses.sort((a, b) => {
    if (a.status !== 'improvable' && b.status === 'improvable') return 1
    if (a.status === 'improvable' && b.status !== 'improvable') return -1
    return b.roi - a.roi
  })

  const topPriority = analyses.find(a => a.status === 'improvable') || null

  return {
    ranked: analyses,
    topPriority,
    hasAnyImprovable: analyses.some(a => a.status === 'improvable'),
    summary: buildSummary(analyses),
  }
}

/**
 * Build a concise human-readable strategy summary.
 */
function buildSummary(analyses) {
  if (analyses.length === 0) return null

  const improvable = analyses.filter(a => a.status === 'improvable')
  const maxed = analyses.filter(a => a.status === 'maxed')

  const parts = []

  if (improvable.length > 0) {
    const top = improvable[0]
    const compName = getComponentName(top.component)
    const exName = EXERCISE_NAMES[top.exercise] || top.exercise
    parts.push(
      `Best ROI: ${compName} (${exName}) - +${top.ptsGain.toFixed(1)} pts in ~${top.effortWeeks.toFixed(1)} weeks`
    )
  }

  if (maxed.length > 0) {
    const names = maxed.map(a => getComponentName(a.component)).join(', ')
    parts.push(`Maxed: ${names}`)
  }

  return parts.join(' | ')
}

function getComponentName(comp) {
  const names = {
    [COMPONENTS.CARDIO]: 'Cardio',
    [COMPONENTS.STRENGTH]: 'Strength',
    [COMPONENTS.CORE]: 'Core',
    [COMPONENTS.BODY_COMP]: 'Body Comp (WHtR)',
  }
  return names[comp] || comp
}
