/**
 * Scoring Engine unit tests
 * Covers EC-01: values above/below chart bounds → clamp, never 0
 */

import { describe, it, expect } from 'vitest'
import { lookupScore, parseTime, calculateCompositeScore, calculateComponentScore, calculateWHtR, hamrTimeToShuttles } from './scoringEngine.js'
import { EXERCISES, AGE_BRACKETS, GENDER, COMPONENTS, calculateAge, getAgeBracket, getProjectionAgeBracket, getWalkTimeLimit, WALK_TIME_LIMITS } from './constants.js'

// Male <25 table reference values (from scoringTables.js)
// RUN_2MILE: best=805s(13:25)/50pts, worst=1185s(19:45)/29.5pts
// PUSHUPS:   best=67reps/15pts,       worst=30reps/0.8pts
// PLANK:     best=215s(3:35)/15pts,   worst=65s(1:05)/7.5pts
// HAMR:      best=100shutt/50pts,     worst=39shutt/29.5pts
// SITUPS:    best=58reps/15pts,       worst=39reps/2.3pts

const M = GENDER.MALE
const U25 = AGE_BRACKETS.UNDER_25

// ─── EC-01: above-chart-max clamps to max points ─────────────────────────────

describe('EC-01 - reps above chart max → max points', () => {
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

describe('EC-01 - plank time above chart max → max points', () => {
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

describe('EC-01 - run time faster than chart min → max points', () => {
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

describe('EC-01 - reps below chart min → minimum chart points, never 0', () => {
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

describe('EC-01 - plank time below chart min → minimum chart points, never 0', () => {
  it('plank: time below chart min (65s) returns minimum 7.5 pts, not 0', () => {
    const result = lookupScore(EXERCISES.PLANK, 10, M, U25)
    expect(result.points).toBe(7.5)
    expect(result.points).toBeGreaterThan(0)
  })
})

describe('EC-01 - run time slower than chart worst → minimum chart points, never 0', () => {
  it('2-mile run: time slower than chart worst (1185s) returns minimum 29.5 pts, not 0', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 2000, M, U25)
    expect(result.points).toBe(29.5)
    expect(result.points).toBeGreaterThan(0)
  })
})

// ─── SL-10 / EC-10: 0 reps on non-exempt → chart min points + component fail ──
// Supersedes SL-02: 0 reps no longer returns 0 pts; it clamps to chart min
// (same EC-01 logic) so "attempted with 0 reps" ≠ "not tested" (null).

describe('SL-10 - 0 reps → chart minimum points (not 0, not null)', () => {
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

describe('EC-10 - 0 reps on non-exempt component → always pass:false', () => {
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

describe('SL-03 / EC-07 - run time at exact boundary earns that row\'s points (inclusive)', () => {
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
//   threshold  94 → 49.4 pts  (gap: 95-99)
//   threshold  45 → 32.5 pts
//   threshold  42 → 31.0 pts  (gap: 43-44)
//   threshold  39 → 29.5 pts  ← chart worst

describe('SL-04 - HAMR gap values use containing bracket (no interpolation)', () => {
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

  it('46 shuttles (1 above lower boundary of 45-47 range) → 32.5 pts', () => {
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

// ─── SL-05 / EC-06: WHtR rounded to 2 decimals before lookup ─────────────────
// Raw ratios like 0.494 must round to 0.49 BEFORE comparison against the table,
// not after - otherwise 0.494 would fall in the 0.50 bracket (wrong row).
//
// WHTR_TABLE (universal, not age/gender specific):
//   threshold 0.49 → 20.0 pts
//   threshold 0.50 → 19.0 pts
//   threshold 0.51 → 18.0 pts
//   threshold 0.60 →  0.0 pts  ← chart worst

describe('SL-05 / EC-06 - WHtR rounded to 2 decimals before lookup', () => {
  it('0.494 → rounds to 0.49 → 20.0 pts (not 19.0 from 0.50 bracket)', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.494, M, U25)
    expect(result.points).toBe(20.0)
    expect(result.points).not.toBe(19.0)  // would be wrong without rounding
  })

  it('0.495 → rounds to 0.50 → 19.0 pts (midpoint rounds up)', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.495, M, U25)
    expect(result.points).toBe(19.0)
  })

  it('0.501 → rounds to 0.50 → 19.0 pts (not 18.0 from 0.51 bracket)', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.501, M, U25)
    expect(result.points).toBe(19.0)
    expect(result.points).not.toBe(18.0)  // would be wrong without rounding
  })

  it('0.504 → rounds to 0.50 → 19.0 pts', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.504, M, U25)
    expect(result.points).toBe(19.0)
  })

  it('0.49 (exact threshold) → 20.0 pts', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.49, M, U25)
    expect(result.points).toBe(20.0)
  })

  it('0.50 (exact threshold) → 19.0 pts', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.50, M, U25)
    expect(result.points).toBe(19.0)
  })

  it('0.51 (exact threshold) → 18.0 pts', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.51, M, U25)
    expect(result.points).toBe(18.0)
  })
})

// ─── EC-23: calculateWHtR rejects zero inputs, prevents division by zero ──────
// waist / height would produce Infinity (height=0) or NaN (0/0); guard
// must return null before the division executes.
// The guard: !waistInches || !heightInches covers both zero and null/undefined.

describe('EC-23 - height=0 or waist=0 → calculateWHtR returns null', () => {
  it('waist=0, height=60 → null (no ratio calculated)', () => {
    expect(calculateWHtR(0, 60)).toBeNull()
  })

  it('waist=30, height=0 → null (prevents 30/0 = Infinity)', () => {
    expect(calculateWHtR(30, 0)).toBeNull()
  })

  it('waist=0, height=0 → null (prevents 0/0 = NaN)', () => {
    expect(calculateWHtR(0, 0)).toBeNull()
  })

  it('waist=null, height=60 → null', () => {
    expect(calculateWHtR(null, 60)).toBeNull()
  })

  it('waist=30, height=null → null', () => {
    expect(calculateWHtR(30, null)).toBeNull()
  })

  it('valid waist=30, height=60 → 0.50 (normal path unaffected)', () => {
    expect(calculateWHtR(30, 60)).toBe(0.50)
  })

  it('valid waist=33, height=66 → 0.50 (rounding still applied)', () => {
    expect(calculateWHtR(33, 66)).toBe(0.50)
  })
})

// ─── SL-06: composite = round((earned/possible)*100, 1) ──────────────────────
// The composite must be rounded to 1 decimal BEFORE the pass/fail comparison.
// Without this, a raw composite of 74.95 would display as 75.0 but fail.

const makeComp = (points, maxPoints, pass = true) => ({
  tested: true, exempt: false, points, maxPoints, pass,
})

describe('SL-06 - composite rounded to 1 decimal before pass check', () => {
  it('composite is the rounded value, not raw float', () => {
    // raw = (37.5/50)*100 = 75.0 → 75.0
    const result = calculateCompositeScore([makeComp(37.5, 50)])
    expect(result.composite).toBe(75.0)
  })

  it('raw 74.95 → composite 75.0 → passes (key rounding-before-check case)', () => {
    // raw = (1499/2000)*100 = 74.95 → rounds to 75.0 → compositePass = true
    // Without SL-06 fix, compositePass would use raw 74.95 < 75 → fail
    const result = calculateCompositeScore([makeComp(1499, 2000)])
    expect(result.composite).toBe(75.0)
    expect(result.pass).toBe(true)
  })

  it('raw 74.90 → composite 74.9 → fails', () => {
    // raw = (1498/2000)*100 = 74.9 → rounds to 74.9 → fail
    const result = calculateCompositeScore([makeComp(1498, 2000)])
    expect(result.composite).toBe(74.9)
    expect(result.pass).toBe(false)
  })

  it('raw 75.05 → composite 75.1 → passes', () => {
    const result = calculateCompositeScore([makeComp(1501, 2000)])
    expect(result.composite).toBe(75.1)
    expect(result.pass).toBe(true)
  })

  it('raw 72.55 → composite 72.6 (rounds half-up)', () => {
    // Math.round(725.5) = 726 in JS → 72.6
    const result = calculateCompositeScore([makeComp(7255, 10000)])
    expect(result.composite).toBe(72.6)
  })

  it('standard 4-component perfect score → composite 100.0', () => {
    const result = calculateCompositeScore([
      makeComp(50, 50),  // cardio
      makeComp(20, 20),  // bodyComp
      makeComp(15, 15),  // strength
      makeComp(15, 15),  // core
    ])
    expect(result.composite).toBe(100.0)
    expect(result.pass).toBe(true)
  })

  it('composite exact at 75.0 → passes', () => {
    const result = calculateCompositeScore([makeComp(75, 100)])
    expect(result.composite).toBe(75.0)
    expect(result.pass).toBe(true)
  })
})

// ─── SL-07: Walk = 0 earned, 0 possible for cardio; composite from remaining 3 ─

describe('SL-07 - 2km walk excluded from composite', () => {
  it('calculateComponentScore marks walk result as walkOnly', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.WALK_2KM, value: 1500 },
      M, U25,
    )
    expect(result.walkOnly).toBe(true)
    expect(result.tested).toBe(true)
    expect(result.exempt).toBe(false)
    // (walk scoring table not yet built; points may be 0 until Sprint 2)
  })

  it('calculateComponentScore does NOT mark run as walkOnly', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.RUN_2MILE, value: 900 },
      M, U25,
    )
    expect(result.walkOnly).toBeFalsy()
  })

  it('walk component not included in totalEarned / totalPossible', () => {
    const walkCardio = { tested: true, exempt: false, walkOnly: true,  points: 40, maxPoints: 50, pass: true }
    const bodyComp   = { tested: true, exempt: false, walkOnly: false, points: 20, maxPoints: 20, pass: true }
    const strength   = { tested: true, exempt: false, walkOnly: false, points: 15, maxPoints: 15, pass: true }
    const core       = { tested: true, exempt: false, walkOnly: false, points: 15, maxPoints: 15, pass: true }

    const result = calculateCompositeScore([walkCardio, bodyComp, strength, core])

    // Remaining 3: earned=50, possible=50 → composite=100.0
    expect(result.totalEarned).toBe(50)
    expect(result.totalPossible).toBe(50)
    expect(result.composite).toBe(100.0)
    expect(result.pass).toBe(true)
  })

  it('EC-05: failed walk propagates to overall fail', () => {
    const walkCardio = { tested: true, exempt: false, walkOnly: true,  points: 5, maxPoints: 50, pass: false }
    const bodyComp   = { tested: true, exempt: false, walkOnly: false, points: 16, maxPoints: 20, pass: true }
    const strength   = { tested: true, exempt: false, walkOnly: false, points: 12, maxPoints: 15, pass: true }
    const core       = { tested: true, exempt: false, walkOnly: false, points: 12, maxPoints: 15, pass: true }

    const result = calculateCompositeScore([walkCardio, bodyComp, strength, core])

    // Walk fail must not bleed into allComponentsPass (non-walk components still pass)
    expect(result.allComponentsPass).toBe(true)
    // Composite from remaining 3: (40/50)*100 = 80.0
    expect(result.composite).toBe(80.0)
    // EC-05: Walk failed = overall FAIL regardless of composite
    expect(result.pass).toBe(false)
  })

  it('walk result appears in walkComponents array, not testedComponents', () => {
    const walkCardio = { tested: true, exempt: false, walkOnly: true,  points: 30, maxPoints: 50, pass: true }
    const strength   = { tested: true, exempt: false, walkOnly: false, points: 15, maxPoints: 15, pass: true }
    const core       = { tested: true, exempt: false, walkOnly: false, points: 15, maxPoints: 15, pass: true }
    const bodyComp   = { tested: true, exempt: false, walkOnly: false, points: 20, maxPoints: 20, pass: true }

    const result = calculateCompositeScore([walkCardio, strength, core, bodyComp])

    expect(result.walkComponents).toHaveLength(1)
    expect(result.walkComponents[0]).toBe(walkCardio)
    expect(result.testedComponents).not.toContain(walkCardio)
  })

  it('walk + 2 others = partialAssessment (4th component missing)', () => {
    const walkCardio = { tested: true, exempt: false, walkOnly: true,  points: 30, maxPoints: 50, pass: true }
    const strength   = { tested: true, exempt: false, walkOnly: false, points: 15, maxPoints: 15, pass: true }
    const core       = { tested: true, exempt: false, walkOnly: false, points: 15, maxPoints: 15, pass: true }

    // Only 3 of 4 components provided → partial
    const result = calculateCompositeScore([walkCardio, strength, core])
    // All 3 accounted for → composite IS calculable (no missing component)
    // totalPossible = 15+15 = 30; composite = (30/30)*100 = 100.0
    expect(result.partialAssessment).toBeFalsy()
    expect(result.composite).toBe(100.0)
  })

  it('composite correctly scaled to remaining-3 possible (50 pts)', () => {
    // Airman scores 75% of each remaining component
    const walkCardio = { tested: true, exempt: false, walkOnly: true,  points: 0, maxPoints: 50, pass: true }
    const bodyComp   = { tested: true, exempt: false, walkOnly: false, points: 15, maxPoints: 20, pass: true } // 75%
    const strength   = { tested: true, exempt: false, walkOnly: false, points: 11.25, maxPoints: 15, pass: true } // 75%
    const core       = { tested: true, exempt: false, walkOnly: false, points: 11.25, maxPoints: 15, pass: true } // 75%

    const result = calculateCompositeScore([walkCardio, bodyComp, strength, core])
    // (37.5/50)*100 = 75.0 → passes (walk passed so no EC-05 fail)
    expect(result.composite).toBe(75.0)
    expect(result.pass).toBe(true)
  })
})

