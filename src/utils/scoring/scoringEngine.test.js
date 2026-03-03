/**
 * Scoring Engine unit tests
 * Covers EC-01: values above/below chart bounds → clamp, never 0
 */

import { describe, it, expect } from 'vitest'
import { lookupScore, parseTime, calculateCompositeScore, calculateComponentScore } from './scoringEngine.js'
import { EXERCISES, AGE_GROUPS, GENDER, COMPONENTS } from './constants.js'

// Male <25 table reference values (from scoringTables.js)
// RUN_2MILE: best=805s(13:25)/50pts, worst=1185s(19:45)/29.5pts
// PUSHUPS:   best=67reps/15pts,       worst=30reps/0.8pts
// PLANK:     best=215s(3:35)/15pts,   worst=65s(1:05)/7.5pts
// HAMR:      best=100shutt/50pts,     worst=39shutt/29.5pts
// SITUPS:    best=58reps/15pts,       worst=39reps/2.3pts

const M = GENDER.MALE
const U25 = AGE_GROUPS.UNDER_25

// ─── EC-01: above-chart-max clamps to max points ─────────────────────────────

describe('EC-01 – reps above chart max → max points', () => {
  it('pushups: value above chart max (67) returns max 15.0 pts', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 100, M, U25)
    expect(result.points).toBe(15.0)
    expect(result.percentage).toBe(100)
  })

  it('pushups: value exactly at chart max (67) returns max 15.0 pts', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 67, M, U25)
    expect(result.points).toBe(15.0)
  })

  it('HAMR: value above chart max (100) returns max 50.0 pts', () => {
    const result = lookupScore(EXERCISES.HAMR, 150, M, U25)
    expect(result.points).toBe(50.0)
    expect(result.percentage).toBe(100)
  })

  it('HAMR: value exactly at chart max (100) returns max 50.0 pts', () => {
    const result = lookupScore(EXERCISES.HAMR, 100, M, U25)
    expect(result.points).toBe(50.0)
  })

  it('situps: value above chart max (58) returns max 15.0 pts', () => {
    const result = lookupScore(EXERCISES.SITUPS, 80, M, U25)
    expect(result.points).toBe(15.0)
    expect(result.percentage).toBe(100)
  })
})

describe('EC-01 – plank time above chart max → max points', () => {
  it('plank: time above chart max (215s) returns max 15.0 pts', () => {
    const result = lookupScore(EXERCISES.PLANK, 400, M, U25)
    expect(result.points).toBe(15.0)
    expect(result.percentage).toBe(100)
  })

  it('plank: time exactly at chart max (215s) returns max 15.0 pts', () => {
    const result = lookupScore(EXERCISES.PLANK, 215, M, U25)
    expect(result.points).toBe(15.0)
  })
})

describe('EC-01 – run time faster than chart min → max points', () => {
  it('2-mile run: time faster than chart best (805s) returns max 50.0 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 600, M, U25)
    expect(result.points).toBe(50.0)
    expect(result.percentage).toBe(100)
  })

  it('2-mile run: time exactly at chart best (805s) returns max 50.0 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 805, M, U25)
    expect(result.points).toBe(50.0)
  })
})

// ─── EC-01: below-chart-min clamps to minimum points (never 0) ───────────────

describe('EC-01 – reps below chart min → minimum chart points, never 0', () => {
  it('pushups: value below chart min (30) returns minimum 0.8 pts, not 0', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 5, M, U25)
    expect(result.points).toBe(0.8)
    expect(result.points).toBeGreaterThan(0)
  })

  it('pushups: value = 1 (below chart min of 30) → minimum chart points, not 0', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 1, M, U25)
    expect(result.points).toBe(0.8)
    expect(result.points).toBeGreaterThan(0)
  })

  it('HAMR: value below chart min (39) returns minimum 29.5 pts, not 0', () => {
    const result = lookupScore(EXERCISES.HAMR, 10, M, U25)
    expect(result.points).toBe(29.5)
    expect(result.points).toBeGreaterThan(0)
  })

  it('situps: value below chart min (39) returns minimum 2.3 pts, not 0', () => {
    const result = lookupScore(EXERCISES.SITUPS, 1, M, U25)
    expect(result.points).toBe(2.3)
    expect(result.points).toBeGreaterThan(0)
  })
})

describe('EC-01 – plank time below chart min → minimum chart points, never 0', () => {
  it('plank: time below chart min (65s) returns minimum 7.5 pts, not 0', () => {
    const result = lookupScore(EXERCISES.PLANK, 10, M, U25)
    expect(result.points).toBe(7.5)
    expect(result.points).toBeGreaterThan(0)
  })
})

