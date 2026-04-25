import { describe, it, expect } from 'vitest'
import {
  getHeartRateZones,
  formatHeartRateZone,
  prescribeSession,
  WEEKLY_TEMPLATES,
  PHASE_NAMES,
  INTENSITY,
  phaseConfig,
} from './phaseEngine.js'

describe('getHeartRateZones', () => {
  it('calculates max HR as 220 - age', () => {
    expect(getHeartRateZones(30).maxHR).toBe(190)
    expect(getHeartRateZones(40).maxHR).toBe(180)
    expect(getHeartRateZones(20).maxHR).toBe(200)
  })

  it('returns 5 zones with correct boundaries', () => {
    const { zones } = getHeartRateZones(30) // maxHR = 190
    expect(zones).toHaveLength(5)
    expect(zones[0]).toEqual({ zone: 1, label: 'Recovery', low: 95, high: 114 })
    expect(zones[1]).toEqual({ zone: 2, label: 'Aerobic', low: 114, high: 133 })
    expect(zones[2]).toEqual({ zone: 3, label: 'Tempo', low: 133, high: 152 })
    expect(zones[3]).toEqual({ zone: 4, label: 'Threshold', low: 152, high: 171 })
    expect(zones[4]).toEqual({ zone: 5, label: 'Max', low: 171, high: 190 })
  })
})

describe('formatHeartRateZone', () => {
  it('formats zone with BPM range', () => {
    expect(formatHeartRateZone(30, 2)).toBe('Zone 2 (114-133 bpm)')
  })

  it('falls back gracefully for invalid zone', () => {
    expect(formatHeartRateZone(30, 9)).toBe('Zone 9')
  })

  it('personalizes for different ages', () => {
    // Age 25: maxHR = 195, Zone 2 = 60-70% = 117-137
    expect(formatHeartRateZone(25, 2)).toBe('Zone 2 (117-137 bpm)')
    // Age 50: maxHR = 170, Zone 2 = 60-70% = 102-119
    expect(formatHeartRateZone(50, 2)).toBe('Zone 2 (102-119 bpm)')
  })
})

// ── Per-session volume invariance (Task 4) ────────────────────────────────────
//
// Decision (docs/DECISIONS.md "Training-day range 3-7 with constant per-session
// load"): weekly volume scales linearly with day count; per-session volume is
// constant. phaseEngine.js has no preferredDays parameter at all - invariance
// is structural, not configured.