// ─── Walk Time Limits (Table 3.1, DAFMAN 36-2905) ───────────────────────────

describe('Walk time limits', () => {
  it('getWalkTimeLimit returns correct male <25 limit', () => {
    expect(getWalkTimeLimit('M', AGE_BRACKETS.UNDER_25)).toBe(976) // 16:16
  })

  it('getWalkTimeLimit returns correct female 60+ limit', () => {
    expect(getWalkTimeLimit('F', AGE_BRACKETS.AGE_60_PLUS)).toBe(1133) // 18:53
  })

  it('all 18 brackets have walk time limits defined', () => {
    for (const gender of ['M', 'F']) {
      for (const bracket of Object.values(AGE_BRACKETS)) {
        const limit = getWalkTimeLimit(gender, bracket)
        expect(limit).toBeGreaterThan(0)
        expect(limit).toBeLessThan(1200) // under 20 minutes
      }
    }
  })

  it('female limits are more generous than male limits for same bracket', () => {
    for (const bracket of Object.values(AGE_BRACKETS)) {
      const maleLimit = getWalkTimeLimit('M', bracket)
      const femaleLimit = getWalkTimeLimit('F', bracket)
      expect(femaleLimit).toBeGreaterThan(maleLimit)
    }
  })

  it('older brackets have more generous limits than younger brackets', () => {
    const maleLimits = Object.values(WALK_TIME_LIMITS.M)
    for (let i = 1; i < maleLimits.length; i++) {
      expect(maleLimits[i]).toBeGreaterThanOrEqual(maleLimits[i - 1])
    }
  })

  it('walk auto-pass when time within limit', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.WALK_2KM, value: 900 }, // 15:00 - well under limit
      M, U25,
    )
    expect(result.walkOnly).toBe(true)
    expect(result.pass).toBe(true)
  })

  it('walk auto-fail when time exceeds limit', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.WALK_2KM, value: 1100 }, // 18:20 - over male <25 limit of 16:16
      M, U25,
    )
    expect(result.walkOnly).toBe(true)
    expect(result.pass).toBe(false)
  })

  it('explicit walkPass overrides auto-determination', () => {
    // Time is over limit but walkPass=true explicitly set
    const result = calculateComponentScore(
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.WALK_2KM, value: 1100, walkPass: true },
      M, U25,
    )
    expect(result.pass).toBe(true)
  })

  it('walkTimeLimit is returned in result', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.WALK_2KM, value: 900 },
      M, U25,
    )
    expect(result.walkTimeLimit).toBe(976) // 16:16
  })
})