describe('EC-01 – run time slower than chart worst → minimum chart points, never 0', () => {
  it('2-mile run: time slower than chart worst (1185s) returns minimum 29.5 pts, not 0', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 2000, M, U25)
    expect(result.points).toBe(29.5)
    expect(result.points).toBeGreaterThan(0)
  })
})

// ─── SL-02: 0 reps/seconds = did not attempt → exactly 0 points ──────────────

describe('SL-02 – 0 reps/seconds → 0 points (not minimum chart points)', () => {
  it('pushups: 0 reps → 0 points', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 0, M, U25)
    expect(result.points).toBe(0)
    expect(result.percentage).toBe(0)
  })

  it('HAMR: 0 shuttles → 0 points', () => {
    const result = lookupScore(EXERCISES.HAMR, 0, M, U25)
    expect(result.points).toBe(0)
    expect(result.percentage).toBe(0)
  })

  it('situps: 0 reps → 0 points', () => {
    const result = lookupScore(EXERCISES.SITUPS, 0, M, U25)
    expect(result.points).toBe(0)
    expect(result.percentage).toBe(0)
  })

  it('CLRC: 0 reps → 0 points', () => {
    const result = lookupScore(EXERCISES.CLRC, 0, M, U25)
    expect(result.points).toBe(0)
    expect(result.percentage).toBe(0)
  })

  it('plank: 0 seconds → 0 points', () => {
    const result = lookupScore(EXERCISES.PLANK, 0, M, U25)
    expect(result.points).toBe(0)
    expect(result.percentage).toBe(0)
  })

  it('maxPoints still reflects the table max even when points = 0', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 0, M, U25)
    expect(result.maxPoints).toBe(15.0)
  })

  it('0 reps is distinct from null (null = untested, 0 = attempted with no reps)', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, null, M, U25)).toBeNull()
    expect(lookupScore(EXERCISES.PUSHUPS, 0, M, U25)).not.toBeNull()
    expect(lookupScore(EXERCISES.PUSHUPS, 0, M, U25).points).toBe(0)
  })
})

// ─── Mid-table lookups ────────────────────────────────────────────────────────

describe('lookupScore – mid-table values', () => {
  it('2-mile run: 17:55 (1075s) → 37.5 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1075, M, U25)
    expect(result.points).toBe(37.5)
  })

  it('pushups: 42 reps → 10.8 pts', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 42, M, U25)
    expect(result.points).toBe(10.8)
  })

  it('plank: 125s → 10.5 pts', () => {
    const result = lookupScore(EXERCISES.PLANK, 125, M, U25)
    expect(result.points).toBe(10.5)
  })
})

// ─── parseTime ────────────────────────────────────────────────────────────────

describe('parseTime', () => {
  it('"18" treated as 18 minutes → 1080 seconds', () => {
    expect(parseTime('18')).toBe(1080)
  })

  it('"18:00" → 1080 seconds', () => {
    expect(parseTime('18:00')).toBe(1080)
  })

  it('"18:30" → 1110 seconds', () => {
    expect(parseTime('18:30')).toBe(1110)
  })

  it('"0:30" → 30 seconds', () => {
    expect(parseTime('0:30')).toBe(30)
  })

  it('"13" treated as 13 minutes → 780 seconds', () => {
    expect(parseTime('13')).toBe(780)
  })

  it('empty string → null', () => {
    expect(parseTime('')).toBeNull()
  })

  it('null → null', () => {
    expect(parseTime(null)).toBeNull()
  })

  it('"0" → null (zero minutes is not a valid time)', () => {
    expect(parseTime('0')).toBeNull()
  })
})

// ─── null / undefined inputs ──────────────────────────────────────────────────

describe('lookupScore – null/undefined value', () => {
  it('null value → null result', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, null, M, U25)).toBeNull()
  })

  it('undefined value → null result', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, undefined, M, U25)).toBeNull()
  })
})

// ─── maxPoints derivation ─────────────────────────────────────────────────────

describe('lookupScore – maxPoints always equals table[0].points', () => {
  it('pushups maxPoints is always 15', () => {
    const low = lookupScore(EXERCISES.PUSHUPS, 5, M, U25)
    const high = lookupScore(EXERCISES.PUSHUPS, 100, M, U25)
    expect(low.maxPoints).toBe(15.0)
    expect(high.maxPoints).toBe(15.0)
  })

  it('run maxPoints is always 50', () => {
    const slow = lookupScore(EXERCISES.RUN_2MILE, 2000, M, U25)
    const fast = lookupScore(EXERCISES.RUN_2MILE, 600, M, U25)
    expect(slow.maxPoints).toBe(50.0)
    expect(fast.maxPoints).toBe(50.0)
  })
})
