/**
 * Optimal Score Allocation Engine
 *
 * Given a user's current PFA scores and a target composite, computes the
 * minimum-effort distribution of per-component target points using a
 * greedy marginal-cost algorithm.
 *
 * The greedy approach is provably optimal here because:
 * - The effort curves are monotonically increasing (diminishing returns)
 * - The objective is linear (sum of component points = composite)
 * - Therefore, the cheapest available point is always the global optimum next step
 */

import { getScoringTable } from './scoringTables.js'
import {
  EXERCISES,
  COMPONENTS,
  COMPONENT_WEIGHTS,
  COMPONENT_MINIMUMS,
  PASSING_COMPOSITE,
  IMPROVEMENT_UNITS,
  EFFORT_WEEKS_PER_UNIT,
} from './constants.js'
import { formatReverseValue } from './reverseScoring.js'

// ── Effort Model ─────────────────────────────────────────────────────────────

/**
 * Smooth effort scale factor - continuous piecewise-linear interpolation.
 *
 * Replaces the old 5-tier step function that had hard discontinuities
 * (e.g., jumping from 1.0x to 1.5x at exactly 87%). This version
 * interpolates linearly between the same calibration anchor points,
 * eliminating jumps while preserving the same overall curve shape.
 *
 * Anchor points (scorePct -> multiplier):
 *   0.00-0.60 -> 0.8  (below minimum - gains come faster from low base)
 *   0.75      -> 1.0  (passing zone - baseline calibration)
 *   0.87      -> 1.5  (above passing - appreciably harder)
 *   0.95      -> 2.5  (strong performance - significantly harder)
 *   1.00      -> 5.0  (at ceiling - very diminishing returns)
 *
 * @param {number} scorePct - currentPts / maxPts (0-1)
 * @returns {number} Multiplier applied to base EFFORT_WEEKS_PER_UNIT
 */
