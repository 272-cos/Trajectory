/**
 * Projection Engine unit tests.
 * Each PG rule (PG-01 through PG-08) has at least one dedicated test.
 */

import { describe, it, expect } from 'vitest'
import {
  isLowerIsBetter,
  daysBetween,
  getMinPassingValue,
  clampToChartBounds,
  projectLinear,
  projectLog,
  projectTrend,
  projectComponent,
  projectComposite,
  generateProjection,
  AMBER_MARGIN,
} from './projectionEngine.js'
import { EXERCISES, GENDER, AGE_BRACKETS } from '../scoring/constants.js'

// ─── Shorthand constants ──────────────────────────────────────────────────────

const M = GENDER.MALE
const U25 = AGE_BRACKETS.UNDER_25

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a simple data point array for model tests (days offset from first = 0) */
function pts(pairs) {
  // pairs: [[days, value], ...]
  return pairs.map(([days, value]) => ({ days, value }))
}

/** Build a history entry for projectComponent tests */
function hist(date, value, { exempt = false, outlier = false, exercise = EXERCISES.PUSHUPS } = {}) {
  return { date, value, exempt, outlier, exercise }
}

// ─── isLowerIsBetter ─────────────────────────────────────────────────────────

describe('isLowerIsBetter', () => {
  it('returns true for run, walk, WHtR', () => {
    expect(isLowerIsBetter(EXERCISES.RUN_2MILE)).toBe(true)
    expect(isLowerIsBetter(EXERCISES.WALK_2KM)).toBe(true)
    expect(isLowerIsBetter(EXERCISES.WHTR)).toBe(true)
  })

  it('returns false for reps-based and plank', () => {
    expect(isLowerIsBetter(EXERCISES.PUSHUPS)).toBe(false)
    expect(isLowerIsBetter(EXERCISES.HRPU)).toBe(false)
    expect(isLowerIsBetter(EXERCISES.SITUPS)).toBe(false)
    expect(isLowerIsBetter(EXERCISES.CLRC)).toBe(false)
    expect(isLowerIsBetter(EXERCISES.HAMR)).toBe(false)
    expect(isLowerIsBetter(EXERCISES.PLANK)).toBe(false)
  })
})

// ─── daysBetween ─────────────────────────────────────────────────────────────

describe('daysBetween', () => {
  it('returns correct positive difference', () => {
    expect(daysBetween('2026-01-01', '2026-02-01')).toBe(31)
  })

  it('returns 0 for same date', () => {
    expect(daysBetween('2026-06-01', '2026-06-01')).toBe(0)
  })

  it('returns negative when b is earlier than a', () => {
    expect(daysBetween('2026-02-01', '2026-01-01')).toBe(-31)
  })
})

// ─── PG-01: Projections clamped to chart bounds ───────────────────────────────

describe('PG-01 - clampToChartBounds', () => {
  it('higher-is-better: clamps negative value to 0', () => {
    const clamped = clampToChartBounds(-5, EXERCISES.PUSHUPS, M, U25)
    expect(clamped).toBeGreaterThanOrEqual(0)
  })

  it('higher-is-better: clamps value beyond chart max to chart max', () => {
    // Male U25 pushups chart max = 100 reps
    const clamped = clampToChartBounds(200, EXERCISES.PUSHUPS, M, U25)
    expect(clamped).toBeLessThanOrEqual(100)
  })

  it('lower-is-better: clamps run time below chart best to chart best', () => {
    // Male U25 run chart best = 805s (13:25). Project of 100s is impossible.
    const clamped = clampToChartBounds(100, EXERCISES.RUN_2MILE, M, U25)
    expect(clamped).toBeGreaterThanOrEqual(805)
  })

  it('lower-is-better: does not clamp run time above chart best', () => {
    // A slow time (1500s) is fine - just earns fewer points
    const clamped = clampToChartBounds(1500, EXERCISES.RUN_2MILE, M, U25)
    expect(clamped).toBe(1500)
  })

  it('WHtR: clamps to [0.01, 1.0]', () => {
    expect(clampToChartBounds(-0.5, EXERCISES.WHTR, M, U25)).toBe(0.01)
    expect(clampToChartBounds(1.5, EXERCISES.WHTR, M, U25)).toBe(1.0)
    expect(clampToChartBounds(0.45, EXERCISES.WHTR, M, U25)).toBeCloseTo(0.45)
  })

  it('returns null for non-finite values', () => {
    expect(clampToChartBounds(Infinity, EXERCISES.PUSHUPS, M, U25)).toBeNull()
    expect(clampToChartBounds(NaN, EXERCISES.PUSHUPS, M, U25)).toBeNull()
    expect(clampToChartBounds(null, EXERCISES.PUSHUPS, M, U25)).toBeNull()
  })
})