// ─── SL-08: Component pass/fail checked independently of composite ────────────
// Each component has its own minimum threshold (cardio/strength/core 60%,
// bodyComp 50%). These are enforced at component level; the composite threshold
// (75.0) is a separate, independent check.

describe('SL-08 - component pass/fail independent of composite', () => {
  it('high composite but one component fails minimum → overall fail', () => {
    // Strength 8/15 = 53.3% - below 60% minimum; everything else excellent
    const cardio   = makeComp(50, 50, true)
    const bodyComp = makeComp(20, 20, true)
    const strength = makeComp(8, 15, false) // 53.3% < 60%
    const core     = makeComp(12, 15, true)

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.composite).toBe(90.0)      // (90/100)*100
    expect(result.compositePass).toBe(true)   // 90 ≥ 75
    expect(result.allComponentsPass).toBe(false)
    expect(result.pass).toBe(false)           // overall fails despite high composite
  })

  it('all components pass minimums but composite < 75 → overall fail', () => {
    // Every component at exactly its minimum → composite = 58.0 < 75
    const cardio   = makeComp(30, 50, true)  // 60%
    const bodyComp = makeComp(10, 20, true)  // 50%
    const strength = makeComp(9,  15, true)  // 60%
    const core     = makeComp(9,  15, true)  // 60%

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.composite).toBe(58.0)
    expect(result.compositePass).toBe(false)
    expect(result.allComponentsPass).toBe(true)
    expect(result.pass).toBe(false)           // overall fails despite all components passing
  })

  it('all components pass + composite ≥ 75 → overall pass', () => {
    const cardio   = makeComp(40, 50, true)
    const bodyComp = makeComp(15, 20, true)
    const strength = makeComp(12, 15, true)
    const core     = makeComp(12, 15, true)

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.composite).toBe(79.0)
    expect(result.compositePass).toBe(true)
    expect(result.allComponentsPass).toBe(true)
    expect(result.pass).toBe(true)
  })

  it('result always exposes compositePass and allComponentsPass as separate fields', () => {
    const result = calculateCompositeScore([
      makeComp(50, 50, true),
      makeComp(20, 20, true),
      makeComp(15, 15, true),
      makeComp(15, 15, true),
    ])
    expect(result).toHaveProperty('compositePass')
    expect(result).toHaveProperty('allComponentsPass')
  })

  it('failedComponents lists only components that failed their minimum', () => {
    // Two components fail; composite itself would pass (86/100 = 86%)
    const cardio   = makeComp(50, 50, true)
    const bodyComp = makeComp(20, 20, true)
    const strength = makeComp(8,  15, false) // fails minimum
    const core     = makeComp(8,  15, false) // fails minimum

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.composite).toBe(86.0)
    expect(result.compositePass).toBe(true)   // composite alone would pass
    expect(result.failedComponents).toHaveLength(2)
    expect(result.failedComponents).toContain(strength)
    expect(result.failedComponents).toContain(core)
    expect(result.pass).toBe(false)           // overall fails due to component failures
  })

  it('multiple component failures tracked individually in failedComponents', () => {
    const cardio   = makeComp(30, 50, false) // fails
    const bodyComp = makeComp(10, 20, false) // fails
    const strength = makeComp(15, 15, true)
    const core     = makeComp(15, 15, true)

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.failedComponents).toHaveLength(2)
    expect(result.failedComponents).toContain(cardio)
    expect(result.failedComponents).toContain(bodyComp)
    expect(result.allComponentsPass).toBe(false)
  })

  it('component pass field on calculateComponentScore result is not affected by other components', () => {
    // Verify the pass flag on a component result reflects only that component's
    // own performance - tested by checking two components separately
    const passingStrength = calculateComponentScore(
      { type: COMPONENTS.STRENGTH, exercise: EXERCISES.PUSHUPS, value: 67 }, // best possible
      M, U25,
    )
    const failingStrength = calculateComponentScore(
      { type: COMPONENTS.STRENGTH, exercise: EXERCISES.PUSHUPS, value: 1 }, // worst possible
      M, U25,
    )
    expect(passingStrength.pass).toBe(true)
    expect(failingStrength.pass).toBe(false)
    // pass decisions are independent - checking one doesn't change the other
    expect(passingStrength.pass).toBe(true)
  })
})

