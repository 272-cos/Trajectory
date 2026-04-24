/**
 * Scoring Engine unit tests
 * Covers EC-01: values above/below chart bounds -> clamp, never 0
 *
 * Updated to match 2026 PFRA Scoring Charts (0.5-point step tables).
 */

import { describe, it, expect } from 'vitest'
import { lookupScore, parseTime, calculateCompositeScore, calculateComponentScore, calculateWHtR, hamrTimeToShuttles } from './scoringEngine.js'
import { EXERCISES, AGE_BRACKETS, GENDER, COMPONENTS, calculateAge, getAgeBracket, getProjectionAgeBracket, getWalkTimeLimit, WALK_TIME_LIMITS } from './constants.js'

// Male <25 table reference values (from PFRA Scoring Charts PDF)
// RUN_2MILE: best=805s(13:25)/50pts, worst=1185s(19:45)/35.0pts
// PUSHUPS:   best=67reps/15pts,       worst=30reps/2.5pts
// PLANK:     best=220s(3:40)/15pts,   worst=90s(1:30)/2.5pts
// HAMR:      best=87shutt/50pts,      worst=42shutt/35.0pts
// SITUPS:    best=58reps/15pts,       worst=33reps/2.5pts
// CLRC:      best=60reps/15pts,       worst=35reps/2.5pts

const M = GENDER.MALE
const U25 = AGE_BRACKETS.UNDER_25

// --- EC-01: above-chart-max clamps to max points ---

describe('EC-01 - reps above chart max -> max points', () => {
  it('pushups: value above chart max (67) returns max 15.0 pts', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 100, M, U25)
    expect(result.points).toBe(15.0)
    expect(result.percentage).toBe(100)
  })

  it('pushups: value exactly at chart max (67) returns max 15.0 pts', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 67, M, U25)
    expect(result.points).toBe(15.0)
  })

  it('HAMR: value above chart max (87) returns max 50.0 pts', () => {
    const result = lookupScore(EXERCISES.HAMR, 150, M, U25)
    expect(result.points).toBe(50.0)
    expect(result.percentage).toBe(100)
  })

  it('HAMR: value exactly at chart max (87) returns max 50.0 pts', () => {
    const result = lookupScore(EXERCISES.HAMR, 87, M, U25)
    expect(result.points).toBe(50.0)
  })

  it('situps: value above chart max (58) returns max 15.0 pts', () => {
    const result = lookupScore(EXERCISES.SITUPS, 80, M, U25)
    expect(result.points).toBe(15.0)
    expect(result.percentage).toBe(100)
  })
})

describe('EC-01 - plank time above chart max -> max points', () => {
  it('plank: time above chart max (220s) returns max 15.0 pts', () => {
    const result = lookupScore(EXERCISES.PLANK, 400, M, U25)
    expect(result.points).toBe(15.0)
    expect(result.percentage).toBe(100)
  })

  it('plank: time exactly at chart max (220s) returns max 15.0 pts', () => {
    const result = lookupScore(EXERCISES.PLANK, 220, M, U25)
    expect(result.points).toBe(15.0)
  })
})

describe('EC-01 - run time faster than chart min -> max points', () => {
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

// --- Sub-minimum performance: external=0 per DAFMAN §3.7.4; internal preserves chart-min ---
// DAFMAN 36-2905 §3.7.4: "Repetition/durations below the required minimum receive a component
// score of zero." External `points` MUST be 0 for display/composite/PDF. An `internalPoints`
// field preserves the chart-minimum clamp for projection/ROI/training math only (boss directive,
// docs/SCORING-STRATEGY-DISCUSSION.md 2026-04-16; full D1 split follows in its own PR).

describe('DAFMAN §3.7.4 - reps below chart min -> external 0, internal chart-min', () => {
  it('pushups: 5 reps (below chart min 30) -> points=0, internalPoints=2.5', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 5, M, U25)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(2.5)
  })

  it('pushups: 1 rep -> points=0, internalPoints=2.5', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 1, M, U25)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(2.5)
  })

  it('HAMR: 10 shuttles (below chart min 42) -> points=0, internalPoints=35.0', () => {
    const result = lookupScore(EXERCISES.HAMR, 10, M, U25)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(35.0)
  })

  it('situps: 1 rep (below chart min 33) -> points=0, internalPoints=2.5', () => {
    const result = lookupScore(EXERCISES.SITUPS, 1, M, U25)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(2.5)
  })
})

describe('DAFMAN §3.7.4 - plank time below chart min -> external 0, internal chart-min', () => {
  it('plank: 10s (below chart min 90s) -> points=0, internalPoints=2.5', () => {
    const result = lookupScore(EXERCISES.PLANK, 10, M, U25)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(2.5)
  })
})

describe('DAFMAN §3.7.4 - run time slower than chart worst -> external 0, internal chart-min', () => {
  it('2-mile run: 2000s (slower than chart worst 1185s) -> points=0, internalPoints=35.0', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 2000, M, U25)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(35.0)
  })
})

// --- 0 reps on non-exempt -> sub-minimum per §3.7.4 -> external 0; internal tracks chart-min ---

describe('DAFMAN §3.7.4 - 0 reps -> external 0, internal chart-min', () => {
  it('pushups: 0 reps -> points=0, internalPoints=2.5', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 0, M, U25)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(2.5)
  })

  it('HAMR: 0 shuttles -> points=0, internalPoints=35.0', () => {
    const result = lookupScore(EXERCISES.HAMR, 0, M, U25)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(35.0)
  })

  it('situps: 0 reps -> points=0, internalPoints=2.5', () => {
    const result = lookupScore(EXERCISES.SITUPS, 0, M, U25)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(2.5)
  })

  it('CLRC: 0 reps -> points=0, internalPoints=2.5', () => {
    const result = lookupScore(EXERCISES.CLRC, 0, M, U25)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(2.5)
  })

  it('plank: 0 seconds -> points=0, internalPoints=2.5', () => {
    const result = lookupScore(EXERCISES.PLANK, 0, M, U25)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(2.5)
  })

  it('maxPoints still reflects the table max', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 0, M, U25)
    expect(result.maxPoints).toBe(15.0)
  })

  it('0 reps is distinct from null (null = untested, 0 = attempted with no reps)', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, null, M, U25)).toBeNull()
    expect(lookupScore(EXERCISES.PUSHUPS, 0, M, U25)).not.toBeNull()
    // External 0, internal chart-min - distinct from "untested"
    expect(lookupScore(EXERCISES.PUSHUPS, 0, M, U25).points).toBe(0)
    expect(lookupScore(EXERCISES.PUSHUPS, 0, M, U25).internalPoints).toBeGreaterThan(0)
  })
})