// ─── PG-02: Log model falls back to linear with 1 data point ─────────────────

describe('PG-02 - projectLog fallback with 1 data point', () => {
  it('returns linear model result when only 1 data point provided', () => {
    const result = projectLog(pts([[0, 580]]), 60)
    expect(result).not.toBeNull()
    expect(result.model).toBe('linear')
    expect(result.confidence).toBe('LOW')
    expect(result.projected).toBe(580)
  })

  it('uses log model with 2+ data points', () => {
    const result = projectLog(pts([[0, 580], [31, 570]]), 60)
    expect(result).not.toBeNull()
    expect(result.model).toBe('log')
    expect(result.confidence).toBe('MEDIUM')
  })
})

// ─── PG-03: Historical trend requires 3+ S-codes ─────────────────────────────

describe('PG-03 - projectTrend disabled below 3 data points', () => {
  it('returns null with 0 data points', () => {
    expect(projectTrend([], 60)).toBeNull()
  })

  it('returns null with 1 data point', () => {
    expect(projectTrend(pts([[0, 50]]), 60)).toBeNull()
  })

  it('returns null with 2 data points', () => {
    expect(projectTrend(pts([[0, 50], [30, 55]]), 60)).toBeNull()
  })

  it('returns a projection with 3 data points', () => {
    const result = projectTrend(pts([[0, 40], [30, 45], [60, 50]]), 30)
    expect(result).not.toBeNull()
    expect(result.projected).toBeGreaterThan(0)
  })

  it('returns a projection with 4 data points', () => {
    const result = projectTrend(pts([[0, 40], [30, 45], [60, 50], [90, 55]]), 30)
    expect(result).not.toBeNull()
    expect(result.projected).toBeCloseTo(60, 0)
  })
})

// ─── PG-04: Age bracket uses DOB + target_pfa_date ───────────────────────────

describe('PG-04 - age bracket computed at target PFA date', () => {
  it('uses target-date bracket, not current-date bracket', () => {
    // Born 1981-07-02 -> today (2026-03-05) = age 44 (bracket 40-44)
    //                 -> target 2026-08-01   = age 45 (bracket 45-49)
    const dob = '1981-07-02'
    const targetPfaDate = '2026-08-01'

    const scode = {
      date: '2026-01-01',
      cardio: { exercise: EXERCISES.RUN_2MILE, value: 900, exempt: false },
      strength: null,
      core: null,
      bodyComp: null,
    }

    const result = generateProjection([scode], { dob, gender: M }, targetPfaDate)
    expect(result).not.toBeNull()
    // Must use the 45-49 bracket (age at target date), not 40-44 (current age)
    expect(result.ageBracket).toBe(AGE_BRACKETS.AGE_45_49)
  })

  it('uses UNDER_25 bracket for person who is still under 25 at target date', () => {
    // Born 2002-01-01 -> at target 2026-07-01 = age 24 (still under 25)
    const dob = '2002-01-01'
    const targetPfaDate = '2026-07-01'

    const scode = {
      date: '2026-01-01',
      cardio: { exercise: EXERCISES.RUN_2MILE, value: 900, exempt: false },
      strength: null,
      core: null,
      bodyComp: null,
    }

    const result = generateProjection([scode], { dob, gender: M }, targetPfaDate)
    expect(result).not.toBeNull()
    expect(result.ageBracket).toBe(AGE_BRACKETS.UNDER_25)
  })
})

// ─── PG-05: Cannot project exempt components ──────────────────────────────────

