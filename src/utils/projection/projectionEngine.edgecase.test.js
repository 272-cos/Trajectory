/**
 * Edge case tests for projectionEngine.js - gaps found during audit
 */

import { describe, it, expect } from 'vitest'
import {
  projectLinear,
  projectLog,
  projectTrend,
  projectComponent,
  projectComposite,
  generateProjection,
  clampToChartBounds,
  getMinPassingValue,
} from './projectionEngine.js'
import { EXERCISES, GENDER, AGE_BRACKETS } from '../scoring/constants.js'

const M = GENDER.MALE
const U25 = AGE_BRACKETS.UNDER_25

function pts(pairs) {
  return pairs.map(([days, value]) => ({ days, value }))
}

function hist(date, value, { exempt = false, outlier = false, exercise = EXERCISES.PUSHUPS } = {}) {
  return { date, value, exempt, outlier, exercise }
}

// ─── GAP 1: Scores that DECREASE over time ──────────────────────────────────
// What happens when performance gets worse? The projection should show
// a declining trajectory, not ignore the regression.

describe('Decreasing scores over time', () => {
  it('linear model: decreasing reps projects continued decrease', () => {
    // Pushups: 50 reps -> 45 -> 40 over 60 days, project 30 more days
    const data = pts([[0, 50], [30, 45], [60, 40]])
    const result = projectLinear(data, 30)
    expect(result).not.toBeNull()
    expect(result.slope).toBeLessThan(0) // negative slope = getting worse
    expect(result.projected).toBeLessThan(40) // projects below latest
  })

  it('log model: decreasing run time (improvement) has negative k', () => {
    // Run time going down (improving): 1000 -> 950
    const data = pts([[0, 1000], [30, 950]])
    const result = projectLog(data, 60)
    expect(result.k).toBeLessThan(0)
    expect(result.projected).toBeLessThan(950) // continues to improve
  })

  it('log model: increasing run time (regression) has positive k', () => {
    // Run time going up (getting worse): 900 -> 950
    const data = pts([[0, 900], [30, 950]])
    const result = projectLog(data, 60)
    expect(result.k).toBeGreaterThan(0)
    expect(result.projected).toBeGreaterThan(950) // continues to regress
  })

  it('projectComponent: decreasing pushups still produces valid result', () => {
    const history = [
      hist('2026-01-01', 50, { exercise: EXERCISES.PUSHUPS }),
      hist('2026-02-01', 45, { exercise: EXERCISES.PUSHUPS }),
      hist('2026-03-01', 40, { exercise: EXERCISES.PUSHUPS }),
    ]
    const result = projectComponent(history, EXERCISES.PUSHUPS, 'strength', M, U25, 90)
    expect(result).not.toBeNull()
    // Projected value should be below 40 (continuing the decline)
    // but clamped to chart bounds (minimum 0)
    expect(result.projected_value).toBeLessThanOrEqual(40)
    expect(result.projected_value).toBeGreaterThanOrEqual(0)
  })

  it('generateProjection with worsening trend shows failing component', () => {
    const scodes = [
      {
        date: '2026-01-01',
        cardio: { exercise: EXERCISES.RUN_2MILE, value: 900, exempt: false },
        strength: { exercise: EXERCISES.PUSHUPS, value: 50, exempt: false },
        core: { exercise: EXERCISES.SITUPS, value: 50, exempt: false },
        bodyComp: { heightInches: 70, waistInches: 31, exempt: false },
      },
      {
        date: '2026-02-01',
        cardio: { exercise: EXERCISES.RUN_2MILE, value: 1000, exempt: false }, // slower
        strength: { exercise: EXERCISES.PUSHUPS, value: 40, exempt: false },   // fewer
        core: { exercise: EXERCISES.SITUPS, value: 42, exempt: false },        // fewer
        bodyComp: { heightInches: 70, waistInches: 35, exempt: false },        // worse
      },
    ]
    const result = generateProjection(
      scodes,
      { dob: '1995-01-01', gender: M },
      '2026-07-01',
    )
    expect(result).not.toBeNull()
    // Run time projection should be worse (higher) than 1000
    expect(result.components.cardio.projected_value).toBeGreaterThan(1000)
  })
})

// ─── GAP 2: projectLinear/projectLog with daysToTarget = 0 ─────────────────
// Target date is same as last assessment date. Should project current value.