describe('C3 - 0 time/ratio on lower-is-better exercises -> null', () => {
  it('2-mile run: 0 seconds -> null (physically impossible)', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 0, M, U25)).toBeNull()
  })

  it('2km walk: 0 seconds -> null (physically impossible)', () => {
    expect(lookupScore(EXERCISES.WALK_2KM, 0, M, U25)).toBeNull()
  })

  it('WHtR: 0 ratio -> null (physically impossible)', () => {
    expect(lookupScore(EXERCISES.WHTR, 0, M, U25)).toBeNull()
  })
})

describe('DAFMAN §3.7.4 - 0 reps on non-exempt component -> pass:false, external 0, internal chart-min', () => {
  it('strength: 0 pushups -> tested=true, pass=false, points=0, internalPoints=2.5', () => {
    const result = calculateComponentScore(
      { type: 'strength', exercise: EXERCISES.PUSHUPS, value: 0 },
      M, U25
    )
    expect(result.tested).toBe(true)
    expect(result.pass).toBe(false)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(2.5)
  })

  it('cardio: 0 HAMR -> tested=true, pass=false, points=0, internalPoints=35.0', () => {
    const result = calculateComponentScore(
      { type: 'cardio', exercise: EXERCISES.HAMR, value: 0 },
      M, U25
    )
    expect(result.tested).toBe(true)
    expect(result.pass).toBe(false)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(35.0)
  })

  it('core: 0 situps -> tested=true, pass=false, points=0, internalPoints=2.5', () => {
    const result = calculateComponentScore(
      { type: 'core', exercise: EXERCISES.SITUPS, value: 0 },
      M, U25
    )
    expect(result.tested).toBe(true)
    expect(result.pass).toBe(false)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(2.5)
  })

  it('core: 0s plank -> tested=true, pass=false, points=0, internalPoints=2.5', () => {
    const result = calculateComponentScore(
      { type: 'core', exercise: EXERCISES.PLANK, value: 0 },
      M, U25
    )
    expect(result.tested).toBe(true)
    expect(result.pass).toBe(false)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(2.5)
  })
})

// --- SL-03 / EC-07: run time boundary is inclusive ---
// Male U25 run table rows (2026 PFRA charts):
//   Row: 1071s (17:51) -> 38.0 pts
//   Row: 1090s (18:10) -> 37.5 pts  <- primary boundary under test
//   Row: 1109s (18:29) -> 37.0 pts
//   Row: 1166s (19:26) -> 35.5 pts
//   Row: 1185s (19:45) -> 35.0 pts  <- chart worst

describe('SL-03 / EC-07 - run time at exact boundary earns that row\'s points (inclusive)', () => {
  it('2-mile run: exactly at boundary 18:10 (1090s) -> 37.5 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1090, M, U25)
    expect(result.points).toBe(37.5)
  })

  it('2-mile run: 1 second faster than boundary (1089s) -> same row 37.5 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1089, M, U25)
    expect(result.points).toBe(37.5)
  })

  it('2-mile run: 1 second slower than boundary (1091s) -> next row 37.0 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1091, M, U25)
    expect(result.points).toBe(37.0)
  })

  it('2-mile run: exactly at row 19:36 boundary (1176s) -> 35.5 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1176, M, U25)
    expect(result.points).toBe(35.5)
  })

  it('2-mile run: 1 second slower than 19:36 boundary (1177s) -> 35.0 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1177, M, U25)
    expect(result.points).toBe(35.0)
  })

  it('2-mile run: exactly at chart-worst boundary 19:45 (1185s) -> 35.0 pts (inclusive)', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1185, M, U25)
    expect(result.points).toBe(35.0)
  })

  it('2-mile run: 1 second faster than chart worst (1184s) -> 35.5 pts (within 35.5 row, boundary 1176)', () => {
    // 1184s is between 35.5 boundary (1176) and 35.0 boundary (1185). First threshold >= 1184 is 1185 -> 35.0
    const result = lookupScore(EXERCISES.RUN_2MILE, 1184, M, U25)
    expect(result.points).toBe(35.0)
  })
})

// --- SL-04: HAMR gaps use containing bracket, no interpolation ---
// Male U25 HAMR table (2026 PFRA charts):
//   threshold 87 -> 50.0 pts
//   threshold 84 -> 49.5 pts  (gap: 85-86)
//   threshold 81 -> 49.0 pts  (gap: 82-83)
//   threshold 46 -> 36.0 pts
//   threshold 44 -> 35.5 pts  (gap: 45)
//   threshold 42 -> 35.0 pts  <- chart worst

describe('SL-04 - HAMR gap values use containing bracket (no interpolation)', () => {
  it('43 shuttles (gap between 42 and 44) -> 35.0 pts, not interpolated', () => {
    const result = lookupScore(EXERCISES.HAMR, 43, M, U25)
    expect(result.points).toBe(35.0)
  })

  it('44 shuttles (exact threshold) -> 35.5 pts', () => {
    const result = lookupScore(EXERCISES.HAMR, 44, M, U25)
    expect(result.points).toBe(35.5)
  })

  it('45 shuttles (gap between 44 and 46) -> 35.5 pts', () => {
    const result = lookupScore(EXERCISES.HAMR, 45, M, U25)
    expect(result.points).toBe(35.5)
  })

  it('46 shuttles (exact threshold) -> 36.0 pts', () => {
    const result = lookupScore(EXERCISES.HAMR, 46, M, U25)
    expect(result.points).toBe(36.0)
  })

  it('86 shuttles (gap between 84 and 87) -> 49.5 pts, not interpolated', () => {
    const result = lookupScore(EXERCISES.HAMR, 86, M, U25)
    expect(result.points).toBe(49.5)
  })

  it('85 shuttles (gap between 84 and 87) -> 49.5 pts', () => {
    const result = lookupScore(EXERCISES.HAMR, 85, M, U25)
    expect(result.points).toBe(49.5)
  })

  it('40 shuttles (below chart min 42) -> external 0 per DAFMAN §3.7.4; internal 35.0', () => {
    const result = lookupScore(EXERCISES.HAMR, 40, M, U25)
    expect(result.points).toBe(0)
    expect(result.internalPoints).toBe(35.0)
  })
})