describe('PG-05 - exempt component not projected', () => {
  it('returns cannotProject=true when all history entries are exempt', () => {
    const history = [
      hist('2026-01-01', null, { exempt: true }),
      hist('2026-02-01', null, { exempt: true }),
    ]
    const result = projectComponent(history, EXERCISES.PUSHUPS, 'strength', M, U25, 90)
    expect(result).not.toBeNull()
    expect(result.exempt).toBe(true)
    expect(result.cannotProject).toBe(true)
  })

  it('can project when at least one history entry is not exempt', () => {
    const history = [
      hist('2026-01-01', 40, { exempt: false }),
      hist('2026-02-01', null, { exempt: true }),
    ]
    // Only non-exempt entry should be used
    const result = projectComponent(history, EXERCISES.PUSHUPS, 'strength', M, U25, 90)
    expect(result).not.toBeNull()
    expect(result.cannotProject).toBeFalsy()
    expect(result.projected_value).toBeGreaterThanOrEqual(0)
  })
})

// ─── PG-06: Outlier-flagged S-codes excluded from trend fit ───────────────────

describe('PG-06 - outlier S-codes excluded from trend fit', () => {
  it('excludes outlier from fit; 4 points with 1 outlier -> trend from 3', () => {
    const history = [
      hist('2026-01-01', 40, { outlier: false }),
      hist('2026-01-31', 44, { outlier: false }),
      hist('2026-03-02', 48, { outlier: false }),
      hist('2026-04-01', 5,  { outlier: true }),  // wild outlier, excluded
    ]
    // After excluding outlier, 3 non-outlier points remain -> projectTrend
    const result = projectComponent(history, EXERCISES.PUSHUPS, 'strength', M, U25, 90)
    expect(result).not.toBeNull()
    expect(result.model).toMatch(/^trend/)
    // Projected value should trend upward, not be pulled down by the outlier
    expect(result.projected_value).toBeGreaterThan(40)
  })

  it('with 3 points and 1 outlier, only 2 remain -> log model', () => {
    const history = [
      hist('2026-01-01', 40, { outlier: false }),
      hist('2026-02-01', 45, { outlier: false }),
      hist('2026-03-01', 5,  { outlier: true }),
    ]
    // 2 non-outlier points -> log model
    const result = projectComponent(history, EXERCISES.PUSHUPS, 'strength', M, U25, 90)
    expect(result).not.toBeNull()
    expect(result.model).toBe('log')
  })

  it('with all non-exempt points flagged as outlier, uses most recent as fallback', () => {
    const history = [
      hist('2026-01-01', 40, { outlier: true }),
      hist('2026-02-01', 50, { outlier: true }),
    ]
    // All outlier -> fallback to most recent, linear confidence LOW
    const result = projectComponent(history, EXERCISES.PUSHUPS, 'strength', M, U25, 90)
    expect(result).not.toBeNull()
    expect(result.confidence).toBe('LOW')
  })
})

// ─── PG-07: Output includes required weekly improvement ───────────────────────

describe('PG-07 - required weekly improvement', () => {
  it('failing component: required_weekly_improvement > 0', () => {
    // Male U25 pushups minimum = 60% of 15 pts = 9.0 pts.
    // The table min threshold earns those min points.
    // Using a very low value (1 rep) guarantees failure.
    const history = [hist('2026-01-01', 1, { exercise: EXERCISES.PUSHUPS })]
    const result = projectComponent(history, EXERCISES.PUSHUPS, 'strength', M, U25, 90)
    expect(result).not.toBeNull()
    expect(result.pass).toBe(false)
    expect(result.required_weekly_improvement).toBeGreaterThan(0)
  })

  it('passing component: required_weekly_improvement === 0', () => {
    // Male U25 pushups - 77 reps earns 15.0 pts (100%) - well above 60% minimum
    const history = [hist('2026-01-01', 77, { exercise: EXERCISES.PUSHUPS })]
    const result = projectComponent(history, EXERCISES.PUSHUPS, 'strength', M, U25, 90)
    expect(result).not.toBeNull()
    expect(result.pass).toBe(true)
    expect(result.required_weekly_improvement).toBe(0)
  })

  it('PG-07: includes gap (positive = surplus, negative = deficit)', () => {
    // 1 rep = definitely failing
    const failHistory = [hist('2026-01-01', 1, { exercise: EXERCISES.PUSHUPS })]
    const failResult = projectComponent(failHistory, EXERCISES.PUSHUPS, 'strength', M, U25, 90)
    expect(failResult.gap).toBeLessThan(0)

    // 77 reps = definitely passing
    const passHistory = [hist('2026-01-01', 77, { exercise: EXERCISES.PUSHUPS })]
    const passResult = projectComponent(passHistory, EXERCISES.PUSHUPS, 'strength', M, U25, 90)
    expect(passResult.gap).toBeGreaterThan(0)
  })
})

