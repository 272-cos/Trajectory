/**
 * Edge case tests - gaps found during scoring engine audit
 *
 * These cover code paths and boundary conditions that existing tests miss,
 * focused on cases that could produce WRONG RESULTS.
 */

import { describe, it, expect } from 'vitest'
import {
  lookupScore,
  calculateComponentScore,
  calculateCompositeScore,
  parseTime,
  formatTime,
  isTimeIncomplete,
} from './scoringEngine.js'
import { EXERCISES, AGE_BRACKETS, GENDER, COMPONENTS } from './constants.js'

const M = GENDER.MALE
const U25 = AGE_BRACKETS.UNDER_25

// ─── GAP 1: WHtR 0.60 returns 0.0 points - violates "never 0" invariant ─────
// EC-01 says below-chart-min clamps to minimum chart points, NEVER 0.
// But WHTR_TABLE's last entry is { threshold: 0.60, points: 0.0 }.
// This means lookupScore returns points=0 for WHtR >= 0.60, and
// percentage = (0/20)*100 = 0. This is NOT an error in the table (the
// regulation assigns 0 points), but it means EC-01's "never 0" invariant
// does not hold for WHtR body comp. Tests should document this behavior.

describe('WHtR 0.60 edge case - 0 points from table (not EC-01 violation)', () => {
  it('WHtR exactly 0.60 returns 0.0 points (table minimum, not clamped higher)', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.60, M, U25)
    expect(result).not.toBeNull()
    expect(result.points).toBe(0.0)
    expect(result.percentage).toBe(0)
  })

  it('WHtR worse than chart (0.65) also clamps to 0.0 points', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.65, M, U25)
    expect(result).not.toBeNull()
    expect(result.points).toBe(0.0)
  })

  it('WHtR 0.60 component score: pass=false (0% < 50% minimum)', () => {
    const result = calculateComponentScore(
      { type: 'bodyComp', exercise: EXERCISES.WHTR, value: 0.60 },
      M, U25,
    )
    expect(result.tested).toBe(true)
    expect(result.points).toBe(0.0)
    expect(result.pass).toBe(false)
  })

  it('WHtR 0.59 gives 2.5 pts (just above 0.0 threshold)', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.59, M, U25)
    expect(result.points).toBe(2.5)
  })

  it('WHtR 0.595 rounds to 0.60 and gets 0.0 pts (rounding pushes into 0-pt bracket)', () => {
    // This is a critical rounding edge: 0.595 rounds to 0.60
    const result = lookupScore(EXERCISES.WHTR, 0.595, M, U25)
    expect(result.points).toBe(0.0)
  })

  it('WHtR 0.594 rounds to 0.59 and gets 2.5 pts (rounding saves from 0-pt bracket)', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.594, M, U25)
    expect(result.points).toBe(2.5)
  })
})

// ─── GAP 2: Composite with all-walk components ──────────────────────────────
// What happens when all 4 components are walk-type? The walk code sets
// totalPossible=0 and totalEarned=0. The allExempt path returns composite=null.
// But what if 3 are walk and 1 is exempt? That combination also yields
// totalPossible=0 but through a different path.

describe('Composite edge cases - walk + exempt combinations', () => {
  const makeWalk = (pass) => ({
    tested: true, exempt: false, walkOnly: true, points: 0, maxPoints: 50, pass,
  })
  const makeExempt = () => ({
    tested: false, exempt: true, points: 0, maxPoints: 0, pass: true,
  })

  it('1 walk + 3 exempt = totalPossible=0, allExempt=true, composite=null', () => {
    const result = calculateCompositeScore([
      makeWalk(true), makeExempt(), makeExempt(), makeExempt(),
    ])
    expect(result.composite).toBeNull()
    expect(result.pass).toBeNull()
    expect(result.allExempt).toBe(true)
  })

  it('failed walk + 3 exempt: composite null but walk failure is tracked', () => {
    const result = calculateCompositeScore([
      makeWalk(false), makeExempt(), makeExempt(), makeExempt(),
    ])
    // Walk failure should be noted even though composite is null
    expect(result.composite).toBeNull()
    expect(result.walkComponents).toHaveLength(1)
    expect(result.walkComponents[0].pass).toBe(false)
  })
})