// --- SL-05 / EC-06: WHtR TRUNCATED to 2 decimals before lookup (DAFMAN §3.15.4.2) ---

describe('SL-05 / EC-06 - WHtR truncated (not rounded) to 2 decimals per DAFMAN §3.15.4.2', () => {
  it('0.494 -> truncates to 0.49 -> 20.0 pts', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.494, M, U25)
    expect(result.points).toBe(20.0)
  })

  it('0.495 -> truncates to 0.49 -> 20.0 pts (truncation, NOT round-half-up)', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.495, M, U25)
    expect(result.points).toBe(20.0)
  })

  it('0.499 -> truncates to 0.49 -> 20.0 pts (anything <0.50 lands on 0.49 bracket)', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.499, M, U25)
    expect(result.points).toBe(20.0)
  })

  it('0.501 -> truncates to 0.50 -> 19.0 pts', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.501, M, U25)
    expect(result.points).toBe(19.0)
  })

  it('0.559 -> truncates to 0.55 (still passing) -> 12.5 pts', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.559, M, U25)
    expect(result.points).toBe(12.5)
  })

  it('0.49 (exact threshold) -> 20.0 pts', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.49, M, U25)
    expect(result.points).toBe(20.0)
  })

  it('0.50 (exact threshold) -> 19.0 pts', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.50, M, U25)
    expect(result.points).toBe(19.0)
  })

  it('0.51 (exact threshold) -> 18.0 pts', () => {
    const result = lookupScore(EXERCISES.WHTR, 0.51, M, U25)
    expect(result.points).toBe(18.0)
  })
})

// --- EC-23: calculateWHtR rejects zero inputs ---

describe('EC-23 - height=0 or waist=0 -> calculateWHtR returns null', () => {
  it('waist=0, height=60 -> null (no ratio calculated)', () => {
    expect(calculateWHtR(0, 60)).toBeNull()
  })

  it('waist=30, height=0 -> null (prevents 30/0 = Infinity)', () => {
    expect(calculateWHtR(30, 0)).toBeNull()
  })

  it('waist=0, height=0 -> null (prevents 0/0 = NaN)', () => {
    expect(calculateWHtR(0, 0)).toBeNull()
  })

  it('waist=null, height=60 -> null', () => {
    expect(calculateWHtR(null, 60)).toBeNull()
  })

  it('waist=30, height=null -> null', () => {
    expect(calculateWHtR(30, null)).toBeNull()
  })

  it('valid waist=30, height=60 -> 0.50 (normal path unaffected)', () => {
    expect(calculateWHtR(30, 60)).toBe(0.50)
  })

  it('valid waist=33, height=66 -> 0.50 (rounding still applied)', () => {
    expect(calculateWHtR(33, 66)).toBe(0.50)
  })
})

// --- SL-06: composite = round((earned/possible)*100, 1) ---

const makeComp = (points, maxPoints, pass = true) => ({
  tested: true, exempt: false, points, maxPoints, pass,
})

describe('SL-06 - composite rounded to 1 decimal before pass check', () => {
  it('composite is the rounded value, not raw float', () => {
    const result = calculateCompositeScore([makeComp(37.5, 50)])
    expect(result.composite).toBe(75.0)
  })

  it('raw 74.95 -> composite 75.0 -> passes (key rounding-before-check case)', () => {
    const result = calculateCompositeScore([makeComp(1499, 2000)])
    expect(result.composite).toBe(75.0)
    expect(result.pass).toBe(true)
  })

  it('raw 74.90 -> composite 74.9 -> fails', () => {
    const result = calculateCompositeScore([makeComp(1498, 2000)])
    expect(result.composite).toBe(74.9)
    expect(result.pass).toBe(false)
  })

  it('raw 75.05 -> composite 75.1 -> passes', () => {
    const result = calculateCompositeScore([makeComp(1501, 2000)])
    expect(result.composite).toBe(75.1)
    expect(result.pass).toBe(true)
  })

  it('raw 72.55 -> composite 72.6 (rounds half-up)', () => {
    const result = calculateCompositeScore([makeComp(7255, 10000)])
    expect(result.composite).toBe(72.6)
  })

  it('standard 4-component perfect score -> composite 100.0', () => {
    const result = calculateCompositeScore([
      makeComp(50, 50),
      makeComp(20, 20),
      makeComp(15, 15),
      makeComp(15, 15),
    ])
    expect(result.composite).toBe(100.0)
    expect(result.pass).toBe(true)
  })

  it('composite exact at 75.0 -> passes', () => {
    const result = calculateCompositeScore([makeComp(75, 100)])
    expect(result.composite).toBe(75.0)
    expect(result.pass).toBe(true)
  })
})

// --- SL-07: Walk = 0 earned, 0 possible for cardio ---

describe('SL-07 - 2km walk excluded from composite', () => {
  it('calculateComponentScore marks walk result as walkOnly', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.WALK_2KM, value: 1500 },
      M, U25,
    )
    expect(result.walkOnly).toBe(true)
    expect(result.tested).toBe(true)
    expect(result.exempt).toBe(false)
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

    expect(result.allComponentsPass).toBe(true)
    expect(result.composite).toBe(80.0)
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

  it('walk + 2 others = composite calculable (no missing component)', () => {
    const walkCardio = { tested: true, exempt: false, walkOnly: true,  points: 30, maxPoints: 50, pass: true }
    const strength   = { tested: true, exempt: false, walkOnly: false, points: 15, maxPoints: 15, pass: true }
    const core       = { tested: true, exempt: false, walkOnly: false, points: 15, maxPoints: 15, pass: true }

    const result = calculateCompositeScore([walkCardio, strength, core])
    expect(result.partialAssessment).toBeFalsy()
    expect(result.composite).toBe(100.0)
  })

  it('composite correctly scaled to remaining-3 possible (50 pts)', () => {
    const walkCardio = { tested: true, exempt: false, walkOnly: true,  points: 0, maxPoints: 50, pass: true }
    const bodyComp   = { tested: true, exempt: false, walkOnly: false, points: 15, maxPoints: 20, pass: true }
    const strength   = { tested: true, exempt: false, walkOnly: false, points: 11.25, maxPoints: 15, pass: true }
    const core       = { tested: true, exempt: false, walkOnly: false, points: 11.25, maxPoints: 15, pass: true }

    const result = calculateCompositeScore([walkCardio, bodyComp, strength, core])
    expect(result.composite).toBe(75.0)
    expect(result.pass).toBe(true)
  })
})

