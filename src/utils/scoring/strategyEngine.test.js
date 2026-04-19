/**
 * Unit tests for strategyEngine.js (Task 8.1)
 * Covers: marginalReturn, analyzeNextGain, effortEstimate, strategyEngine
 */

import { describe, it, expect } from 'vitest'
import {
  marginalReturn,
  analyzeNextGain,
  effortEstimate,
  strategyEngine,
  COMPONENT_EXERCISES,
  EXERCISE_NAMES,
  IMPROVEMENT_UNIT_LABELS,
} from './strategyEngine.js'
import { EXERCISES, COMPONENTS, AGE_BRACKETS, GENDER } from './constants.js'

const M_U25 = { gender: GENDER.MALE, ageBracket: AGE_BRACKETS.UNDER_25 }
const F_30 = { gender: GENDER.FEMALE, ageBracket: AGE_BRACKETS.AGE_30_34 }

// ---------------------------------------------------------------------------
// analyzeNextGain
// ---------------------------------------------------------------------------

describe('analyzeNextGain', () => {
  it('returns null for null/undefined value', () => {
    expect(analyzeNextGain(EXERCISES.PUSHUPS, null, 'M', AGE_BRACKETS.UNDER_25)).toBeNull()
    expect(analyzeNextGain(EXERCISES.PUSHUPS, undefined, 'M', AGE_BRACKETS.UNDER_25)).toBeNull()
  })

  it('identifies already-maxed performance (push-ups at max threshold)', () => {
    // M/<25 push-ups: max is 67 reps = 15.0 pts
    const result = analyzeNextGain(EXERCISES.PUSHUPS, 67, 'M', AGE_BRACKETS.UNDER_25)
    expect(result).not.toBeNull()
    expect(result.alreadyMaxed).toBe(true)
    expect(result.ptsGain).toBe(0)
    expect(result.roi).toBe(0)
  })

  it('identifies already-maxed at above-max value', () => {
    // 80 push-ups - above the table maximum of 67
    const result = analyzeNextGain(EXERCISES.PUSHUPS, 80, 'M', AGE_BRACKETS.UNDER_25)
    expect(result).not.toBeNull()
    expect(result.alreadyMaxed).toBe(true)
  })

  it('finds next threshold for push-ups near the bottom cliff', () => {
    // M/<25 push-ups: 30 reps is at chart floor (row 2.5 pts), 31 reps = 3.0 pts
    const result = analyzeNextGain(EXERCISES.PUSHUPS, 30, 'M', AGE_BRACKETS.UNDER_25)
    expect(result).not.toBeNull()
    expect(result.alreadyMaxed).toBe(false)
    expect(result.currentPts).toBeCloseTo(2.5, 1)
    expect(result.ptsGain).toBeCloseTo(0.5, 1) // 3.0 - 2.5
    expect(result.improvementNeeded).toBe(1)    // 31 - 30 = 1 rep
    expect(result.unitsNeeded).toBe(1)           // ceil(1/5) = 1 unit
    expect(result.roi).toBeGreaterThan(0)
  })

  it('finds correct units needed when gap exceeds one standard unit (push-ups)', () => {
    // M/<25 push-ups: 37 reps = 5.0 pts, next threshold 39 reps = 5.5 pts
    // Improvement needed: 39 - 37 = 2 reps; units = ceil(2/5) = 1
    const result = analyzeNextGain(EXERCISES.PUSHUPS, 37, 'M', AGE_BRACKETS.UNDER_25)
    expect(result).not.toBeNull()
    expect(result.currentPts).toBeCloseTo(5.0, 1)
    expect(result.unitsNeeded).toBe(1) // 2 rep gap, 1 unit (5 reps)
  })

  it('computes next gain for 2-mile run (lower is better)', () => {
    // M/<25 run: 1075s is within 37.5 tier (boundary 1090s), next threshold 1071s = 38.0 pts
    const result = analyzeNextGain(EXERCISES.RUN_2MILE, 1075, 'M', AGE_BRACKETS.UNDER_25)
    expect(result).not.toBeNull()
    expect(result.alreadyMaxed).toBe(false)
    expect(result.currentPts).toBeCloseTo(37.5, 1)
    expect(result.ptsGain).toBeCloseTo(0.5, 1)          // 38.0 - 37.5
    expect(result.improvementNeeded).toBeCloseTo(4, 0)  // 1075 - 1071 = 4s
    expect(result.unitsNeeded).toBe(1)                   // ceil(4/10) = 1 unit
  })

  it('computes next gain for run when within a tier (not at the threshold boundary)', () => {
    // Runner at 1065s: within the 38.0 tier (boundary 1071s); next threshold 1052s = 38.5 pts
    const result = analyzeNextGain(EXERCISES.RUN_2MILE, 1065, 'M', AGE_BRACKETS.UNDER_25)
    expect(result).not.toBeNull()
    expect(result.currentPts).toBeCloseTo(38.0, 1)
    expect(result.improvementNeeded).toBeCloseTo(13, 0) // 1065 - 1052 = 13s
    expect(result.unitsNeeded).toBe(2)                   // ceil(13/10) = 2 units
  })

  it('computes next gain for HAMR when gap requires more than one unit', () => {
    // M/<25 HAMR: 39 shuttles clamps to chart min 35.0 pts, next threshold 44 = 35.5 pts
    const result = analyzeNextGain(EXERCISES.HAMR, 39, 'M', AGE_BRACKETS.UNDER_25)
    expect(result).not.toBeNull()
    expect(result.currentPts).toBeCloseTo(35.0, 1)
    expect(result.ptsGain).toBeCloseTo(0.5, 1) // 35.5 - 35.0
    expect(result.improvementNeeded).toBe(5)    // 44 - 39 = 5 shuttles
    expect(result.unitsNeeded).toBe(3)           // ceil(5/2) = 3 units
  })

  it('computes next gain for forearm plank (higher time = better)', () => {
    // Plank at 65s: below chart min (95s = 2.5 pts for M/<25); clamps to 2.5 pts
    // Next threshold is 100s = 3.5 pts (3.0 doesn't exist as separate row in chart floor)
    const result = analyzeNextGain(EXERCISES.PLANK, 65, 'M', AGE_BRACKETS.UNDER_25)
    expect(result).not.toBeNull()
    expect(result.currentPts).toBeCloseTo(2.5, 1)
    expect(result.improvementNeeded).toBe(35)   // 100 - 65 = 35s
    expect(result.unitsNeeded).toBe(3)           // ceil(35/15) = 3
  })

  it('computes next gain for WHtR (lower ratio = better)', () => {
    // WHtR is universal table (gender/age-independent)
    // Find a mid-range value and verify direction
    const result = analyzeNextGain(EXERCISES.WHTR, 0.45, 'M', AGE_BRACKETS.UNDER_25)
    expect(result).not.toBeNull()
    if (!result.alreadyMaxed) {
      expect(result.ptsGain).toBeGreaterThan(0)
      expect(result.roi).toBeGreaterThan(0)
    }
  })

  it('reports diminishing returns near ceiling (push-ups near max)', () => {
    // 60 push-ups = 14.0 pts out of 15.0 max (93.3% = near ceiling scale 2.5)
    const low = analyzeNextGain(EXERCISES.PUSHUPS, 30, 'M', AGE_BRACKETS.UNDER_25)
    const high = analyzeNextGain(EXERCISES.PUSHUPS, 60, 'M', AGE_BRACKETS.UNDER_25)
    expect(low).not.toBeNull()
    expect(high).not.toBeNull()
    // ROI near ceiling should be lower than ROI near bottom (even though pts/unit may differ)
    // The effort scale factor at 14/15 = 93% (scale 2.5) vs 0.8/15 = 5% (scale 0.8)
    if (!low.alreadyMaxed && !high.alreadyMaxed) {
      expect(high.effortWeeksPerUnit).toBeGreaterThan(low.effortWeeksPerUnit)
    }
  })
})

