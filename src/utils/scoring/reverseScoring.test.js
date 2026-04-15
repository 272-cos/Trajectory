/**
 * reverseScoring.js unit tests
 * Covers getMinimumToPass() and reverseLookup() behavior.
 */

import { describe, it, expect } from 'vitest'
import { getMinimumToPass } from './reverseScoring.js'
import { calculateComponentScore } from './scoringEngine.js'
import { EXERCISES, AGE_BRACKETS, GENDER } from './constants.js'

const M = GENDER.MALE
const F = GENDER.FEMALE
const U25 = AGE_BRACKETS.UNDER_25
const A4044 = AGE_BRACKETS.AGE_40_44
const A5559 = AGE_BRACKETS.AGE_55_59

// ─── getMinimumToPass: return shape ──────────────────────────────────────────

describe('getMinimumToPass - return shape', () => {
  it('returns { threshold, points, minimumPct, displayValue, unit } for push-ups', () => {
    const result = getMinimumToPass(EXERCISES.PUSHUPS, U25, M)
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('threshold')
    expect(result).toHaveProperty('points')
    expect(result).toHaveProperty('minimumPct')
    expect(result).toHaveProperty('displayValue')
    expect(result).toHaveProperty('unit')
  })

  it('returns null for 2km walk (pass/fail only, no minimum threshold)', () => {
    expect(getMinimumToPass(EXERCISES.WALK_2KM, U25, M)).toBeNull()
  })

  it('returns null for unknown exercise', () => {
    expect(getMinimumToPass('invalid_exercise', U25, M)).toBeNull()
  })
})

// ─── getMinimumToPass: minimumPct by component ───────────────────────────────
// Cardio/Strength/Core: 60%; Body Comp: 50%

describe('getMinimumToPass - minimumPct values match component rules', () => {
  it('2-mile run minimumPct = 60 (cardio)', () => {
    const result = getMinimumToPass(EXERCISES.RUN_2MILE, U25, M)
    expect(result.minimumPct).toBe(60)
  })

  it('HAMR minimumPct = 60 (cardio)', () => {
    const result = getMinimumToPass(EXERCISES.HAMR, U25, M)
    expect(result.minimumPct).toBe(60)
  })

  it('push-ups minimumPct = 60 (strength)', () => {
    const result = getMinimumToPass(EXERCISES.PUSHUPS, U25, M)
    expect(result.minimumPct).toBe(60)
  })

  it('HRPU minimumPct = 60 (strength)', () => {
    const result = getMinimumToPass(EXERCISES.HRPU, U25, M)
    expect(result.minimumPct).toBe(60)
  })

  it('sit-ups minimumPct = 60 (core)', () => {
    const result = getMinimumToPass(EXERCISES.SITUPS, U25, M)
    expect(result.minimumPct).toBe(60)
  })

  it('CLRC minimumPct = 60 (core)', () => {
    const result = getMinimumToPass(EXERCISES.CLRC, U25, M)
    expect(result.minimumPct).toBe(60)
  })

  it('plank minimumPct = 60 (core)', () => {
    const result = getMinimumToPass(EXERCISES.PLANK, U25, M)
    expect(result.minimumPct).toBe(60)
  })

  it('WHtR minimumPct = 50 (body comp)', () => {
    const result = getMinimumToPass(EXERCISES.WHTR, U25, M)
    expect(result.minimumPct).toBe(50)
  })
})

// ─── getMinimumToPass: points must be >= minimum required ─────────────────────
// Cardio min 30/50, Strength min 9/15, Core min 9/15, BodyComp min 10/20

