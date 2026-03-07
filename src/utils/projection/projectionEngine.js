/**
 * Projection Engine - Pure functions for PFA readiness projection.
 * Design refs: docs/design.md §9 Projection Engine, §5.3 PG-01 through PG-08
 *
 * Models (selected by number of non-outlier data points):
 *   1 data point  -> Linear (PG-02 fallback), confidence LOW (Preliminary)
 *   2 data points -> Logarithmic (diminishing returns), confidence MEDIUM (Established)
 *   3+ data points-> Historical trend (least-squares), confidence HIGH/MEDIUM (Mature/Established)
 */

import {
  EXERCISES,
  COMPONENT_WEIGHTS,
  COMPONENT_MINIMUMS,
  PASSING_COMPOSITE,
  getProjectionAgeBracket,
} from '../scoring/constants.js'
import { lookupScore, calculateWHtR } from '../scoring/scoringEngine.js'
import { getScoringTable } from '../scoring/scoringTables.js'

// ─── Module constants ─────────────────────────────────────────────────────────

/** tau (days) for log model - controls rate of diminishing returns */
const LOG_TAU = 30

/** PG-08: amber warning when projected composite is within this many pts of 75.0 */
export const AMBER_MARGIN = 3.0

// ─── Exercise direction helper ────────────────────────────────────────────────

/**
 * Returns true for exercises where a LOWER raw value is better.
 * (2-mile run: faster time; 2km walk: faster time; WHtR: lower ratio)
 */
export function isLowerIsBetter(exercise) {
  return (
    exercise === EXERCISES.RUN_2MILE ||
    exercise === EXERCISES.WALK_2KM ||
    exercise === EXERCISES.WHTR
  )
}

// ─── Date utilities ───────────────────────────────────────────────────────────

/** Epoch reference for integer-day arithmetic */
const EPOCH_MS = Date.UTC(2020, 0, 1)

/** Convert an ISO date string (YYYY-MM-DD) to integer days since 2020-01-01 */
function isoToDays(dateStr) {
  return Math.round((new Date(dateStr + 'T00:00:00Z').getTime() - EPOCH_MS) / 86_400_000)
}

/** Days between two ISO date strings (positive when b is later than a) */
export function daysBetween(isoA, isoB) {
  return isoToDays(isoB) - isoToDays(isoA)
}

// ─── Chart bounds helpers ─────────────────────────────────────────────────────

/**
 * Return the minimum raw exercise value required to just meet the component
 * passing threshold (COMPONENT_MINIMUMS[componentType]).
 *
 * For lower-is-better exercises (run, WHtR):
 *   Returns the worst (highest/slowest) threshold that still earns enough points.
 * For higher-is-better exercises (reps):
 *   Returns the worst (lowest) threshold that still earns enough points.
 *
 * PG-07 uses this to compute required weekly improvement.
 *
 * @param {string} exercise
 * @param {string} componentType - 'cardio' | 'strength' | 'core' | 'bodyComp'
 * @param {string} gender
 * @param {string} ageBracket
 * @returns {number | null}
 */
export function getMinPassingValue(exercise, componentType, gender, ageBracket) {
  const table = getScoringTable(gender, ageBracket, exercise)
  if (!table || table.length === 0) return null

  const maxPts = table[0].points
  const minPct = COMPONENT_MINIMUMS[componentType] / 100
  const minPtsNeeded = maxPts * minPct

  // Walk from worst entry (last) toward best (first); return the worst that passes.
  for (let i = table.length - 1; i >= 0; i--) {
    if (table[i].points >= minPtsNeeded) {
      return table[i].threshold
    }
  }

  // Every entry passes (edge case) - return worst threshold
  return table[table.length - 1].threshold
}

/**
 * Clamp a projected raw value to physically meaningful chart bounds (PG-01).
 *
 * Higher-is-better (reps, plank): clamp to [0, chartBest] where chartBest is
 *   the highest reps/time in the scoring table (earns max points).
 * Lower-is-better (run time, WHtR): clamp to [chartBest, +inf] where chartBest
 *   is the fastest time / lowest ratio in the scoring table (earns max points).
 *   WHtR additionally clamped to [0.01, 1.0].
 *
 * @param {number} value - raw projected value
 * @param {string} exercise
 * @param {string} gender
 * @param {string} ageBracket
 * @returns {number | null}
 */