// --- Walk Time Limits (Table 3.1, DAFMAN 36-2905) ---

describe('Walk time limits', () => {
  it('getWalkTimeLimit returns correct male <25 limit', () => {
    expect(getWalkTimeLimit('M', AGE_BRACKETS.UNDER_25)).toBe(976)
  })

  it('getWalkTimeLimit returns correct female 60+ limit', () => {
    expect(getWalkTimeLimit('F', AGE_BRACKETS.AGE_60_PLUS)).toBe(1133)
  })

  it('all 18 brackets have walk time limits defined', () => {
    for (const gender of ['M', 'F']) {
      for (const bracket of Object.values(AGE_BRACKETS)) {
        const limit = getWalkTimeLimit(gender, bracket)
        expect(limit).toBeGreaterThan(0)
        expect(limit).toBeLessThan(1200)
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
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.WALK_2KM, value: 900 },
      M, U25,
    )
    expect(result.walkOnly).toBe(true)
    expect(result.pass).toBe(true)
  })

  it('walk auto-fail when time exceeds limit', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.WALK_2KM, value: 1100 },
      M, U25,
    )
    expect(result.walkOnly).toBe(true)
    expect(result.pass).toBe(false)
  })

  it('explicit walkPass overrides auto-determination', () => {
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
    expect(result.walkTimeLimit).toBe(976)
  })
})

// --- SL-08: Component pass/fail checked independently of composite ---

describe('SL-08 - component pass/fail independent of composite', () => {
  it('high composite but one component fails minimum -> overall fail', () => {
    const cardio   = makeComp(50, 50, true)
    const bodyComp = makeComp(20, 20, true)
    const strength = makeComp(8, 15, false)
    const core     = makeComp(12, 15, true)

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.composite).toBe(90.0)
    expect(result.compositePass).toBe(true)
    expect(result.allComponentsPass).toBe(false)
    expect(result.pass).toBe(false)
  })

  it('all components pass minimums but composite < 75 -> overall fail', () => {
    const cardio   = makeComp(30, 50, true)
    const bodyComp = makeComp(10, 20, true)
    const strength = makeComp(9,  15, true)
    const core     = makeComp(9,  15, true)

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.composite).toBe(58.0)
    expect(result.compositePass).toBe(false)
    expect(result.allComponentsPass).toBe(true)
    expect(result.pass).toBe(false)
  })

  it('all components pass + composite >= 75 -> overall pass', () => {
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
    const cardio   = makeComp(50, 50, true)
    const bodyComp = makeComp(20, 20, true)
    const strength = makeComp(8,  15, false)
    const core     = makeComp(8,  15, false)

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.composite).toBe(86.0)
    expect(result.compositePass).toBe(true)
    expect(result.failedComponents).toHaveLength(2)
    expect(result.failedComponents).toContain(strength)
    expect(result.failedComponents).toContain(core)
    expect(result.pass).toBe(false)
  })

  it('multiple component failures tracked individually in failedComponents', () => {
    const cardio   = makeComp(30, 50, false)
    const bodyComp = makeComp(10, 20, false)
    const strength = makeComp(15, 15, true)
    const core     = makeComp(15, 15, true)

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.failedComponents).toHaveLength(2)
    expect(result.failedComponents).toContain(cardio)
    expect(result.failedComponents).toContain(bodyComp)
    expect(result.allComponentsPass).toBe(false)
  })

  it('component pass field on calculateComponentScore result is not affected by other components', () => {
    const passingStrength = calculateComponentScore(
      { type: COMPONENTS.STRENGTH, exercise: EXERCISES.PUSHUPS, value: 67 },
      M, U25,
    )
    const failingStrength = calculateComponentScore(
      { type: COMPONENTS.STRENGTH, exercise: EXERCISES.PUSHUPS, value: 1 },
      M, U25,
    )
    expect(passingStrength.pass).toBe(true)
    expect(failingStrength.pass).toBe(false)
    expect(passingStrength.pass).toBe(true)
  })
})

// --- SL-09: All components exempt -> composite = null ---

const makeExempt = () => ({ tested: false, exempt: true, points: 0, maxPoints: 0, pass: true })

describe('SL-09 - all components exempt -> composite null', () => {
  it('all 4 exempt -> composite=null, pass=null', () => {
    const result = calculateCompositeScore([makeExempt(), makeExempt(), makeExempt(), makeExempt()])
    expect(result.composite).toBeNull()
    expect(result.pass).toBeNull()
  })

  it('all 4 exempt -> allExempt=true flag set', () => {
    const result = calculateCompositeScore([makeExempt(), makeExempt(), makeExempt(), makeExempt()])
    expect(result.allExempt).toBe(true)
  })

  it('all 4 exempt -> failedComponents is empty', () => {
    const result = calculateCompositeScore([makeExempt(), makeExempt(), makeExempt(), makeExempt()])
    expect(result.failedComponents).toHaveLength(0)
  })

  it('all 4 exempt -> exemptComponents holds all 4 entries', () => {
    const comps = [makeExempt(), makeExempt(), makeExempt(), makeExempt()]
    const result = calculateCompositeScore(comps)
    expect(result.exemptComponents).toHaveLength(4)
    comps.forEach(c => expect(result.exemptComponents).toContain(c))
  })

  it('partial exemption: cardio exempt, 3 scored -> composite from remaining 3', () => {
    const cardio   = makeExempt()
    const bodyComp = makeComp(20, 20, true)
    const strength = makeComp(15, 15, true)
    const core     = makeComp(15, 15, true)

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.allExempt).toBeFalsy()
    expect(result.composite).toBe(100.0)
    expect(result.pass).toBe(true)
    expect(result.totalPossible).toBe(50)
    expect(result.exemptComponents).toHaveLength(1)
  })

  it('partial exemption: bodyComp exempt, cardio/strength/core scored -> composite from 3', () => {
    const cardio   = makeComp(40, 50, true)
    const bodyComp = makeExempt()
    const strength = makeComp(12, 15, true)
    const core     = makeComp(12, 15, true)

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.totalEarned).toBe(64)
    expect(result.totalPossible).toBe(80)
    expect(result.composite).toBe(80.0)
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
    expect(result.pass).toBe(true)
    expect(result.percentage).toBeNull()
  })

  it('3 exempt + 1 untested (no value) -> partialAssessment, not allExempt', () => {
    const untested = { tested: false, exempt: false, points: null, maxPoints: 50, pass: null }
    const result = calculateCompositeScore([makeExempt(), makeExempt(), makeExempt(), untested])
    expect(result.partialAssessment).toBe(true)
    expect(result.allExempt).toBeFalsy()
    expect(result.composite).toBeNull()
  })
})

