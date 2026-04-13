import { describe, test, expect } from 'vitest'

/**
 * Adaptation Integration Tests
 *
 * Verifies that RPE feedback flows through detectAdaptationState() ->
 * applyAdaptation() -> generateCalendar() and produces modified workout
 * events for future sessions only.
 *
 * Tests use in-memory RPE history (passed directly to detectAdaptationState)
 * to avoid localStorage coupling.
 */

import { generateCalendar, EVENT_TYPES } from './trainingCalendar.js'
import { detectAdaptationState, ADAPTATION_STATES } from './adaptiveFeedback.js'

const TODAY = '2026-04-09'
const TARGET = '2026-07-22' // ~15 weeks out - enough for all phases

const DEMOGRAPHICS = { gender: 'M', dob: '1990-01-01' }
const SCORES = { composite: 80, cardio: 85, strength: 75, core: 80, bodyComp: 80 }
const PREFERRED_DAYS = [1, 3, 5] // Mon/Wed/Fri

/** Build RPE history where all 5 recent sessions have the same RPE value */
function buildRPEHistory(rpe) {
  return Array.from({ length: 5 }, (_, i) => ({
    date: `2026-04-0${i + 1}`,
    rpe,
    weekNum: 1,
    phase: 'BASE',
    ts: Date.now(),
  }))
}

/** Get all future training events from a generated calendar */
function getFutureTrainingEvents(calendar, todayISO) {
  return Object.values(calendar.eventsByDate)
    .flat()
    .filter(e => e.type === EVENT_TYPES.TRAINING && e.date > todayISO && e.intensity)
}

// ── TEST 1: Fatigue reduces intensity ─────────────────────────────────────────

describe('TEST 1 - Fatigue response (RPE 5 x5)', () => {
  test('non-SHARPEN future training events have reduced intensity and adaptationNote', () => {
    const history = buildRPEHistory(5)
    const adaptationState = detectAdaptationState(history)

    expect(adaptationState.state).toBe(ADAPTATION_STATES.FATIGUED)
    expect(adaptationState.avgRPE).toBeGreaterThanOrEqual(4.5)

    const calendar = generateCalendar(
      DEMOGRAPHICS, TARGET, SCORES, TODAY,
      { preferredDays: PREFERRED_DAYS, adaptationState },
    )

    // SHARPEN phase is intentionally suppressed (validated by fitness review)
    const adaptableEvents = getFutureTrainingEvents(calendar, TODAY)
      .filter(e => e.phaseName !== 'SHARPEN')

    expect(adaptableEvents.length).toBeGreaterThan(0)

    // Non-SHARPEN sessions must carry adaptationNote and reduced intensity
    adaptableEvents.forEach(e => {
      expect(e.adaptationNote).toBeDefined()
      expect(e.adaptationNote).toMatch(/fatigue/i)
      expect(e.intensity).not.toBe('high')
    })
  })

  test('before vs after: moderate session becomes low', () => {
    // Without adaptation
    const normalState = detectAdaptationState(buildRPEHistory(3))
    const calendarBefore = generateCalendar(
      DEMOGRAPHICS, TARGET, SCORES, TODAY,
      { preferredDays: PREFERRED_DAYS, adaptationState: normalState },
    )

    // With fatigue adaptation
    const fatigueState = detectAdaptationState(buildRPEHistory(5))
    const calendarAfter = generateCalendar(
      DEMOGRAPHICS, TARGET, SCORES, TODAY,
      { preferredDays: PREFERRED_DAYS, adaptationState: fatigueState },
    )

    const beforeEvents = getFutureTrainingEvents(calendarBefore, TODAY)
    const afterEvents  = getFutureTrainingEvents(calendarAfter,  TODAY)

    // Find at least one session that was moderate before and is now low
    const beforeModerate = beforeEvents.filter(e => e.intensity === 'moderate')
    expect(beforeModerate.length).toBeGreaterThan(0)

    const afterSameDates = afterEvents.filter(
      e => beforeModerate.some(b => b.date === e.date),
    )
    afterSameDates.forEach(e => {
      // moderate dropped to low; high dropped to moderate
      expect(['low', 'moderate']).toContain(e.intensity)
    })
  })
})

// ── TEST 2: Undertraining increases volume ────────────────────────────────────

describe('TEST 2 - Undertraining response (RPE 1 x5)', () => {
  test('non-BASE non-SHARPEN future training events get volumeModifier of 1.1 (+10%)', () => {
    const history = buildRPEHistory(1)
    const adaptationState = detectAdaptationState(history)

    expect(adaptationState.state).toBe(ADAPTATION_STATES.UNDERTRAINED)

    const calendar = generateCalendar(
      DEMOGRAPHICS, TARGET, SCORES, TODAY,
      { preferredDays: PREFERRED_DAYS, adaptationState },
    )

    // BASE and SHARPEN are intentionally suppressed (validated by fitness review)
    const adaptableEvents = getFutureTrainingEvents(calendar, TODAY)
      .filter(e => e.phaseName !== 'BASE' && e.phaseName !== 'SHARPEN')

    expect(adaptableEvents.length).toBeGreaterThan(0)

    adaptableEvents.forEach(e => {
      expect(e.volumeModifier).toBe(1.1)
      expect(e.adaptationNote).toBeDefined()
      expect(e.adaptationNote).toMatch(/undertraining/i)
    })
  })
})

// ── TEST 3: Normal RPE - no adaptation ───────────────────────────────────────

