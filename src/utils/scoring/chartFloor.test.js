/**
 * Chart Floor Audit - DAFMAN 36-2905 §3.7.4
 *
 * Iterates every exercise × gender × age-bracket combination (126 total) and
 * asserts that the last row of each scoring table matches the asterisk (*) row
 * published in docs/PFRA-Scoring-Charts.md.
 *
 * The * row is the chart floor: performance below it earns 0 pts and fails the
 * component. Performance at or above it earns the floor points and passes.
 *
 * This test catches typos in scoringTables.js that would silently produce wrong
 * minimums in the scoring engine.
 */

import { describe, it, expect } from 'vitest'
import { getScoringTable } from './scoringTables.js'
import { calculateComponentScore } from './scoringEngine.js'
import {
  EXERCISES,
  GENDER,
  AGE_BRACKETS,
  COMPONENTS,
  COMPONENTS_WITH_CHART_FLOOR_MINIMUM,
} from './constants.js'

const M = GENDER.MALE
const F = GENDER.FEMALE

// All 9 AFPC age brackets
const ALL_BRACKETS = Object.values(AGE_BRACKETS)

// Exercises with chart floors (cardio/strength/core; walk and WHTR excluded)
const FLOOR_EXERCISES = [
  { exercise: EXERCISES.RUN_2MILE, component: COMPONENTS.CARDIO, expectedFloorPts: 35.0 },
  { exercise: EXERCISES.HAMR,      component: COMPONENTS.CARDIO, expectedFloorPts: 35.0 },
  { exercise: EXERCISES.PUSHUPS,   component: COMPONENTS.STRENGTH, expectedFloorPts: 2.5 },
  { exercise: EXERCISES.HRPU,      component: COMPONENTS.STRENGTH, expectedFloorPts: 2.5 },
  { exercise: EXERCISES.SITUPS,    component: COMPONENTS.CORE, expectedFloorPts: 2.5 },
  { exercise: EXERCISES.CLRC,      component: COMPONENTS.CORE, expectedFloorPts: 2.5 },
  { exercise: EXERCISES.PLANK,     component: COMPONENTS.CORE, expectedFloorPts: 2.5 },
]

// ── Floor points universally match expected values ────────────────────────────

describe('Chart floor (* row) points match PFRA Scoring Charts - all brackets', () => {
  for (const gender of [M, F]) {
    for (const bracket of ALL_BRACKETS) {
      for (const { exercise, expectedFloorPts } of FLOOR_EXERCISES) {
        it(`${gender} ${bracket} ${exercise}: last row = ${expectedFloorPts} pts`, () => {
          const table = getScoringTable(gender, bracket, exercise)
          expect(table).not.toBeNull()
          expect(table.length).toBeGreaterThan(0)
          const lastRow = table[table.length - 1]
          expect(lastRow.points).toBe(expectedFloorPts)
        })
      }
    }
  }
})

// ── Floor threshold spot-checks against PFRA Scoring Charts ──────────────────
// Representative * row thresholds from docs/PFRA-Scoring-Charts.md.

describe('Chart floor (* row) thresholds - spot-checks against PFRA charts', () => {
  it('M <25 push-ups * row = 30 reps (2.5 pts)', () => {
    const table = getScoringTable(M, AGE_BRACKETS.UNDER_25, EXERCISES.PUSHUPS)
    expect(table[table.length - 1]).toEqual({ threshold: 30, points: 2.5 })
  })

  it('F <25 push-ups * row = 15 reps (2.5 pts)', () => {
    const table = getScoringTable(F, AGE_BRACKETS.UNDER_25, EXERCISES.PUSHUPS)
    expect(table[table.length - 1]).toEqual({ threshold: 15, points: 2.5 })
  })

  it('M <25 2-mile run * row = 19:45 (1185s, 35 pts)', () => {
    const table = getScoringTable(M, AGE_BRACKETS.UNDER_25, EXERCISES.RUN_2MILE)
    expect(table[table.length - 1]).toEqual({ threshold: 1185, points: 35.0 })
  })

  it('F <25 2-mile run * row = 1523s (35 pts)', () => {
    const table = getScoringTable(F, AGE_BRACKETS.UNDER_25, EXERCISES.RUN_2MILE)
    expect(table[table.length - 1]).toEqual({ threshold: 1523, points: 35.0 })
  })

  it('M <25 HAMR * row = 42 shuttles (35 pts)', () => {
    const table = getScoringTable(M, AGE_BRACKETS.UNDER_25, EXERCISES.HAMR)
    expect(table[table.length - 1]).toEqual({ threshold: 42, points: 35.0 })
  })

  it('M <25 sit-ups * row = 33 reps (2.5 pts)', () => {
    const table = getScoringTable(M, AGE_BRACKETS.UNDER_25, EXERCISES.SITUPS)
    expect(table[table.length - 1]).toEqual({ threshold: 33, points: 2.5 })
  })

  it('M <25 plank * row = 95s (2.5 pts)', () => {
    const table = getScoringTable(M, AGE_BRACKETS.UNDER_25, EXERCISES.PLANK)
    expect(table[table.length - 1]).toEqual({ threshold: 95, points: 2.5 })
  })

  it('M 60+ push-ups * row = 12 reps (2.5 pts)', () => {
    const table = getScoringTable(M, AGE_BRACKETS.AGE_60_PLUS, EXERCISES.PUSHUPS)
    expect(table[table.length - 1]).toEqual({ threshold: 12, points: 2.5 })
  })

  it('M 60+ 2-mile run * row = 1440s (35 pts)', () => {
    const table = getScoringTable(M, AGE_BRACKETS.AGE_60_PLUS, EXERCISES.RUN_2MILE)
    expect(table[table.length - 1]).toEqual({ threshold: 1440, points: 35.0 })
  })
})