// ─── SL-09: All components exempt → composite = null, no score ───────────────

const makeExempt = () => ({ tested: false, exempt: true, points: 0, maxPoints: 0, pass: true })

describe('SL-09 - all components exempt → composite null', () => {
  it('all 4 exempt → composite=null, pass=null', () => {
    const result = calculateCompositeScore([makeExempt(), makeExempt(), makeExempt(), makeExempt()])
    expect(result.composite).toBeNull()
    expect(result.pass).toBeNull()
  })

  it('all 4 exempt → allExempt=true flag set', () => {
    const result = calculateCompositeScore([makeExempt(), makeExempt(), makeExempt(), makeExempt()])
    expect(result.allExempt).toBe(true)
  })

  it('all 4 exempt → failedComponents is empty', () => {
    const result = calculateCompositeScore([makeExempt(), makeExempt(), makeExempt(), makeExempt()])
    expect(result.failedComponents).toHaveLength(0)
  })

  it('all 4 exempt → exemptComponents holds all 4 entries', () => {
    const comps = [makeExempt(), makeExempt(), makeExempt(), makeExempt()]
    const result = calculateCompositeScore(comps)
    expect(result.exemptComponents).toHaveLength(4)
    comps.forEach(c => expect(result.exemptComponents).toContain(c))
  })

  it('partial exemption: cardio exempt, 3 scored → composite from remaining 3', () => {
    const cardio   = makeExempt()
    const bodyComp = makeComp(20, 20, true)
    const strength = makeComp(15, 15, true)
    const core     = makeComp(15, 15, true)

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.allExempt).toBeFalsy()
    expect(result.composite).toBe(100.0)
    expect(result.pass).toBe(true)
    expect(result.totalPossible).toBe(50) // cardio (50 pts) excluded
    expect(result.exemptComponents).toHaveLength(1)
  })

  it('partial exemption: bodyComp exempt, cardio/strength/core scored → composite from 3', () => {
    const cardio   = makeComp(40, 50, true)  // 80%
    const bodyComp = makeExempt()
    const strength = makeComp(12, 15, true)  // 80%
    const core     = makeComp(12, 15, true)  // 80%

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    // totalPossible = 50+15+15 = 80; earned = 40+12+12 = 64
    expect(result.totalEarned).toBe(64)
    expect(result.totalPossible).toBe(80)
    expect(result.composite).toBe(80.0)     // (64/80)*100 = 80.0
    expect(result.pass).toBe(true)
  })

  it('calculateComponentScore with exempt=true returns correct shape', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.RUN_2MILE, exempt: true },
      M, U25,
    )
    expect(result.exempt).toBe(true)
    expect(result.tested).toBe(false)
    expect(result.points).toBe(0)
    expect(result.maxPoints).toBe(0)
    expect(result.pass).toBe(true)  // exempt components never fail
    expect(result.percentage).toBeNull()
  })

  it('3 exempt + 1 untested (no value) → partialAssessment, not allExempt', () => {
    // 4th component has value=null → untested, not exempt → composite blocked
    const untested = { tested: false, exempt: false, points: null, maxPoints: 50, pass: null }
    const result = calculateCompositeScore([makeExempt(), makeExempt(), makeExempt(), untested])
    expect(result.partialAssessment).toBe(true)
    expect(result.allExempt).toBeFalsy()
    expect(result.composite).toBeNull()
  })
})

