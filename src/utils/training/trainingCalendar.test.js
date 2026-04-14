/**
 * Training Calendar tests
 *
 * Validates: dynamic phase boundaries, PI Workout dates, fractional test dates,
 * mock test date, taper period bounds, and regression tests for the fixed-16-week bug.
 */

import { describe, it, expect } from 'vitest'
import {
  generateCalendar,
  EVENT_TYPES,
  detectPhase,
  PHASES,
  shouldUsePhase0,
  daysBetween,
  hasConsecutiveDays,
  computePhaseBoundaries,
  getProgressionRatio,
  getPhaseFromRatio,
} from './trainingCalendar.js'

// ── Helper ─────────────────────────────────────────────────────────────────────

const baseDemographics = { gender: 'M', dob: '1995-06-15', ageBracket: '25-29' }
const baseScores = { composite: 78, cardio: 80, strength: 75, core: 70, bodyComp: 85 }

function collectEventsByType(calendar, type) {
  const results = []
  for (const [date, events] of Object.entries(calendar.eventsByDate)) {
    for (const evt of events) {
      if (evt.type === type) {
        results.push({ ...evt, date })
      }
    }
  }
  return results.sort((a, b) => a.date.localeCompare(b.date))
}

// ── computePhaseBoundaries ────────────────────────────────────────────────────

describe('computePhaseBoundaries', () => {
  it('16-week plan matches reference distribution', () => {
    const b = computePhaseBoundaries(16)
    expect(b.phases[0].weeks).toBe(4)  // BASE
    expect(b.phases[1].weeks).toBe(4)  // BUILD
    expect(b.phases[2].weeks).toBe(5)  // BUILD_PLUS
    expect(b.phases[3].weeks).toBe(3)  // SHARPEN
    expect(b.phases[0].weeks + b.phases[1].weeks + b.phases[2].weeks + b.phases[3].weeks).toBe(16)
  })

  it('24-week plan expands BASE and BUILD, not SHARPEN', () => {
    const b = computePhaseBoundaries(24)
    expect(b.phases[0].weeks).toBeGreaterThan(4) // BASE expanded
    expect(b.phases[1].weeks).toBeGreaterThanOrEqual(4) // BUILD expanded or same
    expect(b.phases[2].weeks).toBe(5) // BUILD_PLUS stays at reference
    expect(b.phases[3].weeks).toBe(3) // SHARPEN stays at reference
  })

  it('10-week plan: all phases have at least 1 week', () => {
    const b = computePhaseBoundaries(10)
    expect(b.phases.every(p => p.weeks >= 1)).toBe(true)
    expect(b.phases[0].weeks + b.phases[1].weeks + b.phases[2].weeks + b.phases[3].weeks).toBe(10)
  })

  it('6-week plan: SHARPEN is at least 2 weeks', () => {
    const b = computePhaseBoundaries(6)
    expect(b.phases[3].weeks).toBeGreaterThanOrEqual(2)
    expect(b.phases.every(p => p.weeks >= 1)).toBe(true)
  })

  it('4-week plan: all phases get 1 week', () => {
    const b = computePhaseBoundaries(4)
    expect(b.phases.every(p => p.weeks >= 1)).toBe(true)
  })

  it('phase ratios are cumulative from 0 to 1', () => {
    for (const weeks of [4, 6, 10, 16, 20, 24, 30]) {
      const b = computePhaseBoundaries(weeks)
      expect(b.phases[0].startRatio).toBe(0)
      expect(b.phases[3].endRatio).toBe(1)
      for (let i = 1; i < b.phases.length; i++) {
        expect(b.phases[i].startRatio).toBeCloseTo(b.phases[i - 1].endRatio, 10)
      }
    }
  })
})

// ── getProgressionRatio ──────────────────────────────────────────────────────

