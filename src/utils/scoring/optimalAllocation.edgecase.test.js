/**
 * Edge case tests for optimalAllocation.js - gaps found during audit
 */

import { describe, it, expect } from 'vitest'
import {
  effortScaleFactor,
  buildMarginalCostSchedule,
  computeOptimalAllocation,
} from './optimalAllocation.js'
import { EXERCISES, COMPONENTS, AGE_BRACKETS, GENDER } from './constants.js'

const M_U25 = { gender: GENDER.MALE, ageBracket: AGE_BRACKETS.UNDER_25 }
const M_35_39 = { gender: GENDER.MALE, ageBracket: AGE_BRACKETS.AGE_35_39 }

// ─── GAP 1: Target below current composite ──────────────────────────────────
// computeOptimalAllocation computes pointsNeeded = max(0, targetPts - totalEarned).
// When target is below current, pointsNeeded = 0 and the greedy loop is skipped.
// No test explicitly verifies this returns achievable=true with 0 effort for
// a target significantly below current.

describe('Target below current composite', () => {
  it('target 60 when current composite is ~72.7: achievable with 0 effort', () => {
    const scores = {
      [COMPONENTS.CARDIO]: { exercise: EXERCISES.RUN_2MILE, value: 1440, pts: 29.5 },
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 41, pts: 13.2 },
      [COMPONENTS.CORE]: { exercise: EXERCISES.CLRC, value: 61, pts: 15.0 },
      [COMPONENTS.BODY_COMP]: { exercise: EXERCISES.WHTR, value: 0.54, pts: 15.0 },
    }
    const result = computeOptimalAllocation(scores, 60, M_35_39)
    expect(result.achievable).toBe(true)
    expect(result.totalEffortWeeks).toBe(0)
    // No components should have increased targets
    expect(result.components[COMPONENTS.STRENGTH].ptsGain).toBe(0)
    expect(result.components[COMPONENTS.CORE].ptsGain).toBe(0)
  })

  it('target 0: trivially achievable', () => {
    const scores = {
      [COMPONENTS.CARDIO]: { exercise: EXERCISES.RUN_2MILE, value: 1440, pts: 29.5 },
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 41, pts: 13.2 },
      [COMPONENTS.CORE]: { exercise: EXERCISES.CLRC, value: 61, pts: 15.0 },
      [COMPONENTS.BODY_COMP]: { exercise: EXERCISES.WHTR, value: 0.54, pts: 15.0 },
    }
    const result = computeOptimalAllocation(scores, 0, M_35_39)
    expect(result.achievable).toBe(true)
    expect(result.totalEffortWeeks).toBe(0)
  })
})

// ─── GAP 2: All components exempt ───────────────────────────────────────────
// totalPossible = 0, should return achievable=false with currentComposite=0.

describe('All components exempt', () => {
  it('returns achievable=false when all 4 components are exempt', () => {
    const scores = {
      [COMPONENTS.CARDIO]: { exercise: EXERCISES.RUN_2MILE, value: 900, pts: 40, exempt: true },
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 50, pts: 15, exempt: true },
      [COMPONENTS.CORE]: { exercise: EXERCISES.SITUPS, value: 50, pts: 15, exempt: true },
      [COMPONENTS.BODY_COMP]: { exercise: EXERCISES.WHTR, value: 0.49, pts: 20, exempt: true },
    }
    const result = computeOptimalAllocation(scores, 75, M_U25)
    expect(result.achievable).toBe(false)
    expect(result.totalEffortWeeks).toBe(0)
    expect(result.currentComposite).toBe(0)
  })
})

// ─── GAP 3: Body comp at WHtR 0.60 (0 points) in optimal allocation ────────
// When bodyComp has 0 points (WHtR >= 0.60), the schedule should be able to
// find improvement paths from that floor.

describe('Body comp at 0 points (WHtR 0.60)', () => {
  it('buildMarginalCostSchedule returns improvement path from WHtR 0.60', () => {
    const schedule = buildMarginalCostSchedule(
      EXERCISES.WHTR, 0.60, GENDER.MALE, AGE_BRACKETS.UNDER_25,
    )
    expect(schedule.length).toBeGreaterThan(0)
    // First step should improve from 0.0 pts to something positive
    expect(schedule[0].fromPts).toBe(0.0)
    expect(schedule[0].toPts).toBeGreaterThan(0)
  })

  it('allocation can improve body comp from 0 pts', () => {
    const scores = {
      [COMPONENTS.CARDIO]: { exercise: EXERCISES.RUN_2MILE, value: 900, pts: 45.0 },
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 50, pts: 15.0 },
      [COMPONENTS.CORE]: { exercise: EXERCISES.SITUPS, value: 50, pts: 15.0 },
      [COMPONENTS.BODY_COMP]: { exercise: EXERCISES.WHTR, value: 0.60, pts: 0.0 },
    }
    const result = computeOptimalAllocation(scores, 80, M_U25)
    // Body comp is below minimum (50% of 20 = 10 pts), must be raised
    expect(result.components[COMPONENTS.BODY_COMP].belowMinimum).toBe(true)
    expect(result.components[COMPONENTS.BODY_COMP].targetPts).toBeGreaterThan(0)
  })
})