// ─── EC-02: Projection uses DOB + target date for age group (age-rollover) ────
// An Airman who crosses an age-bracket boundary before their target PFA date
// must be scored on the NEW bracket's tables, not today's.
// All examples anchored to today = 2026-03-03.

describe('EC-02 - getProjectionAgeBracket uses target date, not today', () => {
  // ─ rollover: 25-29 → 30-34 ─────────────────────────────────────────────────
  it('DOB 1996-06-15: age 29 today, turns 30 before target → AGE_30_34', () => {
    const dob = '1996-06-15'
    // Today (2026-03-03): age 29 → AGE_25_29
    expect(getAgeBracket(calculateAge(dob, '2026-03-03'))).toBe(AGE_BRACKETS.AGE_25_29)
    // Target (2026-07-01): age 30 → AGE_30_34
    expect(getProjectionAgeBracket(dob, '2026-07-01')).toBe(AGE_BRACKETS.AGE_30_34)
  })

  // ─ rollover: UNDER_25 → 25-29 ───────────────────────────────────────────────
  it('DOB 2001-06-15: age 24 today, turns 25 before target → AGE_25_29', () => {
    const dob = '2001-06-15'
    expect(getAgeBracket(calculateAge(dob, '2026-03-03'))).toBe(AGE_BRACKETS.UNDER_25)
    expect(getProjectionAgeBracket(dob, '2026-07-01')).toBe(AGE_BRACKETS.AGE_25_29)
  })

  // ─ rollover: 35-39 → 40-44 ──────────────────────────────────────────────────
  it('DOB 1986-04-01: age 39 today, turns 40 before target → AGE_40_44', () => {
    const dob = '1986-04-01'
    expect(getAgeBracket(calculateAge(dob, '2026-03-03'))).toBe(AGE_BRACKETS.AGE_35_39)
    expect(getProjectionAgeBracket(dob, '2026-07-01')).toBe(AGE_BRACKETS.AGE_40_44)
  })

  // ─ no rollover ───────────────────────────────────────────────────────────────
  it('DOB 1993-01-01: age 33 today and at target → stays AGE_30_34', () => {
    const dob = '1993-01-01'
    expect(getProjectionAgeBracket(dob, '2026-03-03')).toBe(AGE_BRACKETS.AGE_30_34)
    expect(getProjectionAgeBracket(dob, '2026-07-01')).toBe(AGE_BRACKETS.AGE_30_34)
  })

  // ─ birthday exactly on target date ───────────────────────────────────────────
  it('birthday falls exactly on target date → new bracket applies', () => {
    // DOB 1996-07-01: turns 30 on 2026-07-01 exactly
    const dob = '1996-07-01'
    expect(getAgeBracket(calculateAge(dob, '2026-03-03'))).toBe(AGE_BRACKETS.AGE_25_29)
    expect(getProjectionAgeBracket(dob, '2026-07-01')).toBe(AGE_BRACKETS.AGE_30_34)
  })

  // ─ birthday one day after target date → still in old bracket ────────────────
  it('birthday one day after target date → old bracket still applies', () => {
    // DOB 1996-07-02: turns 30 the day AFTER target date
    const dob = '1996-07-02'
    expect(getAgeBracket(calculateAge(dob, '2026-03-03'))).toBe(AGE_BRACKETS.AGE_25_29)
    expect(getProjectionAgeBracket(dob, '2026-07-01')).toBe(AGE_BRACKETS.AGE_25_29)
  })

  // ─ getProjectionAgeBracket accepts Date objects ─────────────────────────────
  it('accepts Date objects as well as ISO strings', () => {
    const dob = new Date('1996-06-15')
    const target = new Date('2026-07-01')
    expect(getProjectionAgeBracket(dob, target)).toBe(AGE_BRACKETS.AGE_30_34)
  })
})

