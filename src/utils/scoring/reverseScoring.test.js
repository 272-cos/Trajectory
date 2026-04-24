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
  it('returns { threshold, points, displayValue, unit } for push-ups (no minimumPct)', () => {
    const result = getMinimumToPass(EXERCISES.PUSHUPS, U25, M)
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('threshold')
    expect(result).toHaveProperty('points')
    expect(result).toHaveProperty('displayValue')
    expect(result).toHaveProperty('unit')
    // minimumPct is removed - floor is chart-based, not percentage
    expect(result).not.toHaveProperty('minimumPct')
  })

  it('returns null for 2km walk (pass/fail only, no minimum threshold)', () => {
    expect(getMinimumToPass(EXERCISES.WALK_2KM, U25, M)).toBeNull()
  })

  it('returns null for unknown exercise', () => {
    expect(getMinimumToPass('invalid_exercise', U25, M)).toBeNull()
  })
})

// ─── getMinimumToPass: returns * row (last table row) per §3.7.4 ─────────────
// The * row is the chart floor - the lowest threshold that still earns any points.

describe('getMinimumToPass - returns * row (chart floor) per DAFMAN §3.7.4', () => {
  it('M <25 2-mile run returns * row: 1185s, 35 pts', () => {
    const result = getMinimumToPass(EXERCISES.RUN_2MILE, U25, M)
    expect(result.threshold).toBe(1185)
    expect(result.points).toBe(35.0)
  })

  it('M <25 HAMR returns * row: 42 shuttles, 35 pts', () => {
    const result = getMinimumToPass(EXERCISES.HAMR, U25, M)
    expect(result.threshold).toBe(42)
    expect(result.points).toBe(35.0)
  })

  it('M <25 push-ups returns * row: 30 reps, 2.5 pts', () => {
    const result = getMinimumToPass(EXERCISES.PUSHUPS, U25, M)
    expect(result.threshold).toBe(30)
    expect(result.points).toBe(2.5)
  })

  it('M <25 HRPU returns * row: 27 reps, 2.5 pts', () => {
    const result = getMinimumToPass(EXERCISES.HRPU, U25, M)
    expect(result.threshold).toBe(27)
    expect(result.points).toBe(2.5)
  })

  it('M <25 sit-ups returns * row: 33 reps, 2.5 pts', () => {
    const result = getMinimumToPass(EXERCISES.SITUPS, U25, M)
    expect(result.threshold).toBe(33)
    expect(result.points).toBe(2.5)
  })

  it('M <25 CLRC returns * row: 35 reps, 2.5 pts', () => {
    const result = getMinimumToPass(EXERCISES.CLRC, U25, M)
    expect(result.threshold).toBe(35)
    expect(result.points).toBe(2.5)
  })

  it('M <25 plank returns * row: 95s, 2.5 pts', () => {
    const result = getMinimumToPass(EXERCISES.PLANK, U25, M)
    expect(result.threshold).toBe(95)
    expect(result.points).toBe(2.5)
  })

  it('WHtR getMinimumToPass returns null (BC has no minimum per DAFMAN §3.7.1)', () => {
    const result = getMinimumToPass(EXERCISES.WHTR, U25, M)
    expect(result).toBeNull()
  })
})

// ─── getMinimumToPass: * row points are positive (any points = passes floor) ──
// §3.7.4: the * row is the lowest threshold with points > 0.

describe('getMinimumToPass - returned points > 0 (* row earns positive score)', () => {
  it('push-ups: returned points > 0 (2.5 pts = * row floor)', () => {
    const result = getMinimumToPass(EXERCISES.PUSHUPS, U25, M)
    expect(result.points).toBeGreaterThan(0)
    expect(result.points).toBe(2.5)
  })

  it('HRPU: returned points > 0 (2.5 pts = * row floor)', () => {
    const result = getMinimumToPass(EXERCISES.HRPU, U25, M)
    expect(result.points).toBeGreaterThan(0)
    expect(result.points).toBe(2.5)
  })

  it('2-mile run: returned points > 0 (35 pts = * row floor)', () => {
    const result = getMinimumToPass(EXERCISES.RUN_2MILE, U25, M)
    expect(result.points).toBeGreaterThan(0)
    expect(result.points).toBe(35.0)
  })

  it('HAMR: returned points > 0 (35 pts = * row floor)', () => {
    const result = getMinimumToPass(EXERCISES.HAMR, U25, M)
    expect(result.points).toBeGreaterThan(0)
    expect(result.points).toBe(35.0)
  })

  it('sit-ups: returned points > 0 (2.5 pts = * row floor)', () => {
    const result = getMinimumToPass(EXERCISES.SITUPS, U25, M)
    expect(result.points).toBeGreaterThan(0)
    expect(result.points).toBe(2.5)
  })

  it('plank: returned points > 0 (2.5 pts = * row floor)', () => {
    const result = getMinimumToPass(EXERCISES.PLANK, U25, M)
    expect(result.points).toBeGreaterThan(0)
    expect(result.points).toBe(2.5)
  })

  it('WHtR: returns null - no per-component minimum (DAFMAN §3.7.1)', () => {
    const result = getMinimumToPass(EXERCISES.WHTR, U25, M)
    expect(result).toBeNull()
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

  it('M <25 WHtR getMinimumToPass returns null (BC has no per-component minimum)', () => {
    // DAFMAN 36-2905 §3.7.1: Body Composition has no minimum requirement.
    const minInfo = getMinimumToPass(EXERCISES.WHTR, U25, M)
    expect(minInfo).toBeNull()
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

  it('WHtR returns null - no threshold concept (BC has no per-component minimum)', () => {
    const result = getMinimumToPass(EXERCISES.WHTR, U25, M)
    expect(result).toBeNull()
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

  it('WHtR returns null - no displayValue (BC has no per-component minimum)', () => {
    const result = getMinimumToPass(EXERCISES.WHTR, U25, M)
    expect(result).toBeNull()
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

  it('M 55-59 WHtR returns null (BC has no per-component minimum)', () => {
    const result = getMinimumToPass(EXERCISES.WHTR, A5559, M)
    expect(result).toBeNull()
  })
})