// ─── PG-08: Amber warning within 3 pts of 75.0 ───────────────────────────────

describe('PG-08 - amber warning', () => {
  it('AMBER_MARGIN constant equals 3.0', () => {
    expect(AMBER_MARGIN).toBe(3.0)
  })

  it('composite 73.5 (within 3 pts, failing) -> amberWarning = true', () => {
    // Manually craft component projections that yield ~73.5 composite
    // Total weight = 100. Need totalEarned / totalPossible * 100 = 73.5
    // Use cardio(50) + bodyComp(20) = 70 possible; with 51.45 earned -> 73.5 of 70... no.
    // Easier: all 4 components present, total possible = 100, earned = 73.5
    const componentProjections = {
      cardio:   { projected_points: 36.75, pass: false, gap: -13, required_weekly_improvement: 1, model: 'linear', confidence: 'LOW' },
      bodyComp: { projected_points: 14.70, pass: true,  gap: 23,  required_weekly_improvement: 0, model: 'linear', confidence: 'LOW' },
      strength: { projected_points: 11.03, pass: true,  gap: 13,  required_weekly_improvement: 0, model: 'linear', confidence: 'LOW' },
      core:     { projected_points: 11.02, pass: true,  gap: 13,  required_weekly_improvement: 0, model: 'linear', confidence: 'LOW' },
    }
    const result = projectComposite(componentProjections)
    expect(result.projected).toBeCloseTo(73.5, 0)
    expect(result.pass).toBe(false)
    expect(result.amberWarning).toBe(true)
  })

  it('composite 71.9 (more than 3 pts below 75.0) -> amberWarning = false', () => {
    // 71.9 < 72.0 (= 75.0 - 3.0), so outside the amber zone
    const componentProjections = {
      cardio:   { projected_points: 35.95, pass: false, gap: -14, required_weekly_improvement: 1, model: 'linear', confidence: 'LOW' },
      bodyComp: { projected_points: 14.38, pass: true,  gap: 22,  required_weekly_improvement: 0, model: 'linear', confidence: 'LOW' },
      strength: { projected_points: 10.79, pass: true,  gap: 12,  required_weekly_improvement: 0, model: 'linear', confidence: 'LOW' },
      core:     { projected_points: 10.78, pass: true,  gap: 12,  required_weekly_improvement: 0, model: 'linear', confidence: 'LOW' },
    }
    const result = projectComposite(componentProjections)
    expect(result.projected).toBeLessThan(72.0)
    expect(result.pass).toBe(false)
    expect(result.amberWarning).toBe(false)
  })

  it('composite exactly 75.0 -> pass = true, amberWarning = false', () => {
    const componentProjections = {
      cardio:   { projected_points: 37.5, pass: true,  gap: 25, required_weekly_improvement: 0, model: 'linear', confidence: 'LOW' },
      bodyComp: { projected_points: 15.0, pass: true,  gap: 25, required_weekly_improvement: 0, model: 'linear', confidence: 'LOW' },
      strength: { projected_points: 11.25, pass: true, gap: 15, required_weekly_improvement: 0, model: 'linear', confidence: 'LOW' },
      core:     { projected_points: 11.25, pass: true, gap: 15, required_weekly_improvement: 0, model: 'linear', confidence: 'LOW' },
    }
    const result = projectComposite(componentProjections)
    expect(result.projected).toBeCloseTo(75.0, 1)
    expect(result.pass).toBe(true)
    expect(result.amberWarning).toBe(false)
  })

  it('composite 80.0 (clearly passing) -> amberWarning = false', () => {
    const componentProjections = {
      cardio:   { projected_points: 40, pass: true, gap: 30, required_weekly_improvement: 0, model: 'linear', confidence: 'MEDIUM' },
      bodyComp: { projected_points: 16, pass: true, gap: 30, required_weekly_improvement: 0, model: 'linear', confidence: 'MEDIUM' },
      strength: { projected_points: 12, pass: true, gap: 20, required_weekly_improvement: 0, model: 'linear', confidence: 'MEDIUM' },
      core:     { projected_points: 12, pass: true, gap: 20, required_weekly_improvement: 0, model: 'linear', confidence: 'MEDIUM' },
    }
    const result = projectComposite(componentProjections)
    expect(result.projected).toBeCloseTo(80.0, 1)
    expect(result.pass).toBe(true)
    expect(result.amberWarning).toBe(false)
  })
})