// --- EC-02: Projection uses DOB + target date for age group ---

describe('EC-02 - getProjectionAgeBracket uses target date, not today', () => {
  it('DOB 1996-06-15: age 29 today, turns 30 before target -> AGE_30_34', () => {
    const dob = '1996-06-15'
    expect(getAgeBracket(calculateAge(dob, '2026-03-03'))).toBe(AGE_BRACKETS.AGE_25_29)
    expect(getProjectionAgeBracket(dob, '2026-07-01')).toBe(AGE_BRACKETS.AGE_30_34)
  })

  it('DOB 2001-06-15: age 24 today, turns 25 before target -> AGE_25_29', () => {
    const dob = '2001-06-15'
    expect(getAgeBracket(calculateAge(dob, '2026-03-03'))).toBe(AGE_BRACKETS.UNDER_25)
    expect(getProjectionAgeBracket(dob, '2026-07-01')).toBe(AGE_BRACKETS.AGE_25_29)
  })

  it('DOB 1986-04-01: age 39 today, turns 40 before target -> AGE_40_44', () => {
    const dob = '1986-04-01'
    expect(getAgeBracket(calculateAge(dob, '2026-03-03'))).toBe(AGE_BRACKETS.AGE_35_39)
    expect(getProjectionAgeBracket(dob, '2026-07-01')).toBe(AGE_BRACKETS.AGE_40_44)
  })

  it('DOB 1993-01-01: age 33 today and at target -> stays AGE_30_34', () => {
    const dob = '1993-01-01'
    expect(getProjectionAgeBracket(dob, '2026-03-03')).toBe(AGE_BRACKETS.AGE_30_34)
    expect(getProjectionAgeBracket(dob, '2026-07-01')).toBe(AGE_BRACKETS.AGE_30_34)
  })

  it('birthday falls exactly on target date -> new bracket applies', () => {
    const dob = '1996-07-01'
    expect(getAgeBracket(calculateAge(dob, '2026-03-03'))).toBe(AGE_BRACKETS.AGE_25_29)
    expect(getProjectionAgeBracket(dob, '2026-07-01')).toBe(AGE_BRACKETS.AGE_30_34)
  })

  it('birthday one day after target date -> old bracket still applies', () => {
    const dob = '1996-07-02'
    expect(getAgeBracket(calculateAge(dob, '2026-03-03'))).toBe(AGE_BRACKETS.AGE_25_29)
    expect(getProjectionAgeBracket(dob, '2026-07-01')).toBe(AGE_BRACKETS.AGE_25_29)
  })

  it('accepts Date objects as well as ISO strings', () => {
    const dob = new Date('1996-06-15')
    const target = new Date('2026-07-01')
    expect(getProjectionAgeBracket(dob, target)).toBe(AGE_BRACKETS.AGE_30_34)
  })
})

// --- EC-07: Exact boundary value is inclusive ---
// M U25 new table values:
//   RUN_2MILE: 805s=50.0, 824s=49.5, 843s=49.0, 1185s=35.0
//   HAMR:      87=50.0, 84=49.5
//   PUSHUPS:   67=15.0, 66=14.5

describe('EC-07 - exact boundary value is inclusive', () => {
  it('run: exact best threshold 805s (13:25) -> 50.0 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 805, M, U25).points).toBe(50.0)
  })

  it('run: one second over best threshold 806s -> drops to 49.5 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 806, M, U25).points).toBe(49.5)
  })

  it('run: exact second-tier threshold 824s (13:44) -> 49.5 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 824, M, U25).points).toBe(49.5)
  })

  it('run: one second over second-tier boundary 825s -> drops to 49.0 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 825, M, U25).points).toBe(49.0)
  })

  it('run: one second under second-tier boundary 823s -> stays at 49.5 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 823, M, U25).points).toBe(49.5)
  })

  it('run: exact worst threshold 1185s (19:45) -> 35.0 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 1185, M, U25).points).toBe(35.0)
  })

  it('HAMR: exact best threshold 87 shuttles -> 50.0 pts', () => {
    expect(lookupScore(EXERCISES.HAMR, 87, M, U25).points).toBe(50.0)
  })

  it('HAMR: one less than best 86 shuttles -> drops to 49.5 pts', () => {
    expect(lookupScore(EXERCISES.HAMR, 86, M, U25).points).toBe(49.5)
  })

  it('HAMR: exact tier boundary 84 shuttles -> 49.5 pts', () => {
    expect(lookupScore(EXERCISES.HAMR, 84, M, U25).points).toBe(49.5)
  })

  it('HAMR: one less than tier boundary 83 shuttles -> drops to 49.0 pts', () => {
    expect(lookupScore(EXERCISES.HAMR, 83, M, U25).points).toBe(49.0)
  })

  it('HAMR: exact worst threshold 42 shuttles -> 35.0 pts', () => {
    expect(lookupScore(EXERCISES.HAMR, 42, M, U25).points).toBe(35.0)
  })

  it('pushups: exact best threshold 67 reps -> 15.0 pts', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, 67, M, U25).points).toBe(15.0)
  })

  it('pushups: exact adjacent boundary 66 reps -> 14.5 pts', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, 66, M, U25).points).toBe(14.5)
  })
})

// --- EC-08: HAMR between published thresholds -> containing bracket ---
// M U25 HAMR table (2026 PFRA): 87, 84, 81, 78, 75, 72, 70, 67, 65, 63, 60...
// Values above 87 all get 50.0 (max). Gaps between thresholds land in the lower tier.

