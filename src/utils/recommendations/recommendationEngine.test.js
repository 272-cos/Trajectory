/**
 * Unit tests for recommendationEngine.js - generateWeeklyPlan (Task 9.2)
 * Covers: urgency tiers, session scaling, gap-based priority, time-awareness
 */

import { describe, it, expect } from 'vitest'
import { generateWeeklyPlan, URGENCY_LABELS } from './recommendationEngine.js'
import { EXERCISES, COMPONENTS } from '../scoring/constants.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a target date N weeks from today as ISO string.
 * @param {number} weeks
 */
function weeksFromToday(weeks) {
  const d = new Date()
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().split('T')[0]
}

// Minimal component data fixtures

const FAILING_CARDIO = {
  percentage: 0, // below chart floor (* row) - earns 0 pts, fails component per §3.7.4
  exercise: EXERCISES.RUN_2MILE,
  exempt: false,
}

const MARGINAL_STRENGTH = {
  percentage: 76, // earns points but below 80% strong tier
  exercise: EXERCISES.PUSHUPS,
  exempt: false,
}

const PASSING_CORE = {
  percentage: 85, // well above chart floor
  exercise: EXERCISES.SITUPS,
  exempt: false,
}

const BODY_COMP_DATA = {
  percentage: 55, // BC has no floor minimum per §3.7.1
  exercise: EXERCISES.WHTR,
  exempt: false,
}

// ── Null / guard cases ───────────────────────────────────────────────────────

describe('generateWeeklyPlan - null/guard cases', () => {
  it('returns null when componentData is null', () => {
    expect(generateWeeklyPlan(null, weeksFromToday(8))).toBeNull()
  })

  it('returns null when targetDate is null', () => {
    expect(generateWeeklyPlan({ cardio: FAILING_CARDIO }, null)).toBeNull()
  })

  it('returns null when all components are exempt', () => {
    const data = {
      cardio: { exempt: true },
      strength: { exempt: true },
    }
    expect(generateWeeklyPlan(data, weeksFromToday(8))).toBeNull()
  })

  it('returns null when all components have null percentage', () => {
    const data = {
      cardio: { percentage: null, exercise: EXERCISES.RUN_2MILE, exempt: false },
    }
    expect(generateWeeklyPlan(data, weeksFromToday(8))).toBeNull()
  })
})

// ── Urgency tiers ────────────────────────────────────────────────────────────

describe('generateWeeklyPlan - urgency tiers', () => {
  const data = { cardio: FAILING_CARDIO }

  it('assigns urgent when < 4 weeks to target', () => {
    const plan = generateWeeklyPlan(data, weeksFromToday(2))
    expect(plan.urgency).toBe('urgent')
    expect(plan.urgencyLabel).toBe(URGENCY_LABELS['urgent'])
  })

  it('assigns standard for 4-12 weeks to target', () => {
    const plan = generateWeeklyPlan(data, weeksFromToday(8))
    expect(plan.urgency).toBe('standard')
    expect(plan.urgencyLabel).toBe(URGENCY_LABELS['standard'])
  })

  it('assigns long_term for > 12 weeks to target', () => {
    const plan = generateWeeklyPlan(data, weeksFromToday(20))
    expect(plan.urgency).toBe('long_term')
    expect(plan.urgencyLabel).toBe(URGENCY_LABELS['long_term'])
  })

  it('assigns standard at exactly 4 weeks boundary', () => {
    const plan = generateWeeklyPlan(data, weeksFromToday(4))
    expect(plan.urgency).toBe('standard')
  })

  it('assigns standard at exactly 12 weeks boundary', () => {
    const plan = generateWeeklyPlan(data, weeksFromToday(12))
    expect(plan.urgency).toBe('standard')
  })

  it('assigns long_term at 13 weeks', () => {
    const plan = generateWeeklyPlan(data, weeksFromToday(13))
    expect(plan.urgency).toBe('long_term')
  })
})

// ── Weeks to target ──────────────────────────────────────────────────────────

describe('generateWeeklyPlan - weeksToTarget', () => {
  const data = { cardio: FAILING_CARDIO }

  it('reports correct weeks to target', () => {
    const plan = generateWeeklyPlan(data, weeksFromToday(8))
    expect(plan.weeksToTarget).toBeGreaterThanOrEqual(7)
    expect(plan.weeksToTarget).toBeLessThanOrEqual(9)
  })

  it('clamps weeksToTarget to 0 when target date is in the past', () => {
    const pastDate = '2020-01-01'
    const plan = generateWeeklyPlan(data, pastDate)
    expect(plan.weeksToTarget).toBe(0)
    expect(plan.urgency).toBe('urgent')
  })
})