// ─── Linear model accuracy ────────────────────────────────────────────────────

describe('Linear model accuracy', () => {
  it('1 data point: projected = current value (no trend)', () => {
    const result = projectLinear(pts([[0, 580]]), 60)
    expect(result).not.toBeNull()
    expect(result.projected).toBe(580)
    expect(result.slope).toBe(0)
    expect(result.model).toBe('linear')
    expect(result.confidence).toBe('LOW')
  })

  it('2 data points: projects slope correctly', () => {
    // 580 at day 0, 570 at day 31 -> slope = -10/31 per day
    // 30 more days from day 31 -> projected at x=61: slope*61 + intercept
    const result = projectLinear(pts([[0, 580], [31, 570]]), 30)
    expect(result).not.toBeNull()
    // slope = -10/31, intercept = 580
    // projected = (-10/31) * 61 + 580 = 580 - 19.677 = 560.32
    expect(result.projected).toBeCloseTo(560.3, 1)
    expect(result.slope).toBeCloseTo(-10 / 31, 4)
    expect(result.model).toBe('linear')
    expect(result.confidence).toBe('MEDIUM')
  })

  it('3 data points: perfectly linear data projects correctly', () => {
    // y = 600 - x*1 (decreasing, like run time improvement)
    // points: (0,600), (30,570), (60,540)
    const result = projectLinear(pts([[0, 600], [30, 570], [60, 540]]), 30)
    expect(result).not.toBeNull()
    // projected at x=90: 600 - 90 = 510
    expect(result.projected).toBeCloseTo(510, 0)
    expect(result.rSquared).toBeCloseTo(1.0, 4)
    expect(result.confidence).toBe('HIGH')
  })

  it('returns null for empty data', () => {
    expect(projectLinear([], 60)).toBeNull()
  })
})

// ─── Log model clamping / diminishing returns ─────────────────────────────────

describe('Log model - diminishing returns', () => {
  it('projects less improvement than linear for same data over same horizon', () => {
    const data = pts([[0, 30], [30, 35]])  // +5 reps in 30 days
    const linearResult = projectLinear(data, 60)
    const logResult = projectLog(data, 60)
    // Log assumes diminishing returns; should project LESS than linear
    // Linear: 30 + (5/30)*90 = 30 + 15 = 45
    // Log: k*ln(2) = 5 -> k = 5/ln(2) ~7.21; then 35 + 7.21*ln(3) ~35 + 7.92 = 42.92
    expect(logResult.projected).toBeLessThan(linearResult.projected)
    expect(logResult.model).toBe('log')
  })

  it('log model correctly fits k from observed change', () => {
    // elapsed=30, delta=5, tau=30: k = 5/ln(2)
    const data = pts([[0, 30], [30, 35]])
    const result = projectLog(data, 30)
    const expectedK = 5 / Math.log(2)
    expect(result.k).toBeCloseTo(expectedK, 3)
    // projected = 35 + k*ln(1 + 30/30) = 35 + k*ln(2) = 35 + 5 = 40
    expect(result.projected).toBeCloseTo(40, 1)
  })

  it('log model: lower-is-better (run) produces negative k for improvement', () => {
    // Run time decreasing (improving): 1000 -> 970 over 30 days
    const data = pts([[0, 1000], [30, 970]])
    const result = projectLog(data, 30)
    expect(result.k).toBeLessThan(0) // improvement = negative k for lower-is-better
  })
})

// ─── 3+ S-code trend fit ──────────────────────────────────────────────────────