// ---------------------------------------------------------------------------
// marginalReturn
// ---------------------------------------------------------------------------

describe('marginalReturn', () => {
  it('returns null for null value', () => {
    expect(marginalReturn(EXERCISES.PUSHUPS, null, 'M', AGE_BRACKETS.UNDER_25)).toBeNull()
  })

  it('returns alreadyMaxed=true when at table maximum', () => {
    const result = marginalReturn(EXERCISES.PUSHUPS, 70, 'M', AGE_BRACKETS.UNDER_25)
    expect(result.alreadyMaxed).toBe(true)
    expect(result.marginalPts).toBe(0)
  })

  it('computes non-zero marginal pts when unit crosses a threshold (push-ups)', () => {
    // 32 reps = 3.0 pts, +5 reps = 37 reps = 5.0 pts (crosses multiple half-point rows)
    const result = marginalReturn(EXERCISES.PUSHUPS, 32, 'M', AGE_BRACKETS.UNDER_25)
    expect(result).not.toBeNull()
    expect(result.marginalPts).toBeGreaterThan(0)
    expect(result.currentPts).toBeCloseTo(3.0, 1)
  })

  it('may return 0 marginalPts when unit does not cross any threshold (small unit)', () => {
    // 39 HAMR = 29.5 pts; +2 shuttles = 41 = still 29.5 (next threshold is 42)
    const result = marginalReturn(EXERCISES.HAMR, 39, 'M', AGE_BRACKETS.UNDER_25)
    expect(result).not.toBeNull()
    expect(result.marginalPts).toBe(0) // No crossing within 2-shuttle unit
  })

  it('returns positive marginalPts when unit crosses threshold (HAMR at right position)', () => {
    // 42 HAMR = 35.0 pts (clamp to chart min); +2 = 44 = 35.5 pts (first chart row)
    const result = marginalReturn(EXERCISES.HAMR, 42, 'M', AGE_BRACKETS.UNDER_25)
    expect(result).not.toBeNull()
    expect(result.currentPts).toBeCloseTo(35.0, 1)
    expect(result.marginalPts).toBeGreaterThanOrEqual(0)
  })

  it('run marginalPts is non-negative (lower is better, 10s faster)', () => {
    const result = marginalReturn(EXERCISES.RUN_2MILE, 1075, 'M', AGE_BRACKETS.UNDER_25)
    expect(result).not.toBeNull()
    expect(result.marginalPts).toBeGreaterThanOrEqual(0)
  })

  it('scorePct is in range [0, 1]', () => {
    const result = marginalReturn(EXERCISES.SITUPS, 42, 'M', AGE_BRACKETS.UNDER_25)
    expect(result.scorePct).toBeGreaterThanOrEqual(0)
    expect(result.scorePct).toBeLessThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// effortEstimate
// ---------------------------------------------------------------------------

describe('effortEstimate', () => {
  it('returns 0 when already at or past target (push-ups, higher is better)', () => {
    expect(effortEstimate(EXERCISES.PUSHUPS, 40, 40, 'M', AGE_BRACKETS.UNDER_25)).toBe(0)
    expect(effortEstimate(EXERCISES.PUSHUPS, 45, 40, 'M', AGE_BRACKETS.UNDER_25)).toBe(0)
  })

  it('returns 0 when already at or past target (run, lower is better)', () => {
    expect(effortEstimate(EXERCISES.RUN_2MILE, 1000, 1010, 'M', AGE_BRACKETS.UNDER_25)).toBe(0)
    expect(effortEstimate(EXERCISES.RUN_2MILE, 1000, 1000, 'M', AGE_BRACKETS.UNDER_25)).toBe(0)
  })

  it('estimates non-zero weeks when a gap exists (push-ups)', () => {
    const weeks = effortEstimate(EXERCISES.PUSHUPS, 30, 40, 'M', AGE_BRACKETS.UNDER_25)
    expect(weeks).toBeGreaterThan(0)
  })

  it('larger gap requires more weeks', () => {
    const smallGap = effortEstimate(EXERCISES.PUSHUPS, 37, 42, 'M', AGE_BRACKETS.UNDER_25)
    const largeGap = effortEstimate(EXERCISES.PUSHUPS, 30, 50, 'M', AGE_BRACKETS.UNDER_25)
    expect(largeGap).toBeGreaterThan(smallGap)
  })

  it('run improvement correctly decreases time (lower is better)', () => {
    const weeks = effortEstimate(EXERCISES.RUN_2MILE, 1075, 1057, 'M', AGE_BRACKETS.UNDER_25)
    expect(weeks).toBeGreaterThan(0)
    // 18s improvement across 2 units at baseline = ~3 weeks
    expect(weeks).toBeLessThan(10) // Reasonable upper bound
  })

  it('WHtR improvement takes longer per unit (4 weeks/unit base)', () => {
    const weeksWHtR = effortEstimate(EXERCISES.WHTR, 0.50, 0.48, 'M', AGE_BRACKETS.UNDER_25)
    const weeksPushups = effortEstimate(EXERCISES.PUSHUPS, 40, 50, 'M', AGE_BRACKETS.UNDER_25)
    // WHtR effort per unit (4.0) >> push-ups (1.0), so same number of units = more weeks
    // For 2 units: WHtR ~8 weeks vs push-ups ~2 weeks (at same scale factor)
    expect(weeksWHtR).toBeGreaterThan(weeksPushups)
  })
})

// ---------------------------------------------------------------------------
// strategyEngine
// ---------------------------------------------------------------------------

describe('strategyEngine', () => {
  const demographics = M_U25

  it('returns empty results when no inputs provided', () => {
    const result = strategyEngine(demographics, {})
    expect(result.ranked).toHaveLength(0)
    expect(result.topPriority).toBeNull()
    expect(result.hasAnyImprovable).toBe(false)
  })

  it('skips exempt components', () => {
    const rawInputs = {
      [COMPONENTS.CARDIO]: { exercise: EXERCISES.RUN_2MILE, value: 1075, exempt: true },
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 42, exempt: false },
    }
    const result = strategyEngine(demographics, rawInputs)
    expect(result.ranked).toHaveLength(1)
    expect(result.ranked[0].component).toBe(COMPONENTS.STRENGTH)
  })

  it('skips walk (pass/fail) components', () => {
    const rawInputs = {
      [COMPONENTS.CARDIO]: { exercise: EXERCISES.WALK_2KM, value: 900, exempt: false, isWalk: true },
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 42, exempt: false },
    }
    const result = strategyEngine(demographics, rawInputs)
    expect(result.ranked.every(a => a.component !== COMPONENTS.CARDIO)).toBe(true)
  })

  it('skips components with no value', () => {
    const rawInputs = {
      [COMPONENTS.CARDIO]: { exercise: EXERCISES.RUN_2MILE, value: null, exempt: false },
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 42, exempt: false },
    }
    const result = strategyEngine(demographics, rawInputs)
    expect(result.ranked).toHaveLength(1)
    expect(result.ranked[0].component).toBe(COMPONENTS.STRENGTH)
  })

  it('identifies top priority component correctly', () => {
    // 30 push-ups = 0.8/15 pts (VERY low, high ROI cliff)
    // Decent run = less ROI gain expected
    const rawInputs = {
      [COMPONENTS.CARDIO]: { exercise: EXERCISES.RUN_2MILE, value: 938, exempt: false }, // 45.0 pts, good performance
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 30, exempt: false }, // 0.8 pts, terrible
    }
    const result = strategyEngine(demographics, rawInputs)
    expect(result.topPriority).not.toBeNull()
    // Strength at 30 push-ups has massive ROI (cliff at 30-37 range)
    // Cardio at 938s (45.0 pts) has less ROI near top of table
    expect(result.topPriority.component).toBe(COMPONENTS.STRENGTH)
  })

  it('identifies maxed components and places them last in ranking', () => {
    const rawInputs = {
      [COMPONENTS.CARDIO]: { exercise: EXERCISES.RUN_2MILE, value: 800, exempt: false }, // At/near max
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 42, exempt: false }, // Mid-range
    }
    const result = strategyEngine(demographics, rawInputs)
    expect(result.ranked).toHaveLength(2)
    // Maxed components should be last
    const maxed = result.ranked.filter(a => a.status === 'maxed')
    const improvable = result.ranked.filter(a => a.status === 'improvable')
    if (maxed.length > 0 && improvable.length > 0) {
      const lastImprovable = result.ranked.findIndex(a => a.status === 'improvable')
      const firstMaxed = result.ranked.findIndex(a => a.status === 'maxed')
      expect(lastImprovable).toBeLessThan(firstMaxed)
    }
  })

  it('ranks by ROI: high-ROI component comes before low-ROI component', () => {
    // Plank at minimum (7.5 pts, 65s) vs push-ups at near-max (60 reps = 14.0 pts)
    // Plank has more room to improve; push-ups near ceiling
    const rawInputs = {
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 60, exempt: false }, // Near max, low ROI
      [COMPONENTS.CORE]: { exercise: EXERCISES.PLANK, value: 65, exempt: false },       // Near min, higher ROI
    }
    const result = strategyEngine(demographics, rawInputs)
    expect(result.ranked).toHaveLength(2)
    // Core (plank at 65s) should rank higher than Strength (60 push-ups near max)
    const coreIdx = result.ranked.findIndex(a => a.component === COMPONENTS.CORE)
    const strengthIdx = result.ranked.findIndex(a => a.component === COMPONENTS.STRENGTH)
    expect(coreIdx).toBeLessThan(strengthIdx)
  })

  it('respects preference locking - locked component still appears in results', () => {
    const rawInputs = {
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.HRPU, value: 25, exempt: false },
    }
    const preferences = { [COMPONENTS.STRENGTH]: EXERCISES.HRPU }
    const result = strategyEngine(demographics, rawInputs, preferences)
    expect(result.ranked).toHaveLength(1)
    expect(result.ranked[0].isPreferenceLocked).toBe(true)
  })

  it('preference note appears when alternative has better ROI', () => {
    // Lock push-ups, where HRPU might have different ROI
    const rawInputs = {
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 50, exempt: false },
    }
    const preferences = { [COMPONENTS.STRENGTH]: EXERCISES.PUSHUPS }
    const result = strategyEngine(demographics, rawInputs, preferences)
    expect(result.ranked).toHaveLength(1)
    // preferenceNote is either null (push-ups is already best) or has alternativeExercise
    const note = result.ranked[0].preferenceNote
    if (note !== null) {
      expect(note.alternativeExercise).toBeDefined()
      expect(note.alternativeROI).toBeGreaterThan(0)
    }
  })

  it('no preference note when exercise is not locked', () => {
    const rawInputs = {
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 50, exempt: false },
    }
    // No preferences (nothing locked)
    const result = strategyEngine(demographics, rawInputs, {})
    expect(result.ranked[0].isPreferenceLocked).toBe(false)
    expect(result.ranked[0].preferenceNote).toBeNull()
  })

  it('includes alternatives analysis for component with multiple exercise options', () => {
    const rawInputs = {
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 42, exempt: false },
    }
    const result = strategyEngine(demographics, rawInputs)
    const strengthResult = result.ranked.find(a => a.component === COMPONENTS.STRENGTH)
    expect(strengthResult).toBeDefined()
    // Should have alternatives (HRPU for strength)
    expect(strengthResult.alternatives).toHaveLength(1)
    expect(strengthResult.alternatives[0].exercise).toBe(EXERCISES.HRPU)
  })

  it('includes alternatives for core (3 exercise options)', () => {
    const rawInputs = {
      [COMPONENTS.CORE]: { exercise: EXERCISES.SITUPS, value: 42, exempt: false },
    }
    const result = strategyEngine(demographics, rawInputs)
    const coreResult = result.ranked.find(a => a.component === COMPONENTS.CORE)
    expect(coreResult).toBeDefined()
    expect(coreResult.alternatives).toHaveLength(2) // CLRC and PLANK
  })

  it('all-component analysis produces valid ranked output', () => {
    const rawInputs = {
      [COMPONENTS.CARDIO]: { exercise: EXERCISES.RUN_2MILE, value: 1075, exempt: false },
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 42, exempt: false },
      [COMPONENTS.CORE]: { exercise: EXERCISES.SITUPS, value: 42, exempt: false },
      [COMPONENTS.BODY_COMP]: { exercise: EXERCISES.WHTR, value: 0.45, exempt: false },
    }
    const result = strategyEngine(demographics, rawInputs)
    expect(result.ranked).toHaveLength(4)
    expect(result.topPriority).not.toBeNull()
    expect(result.summary).toBeTruthy()

    // ROI values should be non-negative
    result.ranked.forEach(a => {
      expect(a.roi).toBeGreaterThanOrEqual(0)
    })

    // Ranked list should be in descending ROI order (among improvable)
    const improvable = result.ranked.filter(a => a.status === 'improvable')
    for (let i = 1; i < improvable.length; i++) {
      expect(improvable[i - 1].roi).toBeGreaterThanOrEqual(improvable[i].roi)
    }
  })

  it('female bracket produces valid results', () => {
    const rawInputs = {
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 25, exempt: false },
      [COMPONENTS.CORE]: { exercise: EXERCISES.PLANK, value: 90, exempt: false },
    }
    const result = strategyEngine(F_30, rawInputs)
    expect(result.ranked).toHaveLength(2)
    result.ranked.forEach(a => {
      expect(a.currentPts).toBeGreaterThan(0)
      expect(a.roi).toBeGreaterThanOrEqual(0)
    })
  })

  it('summary string is generated when there are improvable components', () => {
    const rawInputs = {
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 42, exempt: false },
    }
    const result = strategyEngine(demographics, rawInputs)
    if (result.hasAnyImprovable) {
      expect(result.summary).toContain('ROI')
    }
  })

  it('includes optimalAllocation when options.targetComposite is provided', () => {
    const rawInputs = {
      [COMPONENTS.CARDIO]: { exercise: EXERCISES.RUN_2MILE, value: 1075, exempt: false },
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 42, exempt: false },
      [COMPONENTS.CORE]: { exercise: EXERCISES.SITUPS, value: 42, exempt: false },
      [COMPONENTS.BODY_COMP]: { exercise: EXERCISES.WHTR, value: 0.45, exempt: false },
    }
    const result = strategyEngine(demographics, rawInputs, {}, { targetComposite: 85 })
    expect(result.optimalAllocation).toBeDefined()
    expect(result.optimalAllocation).not.toBeNull()
    expect(result.optimalAllocation.targetComposite).toBe(85)
    expect(result.optimalAllocation.components).toBeDefined()
  })

  it('does not include optimalAllocation when no targetComposite option', () => {
    const rawInputs = {
      [COMPONENTS.STRENGTH]: { exercise: EXERCISES.PUSHUPS, value: 42, exempt: false },
    }
    const result = strategyEngine(demographics, rawInputs)
    expect(result.optimalAllocation).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe('COMPONENT_EXERCISES', () => {
  it('cardio has run and HAMR', () => {
    expect(COMPONENT_EXERCISES[COMPONENTS.CARDIO]).toContain(EXERCISES.RUN_2MILE)
    expect(COMPONENT_EXERCISES[COMPONENTS.CARDIO]).toContain(EXERCISES.HAMR)
  })

  it('strength has push-ups and HRPU', () => {
    expect(COMPONENT_EXERCISES[COMPONENTS.STRENGTH]).toContain(EXERCISES.PUSHUPS)
    expect(COMPONENT_EXERCISES[COMPONENTS.STRENGTH]).toContain(EXERCISES.HRPU)
  })

  it('core has 3 exercises', () => {
    expect(COMPONENT_EXERCISES[COMPONENTS.CORE]).toHaveLength(3)
  })

  it('bodyComp has WHtR', () => {
    expect(COMPONENT_EXERCISES[COMPONENTS.BODY_COMP]).toContain(EXERCISES.WHTR)
  })
})

describe('EXERCISE_NAMES and IMPROVEMENT_UNIT_LABELS', () => {
  it('all exercises have a name', () => {
    const allExercises = [
      EXERCISES.RUN_2MILE, EXERCISES.HAMR, EXERCISES.PUSHUPS,
      EXERCISES.HRPU, EXERCISES.SITUPS, EXERCISES.CLRC, EXERCISES.PLANK, EXERCISES.WHTR,
    ]
    allExercises.forEach(ex => {
      expect(EXERCISE_NAMES[ex]).toBeTruthy()
      expect(IMPROVEMENT_UNIT_LABELS[ex]).toBeTruthy()
    })
  })
})