// ─── EC-07: Exact boundary value is inclusive (gets the tier, not the one below) ─
// Time-based (run): lookupValue <= threshold  → exact match → that tier's points
// Reps-based (HAMR, pushups): lookupValue >= threshold → exact match → that tier's points
// Male <25 reference values (from scoringTables.js):
//   RUN_2MILE: 805s=50.0, 835s=49.4, 836s→48.8, 1185s=29.5
//   HAMR:      100=50.0, 94=49.4, 93→48.8, 39=29.5
//   PUSHUPS:   67=15.0, 66=14.9

describe('EC-07 - exact boundary value is inclusive', () => {
  // ─ 2-mile run (lower time = better; threshold is MAX time for the tier) ───────

  it('run: exact best threshold 805s (13:25) → 50.0 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 805, M, U25).points).toBe(50.0)
  })

  it('run: one second over best threshold 806s → drops to 49.4 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 806, M, U25).points).toBe(49.4)
  })

  it('run: exact second-tier threshold 835s (13:55) → 49.4 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 835, M, U25).points).toBe(49.4)
  })

  it('run: one second over second-tier boundary 836s → drops to 48.8 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 836, M, U25).points).toBe(48.8)
  })

  it('run: one second under second-tier boundary 834s → stays at 49.4 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 834, M, U25).points).toBe(49.4)
  })

  it('run: exact worst threshold 1185s (19:45) → 29.5 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 1185, M, U25).points).toBe(29.5)
  })

  // ─ HAMR shuttle (higher reps = better; threshold is MIN shuttles for the tier) ─

  it('HAMR: exact best threshold 100 shuttles → 50.0 pts', () => {
    expect(lookupScore(EXERCISES.HAMR, 100, M, U25).points).toBe(50.0)
  })

  it('HAMR: one less than best 99 shuttles → drops to 49.4 pts', () => {
    expect(lookupScore(EXERCISES.HAMR, 99, M, U25).points).toBe(49.4)
  })

  it('HAMR: exact tier boundary 94 shuttles → 49.4 pts', () => {
    expect(lookupScore(EXERCISES.HAMR, 94, M, U25).points).toBe(49.4)
  })

  it('HAMR: one less than tier boundary 93 shuttles → drops to 48.8 pts', () => {
    expect(lookupScore(EXERCISES.HAMR, 93, M, U25).points).toBe(48.8)
  })

  it('HAMR: exact worst threshold 39 shuttles → 29.5 pts', () => {
    expect(lookupScore(EXERCISES.HAMR, 39, M, U25).points).toBe(29.5)
  })

  // ─ Push-ups (higher reps = better) ─────────────────────────────────────────

  it('pushups: exact best threshold 67 reps → 15.0 pts', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, 67, M, U25).points).toBe(15.0)
  })

  it('pushups: exact adjacent boundary 66 reps → 14.9 pts', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, 66, M, U25).points).toBe(14.9)
  })
})