// ── Priority ordering ────────────────────────────────────────────────────────

describe('generateWeeklyPlan - priority ordering', () => {
  it('places failing component before passing component', () => {
    const data = {
      cardio: FAILING_CARDIO,
      strength: PASSING_CORE,
    }
    const plan = generateWeeklyPlan(data, weeksFromToday(8))
    expect(plan.planItems[0].component).toBe(COMPONENTS.CARDIO)
    expect(plan.planItems[0].isFailing).toBe(true)
  })

  it('orders failing component (0%) before non-failing component', () => {
    const data = {
      cardio: { percentage: 50, exercise: EXERCISES.RUN_2MILE, exempt: false }, // not failing (> 0%)
      strength: { percentage: 0, exercise: EXERCISES.PUSHUPS, exempt: false }, // failing (0 pts)
    }
    const plan = generateWeeklyPlan(data, weeksFromToday(8))
    // strength is failing (isFailing:true) and must be sorted before non-failing cardio
    expect(plan.planItems[0].component).toBe(COMPONENTS.STRENGTH)
    expect(plan.planItems[0].isFailing).toBe(true)
  })

  it('assigns correct priorityRank values', () => {
    const data = {
      cardio: FAILING_CARDIO,
      strength: MARGINAL_STRENGTH,
      core: PASSING_CORE,
    }
    const plan = generateWeeklyPlan(data, weeksFromToday(8))
    const ranks = plan.planItems.map(p => p.priorityRank)
    expect(ranks).toEqual([1, 2, 3])
  })
})

// ── Session counts ───────────────────────────────────────────────────────────

describe('generateWeeklyPlan - session counts', () => {
  it('gives more sessions per week for failing component (0%) than passing in urgent mode', () => {
    // §3.7.4: a component at 0% (below chart floor) gets gapBelowMin=100 -> max frequency
    const failing = { percentage: 0, exercise: EXERCISES.RUN_2MILE, exempt: false }
    const passing = { percentage: 60, exercise: EXERCISES.RUN_2MILE, exempt: false }

    const planFailing = generateWeeklyPlan({ cardio: failing }, weeksFromToday(2))
    const planPassing = generateWeeklyPlan({ cardio: passing }, weeksFromToday(2))

    expect(planFailing.planItems[0].sessionsPerWeek).toBeGreaterThan(
      planPassing.planItems[0].sessionsPerWeek
    )
  })

  it('body comp component returns 0 sessions per week (daily habits)', () => {
    const plan = generateWeeklyPlan({ bodyComp: BODY_COMP_DATA }, weeksFromToday(8))
    expect(plan.planItems[0].sessionsPerWeek).toBe(0)
  })

  it('strength sessions per week never exceed 3', () => {
    const failing = { percentage: 20, exercise: EXERCISES.PUSHUPS, exempt: false }
    const plan = generateWeeklyPlan({ strength: failing }, weeksFromToday(2))
    expect(plan.planItems[0].sessionsPerWeek).toBeLessThanOrEqual(3)
  })

  it('core sessions per week never exceed 3', () => {
    const failing = { percentage: 20, exercise: EXERCISES.SITUPS, exempt: false }
    const plan = generateWeeklyPlan({ core: failing }, weeksFromToday(2))
    expect(plan.planItems[0].sessionsPerWeek).toBeLessThanOrEqual(3)
  })

  it('cardio sessions per week never exceed 5', () => {
    const failing = { percentage: 20, exercise: EXERCISES.RUN_2MILE, exempt: false }
    const plan = generateWeeklyPlan({ cardio: failing }, weeksFromToday(2))
    expect(plan.planItems[0].sessionsPerWeek).toBeLessThanOrEqual(5)
  })
})

// ── Workout content ──────────────────────────────────────────────────────────