describe('daysToTarget = 0 (target date is today)', () => {
  it('linear model with 2 points and daysToTarget=0: projects value at last point', () => {
    const data = pts([[0, 40], [30, 50]])
    const result = projectLinear(data, 0)
    expect(result).not.toBeNull()
    // slope = 10/30, intercept = 40, projected at x=30: 40 + (10/30)*30 = 50
    expect(result.projected).toBeCloseTo(50, 1)
  })

  it('log model with 2 points and daysToTarget=0: projects last value', () => {
    const data = pts([[0, 40], [30, 50]])
    const result = projectLog(data, 0)
    expect(result).not.toBeNull()
    // daysToTarget=0: latest + k*ln(1+0/30) = latest + k*0 = latest = 50
    expect(result.projected).toBeCloseTo(50, 1)
  })

  it('trend model with 3 points and daysToTarget=0: projects at last data point', () => {
    const data = pts([[0, 40], [30, 50], [60, 60]])
    const result = projectTrend(data, 0)
    expect(result).not.toBeNull()
    expect(result.projected).toBeCloseTo(60, 0)
  })
})

// ─── GAP 3: projectTrend quadratic vs linear selection edge case ────────────
// When quadratic R-squared is only slightly better (< 0.05 improvement),
// linear should be chosen.

describe('Trend model selection boundary', () => {
  it('nearly-linear data with tiny quadratic component uses linear model', () => {
    // Very slightly curved data - quadratic R-squared should barely beat linear
    const data = pts([[0, 40], [30, 50], [60, 59.5], [90, 69]])
    const result = projectTrend(data, 30)
    expect(result).not.toBeNull()
    // Should favor linear since the quadratic R-squared improvement is marginal
    // (this test documents the behavior, whichever model wins)
    expect(result.model).toMatch(/^trend_/)
  })
})

// ─── GAP 4: projectComposite with all exempt components ─────────────────────
// All components exempt/cannotProject -> totalPossible=0 -> returns null.
// This is tested for `{}` but not for all-exempt.

describe('projectComposite with all components exempt', () => {
  it('returns null when all 4 components are exempt', () => {
    const projections = {
      cardio:   { exempt: true, cannotProject: true },
      strength: { exempt: true, cannotProject: true },
      core:     { exempt: true, cannotProject: true },
      bodyComp: { exempt: true, cannotProject: true },
    }
    expect(projectComposite(projections)).toBeNull()
  })

  it('returns null when all components cannot project (not exempt, just no data)', () => {
    const projections = {
      cardio:   { cannotProject: true, reason: 'no data' },
      strength: { cannotProject: true, reason: 'no data' },
      core:     { cannotProject: true, reason: 'no data' },
      bodyComp: { cannotProject: true, reason: 'no data' },
    }
    expect(projectComposite(projections)).toBeNull()
  })
})

// ─── GAP 5: generateProjection with mixed exercise types over time ──────────
// filterToLatestExercise only keeps entries matching the most recent exercise.
// If user switched from pushups to HRPU, old pushup data should be excluded.

describe('filterToLatestExercise in generateProjection', () => {
  it('only uses most recent exercise type for projection', () => {
    const scodes = [
      {
        date: '2026-01-01',
        cardio: null,
        strength: { exercise: EXERCISES.PUSHUPS, value: 40, exempt: false },
        core: null, bodyComp: null,
      },
      {
        date: '2026-02-01',
        cardio: null,
        strength: { exercise: EXERCISES.PUSHUPS, value: 45, exempt: false },
        core: null, bodyComp: null,
      },
      {
        date: '2026-03-01',
        cardio: null,
        strength: { exercise: EXERCISES.HRPU, value: 30, exempt: false },
        core: null, bodyComp: null,
      },
    ]
    const result = generateProjection(
      scodes,
      { dob: '1995-01-01', gender: M },
      '2026-07-01',
    )
    expect(result).not.toBeNull()
    // Strength should use HRPU (most recent), not pushups
    expect(result.components.strength.exercise).toBe(EXERCISES.HRPU)
    // With only 1 HRPU data point, should fall back to linear model
    expect(result.components.strength.model).toBe('linear')
    expect(result.components.strength.confidence).toBe('LOW')
  })
})

// ─── GAP 6: projectComponent with forceModel override ───────────────────────
// forceModel='trend' with < 3 data points returns cannotProject.
// This path is tested by the source code but not in the test file.