export function clampToChartBounds(value, exercise, gender, ageBracket) {
  if (value === null || value === undefined || !isFinite(value)) return null

  if (exercise === EXERCISES.WHTR) {
    return Math.max(0.01, Math.min(1.0, value))
  }

  const table = getScoringTable(gender, ageBracket, exercise)
  const bestThreshold = table && table.length > 0 ? table[0].threshold : null

  if (isLowerIsBetter(exercise)) {
    // Can't run faster than the chart's fastest entry (bestThreshold = smallest time)
    return bestThreshold !== null ? Math.max(bestThreshold, value) : Math.max(1, value)
  } else {
    // Can't exceed the chart's best entry (bestThreshold = most reps/longest hold)
    // and can't go below zero
    return bestThreshold !== null
      ? Math.min(bestThreshold, Math.max(0, value))
      : Math.max(0, value)
  }
}

// ─── Math utilities ───────────────────────────────────────────────────────────

/**
 * Ordinary least-squares linear regression.
 * @param {Array<{x: number, y: number}>} pts
 * @returns {{ slope: number, intercept: number, rSquared: number }}
 */
function linReg(pts) {
  const n = pts.length
  if (n === 0) return { slope: 0, intercept: 0, rSquared: 0 }

  let sx = 0, sy = 0, sxx = 0, sxy = 0
  for (const { x, y } of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y }

  const denom = n * sxx - sx * sx
  if (Math.abs(denom) < 1e-10) {
    return { slope: 0, intercept: sy / n, rSquared: 0 }
  }

  const slope = (n * sxy - sx * sy) / denom
  const intercept = (sy - slope * sx) / n

  const yMean = sy / n
  const ssTot = pts.reduce((s, p) => s + (p.y - yMean) ** 2, 0)
  const ssRes = pts.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0)
  const rSquared = ssTot < 1e-10 ? 1 : 1 - ssRes / ssTot

  return { slope, intercept, rSquared }
}

/**
 * Ordinary least-squares quadratic regression: y = a*x^2 + b*x + c.
 * Uses Gaussian elimination with partial pivoting on the normal equations.
 *
 * @param {Array<{x: number, y: number}>} pts
 * @returns {{ a: number, b: number, c: number, rSquared: number } | null}
 */
function quadReg(pts) {
  const n = pts.length
  if (n < 3) return null

  let s1=0, s2=0, s3=0, s4=0, t0=0, t1=0, t2=0
  for (const { x, y } of pts) {
    s1 += x; s2 += x*x; s3 += x*x*x; s4 += x*x*x*x
    t0 += y; t1 += x*y; t2 += x*x*y
  }

  // Augmented matrix for normal equations [c, b, a | rhs]
  const m = [
    [n,  s1, s2, t0],
    [s1, s2, s3, t1],
    [s2, s3, s4, t2],
  ]

  // Gaussian elimination with partial pivoting
  for (let col = 0; col < 3; col++) {
    let maxRow = col
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[maxRow][col])) maxRow = row
    }
    ;[m[col], m[maxRow]] = [m[maxRow], m[col]]
    if (Math.abs(m[col][col]) < 1e-10) return null // singular matrix

    for (let row = col + 1; row < 3; row++) {
      const f = m[row][col] / m[col][col]
      for (let j = col; j < 4; j++) m[row][j] -= f * m[col][j]
    }
  }

  // Back-substitution
  const a = m[2][3] / m[2][2]
  const b = (m[1][3] - m[1][2] * a) / m[1][1]
  const c = (m[0][3] - m[0][2] * a - m[0][1] * b) / m[0][0]

  const yMean = t0 / n
  const ssTot = pts.reduce((s, p) => s + (p.y - yMean) ** 2, 0)
  const ssRes = pts.reduce((s, p) => s + (p.y - (a*p.x*p.x + b*p.x + c)) ** 2, 0)
  const rSquared = ssTot < 1e-10 ? 1 : 1 - ssRes / ssTot

  return { a, b, c, rSquared }
}

// ─── Projection models (exported for unit testing) ────────────────────────────

/**
 * Linear projection model (PG-02 base; always available with 1+ data points).
 *
 * With 1 data point: project = current value (no trend info), confidence LOW.
 * With 2+ data points: OLS linear regression extrapolated to target, confidence MEDIUM/HIGH.
 *
 * @param {Array<{days: number, value: number}>} dataPoints
 *   Sorted ascending by days. days = integer offset from the FIRST data point (first = 0).
 * @param {number} daysToTarget - days from the LAST data point to the target PFA date.
 * @returns {{ projected: number, slope: number, rSquared?: number, model: string, confidence: string } | null}
 */