describe('getMinimumToPass - returned points >= component minimum', () => {
  it('push-ups: returned points >= 9.0 (60% of 15)', () => {
    const result = getMinimumToPass(EXERCISES.PUSHUPS, U25, M)
    expect(result.points).toBeGreaterThanOrEqual(9.0)
  })

  it('HRPU: returned points >= 9.0 (60% of 15)', () => {
    const result = getMinimumToPass(EXERCISES.HRPU, U25, M)
    expect(result.points).toBeGreaterThanOrEqual(9.0)
  })

  it('2-mile run: returned points >= 30.0 (60% of 50)', () => {
    const result = getMinimumToPass(EXERCISES.RUN_2MILE, U25, M)
    expect(result.points).toBeGreaterThanOrEqual(30.0)
  })

  it('HAMR: returned points >= 30.0 (60% of 50)', () => {
    const result = getMinimumToPass(EXERCISES.HAMR, U25, M)
    expect(result.points).toBeGreaterThanOrEqual(30.0)
  })

  it('sit-ups: returned points >= 9.0 (60% of 15)', () => {
    const result = getMinimumToPass(EXERCISES.SITUPS, U25, M)
    expect(result.points).toBeGreaterThanOrEqual(9.0)
  })

  it('plank: returned points >= 9.0 (60% of 15)', () => {
    const result = getMinimumToPass(EXERCISES.PLANK, U25, M)
    expect(result.points).toBeGreaterThanOrEqual(9.0)
  })

  it('WHtR: returned points >= 10.0 (50% of 20)', () => {
    const result = getMinimumToPass(EXERCISES.WHTR, U25, M)
    expect(result.points).toBeGreaterThanOrEqual(10.0)
  })
})

// ─── getMinimumToPass: integration - scoring at threshold passes component ───
// The threshold from getMinimumToPass should produce pass:true in scoringEngine.

describe('getMinimumToPass - integration: threshold earns passing score', () => {
  it('M <25 push-ups at minimum threshold → component pass: true', () => {
    const minInfo = getMinimumToPass(EXERCISES.PUSHUPS, U25, M)
    const compResult = calculateComponentScore(
      { type: 'strength', exercise: EXERCISES.PUSHUPS, value: minInfo.threshold },
      M, U25
    )
    expect(compResult.pass).toBe(true)
    expect(compResult.belowMinimum).toBe(false)
  })

  it('M <25 sit-ups at minimum threshold → component pass: true', () => {
    const minInfo = getMinimumToPass(EXERCISES.SITUPS, U25, M)
    const compResult = calculateComponentScore(
      { type: 'core', exercise: EXERCISES.SITUPS, value: minInfo.threshold },
      M, U25
    )
    expect(compResult.pass).toBe(true)
    expect(compResult.belowMinimum).toBe(false)
  })

  it('M <25 2-mile run at minimum threshold → component pass: true', () => {
    const minInfo = getMinimumToPass(EXERCISES.RUN_2MILE, U25, M)
    const compResult = calculateComponentScore(
      { type: 'cardio', exercise: EXERCISES.RUN_2MILE, value: minInfo.threshold },
      M, U25
    )
    expect(compResult.pass).toBe(true)
    expect(compResult.belowMinimum).toBe(false)
  })

  it('M <25 WHtR at minimum threshold → component pass: true', () => {
    const minInfo = getMinimumToPass(EXERCISES.WHTR, U25, M)
    const compResult = calculateComponentScore(
      { type: 'bodyComp', exercise: EXERCISES.WHTR, value: minInfo.threshold },
      M, U25
    )
    expect(compResult.pass).toBe(true)
    expect(compResult.belowMinimum).toBe(false)
  })

  it('F 40-44 push-ups at minimum threshold → component pass: true', () => {
    const minInfo = getMinimumToPass(EXERCISES.PUSHUPS, A4044, F)
    const compResult = calculateComponentScore(
      { type: 'strength', exercise: EXERCISES.PUSHUPS, value: minInfo.threshold },
      F, A4044
    )
    expect(compResult.pass).toBe(true)
    expect(compResult.belowMinimum).toBe(false)
  })

  it('F 55-59 plank at minimum threshold → component pass: true', () => {
    const minInfo = getMinimumToPass(EXERCISES.PLANK, A5559, F)
    const compResult = calculateComponentScore(
      { type: 'core', exercise: EXERCISES.PLANK, value: minInfo.threshold },
      F, A5559
    )
    expect(compResult.pass).toBe(true)
    expect(compResult.belowMinimum).toBe(false)
  })
})

// ─── getMinimumToPass: threshold direction correctness ────────────────────────
// For lower-is-better (run, WHtR): threshold is a time/ratio (not too high).
// For higher-is-better (reps, HAMR, plank): threshold is a minimum count.

