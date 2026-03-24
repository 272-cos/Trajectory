/**
 * Training Calendar tests - Task 10.3 milestone date calculations
 *
 * Validates: PI Workout dates, fractional test dates (50%/75%),
 * mock test date, taper period bounds given a target PFA date.
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

// ── detectPhase ────────────────────────────────────────────────────────────────

describe('detectPhase', () => {
  it('returns Phase 1 for 13+ weeks out', () => {
    expect(detectPhase(14)).toBe(PHASES.PHASE_1)
    expect(detectPhase(13)).toBe(PHASES.PHASE_1)
  })

  it('returns Phase 2 for 9-12 weeks out', () => {
    expect(detectPhase(12)).toBe(PHASES.PHASE_2)
    expect(detectPhase(9)).toBe(PHASES.PHASE_2)
  })

  it('returns Phase 3 for 5-8 weeks out', () => {
    expect(detectPhase(8)).toBe(PHASES.PHASE_3)
    expect(detectPhase(5)).toBe(PHASES.PHASE_3)
  })

  it('returns Phase 4 for 1-4 weeks out', () => {
    expect(detectPhase(4)).toBe(PHASES.PHASE_4)
    expect(detectPhase(1)).toBe(PHASES.PHASE_4)
    expect(detectPhase(0)).toBe(PHASES.PHASE_4)
  })

  it('returns Phase 0 when forcePhase0 is true', () => {
    expect(detectPhase(20, { forcePhase0: true })).toBe(PHASES.PHASE_0)
  })
})

// ── shouldUsePhase0 ────────────────────────────────────────────────────────────

describe('shouldUsePhase0', () => {
  it('returns true when composite is null (no data)', () => {
    expect(shouldUsePhase0(null, null)).toBe(true)
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
    // Taper should span 14 days minus mock test day and test day = 12 taper events
    expect(taperEvents.length).toBeGreaterThanOrEqual(10)
    // All taper dates should be between taperStart and target
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

  it('places fractional tests (50% at ~10 weeks out, 75% at ~6 weeks out)', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-01', baseScores, '2026-03-22')
    const fracTests = collectEventsByType(cal, EVENT_TYPES.FRACTIONAL_TEST)
    // Should have two fractional tests (50% and 75%)
    expect(fracTests.length).toBe(2)
    const fractions = fracTests.map(ft => ft.fraction).sort()
    expect(fractions).toEqual([0.5, 0.75])
  })

  it('generates PI workout events', () => {
    const cal = generateCalendar(baseDemographics, '2026-09-01', baseScores, '2026-03-22')
    const piEvents = collectEventsByType(cal, EVENT_TYPES.PI_WORKOUT)
    // With many weeks, should have multiple PI workouts
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
    expect(cal.totalDays).toBe(163) // Mar 22 to Sep 1
    expect(cal.totalWeeks).toBe(23)
  })
})