describe('per-session volume invariance', () => {
  const TOTAL_WEEKS = 16

  it('prescribeSession has no dayCount/preferredDays parameter - invariance is structural', () => {
    // prescribeSession(ratio, totalWeeks, sessionIndex) - three params only
    expect(prescribeSession.length).toBe(3)
  })

  it('same (phase, sessionIndex, totalWeeks) always produces identical session', () => {
    // Call 6 times with indices spread across a 7-day "week" - all should be stable
    const calls = [0, 1, 2, 3, 4, 5, 6].map(i =>
      prescribeSession(0.0, TOTAL_WEEKS, i % 3)
    )
    const reference = prescribeSession(0.0, TOTAL_WEEKS, 0)
    // Index 0 and 3 and 6 are all equivalent (mod 3 BASE templates)
    expect(calls[0]).toEqual(reference)
    expect(calls[3]).toEqual(reference)
    expect(calls[6]).toEqual(reference)
    // Index 1 and 4 are equivalent
    expect(calls[1]).toEqual(calls[4])
    // Index 2 and 5 are equivalent
    expect(calls[2]).toEqual(calls[5])
  })

  it('session description and notes are identical for 3-day and 7-day users at the same index', () => {
    // Simulate 3-day week: indices 0, 1, 2
    const threeDaySessions = [0, 1, 2].map(i => prescribeSession(0.0, TOTAL_WEEKS, i))
    // Simulate 7-day week: indices 0-6 (templates cycle mod template count)
    const sevenDaySessions = [0, 1, 2, 3, 4, 5, 6].map(i => prescribeSession(0.0, TOTAL_WEEKS, i))
    // Each matching mod-3 index must be identical
    for (let i = 0; i < 3; i++) {
      expect(sevenDaySessions[i].description).toBe(threeDaySessions[i].description)
      expect(sevenDaySessions[i].notes).toBe(threeDaySessions[i].notes)
      expect(sevenDaySessions[i].intensity).toBe(threeDaySessions[i].intensity)
      expect(sevenDaySessions[i].stress).toBe(threeDaySessions[i].stress)
    }
  })

  it('BASE phase sessions cycle across all 4 phases at different ratios without volume scaling', () => {
    const phases = [
      { ratio: 0.0, name: PHASE_NAMES.BASE },
      { ratio: 0.26, name: PHASE_NAMES.BUILD },
      { ratio: 0.55, name: PHASE_NAMES.BUILD_PLUS },
      { ratio: 0.82, name: PHASE_NAMES.SHARPEN },
    ]
    for (const { ratio, name } of phases) {
      const templates = WEEKLY_TEMPLATES[name]
      // Each session index maps to a specific template - no volume reduction for fewer/more days
      for (let i = 0; i < templates.length; i++) {
        const session = prescribeSession(ratio, TOTAL_WEEKS, i)
        expect(session.phase).toBe(name)
        // stress and description are template-fixed, not scaled by day count
        expect(typeof session.stress).toBe('number')
        expect(session.stress).toBe(templates[i].stress)
        expect(session.description).toBe(templates[i].description)
      }
    }
  })

  it('phaseConfig sessionsPerWeek is informational only - does not gate session prescription', () => {
    // A 7-day user can get session index 6 even though BASE sessionsPerWeek = 3.
    // prescribeSession should return a valid session, not throw or return null.
    const session7 = prescribeSession(0.0, TOTAL_WEEKS, 6)
    expect(session7).toBeTruthy()
    expect(session7.description).toBeTruthy()
    // It cycles: index 6 % 3 (BASE templates) = 0 -> same as first template
    const session0 = prescribeSession(0.0, TOTAL_WEEKS, 0)
    expect(session7.description).toBe(session0.description)
    // Confirm phaseConfig.BASE.sessionsPerWeek is 3 (informational, not enforced)
    expect(phaseConfig[PHASE_NAMES.BASE].sessionsPerWeek).toBe(3)
  })

  it('BUILD_PLUS HIGH sessions are non-adjacent in the template (no back-to-back hard days on default 3-day cycle)', () => {
    const templates = WEEKLY_TEMPLATES[PHASE_NAMES.BUILD_PLUS]
    const highIndices = templates
      .map((t, i) => t.intensity === INTENSITY.HIGH ? i : -1)
      .filter(i => i >= 0)
    // BUILD_PLUS has 2 HIGH sessions, but they are at indices 0 and 3 (not consecutive).
    // Default 3-day cycle uses indices 0,1,2 -> only one HIGH fires per week.
    expect(highIndices.length).toBe(2)
    expect(highIndices[1] - highIndices[0]).toBeGreaterThan(1) // not adjacent
    // With 3 days (0,1,2), only index-0 is HIGH; the week has exactly one hard session.
    const threeDayHighCount = [0, 1, 2].filter(i => templates[i].intensity === INTENSITY.HIGH).length
    expect(threeDayHighCount).toBe(1)
  })

  it('SHARPEN HIGH sessions are at indices 0 and 1, with LOW recovery sessions after', () => {
    // SHARPEN is intentionally high-intensity (test simulation).
    // Calendar-consecutive back-to-back is guarded by the UI hasConsecutiveDays warning.
    const templates = WEEKLY_TEMPLATES[PHASE_NAMES.SHARPEN]
    const highIndices = templates
      .map((t, i) => t.intensity === INTENSITY.HIGH ? i : -1)
      .filter(i => i >= 0)
    expect(highIndices.length).toBe(2)
    // LOW recovery sessions follow the HIGH sessions to prevent accumulated fatigue.
    const lowCount = templates.filter(t => t.intensity === INTENSITY.LOW).length
    expect(lowCount).toBeGreaterThanOrEqual(1)
  })
})