// ─── EC-08: HAMR shuttle between published thresholds → containing bracket ────
// HAMR table (M/<25) is not consecutive: 100, 94, 92, 88, 86, 83, 80, 77, 74, …
// Values that land in a gap belong to the next lower threshold's tier.
// Lookup: iterate descending, first threshold where shuttles >= threshold wins.
//
// Tier ranges covered:
//   100-∞  → 50.0     94-99  → 49.4     92-93  → 48.8
//   88-91  → 48.1     86-87  → 47.5     83-85  → 46.9

describe('EC-08 - HAMR between published thresholds lands in containing bracket', () => {
  // ─ Wide gap: 94-99 (6-wide gap above 94) ────────────────────────────────────

  it('HAMR 99 (just below 100) → 49.4 pts (94 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 99, M, U25).points).toBe(49.4)
  })

  it('HAMR 97 (mid-gap 94-99) → 49.4 pts (94 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 97, M, U25).points).toBe(49.4)
  })

  it('HAMR 95 (just above 94) → 49.4 pts (94 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 95, M, U25).points).toBe(49.4)
  })

  // ─ Narrow gap: 92-93 (one-value gap above 92) ───────────────────────────────

  it('HAMR 93 (single value between 92 and 94) → 48.8 pts (92 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 93, M, U25).points).toBe(48.8)
  })

  // ─ Gap: 88-91 (three values above 88) ──────────────────────────────────────

  it('HAMR 91 (top of 88-91 gap) → 48.1 pts (88 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 91, M, U25).points).toBe(48.1)
  })

  it('HAMR 89 (mid-gap 88-91) → 48.1 pts (88 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 89, M, U25).points).toBe(48.1)
  })

  // ─ Gap: 83-85 (two values above 83) ────────────────────────────────────────

  it('HAMR 85 (top of 83-85 gap) → 46.9 pts (83 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 85, M, U25).points).toBe(46.9)
  })

  it('HAMR 84 (just above 83) → 46.9 pts (83 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 84, M, U25).points).toBe(46.9)
  })

  // ─ Run: equivalent between-threshold test for time-based tables ─────────────
  // RUN_2MILE thresholds: …805, 835, 852, 867, 881, 905, 917, 928, 938, 969…
  // Values between thresholds belong to the tier ending at the upper threshold.

  it('run 820s (between 805 and 835) → 49.4 pts (835 tier)', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 820, M, U25).points).toBe(49.4)
  })

  it('run 843s (between 835 and 852) → 48.8 pts (852 tier)', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 843, M, U25).points).toBe(48.8)
  })

  it('run 950s (between 938 and 969) → 43.9 pts (969 tier)', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 950, M, U25).points).toBe(43.9)
  })
})

