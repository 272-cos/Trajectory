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

// ─── SL-10 / EC-10: 0 reps on non-exempt → chart min points + component fail ──
// Supersedes SL-02: 0 reps no longer returns 0 pts; it clamps to chart min
// (same EC-01 logic) so "attempted with 0 reps" ≠ "not tested" (null).

describe('SL-10 – 0 reps → chart minimum points (not 0, not null)', () => {
  it('pushups: 0 reps → chart min 0.8 pts (not 0)', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 0, M, U25)
    expect(result.points).toBe(0.8)
    expect(result.points).toBeGreaterThan(0)
  })

  it('HAMR: 0 shuttles → chart min 29.5 pts', () => {
    const result = lookupScore(EXERCISES.HAMR, 0, M, U25)
    expect(result.points).toBe(29.5)
    expect(result.points).toBeGreaterThan(0)
  })

  it('situps: 0 reps → chart min 2.3 pts', () => {
    const result = lookupScore(EXERCISES.SITUPS, 0, M, U25)
    expect(result.points).toBe(2.3)
    expect(result.points).toBeGreaterThan(0)
  })

  it('CLRC: 0 reps → chart min 7.5 pts', () => {
    const result = lookupScore(EXERCISES.CLRC, 0, M, U25)
    expect(result.points).toBe(7.5)
    expect(result.points).toBeGreaterThan(0)
  })

  it('plank: 0 seconds → chart min 7.5 pts', () => {
    const result = lookupScore(EXERCISES.PLANK, 0, M, U25)
    expect(result.points).toBe(7.5)
    expect(result.points).toBeGreaterThan(0)
  })

  it('maxPoints still reflects the table max', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 0, M, U25)
    expect(result.maxPoints).toBe(15.0)
  })

  it('0 reps is distinct from null (null = untested, 0 = attempted with no reps)', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, null, M, U25)).toBeNull()
    expect(lookupScore(EXERCISES.PUSHUPS, 0, M, U25)).not.toBeNull()
    expect(lookupScore(EXERCISES.PUSHUPS, 0, M, U25).points).toBeGreaterThan(0)
  })
})

describe('EC-10 – 0 reps on non-exempt component → always pass:false', () => {
  it('strength: 0 pushups → tested=true, pass=false', () => {
    const result = calculateComponentScore(
      { type: 'strength', exercise: EXERCISES.PUSHUPS, value: 0 },
      M, U25
    )
    expect(result.tested).toBe(true)
    expect(result.pass).toBe(false)
    expect(result.points).toBe(0.8)
  })

  it('cardio: 0 HAMR → tested=true, pass=false', () => {
    const result = calculateComponentScore(
      { type: 'cardio', exercise: EXERCISES.HAMR, value: 0 },
      M, U25
    )
    expect(result.tested).toBe(true)
    expect(result.pass).toBe(false)
    expect(result.points).toBe(29.5)
  })

  it('core: 0 situps → tested=true, pass=false', () => {
    const result = calculateComponentScore(
      { type: 'core', exercise: EXERCISES.SITUPS, value: 0 },
      M, U25
    )
    expect(result.tested).toBe(true)
    expect(result.pass).toBe(false)
    expect(result.points).toBe(2.3)
  })

  it('core: 0s plank → tested=true, pass=false', () => {
    const result = calculateComponentScore(
      { type: 'core', exercise: EXERCISES.PLANK, value: 0 },
      M, U25
    )
    expect(result.tested).toBe(true)
    expect(result.pass).toBe(false)
    expect(result.points).toBe(7.5)
  })
})

// ─── SL-03 / EC-07: run time boundary is inclusive ───────────────────────────
// The listed time is the SLOWEST valid time for that row (<=, not <).
// Running exactly at the boundary earns that row's points.
//
// Male U25 run table rows used here:
//   Row 15: 1057s (17:37) → 38.6 pts
//   Row 16: 1075s (17:55) → 37.5 pts  ← primary boundary under test
//   Row 17: 1103s (18:23) → 35.5 pts
//   Row 20: 1176s (19:36) → 31.0 pts
//   Row 21: 1185s (19:45) → 29.5 pts  ← chart worst