describe('EC-08 - HAMR between published thresholds lands in containing bracket', () => {
  it('HAMR 86 (gap between 84 and 87) -> 49.5 pts (84 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 86, M, U25).points).toBe(49.5)
  })

  it('HAMR 85 (gap between 84 and 87) -> 49.5 pts (84 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 85, M, U25).points).toBe(49.5)
  })

  it('HAMR 83 (gap between 81 and 84) -> 49.0 pts (81 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 83, M, U25).points).toBe(49.0)
  })

  it('HAMR 82 (gap between 81 and 84) -> 49.0 pts (81 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 82, M, U25).points).toBe(49.0)
  })

  it('HAMR 80 (gap between 78 and 81) -> 48.0 pts (78 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 80, M, U25).points).toBe(48.0)
  })

  it('HAMR 71 (gap between 70 and 72) -> 45.0 pts (70 tier)', () => {
    expect(lookupScore(EXERCISES.HAMR, 71, M, U25).points).toBe(45.0)
  })

  // Run: equivalent between-threshold test for time-based tables
  // M U25 RUN thresholds: 805, 824, 843, 862, 881, 900, 919, 938, 957...

  it('run 820s (between 805 and 824) -> 49.5 pts (824 tier)', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 820, M, U25).points).toBe(49.5)
  })

  it('run 843s (exact threshold) -> 49.0 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 843, M, U25).points).toBe(49.0)
  })

  it('run 950s (between 938 and 957) -> 43.0 pts (957 tier)', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 950, M, U25).points).toBe(43.0)
  })
})

// --- Mid-table lookups ---

describe('lookupScore - mid-table values', () => {
  it('2-mile run: 17:55 (1075s) -> 37.5 pts', () => {
    const result = lookupScore(EXERCISES.RUN_2MILE, 1075, M, U25)
    expect(result.points).toBe(37.5)
  })

  it('pushups: 42 reps -> 6.5 pts', () => {
    const result = lookupScore(EXERCISES.PUSHUPS, 42, M, U25)
    expect(result.points).toBe(6.5)
  })

  it('plank: 125s -> 5.5 pts', () => {
    const result = lookupScore(EXERCISES.PLANK, 125, M, U25)
    expect(result.points).toBe(5.5)
  })
})

// --- parseTime ---

describe('parseTime', () => {
  it('"18" treated as 18 minutes = 1080 seconds (1-2 digit number = minutes)', () => {
    expect(parseTime('18')).toBe(1080)
  })

  it('"18:00" -> 1080 seconds', () => {
    expect(parseTime('18:00')).toBe(1080)
  })

  it('"18:30" -> 1110 seconds', () => {
    expect(parseTime('18:30')).toBe(1110)
  })

  it('"0:30" -> 30 seconds', () => {
    expect(parseTime('0:30')).toBe(30)
  })

  it('"810" treated as 810 total seconds = 13:30 (3+ digit number = total seconds)', () => {
    expect(parseTime('810')).toBe(810)
  })

  it('empty string -> null', () => {
    expect(parseTime('')).toBeNull()
  })

  it('null -> null', () => {
    expect(parseTime(null)).toBeNull()
  })

  it('"0" -> null (zero minutes is not a valid time)', () => {
    expect(parseTime('0')).toBeNull()
  })
})

// --- null / undefined inputs ---

describe('lookupScore - null/undefined value', () => {
  it('null value -> null result', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, null, M, U25)).toBeNull()
  })

  it('undefined value -> null result', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, undefined, M, U25)).toBeNull()
  })
})

// --- maxPoints derivation ---

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

// --- hamrTimeToShuttles ---

describe('hamrTimeToShuttles', () => {
  it('null input -> null', () => {
    expect(hamrTimeToShuttles(null)).toBeNull()
  })

  it('"0:00" -> null (zero time is not valid)', () => {
    expect(hamrTimeToShuttles('0:00')).toBeNull()
  })

  it('"0:05" -> 0 shuttles (5 seconds completes no shuttles)', () => {
    expect(hamrTimeToShuttles('0:05')).toBe(0)
  })

  it('"0:10" -> 1 shuttle (10 s > 9 s first shuttle)', () => {
    expect(hamrTimeToShuttles('0:10')).toBe(1)
  })

  it('"9:00" -> known shuttle count (standard reference)', () => {
    const result = hamrTimeToShuttles('9:00')
    expect(result).toBeGreaterThan(0)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('known reference: "15:00" produces more shuttles than "9:00"', () => {
    expect(hamrTimeToShuttles('15:00')).toBeGreaterThan(hamrTimeToShuttles('9:00'))
  })
})

// --- Female scoring table coverage ---

const F = GENDER.FEMALE

describe('Female <25 scoring tables', () => {
  const bracket = AGE_BRACKETS.UNDER_25

  it('run: best time 930s (15:30) = 50.0 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 930, F, bracket).points).toBe(50)
  })
  it('run: worst time 1365s -> 37.5 pts (within 22:55 row)', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 1365, F, bracket).points).toBe(37.5)
  })
  it('run: mid-range 1118s -> 44.0 pts (within 18:58 row)', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 1118, F, bracket).points).toBe(44.0)
  })
  it('pushups: best 50 reps = 15.0 pts', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, 50, F, bracket).points).toBe(15)
  })
  it('pushups: 16 reps = 3.0 pts', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, 16, F, bracket).points).toBe(3.0)
  })
  it('situps: best 54 reps = 15.0 pts', () => {
    expect(lookupScore(EXERCISES.SITUPS, 54, F, bracket).points).toBe(15)
  })
  it('HAMR: best 68 shuttles = 50.0 pts', () => {
    expect(lookupScore(EXERCISES.HAMR, 68, F, bracket).points).toBe(50)
  })
  it('plank: best 215s = 15.0 pts', () => {
    expect(lookupScore(EXERCISES.PLANK, 215, F, bracket).points).toBe(15)
  })
})