// ─── GAP 3: Negative values return null ──────────────────────────────────────
// The source code guards negative values but no test verifies this for all
// exercise types.

describe('Negative values return null for all exercise types', () => {
  it('negative reps for pushups returns null', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, -1, M, U25)).toBeNull()
  })

  it('negative time for run returns null', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, -100, M, U25)).toBeNull()
  })

  it('negative ratio for WHtR returns null', () => {
    expect(lookupScore(EXERCISES.WHTR, -0.5, M, U25)).toBeNull()
  })

  it('negative plank time returns null', () => {
    expect(lookupScore(EXERCISES.PLANK, -10, M, U25)).toBeNull()
  })

  it('negative HAMR shuttles returns null', () => {
    expect(lookupScore(EXERCISES.HAMR, -5, M, U25)).toBeNull()
  })
})

// ─── GAP 4: calculateComponentScore with lookupScore returning null ──────────
// When lookupScore returns null (e.g., negative value or 0 for run),
// calculateComponentScore returns an error result. Not tested.

describe('calculateComponentScore when lookupScore returns null', () => {
  it('run with 0 time (lookupScore returns null): error result, pass=false', () => {
    const result = calculateComponentScore(
      { type: 'cardio', exercise: EXERCISES.RUN_2MILE, value: 0 },
      M, U25,
    )
    // lookupScore(RUN_2MILE, 0) returns null because 0 time is impossible
    expect(result.tested).toBe(true)
    expect(result.pass).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('WHtR with 0 ratio (lookupScore returns null): error result', () => {
    const result = calculateComponentScore(
      { type: 'bodyComp', exercise: EXERCISES.WHTR, value: 0 },
      M, U25,
    )
    expect(result.tested).toBe(true)
    expect(result.pass).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

// ─── GAP 5: parseTime edge cases not covered ────────────────────────────────

describe('parseTime - uncovered edge cases', () => {
  it('"0:00" returns null (zero total time)', () => {
    expect(parseTime('0:00')).toBeNull()
  })

  it('"99:59" is valid (max reasonable mm:ss)', () => {
    expect(parseTime('99:59')).toBe(99 * 60 + 59)
  })

  it('"100:00" returns null (minutes > 99)', () => {
    expect(parseTime('100:00')).toBeNull()
  })

  it('"10:60" returns null (seconds >= 60)', () => {
    expect(parseTime('10:60')).toBeNull()
  })

  it('"10:-1" returns null (negative seconds)', () => {
    expect(parseTime('10:-1')).toBeNull()
  })

  it('"-1:30" returns null (negative minutes)', () => {
    expect(parseTime('-1:30')).toBeNull()
  })

  it('"abc" returns null', () => {
    expect(parseTime('abc')).toBeNull()
  })

  it('"10:30:00" returns null (too many colons)', () => {
    expect(parseTime('10:30:00')).toBeNull()
  })

  it('"99" treated as 99 minutes = 5940 seconds (2-digit = minutes)', () => {
    expect(parseTime('99')).toBe(5940)
  })

  it('"100" treated as 100 total seconds (3-digit = seconds)', () => {
    expect(parseTime('100')).toBe(100)
  })
})

// ─── GAP 6: formatTime edge cases ───────────────────────────────────────────

describe('formatTime - uncovered edge cases', () => {
  it('0 seconds returns "0:00"', () => {
    expect(formatTime(0)).toBe('0:00')
  })

  it('59 seconds returns "0:59"', () => {
    expect(formatTime(59)).toBe('0:59')
  })

  it('60 seconds returns "1:00"', () => {
    expect(formatTime(60)).toBe('1:00')
  })

  it('null returns empty string', () => {
    expect(formatTime(null)).toBe('')
  })

  it('undefined returns empty string', () => {
    expect(formatTime(undefined)).toBe('')
  })

  it('fractional seconds are floored', () => {
    expect(formatTime(90.7)).toBe('1:30')
  })
})

// ─── GAP 7: isTimeIncomplete ────────────────────────────────────────────────
// No tests exist for this function at all.

describe('isTimeIncomplete - completely untested function', () => {
  it('null returns false', () => {
    expect(isTimeIncomplete(null)).toBe(false)
  })

  it('empty string returns false', () => {
    expect(isTimeIncomplete('')).toBe(false)
  })

  it('"18:" (trailing colon) returns true', () => {
    expect(isTimeIncomplete('18:')).toBe(true)
  })

  it('"1:" (trailing colon) returns true', () => {
    expect(isTimeIncomplete('1:')).toBe(true)
  })

  it('"18:3" (single digit after colon) returns true', () => {
    expect(isTimeIncomplete('18:3')).toBe(true)
  })

  it('"18:30" (complete time) returns false', () => {
    expect(isTimeIncomplete('18:30')).toBe(false)
  })

  it('"18" (no colon) returns false', () => {
    expect(isTimeIncomplete('18')).toBe(false)
  })
})

// ─── GAP 8: Composite rounding edge at exactly 74.95 ────────────────────────
// SL-06 tests 74.95 rounding to 75.0 with specific points. But the
// float precision of the intermediate calculation matters. Testing with
// values that produce an exact 74.95 raw composite via a different route.

describe('Composite rounding - additional boundary precision', () => {
  const makeComp = (points, maxPoints, pass = true) => ({
    tested: true, exempt: false, points, maxPoints, pass,
  })

  it('total earned 74.95 out of 100 possible rounds to 75.0 and passes', () => {
    // 4 components summing to 74.95 out of 100
    const result = calculateCompositeScore([
      makeComp(37.475, 50),   // cardio
      makeComp(14.975, 20),   // body comp
      makeComp(11.25, 15),    // strength
      makeComp(11.25, 15),    // core
    ])
    // 74.95 / 100 * 1000 = 749.5 -> Math.round(749.5) = 750 -> 75.0
    expect(result.composite).toBe(75.0)
    expect(result.pass).toBe(true)
  })

  it('total earned 74.94 out of 100 possible rounds to 74.9 and fails', () => {
    const result = calculateCompositeScore([
      makeComp(37.47, 50),
      makeComp(14.97, 20),
      makeComp(11.25, 15),
      makeComp(11.25, 15),
    ])
    // 74.94 / 100 * 1000 = 749.4 -> Math.round(749.4) = 749 -> 74.9
    expect(result.composite).toBe(74.9)
    expect(result.pass).toBe(false)
  })
})

// ─── GAP 9: Walk exactly at time limit boundary ─────────────────────────────
// Walk auto-determination uses value <= timeLimit. The exact boundary
// case (value === timeLimit) is not tested.

describe('Walk at exact time limit boundary', () => {
  it('walk time exactly at limit (976s for M/<25) passes', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.WALK_2KM, value: 976 },
      M, U25,
    )
    expect(result.walkOnly).toBe(true)
    expect(result.pass).toBe(true)
  })

  it('walk time 1 second over limit (977s for M/<25) fails', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.WALK_2KM, value: 977 },
      M, U25,
    )
    expect(result.walkOnly).toBe(true)
    expect(result.pass).toBe(false)
  })
})