export function projectLinear(dataPoints, daysToTarget) {
  if (!dataPoints || dataPoints.length === 0) return null

  if (dataPoints.length === 1) {
    return { projected: dataPoints[0].value, slope: 0, model: 'linear', confidence: 'LOW' }
  }

  const pts = dataPoints.map(p => ({ x: p.days, y: p.value }))
  const { slope, intercept, rSquared } = linReg(pts)
  const lastX = dataPoints[dataPoints.length - 1].days
  const projected = slope * (lastX + daysToTarget) + intercept

  return {
    projected,
    slope,
    rSquared,
    model: 'linear',
    confidence: dataPoints.length >= 3 ? 'HIGH' : 'MEDIUM',
  }
}

/**
 * Logarithmic projection model (2+ data points; PG-02: falls back to linear with 1).
 * Models diminishing returns: projected = latest + k * ln(1 + daysToTarget / tau)
 *
 * k is fitted from the total change across all data (oldest to latest).
 *
 * @param {Array<{days: number, value: number}>} dataPoints - sorted ascending by days
 * @param {number} daysToTarget - days from the LAST data point to the target date.
 * @param {number} [tau=30] - diminishing-returns time constant in days
 * @returns {{ projected: number, k?: number, tau?: number, model: string, confidence: string } | null}
 */
export function projectLog(dataPoints, daysToTarget, tau = LOG_TAU) {
  if (!dataPoints || dataPoints.length === 0) return null

  // PG-02: only 1 data point - fall back to linear
  if (dataPoints.length === 1) {
    return { projected: dataPoints[0].value, slope: 0, model: 'linear', confidence: 'LOW' }
  }

  const oldest = dataPoints[0]
  const latest = dataPoints[dataPoints.length - 1]
  const elapsed = latest.days - oldest.days
  const delta = latest.value - oldest.value

  // Solve: delta = k * ln(1 + elapsed/tau)
  const lnArg = elapsed > 0 ? Math.log(1 + elapsed / tau) : 0
  const k = lnArg === 0 ? 0 : delta / lnArg

  // Project forward from the latest value
  const projected = latest.value + k * Math.log(1 + daysToTarget / tau)

  return { projected, k, tau, model: 'log', confidence: 'MEDIUM' }
}

/**
 * Historical trend projection (3+ non-outlier S-codes; PG-03).
 * Fits linear OR quadratic OLS regression; chooses quadratic when R² improves > 0.05.
 * Returns null if fewer than 3 data points are provided (disabled below 3).
 *
 * @param {Array<{days: number, value: number}>} dataPoints - sorted ascending by days
 * @param {number} daysToTarget - days from the LAST data point to the target date.
 * @returns {{ projected: number, rSquared: number, model: string, confidence: string } | null}
 */
export function projectTrend(dataPoints, daysToTarget) {
  if (!dataPoints || dataPoints.length < 3) return null // PG-03

  const pts = dataPoints.map(p => ({ x: p.days, y: p.value }))
  const lastX = dataPoints[dataPoints.length - 1].days
  const targetX = lastX + daysToTarget

  const linear = linReg(pts)
  const quadratic = quadReg(pts)

  let projected, rSquared, model

  if (quadratic && quadratic.rSquared > linear.rSquared + 0.05) {
    projected = quadratic.a * targetX * targetX + quadratic.b * targetX + quadratic.c
    rSquared = quadratic.rSquared
    model = 'trend_quadratic'
  } else {
    projected = linear.slope * targetX + linear.intercept
    rSquared = linear.rSquared
    model = 'trend_linear'
  }

  return { projected, rSquared, model, confidence: rSquared >= 0.8 ? 'HIGH' : 'MEDIUM' }
}

// ─── Per-component projection ─────────────────────────────────────────────────

/**
 * Project a single component's performance to the target PFA date.
 *
 * Model selection (PG-02, PG-03):
 *   >= 3 non-outlier points -> projectTrend (HIGH/MEDIUM confidence)
 *   == 2 non-outlier points -> projectLog   (MEDIUM confidence)
 *   == 1 non-outlier point  -> projectLinear (LOW confidence)
 *
 * @param {Array<{date: string, value: number, exempt: boolean, outlier?: boolean}>} history
 *   Chronological list of component data from decoded S-codes.
 * @param {string} exercise - EXERCISES constant for this component
 * @param {string} componentType - 'cardio' | 'strength' | 'core' | 'bodyComp'
 * @param {string} gender - GENDER constant
 * @param {string} ageBracket - AGE_BRACKETS at the TARGET date (PG-04)
 * @param {number} daysToTarget - days from the most recent history entry to target date
 * @returns {object | null}
 */