// ─── GAP 4: Component with null/missing pts ─────────────────────────────────
// When a component has pts=undefined (not in the data), it should default to 0.

describe('Component with missing pts field', () => {
  it('missing pts defaults to 0 via nullish coalescing', () => {
    const scores = {
      [COMPONENTS.CARDIO]: { exercise: EXERCISES.RUN_2MILE, value: 1440 },
      // pts is undefined, should default to 0 via `data.pts ?? 0`
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 41, pts: 13.2 },
      [COMPONENTS.CORE]: { exercise: EXERCISES.CLRC, value: 61, pts: 15.0 },
      [COMPONENTS.BODY_COMP]: { exercise: EXERCISES.WHTR, value: 0.54, pts: 15.0 },
    }
    const result = computeOptimalAllocation(scores, 75, M_35_39)
    // Should not crash and should treat cardio as 0 points
    expect(result.components[COMPONENTS.CARDIO].currentPts).toBe(0)
  })
})

// ─── GAP 5: buildMarginalCostSchedule with already-maxed exercises ──────────
// These exercise-specific max cases aren't tested per exercise type.

describe('buildMarginalCostSchedule at maximum for various exercises', () => {
  it('WHtR at best (0.49) returns empty schedule', () => {
    const schedule = buildMarginalCostSchedule(
      EXERCISES.WHTR, 0.49, GENDER.MALE, AGE_BRACKETS.UNDER_25,
    )
    // 0.49 matches the best threshold, currentIdx should be 0
    expect(schedule).toHaveLength(0)
  })

  it('WHtR below best (0.45) returns empty schedule', () => {
    const schedule = buildMarginalCostSchedule(
      EXERCISES.WHTR, 0.45, GENDER.MALE, AGE_BRACKETS.UNDER_25,
    )
    expect(schedule).toHaveLength(0)
  })

  it('plank at max (M/35-39) returns empty schedule', () => {
    // Need to find the chart max. It should be at index 0 of the table.
    const schedule = buildMarginalCostSchedule(
      EXERCISES.PLANK, 999, GENDER.MALE, AGE_BRACKETS.AGE_35_39,
    )
    expect(schedule).toHaveLength(0)
  })

  it('2-mile run at best time (fastest possible) returns empty schedule', () => {
    const schedule = buildMarginalCostSchedule(
      EXERCISES.RUN_2MILE, 600, GENDER.MALE, AGE_BRACKETS.UNDER_25,
    )
    // 600s is faster than the chart best (805s), so currentIdx = 0
    expect(schedule).toHaveLength(0)
  })
})

// ─── GAP 6: effortScaleFactor at exact midpoints between anchors ────────────

describe('effortScaleFactor midpoint precision', () => {
  it('at 0.675 (midpoint 0.60-0.75): returns 0.9', () => {
    // Linear interp: 0.8 + (1.0-0.8)*((0.675-0.60)/(0.75-0.60)) = 0.8 + 0.2*0.5 = 0.9
    expect(effortScaleFactor(0.675)).toBeCloseTo(0.9, 2)
  })

  it('at 0.91 (midpoint 0.87-0.95): returns 2.0', () => {
    // 1.5 + (2.5-1.5)*((0.91-0.87)/(0.95-0.87)) = 1.5 + 1.0*0.5 = 2.0
    expect(effortScaleFactor(0.91)).toBeCloseTo(2.0, 2)
  })
})

// ─── GAP 7: bestBangForBuck is null when all components are maxed ───────────

describe('bestBangForBuck when all maxed', () => {
  it('returns null when all non-exempt components are at max', () => {
    const scores = {
      [COMPONENTS.CARDIO]: { exercise: EXERCISES.RUN_2MILE, value: 600, pts: 50.0 },
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 100, pts: 15.0 },
      [COMPONENTS.CORE]: { exercise: EXERCISES.SITUPS, value: 100, pts: 15.0 },
      [COMPONENTS.BODY_COMP]: { exercise: EXERCISES.WHTR, value: 0.40, pts: 20.0 },
    }
    const result = computeOptimalAllocation(scores, 100, M_U25)
    expect(result.bestBangForBuck).toBeNull()
  })
})