// ── Scoring engine integration: * row earns points and passes component ───────

describe('Scoring engine - * row performance passes component floor (§3.7.4)', () => {
  it('M <25 push-ups at 30 reps (floor) -> pass: true, points: 2.5', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.STRENGTH, exercise: EXERCISES.PUSHUPS, value: 30 },
      M, AGE_BRACKETS.UNDER_25
    )
    expect(result.pass).toBe(true)
    expect(result.belowMinimum).toBe(false)
    expect(result.points).toBe(2.5)
  })

  it('M <25 push-ups at 29 reps (below floor) -> pass: false, points: 0', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.STRENGTH, exercise: EXERCISES.PUSHUPS, value: 29 },
      M, AGE_BRACKETS.UNDER_25
    )
    expect(result.pass).toBe(false)
    expect(result.belowMinimum).toBe(true)
    expect(result.points).toBe(0)
  })

  it('M <25 run at 1185s (19:45, floor) -> pass: true, points: 35', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.RUN_2MILE, value: 1185 },
      M, AGE_BRACKETS.UNDER_25
    )
    expect(result.pass).toBe(true)
    expect(result.belowMinimum).toBe(false)
    expect(result.points).toBe(35.0)
  })

  it('M <25 run at 1186s (1s slower than floor) -> pass: false, points: 0', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.CARDIO, exercise: EXERCISES.RUN_2MILE, value: 1186 },
      M, AGE_BRACKETS.UNDER_25
    )
    expect(result.pass).toBe(false)
    expect(result.belowMinimum).toBe(true)
    expect(result.points).toBe(0)
  })

  it('WHtR 0.60 (0 pts) -> pass: true (BC has no floor minimum per §3.7.1)', () => {
    const result = calculateComponentScore(
      { type: COMPONENTS.BODY_COMP, exercise: EXERCISES.WHTR, value: 0.60 },
      M, AGE_BRACKETS.UNDER_25
    )
    expect(result.pass).toBe(true)
    expect(result.belowMinimum).toBe(false)
    expect(result.points).toBe(0)
  })
})

// ── COMPONENTS_WITH_CHART_FLOOR_MINIMUM covers correct set ───────────────────

describe('COMPONENTS_WITH_CHART_FLOOR_MINIMUM set contents', () => {
  it('includes cardio', () => {
    expect(COMPONENTS_WITH_CHART_FLOOR_MINIMUM.has(COMPONENTS.CARDIO)).toBe(true)
  })

  it('includes strength', () => {
    expect(COMPONENTS_WITH_CHART_FLOOR_MINIMUM.has(COMPONENTS.STRENGTH)).toBe(true)
  })

  it('includes core', () => {
    expect(COMPONENTS_WITH_CHART_FLOOR_MINIMUM.has(COMPONENTS.CORE)).toBe(true)
  })

  it('excludes bodyComp (§3.7.1: no minimum)', () => {
    expect(COMPONENTS_WITH_CHART_FLOOR_MINIMUM.has(COMPONENTS.BODY_COMP)).toBe(false)
  })
})