export function projectComponent(history, exercise, componentType, gender, ageBracket, daysToTarget, forceModel = null) {
  if (!history || history.length === 0) return null

  // PG-05: Cannot project exempt component
  const nonExempt = history.filter(h => !h.exempt)
  if (nonExempt.length === 0) {
    return { exempt: true, cannotProject: true, reason: 'PG-05: all entries exempt' }
  }

  // PG-06: Exclude outlier-flagged entries from regression fit
  let fitData = nonExempt.filter(h => !h.outlier)
  if (fitData.length === 0) {
    // All non-exempt entries flagged as outliers - use most recent only
    fitData = [nonExempt[nonExempt.length - 1]]
  }

  // Build data points with days offset from the first fit entry
  const t0 = isoToDays(fitData[0].date)
  const dataPoints = fitData.map(h => ({ days: isoToDays(h.date) - t0, value: h.value }))

  // Select model - forceModel overrides auto-selection when provided
  let modelResult
  if (forceModel === 'trend') {
    modelResult = projectTrend(dataPoints, daysToTarget) // null if < 3 pts
  } else if (forceModel === 'log') {
    modelResult = projectLog(dataPoints, daysToTarget)
  } else if (forceModel === 'linear') {
    modelResult = projectLinear(dataPoints, daysToTarget)
  } else if (dataPoints.length >= 3) {
    modelResult = projectTrend(dataPoints, daysToTarget)
  } else if (dataPoints.length === 2) {
    modelResult = projectLog(dataPoints, daysToTarget)
  } else {
    modelResult = projectLinear(dataPoints, daysToTarget)
  }

  if (!modelResult) {
    // projectTrend returned null (forced 'trend' with < 3 data points)
    return { cannotProject: true, reason: 'PG-03: need 3+ self-checks for trend model' }
  }

  // PG-01: Clamp projected value to chart bounds
  const clampedValue = clampToChartBounds(modelResult.projected, exercise, gender, ageBracket)
  if (clampedValue === null) return null

  // Score projected value against the target-date age bracket (PG-04)
  const scoreResult = lookupScore(exercise, clampedValue, gender, ageBracket)
  if (!scoreResult) return null

  const { points, percentage } = scoreResult
  const minPct = COMPONENT_MINIMUMS[componentType]
  const pass = percentage >= minPct
  const gap = percentage - minPct // positive = surplus, negative = deficit

  // PG-07: Required weekly improvement for failing components
  let required_weekly_improvement = 0
  if (!pass && daysToTarget > 0) {
    const minPassValue = getMinPassingValue(exercise, componentType, gender, ageBracket)
    if (minPassValue !== null) {
      const valueDelta = isLowerIsBetter(exercise)
        ? clampedValue - minPassValue  // need to decrease (run faster, lower ratio)
        : minPassValue - clampedValue  // need to increase (more reps)
      required_weekly_improvement = Math.max(0, (valueDelta / daysToTarget) * 7)
    }
  }

  return {
    exercise,
    projected_value: clampedValue,
    projected_points: points,
    projected_percentage: percentage,
    pass,
    gap,
    required_weekly_improvement,
    model: modelResult.model,
    confidence: modelResult.confidence,
  }
}

// ─── Composite projection ─────────────────────────────────────────────────────

/**
 * Compute projected composite score from per-component projections (PG-08).
 * Exempt and unprojectable components contribute 0 earned and 0 possible,
 * consistent with the scoring engine's SL-07 walk and exempt handling.
 *
 * @param {Object} componentProjections - keyed by component type ('cardio' etc.)
 * @returns {{ projected: number, pass: boolean, amberWarning: boolean, confidence: string } | null}
 */