describe('generateWeeklyPlan - workout content', () => {
  it('returns non-empty workouts array for each plan item', () => {
    const data = {
      cardio: FAILING_CARDIO,
      strength: MARGINAL_STRENGTH,
    }
    const plan = generateWeeklyPlan(data, weeksFromToday(8))
    for (const item of plan.planItems) {
      expect(Array.isArray(item.workouts)).toBe(true)
      expect(item.workouts.length).toBeGreaterThan(0)
    }
  })

  it('returns different workout descriptions for urgent vs long_term', () => {
    const data = { cardio: FAILING_CARDIO }
    const urgentPlan = generateWeeklyPlan(data, weeksFromToday(2))
    const longPlan = generateWeeklyPlan(data, weeksFromToday(20))

    const urgentWorkouts = urgentPlan.planItems[0].workouts.join(' ')
    const longWorkouts = longPlan.planItems[0].workouts.join(' ')

    expect(urgentWorkouts).not.toBe(longWorkouts)
  })

  it('HAMR exercise uses HAMR-specific workouts', () => {
    const data = {
      cardio: { percentage: 60, exercise: EXERCISES.HAMR, exempt: false },
    }
    const plan = generateWeeklyPlan(data, weeksFromToday(8))
    const workouts = plan.planItems[0].workouts.join(' ').toLowerCase()
    // Should contain HAMR or shuttle or sprint related content
    expect(workouts).toMatch(/shuttle|sprint|hamr|agility/i)
  })

  it('plank exercise uses plank-specific workouts', () => {
    const data = {
      core: { percentage: 55, exercise: EXERCISES.PLANK, exempt: false },
    }
    const plan = generateWeeklyPlan(data, weeksFromToday(8))
    const workouts = plan.planItems[0].workouts.join(' ').toLowerCase()
    expect(workouts).toMatch(/plank|hold/i)
  })
})

// ── Plan structure ───────────────────────────────────────────────────────────

describe('generateWeeklyPlan - plan structure', () => {
  it('returns expected top-level fields', () => {
    const plan = generateWeeklyPlan({ cardio: FAILING_CARDIO }, weeksFromToday(8))
    expect(plan).toHaveProperty('weeksToTarget')
    expect(plan).toHaveProperty('urgency')
    expect(plan).toHaveProperty('urgencyLabel')
    expect(plan).toHaveProperty('planItems')
    expect(plan).toHaveProperty('restNote')
    expect(Array.isArray(plan.planItems)).toBe(true)
  })

  it('each plan item has required fields', () => {
    const data = { cardio: FAILING_CARDIO, strength: MARGINAL_STRENGTH }
    const plan = generateWeeklyPlan(data, weeksFromToday(8))
    for (const item of plan.planItems) {
      expect(item).toHaveProperty('component')
      expect(item).toHaveProperty('exercise')
      expect(item).toHaveProperty('percentage')
      expect(item).toHaveProperty('isFailing')
      expect(item).toHaveProperty('gapBelowMin')
      expect(item).toHaveProperty('tier')
      expect(item).toHaveProperty('sessionsPerWeek')
      expect(item).toHaveProperty('workouts')
      expect(item).toHaveProperty('priorityRank')
    }
  })

  it('includes a rest day note', () => {
    const plan = generateWeeklyPlan({ cardio: FAILING_CARDIO }, weeksFromToday(8))
    expect(typeof plan.restNote).toBe('string')
    expect(plan.restNote.length).toBeGreaterThan(10)
  })

  it('skips exempt components', () => {
    const data = {
      cardio: { exempt: true },
      strength: MARGINAL_STRENGTH,
    }
    const plan = generateWeeklyPlan(data, weeksFromToday(8))
    const components = plan.planItems.map(p => p.component)
    expect(components).not.toContain(COMPONENTS.CARDIO)
    expect(components).toContain(COMPONENTS.STRENGTH)
  })
})

// ── isFailing flag ───────────────────────────────────────────────────────────
// §3.7.4: isFailing is true only when the component is in COMPONENTS_WITH_CHART_FLOOR_MINIMUM
// AND percentage === 0 (below the * row, 0 pts scored).
// §3.7.1: Body Comp has no floor minimum, so isFailing is always false for BC.

describe('generateWeeklyPlan - isFailing flag', () => {
  it('flags component at 0% (below chart floor, 0 pts) as failing per §3.7.4', () => {
    const data = { cardio: { percentage: 0, exercise: EXERCISES.RUN_2MILE, exempt: false } }
    const plan = generateWeeklyPlan(data, weeksFromToday(8))
    expect(plan.planItems[0].isFailing).toBe(true)
  })

  it('does not flag component above 0% as failing (any pts scored = floor passed)', () => {
    const data = { cardio: { percentage: 60, exercise: EXERCISES.RUN_2MILE, exempt: false } }
    const plan = generateWeeklyPlan(data, weeksFromToday(8))
    expect(plan.planItems[0].isFailing).toBe(false)
  })

  it('body comp never fails component floor per DAFMAN §3.7.1', () => {
    // BC has no per-component minimum - any WHtR score passes the component floor
    const data = { bodyComp: { percentage: 0, exercise: EXERCISES.WHTR, exempt: false } }
    const plan = generateWeeklyPlan(data, weeksFromToday(8))
    expect(plan.planItems[0].isFailing).toBe(false)
  })
})