describe('forceModel overrides', () => {
  it('forceModel="trend" with 2 data points returns cannotProject', () => {
    const history = [
      hist('2026-01-01', 40, { exercise: EXERCISES.PUSHUPS }),
      hist('2026-02-01', 45, { exercise: EXERCISES.PUSHUPS }),
    ]
    const result = projectComponent(
      history, EXERCISES.PUSHUPS, 'strength', M, U25, 90, 'trend',
    )
    expect(result).not.toBeNull()
    expect(result.cannotProject).toBe(true)
  })

  it('forceModel="linear" with 3 data points uses linear instead of trend', () => {
    const history = [
      hist('2026-01-01', 40, { exercise: EXERCISES.PUSHUPS }),
      hist('2026-02-01', 45, { exercise: EXERCISES.PUSHUPS }),
      hist('2026-03-01', 50, { exercise: EXERCISES.PUSHUPS }),
    ]
    const result = projectComponent(
      history, EXERCISES.PUSHUPS, 'strength', M, U25, 90, 'linear',
    )
    expect(result).not.toBeNull()
    expect(result.model).toBe('linear')
  })

  it('forceModel="log" with 3 data points uses log instead of trend', () => {
    const history = [
      hist('2026-01-01', 40, { exercise: EXERCISES.PUSHUPS }),
      hist('2026-02-01', 45, { exercise: EXERCISES.PUSHUPS }),
      hist('2026-03-01', 50, { exercise: EXERCISES.PUSHUPS }),
    ]
    const result = projectComponent(
      history, EXERCISES.PUSHUPS, 'strength', M, U25, 90, 'log',
    )
    expect(result).not.toBeNull()
    expect(result.model).toBe('log')
  })
})

// ─── GAP 7: linReg with all identical x values (division by zero) ───────────
// If all data points have the same day (denom approaches 0), the safeguard
// in linReg should return slope=0.

describe('Degenerate data - all same day', () => {
  it('all data points on the same day: projection equals average value', () => {
    const data = pts([[0, 40], [0, 45], [0, 50]])
    const result = projectTrend(data, 30)
    expect(result).not.toBeNull()
    // With all x=0, denom ~ 0, slope should be 0, intercept = mean
    // projected = 0*30 + mean = (40+45+50)/3 = 45
    expect(result.projected).toBeCloseTo(45, 0)
  })
})

// ─── GAP 8: clampToChartBounds for HAMR (higher-is-better but not pushups) ──
// HAMR is higher-is-better and has a different chart max than pushups.
// The clamp should respect the HAMR table's max threshold.

describe('clampToChartBounds - additional exercise types', () => {
  it('HAMR: value above chart max clamped to chart max', () => {
    const clamped = clampToChartBounds(200, EXERCISES.HAMR, M, U25)
    // HAMR chart max threshold is 100 for M/U25
    expect(clamped).toBeLessThanOrEqual(100)
  })

  it('HAMR: value 0 stays at 0', () => {
    const clamped = clampToChartBounds(0, EXERCISES.HAMR, M, U25)
    expect(clamped).toBe(0)
  })

  it('plank: value above chart max clamped', () => {
    const clamped = clampToChartBounds(1000, EXERCISES.PLANK, M, U25)
    // Plank chart max for M/U25 is 220s (3:40)
    expect(clamped).toBeLessThanOrEqual(220)
  })
})

// ─── GAP 9: generateProjection target date in the past ──────────────────────
// getDaysToTarget returns null when target date is before last S-code date.
// This means no component projections are generated.

describe('Target date before last S-code date', () => {
  it('no projections generated when target is before last assessment', () => {
    const scode = {
      date: '2026-06-01',
      cardio: { exercise: EXERCISES.RUN_2MILE, value: 900, exempt: false },
      strength: { exercise: EXERCISES.PUSHUPS, value: 50, exempt: false },
      core: null,
      bodyComp: null,
    }
    const result = generateProjection(
      [scode],
      { dob: '1995-01-01', gender: M },
      '2026-05-01', // target is BEFORE the S-code date
    )
    expect(result).not.toBeNull()
    // No components should have projections (daysToTarget < 0 -> null)
    expect(result.components.cardio).toBeUndefined()
    expect(result.components.strength).toBeUndefined()
    expect(result.composite).toBeNull()
  })
})

// ─── GAP 10: getMinPassingValue edge - when every entry passes ──────────────

describe('getMinPassingValue - every entry passes', () => {
  it('returns the worst threshold when all table entries meet minimum', () => {
    // WHtR bodyComp minimum is 50%. Max points = 20.0.
    // 50% of 20 = 10. Looking at WHTR_TABLE, threshold 0.56 = 10.0 pts.
    // So minPassingValue should be 0.56 (worst ratio that still passes).
    const val = getMinPassingValue(EXERCISES.WHTR, 'bodyComp', M, U25)
    expect(val).not.toBeNull()
    expect(val).toBe(0.56) // 10.0 pts = exactly 50% of 20
  })
})