describe('getProgressionRatio', () => {
  it('returns 0 at start, 1 at end', () => {
    expect(getProgressionRatio(16, 16)).toBe(0)
    expect(getProgressionRatio(0, 16)).toBe(1)
  })

  it('returns 0.5 at midpoint', () => {
    expect(getProgressionRatio(8, 16)).toBe(0.5)
  })

  it('clamps to [0, 1]', () => {
    expect(getProgressionRatio(20, 16)).toBe(0) // more weeks remaining than total
    expect(getProgressionRatio(-2, 16)).toBe(1) // negative weeks remaining
  })
})

// ── getPhaseFromRatio ─────────────────────────────────────────────────────────

describe('getPhaseFromRatio', () => {
  it('ratio 0 returns BASE', () => {
    expect(getPhaseFromRatio(0, 16)).toBe('BASE')
  })

  it('ratio 1 returns SHARPEN', () => {
    expect(getPhaseFromRatio(1, 16)).toBe('SHARPEN')
  })

  it('phases progress through all 4 for a 16-week plan', () => {
    const phases = new Set()
    for (let r = 0; r <= 1; r += 0.05) {
      phases.add(getPhaseFromRatio(r, 16))
    }
    expect(phases.has('BASE')).toBe(true)
    expect(phases.has('BUILD')).toBe(true)
    expect(phases.has('BUILD_PLUS')).toBe(true)
    expect(phases.has('SHARPEN')).toBe(true)
  })
})

// ── detectPhase ────────────────────────────────────────────────────────────────

describe('detectPhase', () => {
  it('returns Phase 1 at the start of a 16-week plan', () => {
    expect(detectPhase(16, { totalWeeks: 16 })).toBe(PHASES.PHASE_1)
  })

  it('returns Phase 4 near the end of a plan', () => {
    expect(detectPhase(1, { totalWeeks: 16 })).toBe(PHASES.PHASE_4)
    expect(detectPhase(0, { totalWeeks: 16 })).toBe(PHASES.PHASE_4)
  })

  it('returns Phase 0 when forcePhase0 is true and enough time remains', () => {
    expect(detectPhase(20, { forcePhase0: true, totalWeeks: 20 })).toBe(PHASES.PHASE_0)
  })

  it('uses normal phase progression when forcePhase0 is true but not enough time', () => {
    // For a 10-week plan, BASE is only ~2 weeks, so near the end Phase 0 should not apply
    expect(detectPhase(1, { forcePhase0: true, totalWeeks: 10 })).toBe(PHASES.PHASE_4)
  })

  it('progresses through all phases for a 24-week plan', () => {
    const phases = new Set()
    for (let w = 24; w >= 0; w--) {
      phases.add(detectPhase(w, { totalWeeks: 24 }))
    }
    expect(phases.has(PHASES.PHASE_1)).toBe(true) // BASE
    expect(phases.has(PHASES.PHASE_2)).toBe(true) // BUILD
    expect(phases.has(PHASES.PHASE_3)).toBe(true) // BUILD_PLUS
    expect(phases.has(PHASES.PHASE_4)).toBe(true) // SHARPEN
  })
})

// ── shouldUsePhase0 ────────────────────────────────────────────────────────────

describe('shouldUsePhase0', () => {
  it('returns false when composite is null (no data - use normal phase progression)', () => {
    expect(shouldUsePhase0(null, null)).toBe(false)
  })

  it('returns true when composite < 50', () => {
    expect(shouldUsePhase0(45, 10)).toBe(true)
  })

  it('returns true when PI push-ups < 5', () => {
    expect(shouldUsePhase0(60, 3)).toBe(true)
  })

  it('returns false when composite >= 50 and push-ups >= 5', () => {
    expect(shouldUsePhase0(65, 10)).toBe(false)
  })
})

// ── daysBetween ────────────────────────────────────────────────────────────────

describe('daysBetween', () => {
  it('returns correct day count between two dates', () => {
    expect(daysBetween('2026-03-01', '2026-03-15')).toBe(14)
    expect(daysBetween('2026-06-01', '2026-09-01')).toBe(92)
  })

  it('returns 0 for same date', () => {
    expect(daysBetween('2026-07-01', '2026-07-01')).toBe(0)
  })
})