describe('getMinimumToPass - threshold direction by exercise type', () => {
  it('run threshold is in seconds (> 0, < 3600)', () => {
    const result = getMinimumToPass(EXERCISES.RUN_2MILE, U25, M)
    expect(result.threshold).toBeGreaterThan(0)
    expect(result.threshold).toBeLessThan(3600)
  })

  it('push-ups threshold is a rep count (> 0, < 200)', () => {
    const result = getMinimumToPass(EXERCISES.PUSHUPS, U25, M)
    expect(result.threshold).toBeGreaterThan(0)
    expect(result.threshold).toBeLessThan(200)
  })

  it('WHtR threshold is a ratio (> 0, < 1)', () => {
    const result = getMinimumToPass(EXERCISES.WHTR, U25, M)
    expect(result.threshold).toBeGreaterThan(0)
    expect(result.threshold).toBeLessThan(1)
  })

  it('plank threshold is in seconds (> 0, < 600)', () => {
    const result = getMinimumToPass(EXERCISES.PLANK, U25, M)
    expect(result.threshold).toBeGreaterThan(0)
    expect(result.threshold).toBeLessThan(600)
  })

  it('HAMR threshold is a shuttle count (> 0)', () => {
    const result = getMinimumToPass(EXERCISES.HAMR, U25, M)
    expect(result.threshold).toBeGreaterThan(0)
  })
})

// ─── getMinimumToPass: displayValue format ────────────────────────────────────

describe('getMinimumToPass - displayValue is a non-empty formatted string', () => {
  it('run displayValue is mm:ss format', () => {
    const result = getMinimumToPass(EXERCISES.RUN_2MILE, U25, M)
    expect(result.displayValue).toMatch(/^\d+:\d{2}$/)
  })

  it('push-ups displayValue ends with "reps"', () => {
    const result = getMinimumToPass(EXERCISES.PUSHUPS, U25, M)
    expect(result.displayValue).toMatch(/reps$/)
  })

  it('WHtR displayValue is a decimal ratio string', () => {
    const result = getMinimumToPass(EXERCISES.WHTR, U25, M)
    expect(result.displayValue).toMatch(/^\d+\.\d{2}$/)
  })

  it('plank displayValue is mm:ss format', () => {
    const result = getMinimumToPass(EXERCISES.PLANK, U25, M)
    expect(result.displayValue).toMatch(/^\d+:\d{2}$/)
  })

  it('HAMR displayValue ends with "shuttles"', () => {
    const result = getMinimumToPass(EXERCISES.HAMR, U25, M)
    expect(result.displayValue).toMatch(/shuttles$/)
  })
})

// ─── getMinimumToPass: cross-bracket/gender variation ─────────────────────────
// Thresholds should differ between brackets (sanity check different tables are used)

describe('getMinimumToPass - varies by gender and age bracket', () => {
  it('M <25 push-ups minimum threshold differs from F <25', () => {
    const mResult = getMinimumToPass(EXERCISES.PUSHUPS, U25, M)
    const fResult = getMinimumToPass(EXERCISES.PUSHUPS, U25, F)
    // Male table generally requires more push-ups to pass than female
    expect(mResult.threshold).not.toEqual(fResult.threshold)
  })

  it('M <25 run minimum threshold differs from M 40-44', () => {
    const youngResult = getMinimumToPass(EXERCISES.RUN_2MILE, U25, M)
    const olderResult = getMinimumToPass(EXERCISES.RUN_2MILE, A4044, M)
    // Older brackets generally have slower (higher) allowed times for same pts
    expect(youngResult.threshold).not.toEqual(olderResult.threshold)
  })

  it('F <25 HAMR threshold is non-null and positive', () => {
    const result = getMinimumToPass(EXERCISES.HAMR, U25, F)
    expect(result).not.toBeNull()
    expect(result.threshold).toBeGreaterThan(0)
  })

  it('M 55-59 WHtR minimum threshold is non-null', () => {
    const result = getMinimumToPass(EXERCISES.WHTR, A5559, M)
    expect(result).not.toBeNull()
    expect(result.minimumPct).toBe(50)
  })
})