describe('Trend model - 3+ S-code fit', () => {
  it('perfectly linear data -> trend_linear model', () => {
    // y = 40 + x (reps increasing 1 per day)
    const data = pts([[0, 40], [30, 70], [60, 100]])
    const result = projectTrend(data, 30)
    expect(result).not.toBeNull()
    expect(result.model).toBe('trend_linear')
    expect(result.rSquared).toBeCloseTo(1.0, 4)
    expect(result.projected).toBeCloseTo(130, 0)
    expect(result.confidence).toBe('HIGH')
  })

  it('quadratic data -> trend_quadratic model when R² improvement > 0.05', () => {
    // y = x^2 (parabolic improvement)
    // points: (0,0), (10,100), (20,400), (30,900)
    const data = pts([[0, 0], [10, 100], [20, 400], [30, 900]])
    const result = projectTrend(data, 10)
    expect(result).not.toBeNull()
    expect(result.model).toBe('trend_quadratic')
    // At x=40: 40^2 = 1600
    expect(result.projected).toBeCloseTo(1600, -1) // within 10 units
  })

  it('oscillating data with 5+ points: confidence MEDIUM when R² < 0.8', () => {
    // Zig-zag pattern that is neither linear nor quadratic - guarantees R² < 0.8
    // With 5 points, quadratic (3 params, 2 dof) won't overfit perfectly
    const data = pts([[0, 30], [15, 55], [30, 28], [60, 60], [90, 25]])
    const result = projectTrend(data, 30)
    expect(result).not.toBeNull()
    // R² should be < 0.8 for such oscillating data -> MEDIUM confidence
    expect(result.rSquared).toBeLessThan(0.8)
    expect(result.confidence).toBe('MEDIUM')
  })
})

// ─── getMinPassingValue ───────────────────────────────────────────────────────

describe('getMinPassingValue', () => {
  it('returns a threshold for pushups (strength, 60% minimum)', () => {
    const minVal = getMinPassingValue(EXERCISES.PUSHUPS, 'strength', M, U25)
    expect(minVal).not.toBeNull()
    expect(minVal).toBeGreaterThan(0)
  })

  it('returns a threshold for run (cardio, 60% minimum)', () => {
    const minVal = getMinPassingValue(EXERCISES.RUN_2MILE, 'cardio', M, U25)
    expect(minVal).not.toBeNull()
    expect(minVal).toBeGreaterThan(0)
  })

  it('returns null for WHtR (DAFMAN §3.7.1: BC has no per-component minimum)', () => {
    const minVal = getMinPassingValue(EXERCISES.WHTR, 'bodyComp', M, U25)
    expect(minVal).toBeNull()
  })
})

// ─── projectComponent integration ────────────────────────────────────────────

describe('projectComponent - integration', () => {
  it('returns null for empty history', () => {
    expect(projectComponent([], EXERCISES.PUSHUPS, 'strength', M, U25, 90)).toBeNull()
  })

  it('full result shape with valid 1-entry history', () => {
    const history = [hist('2026-01-01', 40, { exercise: EXERCISES.PUSHUPS })]
    const result = projectComponent(history, EXERCISES.PUSHUPS, 'strength', M, U25, 90)
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('projected_value')
    expect(result).toHaveProperty('projected_points')
    expect(result).toHaveProperty('projected_percentage')
    expect(result).toHaveProperty('pass')
    expect(result).toHaveProperty('gap')
    expect(result).toHaveProperty('required_weekly_improvement')
    expect(result).toHaveProperty('model')
    expect(result).toHaveProperty('confidence')
  })

  it('2 data points -> log model selected', () => {
    const history = [
      hist('2026-01-01', 40, { exercise: EXERCISES.PUSHUPS }),
      hist('2026-02-01', 45, { exercise: EXERCISES.PUSHUPS }),
    ]
    const result = projectComponent(history, EXERCISES.PUSHUPS, 'strength', M, U25, 90)
    expect(result.model).toBe('log')
    expect(result.confidence).toBe('MEDIUM')
  })

  it('3 data points -> trend model selected', () => {
    const history = [
      hist('2026-01-01', 40, { exercise: EXERCISES.PUSHUPS }),
      hist('2026-02-01', 45, { exercise: EXERCISES.PUSHUPS }),
      hist('2026-03-01', 50, { exercise: EXERCISES.PUSHUPS }),
    ]
    const result = projectComponent(history, EXERCISES.PUSHUPS, 'strength', M, U25, 90)
    expect(result.model).toMatch(/^trend/)
    expect(['HIGH', 'MEDIUM']).toContain(result.confidence)
  })
})

// ─── projectComposite ─────────────────────────────────────────────────────────