describe('Female 25-29 scoring tables', () => {
  const bracket = AGE_BRACKETS.AGE_25_29

  it('run: 930s = 50.0 pts (within best threshold)', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 930, F, bracket).points).toBe(50)
  })
  it('pushups: 15 reps = 3.0 pts', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, 15, F, bracket).points).toBe(3.0)
  })
  it('HRPU: best 40 reps = 15.0 pts', () => {
    expect(lookupScore(EXERCISES.HRPU, 40, F, bracket).points).toBe(15)
  })
  it('CLRC: best 56 reps = 15.0 pts', () => {
    expect(lookupScore(EXERCISES.CLRC, 56, F, bracket).points).toBe(15)
  })
  it('plank: 50s (below chart min) = 0 external; internal 2.5 per DAFMAN §3.7.4', () => {
    const r = lookupScore(EXERCISES.PLANK, 50, F, bracket)
    expect(r.points).toBe(0)
    expect(r.internalPoints).toBe(2.5)
  })
})

describe('Female 30-34 scoring tables', () => {
  const bracket = AGE_BRACKETS.AGE_30_34

  it('run: best 970s = 50.0 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 970, F, bracket).points).toBe(50)
  })
  it('pushups: 11 reps (below chart min) = 0 external; internal 2.5 per DAFMAN §3.7.4', () => {
    const r = lookupScore(EXERCISES.PUSHUPS, 11, F, bracket)
    expect(r.points).toBe(0)
    expect(r.internalPoints).toBe(2.5)
  })
  it('situps: 26 reps = 5.5 pts', () => {
    expect(lookupScore(EXERCISES.SITUPS, 26, F, bracket).points).toBe(5.5)
  })
  it('HAMR: 19 shuttles = 35.0 pts (chart min)', () => {
    expect(lookupScore(EXERCISES.HAMR, 19, F, bracket).points).toBe(35.0)
  })
})

describe('Female 40-44 scoring tables', () => {
  const bracket = AGE_BRACKETS.AGE_40_44

  it('run: best 1005s = 50.0 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 1005, F, bracket).points).toBe(50)
  })
  it('pushups: 8 reps (below chart min) = 0 external; internal 2.5 per DAFMAN §3.7.4', () => {
    const r = lookupScore(EXERCISES.PUSHUPS, 8, F, bracket)
    expect(r.points).toBe(0)
    expect(r.internalPoints).toBe(2.5)
  })
  it('HRPU: best 34 reps = 15.0 pts', () => {
    expect(lookupScore(EXERCISES.HRPU, 34, F, bracket).points).toBe(15)
  })
  it('plank: 35s (below chart min) = 0 external; internal 2.5 per DAFMAN §3.7.4', () => {
    const r = lookupScore(EXERCISES.PLANK, 35, F, bracket)
    expect(r.points).toBe(0)
    expect(r.internalPoints).toBe(2.5)
  })
  it('CLRC: 6 reps (below chart min) = 0 external; internal 2.5 per DAFMAN §3.7.4', () => {
    const r = lookupScore(EXERCISES.CLRC, 6, F, bracket)
    expect(r.points).toBe(0)
    expect(r.internalPoints).toBe(2.5)
  })
})

describe('Female 60+ scoring tables', () => {
  const bracket = AGE_BRACKETS.AGE_60_PLUS

  it('run: best 1100s = 50.0 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 1100, F, bracket).points).toBe(50)
  })
  it('run: 1500s = 39.0 pts', () => {
    expect(lookupScore(EXERCISES.RUN_2MILE, 1500, F, bracket).points).toBe(39.0)
  })
  it('pushups: 6 reps = 4.0 pts', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, 6, F, bracket).points).toBe(4.0)
  })
  it('pushups: best 28 reps = 15.0 pts', () => {
    expect(lookupScore(EXERCISES.PUSHUPS, 28, F, bracket).points).toBe(15)
  })
  it('HRPU: 1 rep = 2.5 pts (chart min)', () => {
    expect(lookupScore(EXERCISES.HRPU, 1, F, bracket).points).toBe(2.5)
  })
  it('situps: 8 reps = 3.5 pts', () => {
    expect(lookupScore(EXERCISES.SITUPS, 8, F, bracket).points).toBe(3.5)
  })
  it('HAMR: 2 shuttles (below chart min) = 0 external; internal 35.0 per DAFMAN §3.7.4', () => {
    const r = lookupScore(EXERCISES.HAMR, 2, F, bracket)
    expect(r.points).toBe(0)
    expect(r.internalPoints).toBe(35.0)
  })
  it('plank: 15s (below chart min) = 0 external; internal 2.5 per DAFMAN §3.7.4', () => {
    const r = lookupScore(EXERCISES.PLANK, 15, F, bracket)
    expect(r.points).toBe(0)
    expect(r.internalPoints).toBe(2.5)
  })
})

describe('Female composite - full assessment pass/fail', () => {
  it('F <25: strong performer passes composite', () => {
    const comps = [
      calculateComponentScore({ type: 'cardio', exercise: EXERCISES.RUN_2MILE, value: 1000 }, F, AGE_BRACKETS.UNDER_25),
      calculateComponentScore({ type: 'bodyComp', exercise: EXERCISES.WHTR, value: 0.45 }, F, AGE_BRACKETS.UNDER_25),
      calculateComponentScore({ type: 'strength', exercise: EXERCISES.PUSHUPS, value: 35 }, F, AGE_BRACKETS.UNDER_25),
      calculateComponentScore({ type: 'core', exercise: EXERCISES.SITUPS, value: 45 }, F, AGE_BRACKETS.UNDER_25),
    ]
    const result = calculateCompositeScore(comps)
    expect(result.composite).toBeGreaterThanOrEqual(75)
    expect(result.pass).toBe(true)
  })

  it('F 40-44: failing performer fails composite', () => {
    const comps = [
      calculateComponentScore({ type: 'cardio', exercise: EXERCISES.RUN_2MILE, value: 1395 }, F, AGE_BRACKETS.AGE_40_44),
      calculateComponentScore({ type: 'bodyComp', exercise: EXERCISES.WHTR, value: 0.55 }, F, AGE_BRACKETS.AGE_40_44),
      calculateComponentScore({ type: 'strength', exercise: EXERCISES.PUSHUPS, value: 8 }, F, AGE_BRACKETS.AGE_40_44),
      calculateComponentScore({ type: 'core', exercise: EXERCISES.SITUPS, value: 21 }, F, AGE_BRACKETS.AGE_40_44),
    ]
    const result = calculateCompositeScore(comps)
    expect(result.pass).toBe(false)
  })
})

// --- Below-minimum: component fails per-component minimum ---