// ── hasConsecutiveDays ─────────────────────────────────────────────────────────

describe('hasConsecutiveDays', () => {
  it('detects adjacent days', () => {
    expect(hasConsecutiveDays([1, 2, 4])).toBe(true)
    expect(hasConsecutiveDays([2, 4, 6])).toBe(false)
  })

  it('detects Sunday-Saturday wrap', () => {
    expect(hasConsecutiveDays([0, 6])).toBe(true)
  })
})

// ── generateCalendar ───────────────────────────────────────────────────────────

describe('generateCalendar', () => {
  it('places mock test 14 days before target', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-01', baseScores, '2026-03-22')
    expect(cal.mockTestDate).toBe('2026-08-18')
    const mockEvents = collectEventsByType(cal, EVENT_TYPES.MOCK_TEST)
    expect(mockEvents.length).toBe(1)
    expect(mockEvents[0].date).toBe('2026-08-18')
  })

  it('places taper period from -14 days to -1 day before target', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-01', baseScores, '2026-03-22')
    const taperEvents = collectEventsByType(cal, EVENT_TYPES.TAPER)
    expect(taperEvents.length).toBeGreaterThanOrEqual(10)
    for (const evt of taperEvents) {
      expect(evt.date >= cal.taperStart).toBe(true)
      expect(evt.date < '2026-09-01').toBe(true)
    }
  })

  it('places test day event on the target date', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-01', baseScores, '2026-03-22')
    const testDayEvents = collectEventsByType(cal, EVENT_TYPES.TEST_DAY)
    expect(testDayEvents.length).toBe(1)
    expect(testDayEvents[0].date).toBe('2026-09-01')
  })

  it('places two fractional tests (50% and 75%)', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-01', baseScores, '2026-03-22')
    const fracTests = collectEventsByType(cal, EVENT_TYPES.FRACTIONAL_TEST)
    expect(fracTests.length).toBe(2)
    const fractions = fracTests.map(ft => ft.fraction).sort()
    expect(fractions).toEqual([0.5, 0.75])
    // 50% test should come before 75% test
    expect(fracTests.find(f => f.fraction === 0.5).date < fracTests.find(f => f.fraction === 0.75).date).toBe(true)
  })

  it('places BASELINE_PI events in the first week (Monday start)', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-01', baseScores, '2026-03-23')
    const baselineEvents = collectEventsByType(cal, EVENT_TYPES.BASELINE_PI)
    expect(baselineEvents.length).toBeGreaterThanOrEqual(2)
    for (const evt of baselineEvents) {
      expect(evt.date >= '2026-03-23').toBe(true)
      expect(evt.date <= '2026-03-29').toBe(true)
    }
  })

  it('places BASELINE_PI events on first two future training days when starting mid-week', () => {
    // Thursday start: Mon/Wed preferred days are already past, so baselines must land
    // on the next available future training days (not be silently dropped).
    const thursdayStart = '2026-04-09' // Thursday
    const preferredDays = [1, 3, 5] // Mon/Wed/Fri
    const cal = generateCalendar(
      baseDemographics, '2026-09-01', baseScores, thursdayStart,
      { preferredDays },
    )
    const baselineEvents = collectEventsByType(cal, EVENT_TYPES.BASELINE_PI)
    expect(baselineEvents.length).toBeGreaterThanOrEqual(2)
    // All baselines must be on or after today (never in the past)
    for (const evt of baselineEvents) {
      expect(evt.date >= thursdayStart).toBe(true)
    }
    // The two baselines must be on consecutive training days (Fri this week, Mon next)
    const sortedDates = baselineEvents.map(e => e.date).sort()
    expect(sortedDates[0]).toBe('2026-04-10') // Friday
    expect(sortedDates[1]).toBe('2026-04-13') // Monday
  })

  it('places FOUNDATION_CHECKIN events', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-01', baseScores, '2026-03-22')
    const checkinEvents = collectEventsByType(cal, EVENT_TYPES.FOUNDATION_CHECKIN)
    expect(checkinEvents.length).toBeGreaterThanOrEqual(2)
  })

  it('generates PI workout events', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-01', baseScores, '2026-03-22')
    const piEvents = collectEventsByType(cal, EVENT_TYPES.PI_WORKOUT)
    expect(piEvents.length).toBeGreaterThanOrEqual(3)
  })

  it('omits mock test if today is past mock test date', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-01', baseScores, '2026-08-25')
    expect(cal.mockTestDate).toBeNull()
  })

  it('returns Phase 0 for very low composite', () => {
    const lowScores = { composite: 30, cardio: 20, strength: 25, core: 30, bodyComp: 45 }
    const cal = generateCalendar(baseDemographics, '2026-09-01', lowScores, '2026-03-22')
    expect(cal.isPhase0).toBe(true)
  })

  it('returns correct total days and weeks', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-01', baseScores, '2026-03-22')
    expect(cal.totalDays).toBe(163)
    expect(cal.totalWeeks).toBe(23)
  })

  it('includes phaseBoundaries in output', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-01', baseScores, '2026-03-22')
    expect(cal.phaseBoundaries).toBeDefined()
    expect(cal.phaseBoundaries.phases).toHaveLength(4)
  })
})