export function effortScaleFactor(scorePct) {
  const anchors = [
    [0.00, 0.8],
    [0.60, 0.8],
    [0.75, 1.0],
    [0.87, 1.5],
    [0.95, 2.5],
    [1.00, 5.0],
  ]
  const p = Math.max(0, Math.min(1, scorePct))
  for (let i = 1; i < anchors.length; i++) {
    if (p <= anchors[i][0]) {
      const [x0, y0] = anchors[i - 1]
      const [x1, y1] = anchors[i]
      return y0 + (y1 - y0) * ((p - x0) / (x1 - x0))
    }
  }
  return anchors[anchors.length - 1][1]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Whether improvement means reducing the value (run time, WHtR)
 * vs increasing it (reps, plank hold, HAMR shuttles)
 */
function isLowerBetter(exercise) {
  return exercise === EXERCISES.RUN_2MILE || exercise === EXERCISES.WHTR
}

/**
 * Locate the user's current row index in a scoring table.
 * Tables are sorted so index 0 = best score (highest points).
 *
 * @returns {number} Row index (-1 should not happen; falls back to last row)
 */
function findCurrentRow(table, currentValue, lower) {
  if (lower) {
    // lower-is-better: find first row where value <= threshold
    for (let i = 0; i < table.length; i++) {
      if (currentValue <= table[i].threshold) return i
    }
    return table.length - 1 // Worse than all rows
  } else {
    // higher-is-better: find first row where value >= threshold
    for (let i = 0; i < table.length; i++) {
      if (currentValue >= table[i].threshold) return i
    }
    return table.length - 1 // Worse than all rows
  }
}

// ── Marginal Cost Schedule ───────────────────────────────────────────────────

/**
 * Build the full marginal cost schedule for an exercise from the user's
 * current performance to the table maximum.
 *
 * Each entry represents one scoring-table row transition and includes:
 * - ptsGain: points earned by reaching the next threshold
 * - effortWeeks: estimated training weeks for this transition
 * - marginalCost: effortWeeks / ptsGain (weeks per composite point)
 *
 * @param {string} exercise - Exercise type constant
 * @param {number} currentValue - Current raw performance (seconds, reps, ratio)
 * @param {string} gender - 'M' | 'F'
 * @param {string} ageBracket - Age bracket constant
 * @returns {Array} Ordered list of cost entries from current to max
 */
export function buildMarginalCostSchedule(exercise, currentValue, gender, ageBracket) {
  if (currentValue === null || currentValue === undefined) return []

  const table = getScoringTable(gender, ageBracket, exercise)
  if (!table || table.length === 0) return []

  const lower = isLowerBetter(exercise)
  const unit = IMPROVEMENT_UNITS[exercise]
  const baseEffort = EFFORT_WEEKS_PER_UNIT[exercise]
  if (!unit || !baseEffort) return []

  const currentIdx = findCurrentRow(table, currentValue, lower)
  const maxPts = table[0].points

  // Already at best row
  if (currentIdx === 0) return []

  const schedule = []
  let cumulativeEffort = 0
  let cumulativePts = 0
  // Track the "working value" - starts at currentValue, advances toward each threshold
  let workingValue = currentValue

  // Walk from current row toward better rows (decreasing index)
  for (let i = currentIdx; i > 0; i--) {
    const fromPts = table[i].points
    const toPts = table[i - 1].points
    const targetThreshold = table[i - 1].threshold
    const ptsGain = Math.round((toPts - fromPts) * 100) / 100

    if (ptsGain <= 0) continue

    // How much raw improvement is needed from working value to next threshold?
    let rawGap
    if (lower) {
      rawGap = workingValue - targetThreshold
    } else {
      rawGap = targetThreshold - workingValue
    }
    // Guard: if already past this threshold (floating point), use 1 unit minimum
    if (rawGap <= 0) rawGap = unit

    // Compute effort: simulate unit-by-unit improvement with scaling
    const unitsNeeded = Math.ceil(rawGap / unit)
    let stepEffort = 0
    for (let u = 0; u < unitsNeeded; u++) {
      // Interpolate scorePct across the improvement span
      const progressFraction = unitsNeeded > 1 ? u / (unitsNeeded - 1) : 0
      const interpPts = fromPts + ptsGain * progressFraction
      const scorePct = interpPts / maxPts
      const scale = effortScaleFactor(scorePct)
      stepEffort += baseEffort * scale
    }
    stepEffort = Math.round(stepEffort * 100) / 100

    cumulativeEffort += stepEffort
    cumulativePts = Math.round((cumulativePts + ptsGain) * 100) / 100

    schedule.push({
      fromPts: Math.round(fromPts * 100) / 100,
      toPts: Math.round(toPts * 100) / 100,
      ptsGain,
      effortWeeks: stepEffort,
      marginalCost: Math.round((stepEffort / ptsGain) * 100) / 100,
      targetThreshold,
      cumulativeEffort: Math.round(cumulativeEffort * 100) / 100,
      cumulativePts,
    })

    // Advance working value to this threshold for the next iteration
    workingValue = targetThreshold
  }

  return schedule
}

// ── Optimal Allocation ───────────────────────────────────────────────────────

/**
 * Compute the optimal per-component target allocation that reaches the
 * target composite with minimum total training effort.
 *
 * @param {object} currentScores - Per-component current data:
 *   { cardio: { exercise, value, pts, exempt },
 *     strength: { exercise, value, pts, exempt },
 *     core: { exercise, value, pts, exempt },
 *     bodyComp: { exercise, value, pts, exempt } }
 * @param {number} targetComposite - Target composite score (e.g. 75, 85)
 * @param {{ gender: string, ageBracket: string }} demographics
 * @returns {object} OptimalAllocationResult
 */
export function computeOptimalAllocation(currentScores, targetComposite, demographics) {
  const { gender, ageBracket } = demographics

  // Build per-component state
  const compKeys = [COMPONENTS.CARDIO, COMPONENTS.STRENGTH, COMPONENTS.CORE, COMPONENTS.BODY_COMP]
  const compState = {}
  let totalEarned = 0
  let totalPossible = 0

  for (const key of compKeys) {
    const data = currentScores[key]
    if (!data || data.exempt) {
      compState[key] = { exempt: true }
      continue
    }

    const maxPts = COMPONENT_WEIGHTS[key]
    const pts = data.pts ?? 0
    totalEarned += pts
    totalPossible += maxPts

    compState[key] = {
      exempt: false,
      exercise: data.exercise,
      currentValue: data.value,
      currentPts: pts,
      targetPts: pts, // Will be increased by allocation
      maxPts,
      minPts: maxPts * (COMPONENT_MINIMUMS[key] / 100),
      effortWeeks: 0,
      schedule: null, // Lazy-built
    }
  }

  if (totalPossible === 0) {
    return { achievable: false, currentComposite: 0, targetComposite, totalEffortWeeks: 0, components: {}, bestBangForBuck: null }
  }

  const currentComposite = Math.round((totalEarned / totalPossible) * 1000) / 10

  // Check if already at target AND all component minimums met
  const allMinimumsmet = compKeys.every(key => {
    const cs = compState[key]
    return cs.exempt || cs.currentPts >= cs.minPts
  })
  if (currentComposite >= targetComposite && allMinimumsmet) {
    const components = {}
    for (const key of compKeys) {
      const cs = compState[key]
      if (cs.exempt) continue
      components[key] = {
        exercise: cs.exercise,
        currentPts: cs.currentPts,
        targetPts: cs.currentPts,
        ptsGain: 0,
        effortWeeks: 0,
        targetRaw: cs.currentValue,
        displayTarget: null,
        marginalCostNow: 0,
      }
    }
    return {
      achievable: true,
      currentComposite,
      targetComposite,
      totalEffortWeeks: 0,
      components,
      bestBangForBuck: null,
    }
  }

  // Add 0.05 epsilon so rounding lands on or above target per SL-06
  const targetPts = (targetComposite / 100) * totalPossible + 0.05
  let pointsNeeded = Math.max(0, targetPts - totalEarned)

  // Phase 1: Force components below minimums up to their minimums (mandatory)
  // Only enforce minimums when targeting a passing score (>= 75)
  const enforceMinimums = targetComposite >= PASSING_COMPOSITE
  for (const key of compKeys) {
    const cs = compState[key]
    if (cs.exempt) continue
    if (enforceMinimums && cs.currentPts < cs.minPts) {
      const mandatoryGain = cs.minPts - cs.currentPts
      // Build schedule if not yet built
      if (!cs.schedule) {
        cs.schedule = buildMarginalCostSchedule(cs.exercise, cs.currentValue, gender, ageBracket)
      }
      // Consume schedule entries to cover mandatory gain
      let gained = 0
      let effort = 0
      for (const entry of cs.schedule) {
        if (gained >= mandatoryGain) break
        gained += entry.ptsGain
        effort += entry.effortWeeks
      }
      cs.targetPts = Math.min(cs.maxPts, cs.currentPts + gained)
      cs.effortWeeks = effort
      // Reduce pointsNeeded by mandatory allocation (even if it overshoots minimum)
      pointsNeeded = Math.max(0, pointsNeeded - gained)
    }
  }

  // Phase 2: Greedy allocation of remaining points
  // Build schedule cursors for each component (skip already-consumed mandatory entries)
  const cursors = {}
  for (const key of compKeys) {
    const cs = compState[key]
    if (cs.exempt) continue
    if (!cs.schedule) {
      cs.schedule = buildMarginalCostSchedule(cs.exercise, cs.currentValue, gender, ageBracket)
    }
    // Find how many schedule entries were consumed by mandatory allocation
    let consumed = 0
    let accPts = 0
    const mandatoryGain = cs.targetPts - cs.currentPts
    for (let i = 0; i < cs.schedule.length; i++) {
      if (accPts >= mandatoryGain) break
      accPts += cs.schedule[i].ptsGain
      consumed = i + 1
    }
    cursors[key] = consumed
  }

  // Greedy loop: pick the cheapest available next step across all components
  let allocated = 0
  const maxIterations = 500 // Safety cap
  let iterations = 0

  while (allocated < pointsNeeded && iterations < maxIterations) {
    iterations++

    // Find the component with the cheapest next step
    let bestKey = null
    let bestCost = Infinity
    let bestEntry = null

    for (const key of compKeys) {
      const cs = compState[key]
      if (cs.exempt) continue
      if (cs.targetPts >= cs.maxPts) continue // Already at max

      const idx = cursors[key]
      if (idx >= cs.schedule.length) continue // No more steps available

      const entry = cs.schedule[idx]
      if (entry.marginalCost < bestCost) {
        bestCost = entry.marginalCost
        bestKey = key
        bestEntry = entry
      }
    }

    if (!bestKey) break // All components maxed or no more steps

    // Allocate this step
    const cs = compState[bestKey]
    cs.targetPts = Math.min(cs.maxPts, cs.targetPts + bestEntry.ptsGain)
    cs.effortWeeks += bestEntry.effortWeeks
    allocated += bestEntry.ptsGain
    cursors[bestKey]++
  }

  // Build result
  const totalEffortWeeks = Math.round(
    compKeys.reduce((sum, key) => sum + (compState[key].exempt ? 0 : compState[key].effortWeeks), 0) * 10
  ) / 10

  const achievable = allocated >= pointsNeeded - 0.1 // Small tolerance for rounding

  // Find bestBangForBuck: component with cheapest next step right now
  let bestBBKey = null
  let bestBBCost = Infinity
  for (const key of compKeys) {
    const cs = compState[key]
    if (cs.exempt || cs.targetPts >= cs.maxPts) continue
    const idx = cursors[key]
    if (idx < cs.schedule.length) {
      if (cs.schedule[idx].marginalCost < bestBBCost) {
        bestBBCost = cs.schedule[idx].marginalCost
        bestBBKey = key
      }
    }
  }

  // Build per-component output
  const components = {}
  for (const key of compKeys) {
    const cs = compState[key]
    if (cs.exempt) {
      components[key] = { exempt: true }
      continue
    }

    const ptsGain = Math.round((cs.targetPts - cs.currentPts) * 100) / 100

    // Reverse-lookup the raw performance value for the target points
    let targetRaw = null
    let displayTarget = null
    if (ptsGain > 0 && cs.schedule) {
      // Find the schedule entry closest to our target points
      let accPts = cs.currentPts
      for (const entry of cs.schedule) {
        accPts = entry.toPts
        targetRaw = entry.targetThreshold
        if (accPts >= cs.targetPts - 0.01) break
      }
      if (targetRaw !== null) {
        displayTarget = formatReverseValue(cs.exercise, targetRaw)
      }
    }

    // Compute current marginal cost (cost of next point from target position)
    const cursorIdx = cursors[key] ?? 0
    const marginalCostNow = (cursorIdx < (cs.schedule?.length ?? 0))
      ? cs.schedule[cursorIdx].marginalCost
      : null

    components[key] = {
      exercise: cs.exercise,
      currentPts: Math.round(cs.currentPts * 100) / 100,
      targetPts: Math.round(cs.targetPts * 100) / 100,
      maxPts: cs.maxPts,
      ptsGain: Math.max(0, ptsGain),
      effortWeeks: Math.round(cs.effortWeeks * 10) / 10,
      targetRaw,
      displayTarget,
      currentValue: cs.currentValue,
      marginalCostNow,
      belowMinimum: cs.currentPts < cs.minPts,
    }
  }

  return {
    achievable,
    currentComposite,
    targetComposite,
    totalEffortWeeks,
    components,
    bestBangForBuck: bestBBKey,
  }
}