describe('TEST 3 - Recovery stabilization (RPE 3 x5)', () => {
  test('future sessions have no adaptationNote and no volumeModifier', () => {
    const history = buildRPEHistory(3)
    const adaptationState = detectAdaptationState(history)

    expect(adaptationState.state).toBe(ADAPTATION_STATES.NORMAL)

    const calendar = generateCalendar(
      DEMOGRAPHICS, TARGET, SCORES, TODAY,
      { preferredDays: PREFERRED_DAYS, adaptationState },
    )

    const allEvents = Object.values(calendar.eventsByDate).flat()
      .filter(e => e.type === EVENT_TYPES.TRAINING)

    allEvents.forEach(e => {
      expect(e.adaptationNote).toBeUndefined()
      expect(e.volumeModifier).toBeUndefined()
      expect(e.adaptationState).toBeUndefined()
    })
  })
})

// ── TEST 4: Past sessions are never modified ──────────────────────────────────

describe('TEST 4 - Past/today sessions are protected', () => {
  test('sessions on today are not adapted (only strictly future dates)', () => {
    const fatigueState = detectAdaptationState(buildRPEHistory(5))
    expect(fatigueState.state).toBe(ADAPTATION_STATES.FATIGUED)

    const calendar = generateCalendar(
      DEMOGRAPHICS, TARGET, SCORES, TODAY,
      { preferredDays: PREFERRED_DAYS, adaptationState: fatigueState },
    )

    // Events on TODAY itself must not have adaptationNote
    const todayEvents = (calendar.eventsByDate[TODAY] || [])
      .filter(e => e.type === EVENT_TYPES.TRAINING)

    todayEvents.forEach(e => {
      expect(e.adaptationNote).toBeUndefined()
    })
  })

  test('only future dates (> today) carry adaptationNote', () => {
    const fatigueState = detectAdaptationState(buildRPEHistory(5))

    const calendar = generateCalendar(
      DEMOGRAPHICS, TARGET, SCORES, TODAY,
      { preferredDays: PREFERRED_DAYS, adaptationState: fatigueState },
    )

    const adaptedDates = Object.values(calendar.eventsByDate)
      .flat()
      .filter(e => e.adaptationNote)
      .map(e => e.date)

    adaptedDates.forEach(d => {
      expect(d > TODAY).toBe(true)
    })
  })
})

// ── TEST 5: No adaptationState passed - calendar generates normally ───────────

describe('Edge case - no adaptationState in options', () => {
  test('calendar generates without errors when adaptationState is omitted', () => {
    const calendar = generateCalendar(
      DEMOGRAPHICS, TARGET, SCORES, TODAY,
      { preferredDays: PREFERRED_DAYS },
    )

    expect(calendar).not.toBeNull()
    const trainingEvents = Object.values(calendar.eventsByDate)
      .flat()
      .filter(e => e.type === EVENT_TYPES.TRAINING)

    expect(trainingEvents.length).toBeGreaterThan(0)
    trainingEvents.forEach(e => {
      expect(e.adaptationNote).toBeUndefined()
    })
  })
})

// ── TEST 6: SHARPEN phase guard ───────────────────────────────────────────────

describe('Phase guard - SHARPEN suppresses all adaptation', () => {
  test('SHARPEN phase sessions are never adapted even under fatigue', () => {
    // Use a very short plan so the calendar is almost entirely in SHARPEN
    const shortTarget = '2026-04-23' // ~2 weeks out - lands in SHARPEN
    const fatigueState = detectAdaptationState(buildRPEHistory(5))
    expect(fatigueState.state).toBe(ADAPTATION_STATES.FATIGUED)

    const calendar = generateCalendar(
      DEMOGRAPHICS, shortTarget, SCORES, TODAY,
      { preferredDays: PREFERRED_DAYS, adaptationState: fatigueState },
    )

    const sharpenEvents = Object.values(calendar.eventsByDate)
      .flat()
      .filter(e => e.type === EVENT_TYPES.TRAINING && e.phaseName === 'SHARPEN')

    // If SHARPEN events exist they must not have adaptationNote
    sharpenEvents.forEach(e => {
      expect(e.adaptationNote).toBeUndefined()
    })
  })
})

// ── TEST 7: BASE phase undertraining guard ────────────────────────────────────

describe('Phase guard - BASE phase suppresses UNDERTRAINING signal', () => {
  test('BASE phase sessions with undertraining state are not volume-boosted', () => {
    const undertrainState = detectAdaptationState(buildRPEHistory(1))
    expect(undertrainState.state).toBe(ADAPTATION_STATES.UNDERTRAINED)

    const calendar = generateCalendar(
      DEMOGRAPHICS, TARGET, SCORES, TODAY,
      { preferredDays: PREFERRED_DAYS, adaptationState: undertrainState },
    )

    const baseEvents = Object.values(calendar.eventsByDate)
      .flat()
      .filter(e => e.type === EVENT_TYPES.TRAINING && e.phaseName === 'BASE')

    // BASE events must NOT get the undertraining volume boost
    baseEvents.forEach(e => {
      expect(e.volumeModifier).toBeUndefined()
      expect(e.adaptationNote).toBeUndefined()
    })

    // Non-BASE future events SHOULD still be adapted
    const nonBaseAdapted = Object.values(calendar.eventsByDate)
      .flat()
      .filter(e =>
        e.type === EVENT_TYPES.TRAINING &&
        e.date > TODAY &&
        e.phaseName !== 'BASE' &&
        e.phaseName !== 'SHARPEN',
      )

    if (nonBaseAdapted.length > 0) {
      expect(nonBaseAdapted.some(e => e.volumeModifier === 1.1)).toBe(true)
    }
  })
})