const makeBelow = (points, maxPoints) => ({
  tested: true, exempt: false, walkOnly: false, points, maxPoints, pass: false, belowMinimum: true,
})

describe('belowMinimum - calculateComponentScore flags below-minimum components', () => {
  it('M <25 pushups 30 reps (floor / * row) -> pass: true, belowMinimum: false (§3.7.4)', () => {
    // 30 reps = 2.5 pts = the * row. At or above the * row passes the component floor.
    const result = calculateComponentScore(
      { type: 'strength', exercise: EXERCISES.PUSHUPS, value: 30 },
      M, U25
    )
    expect(result.pass).toBe(true)
    expect(result.belowMinimum).toBe(false)
    expect(result.points).toBe(2.5)
    expect(result.tested).toBe(true)
  })

  it('M <25 pushups 29 reps (below * row) -> pass: false, belowMinimum: true, 0 pts', () => {
    const result = calculateComponentScore(
      { type: 'strength', exercise: EXERCISES.PUSHUPS, value: 29 },
      M, U25
    )
    expect(result.pass).toBe(false)
    expect(result.belowMinimum).toBe(true)
    expect(result.points).toBe(0)
  })

  it('M <25 pushups 67 reps -> belowMinimum: false (well above floor)', () => {
    const result = calculateComponentScore(
      { type: 'strength', exercise: EXERCISES.PUSHUPS, value: 67 },
      M, U25
    )
    expect(result.belowMinimum).toBe(false)
    expect(result.pass).toBe(true)
  })

  it('M <25 2-mile run at chart worst (1185s) -> pass: true, belowMinimum: false (35 pts = * row)', () => {
    // 1185s = 35.0 pts = the * row. Points > 0 so component passes floor.
    const result = calculateComponentScore(
      { type: 'cardio', exercise: EXERCISES.RUN_2MILE, value: 1185 },
      M, U25
    )
    expect(result.pass).toBe(true)
    expect(result.belowMinimum).toBe(false)
    expect(result.points).toBe(35.0)
  })

  it('WHtR 0.60 -> belowMinimum: false (BC has no per-component minimum per DAFMAN §3.7.1)', () => {
    const result = calculateComponentScore(
      { type: 'bodyComp', exercise: EXERCISES.WHTR, value: 0.60 },
      M, U25
    )
    // DAFMAN 36-2905 §3.7.1: Body Composition has no minimum requirement.
    // BFA failure gate (§3.1.2.1.1) triggers separately when WHtR > .55 AND composite < 75.
    expect(result.belowMinimum).toBe(false)
    expect(result.points).toBe(0)
  })

  it('exempt component is never belowMinimum', () => {
    const result = calculateComponentScore(
      { type: 'strength', exercise: EXERCISES.PUSHUPS, exempt: true },
      M, U25
    )
    expect(result.belowMinimum).toBeUndefined()
    expect(result.exempt).toBe(true)
  })
})

describe('belowMinimum - cascades to overall fail; composite remains truthful (DAFMAN)', () => {
  it('1 below-min component still contributes to composite; overall fails', () => {
    const cardio    = makeComp(30, 50, true)
    const bodyComp  = makeComp(15, 20, true)
    const core      = makeComp(12, 15, true)
    const strength  = makeBelow(2, 15)

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.composite).toBe(Math.round((59 / 100) * 1000) / 10)
    expect(result.pass).toBe(false)
  })

  it('below-min populates belowMinimumComponents array', () => {
    const below = makeBelow(5, 50)
    const result = calculateCompositeScore([below, makeComp(15, 20, true), makeComp(12, 15, true), makeComp(12, 15, true)])
    expect(result.belowMinimumComponents).toHaveLength(1)
    expect(result.belowMinimumComponents[0]).toBe(below)
  })

  it('below-min also appears in failedComponents', () => {
    const below = makeBelow(5, 50)
    const result = calculateCompositeScore([below, makeComp(15, 20, true), makeComp(12, 15, true), makeComp(12, 15, true)])
    expect(result.failedComponents).toContain(below)
  })

  it('high composite with 1 below-min component -> overall fail despite good score', () => {
    const cardio    = makeComp(48, 50, true)
    const bodyComp  = makeComp(19, 20, true)
    const core      = makeComp(14, 15, true)
    const strength  = makeBelow(2, 15)

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.composite).toBe(83.0)
    expect(result.pass).toBe(false)
    expect(result.allComponentsPass).toBe(false)
  })

  it('all 4 below-min -> composite reflects actual earned points; pass false', () => {
    const result = calculateCompositeScore([
      makeBelow(5,  50),
      makeBelow(2,  20),
      makeBelow(3,  15),
      makeBelow(3,  15),
    ])
    expect(result.composite).toBe(13.0)
    expect(result.pass).toBe(false)
    expect(result.belowMinimumComponents).toHaveLength(4)
  })

  it('2 below-min + 2 passing -> composite includes all components', () => {
    const cardio   = makeComp(40, 50, true)
    const bodyComp = makeComp(16, 20, true)
    const strength = makeBelow(3, 15)
    const core     = makeBelow(4, 15)

    const result = calculateCompositeScore([cardio, bodyComp, strength, core])

    expect(result.composite).toBe(63.0)
    expect(result.pass).toBe(false)
    expect(result.belowMinimumComponents).toHaveLength(2)
  })

  it('real below-min scenario: M <25 all-4 assessment with bad pushups', () => {
    // 29 reps is below the M/<25 chart floor (30 reps = * row, 2.5 pts) -> 0 pts -> component fail
    const comps = [
      calculateComponentScore({ type: 'cardio', exercise: EXERCISES.RUN_2MILE, value: 900 }, M, U25),
      calculateComponentScore({ type: 'bodyComp', exercise: EXERCISES.WHTR, value: 0.46 }, M, U25),
      calculateComponentScore({ type: 'strength', exercise: EXERCISES.PUSHUPS, value: 29 }, M, U25),
      calculateComponentScore({ type: 'core', exercise: EXERCISES.SITUPS, value: 50 }, M, U25),
    ]
    const result = calculateCompositeScore(comps)

    expect(result.pass).toBe(false)
    expect(result.belowMinimumComponents).toHaveLength(1)
    expect(result.composite).not.toBeNull()
    const strengthComp = comps.find(c => c.pass === false && c.belowMinimum)
    expect(strengthComp).toBeDefined()
  })
})