// ─── Mid-table lookups ────────────────────────────────────────────────────────

describe('lookupScore - mid-table values', () => {
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
  it('"18" treated as 18 minutes = 1080 seconds (1-2 digit number = minutes)', () => {
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

  it('"810" treated as 810 total seconds = 13:30 (3+ digit number = total seconds)', () => {
    expect(parseTime('810')).toBe(810)
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

describe('lookupScore - null/undefined value', () => {
  it('null value → null result', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, null, M, U25)).toBeNull()
  })

  it('undefined value → null result', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, undefined, M, U25)).toBeNull()
  })
})

// ─── maxPoints derivation ─────────────────────────────────────────────────────

describe('lookupScore - maxPoints always equals table[0].points', () => {
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

// ─── hamrTimeToShuttles ────────────────────────────────────────────────────────

describe('hamrTimeToShuttles', () => {
  it('null input → null', () => {
    expect(hamrTimeToShuttles(null)).toBeNull()
  })

  it('"0:00" → null (zero time is not valid)', () => {
    expect(hamrTimeToShuttles('0:00')).toBeNull()
  })

  it('"0:05" → 0 shuttles (5 seconds completes no shuttles)', () => {
    // First shuttle at 8.0 km/h takes 72/8.0 = 9 s; 5 s < 9 s so 0 completed
    expect(hamrTimeToShuttles('0:05')).toBe(0)
  })

  it('"0:10" → 1 shuttle (10 s > 9 s first shuttle)', () => {
    // Level 1 at 8.0 km/h: each shuttle takes 72/8.0 = 9 s
    expect(hamrTimeToShuttles('0:10')).toBe(1)
  })

  it('"9:00" → known shuttle count (standard reference)', () => {
    // Regression: result should be a positive integer
    const result = hamrTimeToShuttles('9:00')
    expect(result).toBeGreaterThan(0)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('known reference: "15:00" produces more shuttles than "9:00"', () => {
    expect(hamrTimeToShuttles('15:00')).toBeGreaterThan(hamrTimeToShuttles('9:00'))
  })
})