describe('projectComposite', () => {
  it('returns null when no projectable components', () => {
    expect(projectComposite({})).toBeNull()
    expect(projectComposite({ cardio: { cannotProject: true } })).toBeNull()
    expect(projectComposite(null)).toBeNull()
  })

  it('composite uses lowest confidence from any component', () => {
    const componentProjections = {
      cardio:   { projected_points: 40, pass: true, gap: 30, required_weekly_improvement: 0, model: 'trend_linear', confidence: 'HIGH' },
      strength: { projected_points: 12, pass: true, gap: 20, required_weekly_improvement: 0, model: 'linear',       confidence: 'LOW'  },
    }
    const result = projectComposite(componentProjections)
    expect(result.confidence).toBe('LOW')
  })

  it('exempt components do not contribute to composite', () => {
    const componentProjections = {
      cardio:   { projected_points: 40, pass: true, gap: 30, required_weekly_improvement: 0, model: 'linear', confidence: 'LOW' },
      strength: { exempt: true, cannotProject: true },
      core:     { exempt: true, cannotProject: true },
      bodyComp: { exempt: true, cannotProject: true },
    }
    // Only cardio contributes: 40/50 * 100 = 80.0
    const result = projectComposite(componentProjections)
    expect(result).not.toBeNull()
    expect(result.projected).toBeCloseTo(80.0, 1)
  })
})

// ─── generateProjection integration ──────────────────────────────────────────

describe('generateProjection - integration', () => {
  it('returns null with no S-codes', () => {
    expect(generateProjection([], { dob: '1995-01-01', gender: M }, '2026-07-01')).toBeNull()
  })

  it('returns null with missing demographics', () => {
    const scode = {
      date: '2026-01-01',
      cardio: { exercise: EXERCISES.RUN_2MILE, value: 900, exempt: false },
      strength: null, core: null, bodyComp: null,
    }
    expect(generateProjection([scode], null, '2026-07-01')).toBeNull()
  })

  it('returns null when targetPfaDate is missing', () => {
    const scode = {
      date: '2026-01-01',
      cardio: { exercise: EXERCISES.RUN_2MILE, value: 900, exempt: false },
      strength: null, core: null, bodyComp: null,
    }
    expect(generateProjection([scode], { dob: '1995-01-01', gender: M }, null)).toBeNull()
  })

  it('full projection result shape from 1 S-code', () => {
    const scode = {
      date: '2026-01-01',
      cardio:   { exercise: EXERCISES.RUN_2MILE, value: 900, exempt: false },
      strength: { exercise: EXERCISES.PUSHUPS,   value: 40,  exempt: false },
      core:     { exercise: EXERCISES.SITUPS,    value: 50,  exempt: false },
      bodyComp: { heightInches: 70, waistInches: 31, exempt: false },
    }
    const result = generateProjection(
      [scode],
      { dob: '1995-06-15', gender: M },
      '2026-07-01'
    )
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('targetDate', '2026-07-01')
    expect(result).toHaveProperty('ageBracket')
    expect(result).toHaveProperty('components')
    expect(result).toHaveProperty('composite')
    expect(result.components).toHaveProperty('cardio')
    expect(result.components).toHaveProperty('strength')
    expect(result.components).toHaveProperty('core')
    expect(result.components).toHaveProperty('bodyComp')
  })

  it('walk S-codes excluded from cardio projection (not projected)', () => {
    const scode = {
      date: '2026-01-01',
      cardio: { exercise: EXERCISES.WALK_2KM, value: 1200, exempt: false },
      strength: null, core: null, bodyComp: null,
    }
    const result = generateProjection(
      [scode],
      { dob: '1995-01-01', gender: M },
      '2026-07-01'
    )
    // Walk S-codes are excluded from cardio history, so no cardio projection
    expect(result).not.toBeNull()
    expect(result.components.cardio).toBeUndefined()
  })

  it('outlier flag propagated correctly from S-code', () => {
    const scodes = [
      {
        date: '2026-01-01',
        cardio:   { exercise: EXERCISES.RUN_2MILE, value: 900, exempt: false },
        strength: null, core: null, bodyComp: null,
        outlier: false,
      },
      {
        date: '2026-02-01',
        cardio:   { exercise: EXERCISES.RUN_2MILE, value: 1200, exempt: false }, // bad run day
        strength: null, core: null, bodyComp: null,
        outlier: true, // PG-06: flagged as outlier
      },
    ]
    // With the outlier excluded, only 1 non-outlier point -> linear fallback
    const result = generateProjection(
      scodes,
      { dob: '1995-01-01', gender: M },
      '2026-07-01'
    )
    expect(result).not.toBeNull()
    expect(result.components.cardio).not.toBeNull()
    expect(result.components.cardio.confidence).toBe('LOW') // 1 non-outlier -> LOW
  })
})