// ── Dynamic plan duration (regression tests for fixed-16-week bug) ───────────

describe('dynamic plan duration', () => {
  it('24-week plan: user progresses past BASE before halfway', () => {
    // Start ~24 weeks before target
    const cal = generateCalendar(baseDemographics, '2026-09-15', baseScores, '2026-03-31')
    const halfwayWeek = Math.ceil(cal.weeks.length / 2)
    const secondHalfWeeks = cal.weeks.filter(w => w.weekNumber > halfwayWeek)
    const secondHalfPhases = new Set(secondHalfWeeks.map(w => w.phaseName).filter(Boolean))
    // By the second half, should not be in BASE anymore
    expect(secondHalfPhases.has('BASE')).toBe(false)
  })

  it('24-week plan: all four phases are represented', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-15', baseScores, '2026-03-31')
    const phaseNames = new Set(cal.weeks.map(w => w.phaseName).filter(Boolean))
    expect(phaseNames.has('BASE')).toBe(true)
    expect(phaseNames.has('BUILD')).toBe(true)
    expect(phaseNames.has('BUILD_PLUS')).toBe(true)
    expect(phaseNames.has('SHARPEN')).toBe(true)
  })

  it('10-week plan: all four phases are represented', () => {
    // ~10 weeks out
    const cal = generateCalendar(baseDemographics, '2026-06-09', baseScores, '2026-03-31')
    const phaseNames = new Set(cal.weeks.map(w => w.phaseName).filter(Boolean))
    expect(phaseNames.has('BASE')).toBe(true)
    expect(phaseNames.has('BUILD')).toBe(true)
    expect(phaseNames.has('BUILD_PLUS')).toBe(true)
    expect(phaseNames.has('SHARPEN')).toBe(true)
  })

  it('6-week plan: SHARPEN phase appears', () => {
    const cal = generateCalendar(baseDemographics, '2026-05-12', baseScores, '2026-03-31')
    const sharpenWeeks = cal.weeks.filter(w => w.phaseName === 'SHARPEN')
    expect(sharpenWeeks.length).toBeGreaterThanOrEqual(1)
  })

  it('weeks have progressionRatio that increases over time', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-01', baseScores, '2026-03-22')
    for (let i = 1; i < cal.weeks.length; i++) {
      expect(cal.weeks[i].progressionRatio).toBeGreaterThanOrEqual(cal.weeks[i - 1].progressionRatio)
    }
  })

  it('fractional tests are placed at ratio milestones for 24-week plan', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-15', baseScores, '2026-03-31')
    const fracTests = collectEventsByType(cal, EVENT_TYPES.FRACTIONAL_TEST)
    expect(fracTests.length).toBe(2)
    expect(fracTests.find(f => f.fraction === 0.5)).toBeDefined()
    expect(fracTests.find(f => f.fraction === 0.75)).toBeDefined()
  })
})