// ─── GAP 10: HRPU and CLRC exercises in calculateComponentScore ─────────────
// Existing tests only test pushups/situps for strength/core. HRPU and CLRC
// are alternative exercises that should work identically but are not tested
// through calculateComponentScore.

describe('Alternative exercises through calculateComponentScore', () => {
  it('HRPU (2-min hand-release push-ups) scores correctly', () => {
    const result = calculateComponentScore(
      { type: 'strength', exercise: EXERCISES.HRPU, value: 30 },
      M, U25,
    )
    expect(result.tested).toBe(true)
    expect(result.points).toBeGreaterThan(0)
    expect(result.pass).toBeDefined()
  })

  it('CLRC (cross-leg reverse crunch) scores correctly', () => {
    const result = calculateComponentScore(
      { type: 'core', exercise: EXERCISES.CLRC, value: 30 },
      M, U25,
    )
    expect(result.tested).toBe(true)
    expect(result.points).toBeGreaterThan(0)
    expect(result.pass).toBeDefined()
  })

  it('HAMR (shuttle run) scores correctly as cardio', () => {
    const result = calculateComponentScore(
      { type: 'cardio', exercise: EXERCISES.HAMR, value: 60 },
      M, U25,
    )
    expect(result.tested).toBe(true)
    expect(result.points).toBeGreaterThan(0)
    expect(result.pass).toBeDefined()
  })
})