describe('SL-03 / EC-07 – run time at exact boundary earns that row\'s points (inclusive)', () => {
  it('2-mile run: exactly at boundary 17:55 (1075s) → 37.5 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1075, M, U25)
    expect(result.points).toBe(37.5)
  })

  it('2-mile run: 1 second faster than boundary (1074s) → same row 37.5 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1074, M, U25)
    expect(result.points).toBe(37.5)
  })

  it('2-mile run: 1 second slower than boundary (1076s) → next row 35.5 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1076, M, U25)
    expect(result.points).toBe(35.5)
  })

  it('2-mile run: exactly at row 20 boundary 19:36 (1176s) → 31.0 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1176, M, U25)
    expect(result.points).toBe(31.0)
  })

  it('2-mile run: 1 second slower than row 20 boundary (1177s) → 29.5 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1177, M, U25)
    expect(result.points).toBe(29.5)
  })

  it('2-mile run: exactly at chart-worst boundary 19:45 (1185s) → 29.5 pts (inclusive)', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1185, M, U25)
    expect(result.points).toBe(29.5)
  })

  it('2-mile run: 1 second faster than chart worst (1184s) → 29.5 pts (within last row)', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1184, M, U25)
    expect(result.points).toBe(29.5)
  })
})

// ─── SL-04: HAMR gaps use containing bracket, no interpolation ───────────────
// HAMR is scored higher-is-better; the table has discrete thresholds.
// A value landing in the gap between two rows earns the lower bracket's points.
//
// Male U25 HAMR rows used here:
//   threshold 100 → 50.0 pts
//   threshold  94 → 49.4 pts  (gap: 95–99)
//   threshold  45 → 32.5 pts
//   threshold  42 → 31.0 pts  (gap: 43–44)
//   threshold  39 → 29.5 pts  ← chart worst

describe('SL-04 – HAMR gap values use containing bracket (no interpolation)', () => {
  it('43 shuttles (gap between 42 and 45) → 31.0 pts, not interpolated 31.5', () => {
    const result = lookupScore(EXERCISES.HAMR, 43, M, U25)
    expect(result.points).toBe(31.0)
    expect(result.points).not.toBe(31.5)  // confirms no interpolation
  })

  it('44 shuttles (gap between 42 and 45) → 31.0 pts', () => {
    const result = lookupScore(EXERCISES.HAMR, 44, M, U25)
    expect(result.points).toBe(31.0)
  })

  it('45 shuttles (exact threshold) → 32.5 pts (bracket boundary is inclusive)', () => {
    const result = lookupScore(EXERCISES.HAMR, 45, M, U25)
    expect(result.points).toBe(32.5)
  })

  it('46 shuttles (1 above lower boundary of 45–47 range) → 32.5 pts', () => {
    const result = lookupScore(EXERCISES.HAMR, 46, M, U25)
    expect(result.points).toBe(32.5)
  })

  it('97 shuttles (gap between 94 and 100) → 49.4 pts, not interpolated ~49.8', () => {
    const result = lookupScore(EXERCISES.HAMR, 97, M, U25)
    expect(result.points).toBe(49.4)
    expect(result.points).not.toBeCloseTo(49.8, 1)  // confirms no interpolation
  })

  it('99 shuttles (gap between 94 and 100) → 49.4 pts', () => {
    const result = lookupScore(EXERCISES.HAMR, 99, M, U25)
    expect(result.points).toBe(49.4)
  })

  it('40 shuttles (gap between 39 and 42) → 29.5 pts (worst bracket)', () => {
    const result = lookupScore(EXERCISES.HAMR, 40, M, U25)
    expect(result.points).toBe(29.5)
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