export function projectComposite(componentProjections) {
  if (!componentProjections) return null

  const CONF_ORDER = { HIGH: 2, MEDIUM: 1, LOW: 0 }
  let totalEarned = 0
  let totalPossible = 0
  let minConfidence = 'HIGH'

  for (const [compType, proj] of Object.entries(componentProjections)) {
    if (!proj || proj.cannotProject || proj.exempt) continue

    const weight = COMPONENT_WEIGHTS[compType]
    if (!weight) continue

    totalEarned += proj.projected_points
    totalPossible += weight

    const confOrd = CONF_ORDER[proj.confidence] ?? 0
    if (confOrd < (CONF_ORDER[minConfidence] ?? 2)) minConfidence = proj.confidence
  }

  if (totalPossible === 0) return null

  const projected = Math.round((totalEarned / totalPossible) * 1000) / 10
  const pass = projected >= PASSING_COMPOSITE

  // PG-08: amber warning when projected composite is failing but within AMBER_MARGIN pts
  const amberWarning = !pass && projected >= PASSING_COMPOSITE - AMBER_MARGIN

  return { projected, pass, amberWarning, confidence: minConfidence }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Generate a full PFA readiness projection for all components.
 *
 * @param {Array<object>} decodedScodes
 *   Output of decodeSCode(), in chronological order.
 *   Shape: { date, cardio, strength, core, bodyComp, outlier? }
 *   bodyComp shape: { heightInches, waistInches, exempt }
 * @param {{ dob: string, gender: string }} demographics
 * @param {string} targetPfaDate - ISO date string (YYYY-MM-DD)
 * @returns {object | null}
 */
export function generateProjection(decodedScodes, demographics, targetPfaDate, options = {}) {
  if (!decodedScodes || decodedScodes.length === 0) return null
  if (!demographics || !targetPfaDate) return null

  const { modelOverride } = options // 'linear' | 'log' | 'trend' | null (auto)
  const { dob, gender } = demographics

  // PG-04: Age bracket computed from DOB + target_pfa_date (not today's date)
  const ageBracket = getProjectionAgeBracket(dob, targetPfaDate)

  // Build per-component history from all decoded S-codes
  const histories = { cardio: [], strength: [], core: [], bodyComp: [] }

  for (const sc of decodedScodes) {
    const outlier = sc.outlier ?? false

    if (sc.cardio && sc.cardio.exercise !== EXERCISES.WALK_2KM) {
      // Walk excluded: it earns 0 earned / 0 possible (SL-07) and cannot be projected
      histories.cardio.push({
        date: sc.date,
        value: sc.cardio.value,
        exempt: sc.cardio.exempt,
        exercise: sc.cardio.exercise,
        outlier,
      })
    }

    if (sc.strength) {
      histories.strength.push({
        date: sc.date,
        value: sc.strength.value,
        exempt: sc.strength.exempt,
        exercise: sc.strength.exercise,
        outlier,
      })
    }

    if (sc.core) {
      histories.core.push({
        date: sc.date,
        value: sc.core.value,
        exempt: sc.core.exempt,
        exercise: sc.core.exercise,
        outlier,
      })
    }

    if (sc.bodyComp) {
      const wHtR = sc.bodyComp.exempt
        ? null
        : calculateWHtR(sc.bodyComp.waistInches, sc.bodyComp.heightInches)
      histories.bodyComp.push({
        date: sc.date,
        value: wHtR,
        exempt: sc.bodyComp.exempt,
        exercise: EXERCISES.WHTR,
        outlier,
      })
    }
  }

  // Only use history for the most recent exercise type per component
  // (avoids mixing e.g. pushups from older sessions with HRPU from recent ones)
  function filterToLatestExercise(arr) {
    if (arr.length === 0) return []
    const latestExercise = arr[arr.length - 1].exercise
    return arr.filter(h => h.exercise === latestExercise)
  }

  const cardioHistory    = filterToLatestExercise(histories.cardio)
  const strengthHistory  = filterToLatestExercise(histories.strength)
  const coreHistory      = filterToLatestExercise(histories.core)
  const bodyCompHistory  = histories.bodyComp // always WHtR

  function getLatestExercise(arr) {
    return arr.length > 0 ? arr[arr.length - 1].exercise : null
  }

  function getDaysToTarget(arr) {
    if (arr.length === 0) return null
    const d = daysBetween(arr[arr.length - 1].date, targetPfaDate)
    return d >= 0 ? d : null // null if target date is in the past relative to last S-code
  }

  const componentProjections = {}

  const cardioDays = getDaysToTarget(cardioHistory)
  if (cardioDays !== null) {
    componentProjections.cardio = projectComponent(
      cardioHistory, getLatestExercise(cardioHistory), 'cardio', gender, ageBracket, cardioDays, modelOverride
    )
  }

  const strengthDays = getDaysToTarget(strengthHistory)
  if (strengthDays !== null) {
    componentProjections.strength = projectComponent(
      strengthHistory, getLatestExercise(strengthHistory), 'strength', gender, ageBracket, strengthDays, modelOverride
    )
  }

  const coreDays = getDaysToTarget(coreHistory)
  if (coreDays !== null) {
    componentProjections.core = projectComponent(
      coreHistory, getLatestExercise(coreHistory), 'core', gender, ageBracket, coreDays, modelOverride
    )
  }

  const bodyCompDays = getDaysToTarget(bodyCompHistory)
  if (bodyCompDays !== null) {
    componentProjections.bodyComp = projectComponent(
      bodyCompHistory, EXERCISES.WHTR, 'bodyComp', gender, ageBracket, bodyCompDays, modelOverride
    )
  }

  const composite = projectComposite(componentProjections)

  return {
    targetDate: targetPfaDate,
    ageBracket,
    components: componentProjections,
    composite,
  }
}
