/**
 * Edge case tests for scode.js - gaps found during audit
 */

import { describe, it, expect } from 'vitest'
import { encodeSCode, decodeSCode, _encodeV2ForTest } from './scode.js'

const SCORED_DATE = '2026-09-01'

// ─── GAP 1: Maximum field values (bit-width saturation) ─────────────────────
// The encoder clamps values with Math.min(..., 2047/127/1023/7).
// Tests should verify that maximum values survive round-trip, and that
// values ABOVE the maximum get clamped rather than corrupting the bitstream.

describe('Maximum field values (bit-width saturation)', () => {
  it('cardio value at max 2047 (11 bits) round-trips', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      cardio: { exercise: '2mile_run', value: 2047, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.cardio.value).toBe(2047)
  })

  it('cardio value above max (2048) gets clamped to 2047', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      cardio: { exercise: '2mile_run', value: 2048, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.cardio.value).toBe(2047)
  })

  it('cardio value at 3000 gets clamped to 2047', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      cardio: { exercise: '2mile_run', value: 3000, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.cardio.value).toBe(2047)
  })

  it('strength value at max 127 (7 bits) round-trips', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      strength: { exercise: 'pushups', value: 127, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.strength.value).toBe(127)
  })

  it('strength value above max (128) gets clamped to 127', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      strength: { exercise: 'pushups', value: 128, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.strength.value).toBe(127)
  })

  it('core value at max 2047 (11 bits) round-trips', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      core: { exercise: 'plank', value: 2047, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.core.value).toBe(2047)
  })

  it('core value above max gets clamped to 2047', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      core: { exercise: 'plank', value: 5000, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.core.value).toBe(2047)
  })

  it('bodyComp heightInches at max 204.7 (11 bits / 10) round-trips', () => {
    // 204.7 * 10 = 2047, max for 11-bit field
    const code = encodeSCode({
      date: SCORED_DATE,
      bodyComp: { heightInches: 204.7, waistInches: 30, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.bodyComp.heightInches).toBeCloseTo(204.7, 1)
  })

  it('bodyComp waistInches at max 102.3 (10 bits / 10) round-trips', () => {
    // 102.3 * 10 = 1023, max for 10-bit field
    const code = encodeSCode({
      date: SCORED_DATE,
      bodyComp: { heightInches: 70, waistInches: 102.3, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.bodyComp.waistInches).toBeCloseTo(102.3, 1)
  })

  it('bodyComp waistInches above max (110) gets clamped to 102.3', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      bodyComp: { heightInches: 70, waistInches: 110, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.bodyComp.waistInches).toBeCloseTo(102.3, 1)
  })
})

// ─── GAP 2: Date field maximum (15-bit day counter) ─────────────────────────
// 15 bits = 32767 days from epoch (2020-01-01). That's about 89 years.
// Dates far in the future should still encode. Dates before epoch would
// produce negative values - what happens?

describe('Date field boundaries', () => {
  it('date at epoch (2020-01-01) round-trips with dateDays=0', () => {
    const code = encodeSCode({ date: '2020-01-01' })
    const decoded = decodeSCode(code)
    expect(decoded.date).toBe('2020-01-01')
  })

  it('date well after epoch (2030-01-01) round-trips', () => {
    const code = encodeSCode({ date: '2030-01-01' })
    const decoded = decodeSCode(code)
    expect(decoded.date).toBe('2030-01-01')
  })

  it('date close to max day count still works (2050-01-01)', () => {
    // 2050-01-01 is about 10957 days from 2020-01-01, well within 15-bit range
    const code = encodeSCode({ date: '2050-01-01' })
    const decoded = decodeSCode(code)
    expect(decoded.date).toBe('2050-01-01')
  })
})

// ─── GAP 3: Fractional values and rounding in encode ────────────────────────
// Cardio/core values are rounded via Math.round(). Test that fractional
// inputs are handled correctly.

describe('Fractional value rounding in encode', () => {
  it('cardio value 900.4 rounds to 900', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      cardio: { exercise: '2mile_run', value: 900.4, exempt: false },
    })
    expect(decodeSCode(code).cardio.value).toBe(900)
  })

  it('cardio value 900.5 rounds to 901 (round half-up)', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      cardio: { exercise: '2mile_run', value: 900.5, exempt: false },
    })
    // JS Math.round rounds 0.5 up
    expect(decodeSCode(code).cardio.value).toBe(901)
  })

  it('strength value 42.7 rounds to 43', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      strength: { exercise: 'pushups', value: 42.7, exempt: false },
    })
    expect(decodeSCode(code).strength.value).toBe(43)
  })

  it('bodyComp 0.1-inch precision preserved (70.3 height)', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      bodyComp: { heightInches: 70.3, waistInches: 32.7, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.bodyComp.heightInches).toBeCloseTo(70.3, 1)
    expect(decoded.bodyComp.waistInches).toBeCloseTo(32.7, 1)
  })
})

// ─── GAP 4: Value = 0 for various components ───────────────────────────────
// 0 is a valid value (0 reps, 0 seconds) but the encoder uses
// `Math.round(value ?? 0) || 0` which is intentionally treating 0 the same
// as null for the bitstream. But 0 is a meaningful value (0 pushups attempted).

describe('Zero values in encode/decode', () => {
  it('cardio value 0 encodes as 0 and decodes as 0', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      cardio: { exercise: 'hamr', value: 0, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.cardio.value).toBe(0)
  })

  it('strength value 0 encodes as 0 and decodes as 0', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      strength: { exercise: 'pushups', value: 0, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.strength.value).toBe(0)
  })

  it('core value 0 encodes as 0 and decodes as 0', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      core: { exercise: 'situps', value: 0, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.core.value).toBe(0)
  })
})

// ─── GAP 5: null/undefined values for non-exempt components ─────────────────
// The encoder uses `Math.round(value ?? 0) || 0`. When value is null,
// it writes 0 bits. But on decode, this comes back as 0, not null.
// This is a potential data confusion: null (untested) vs 0 (tested with 0 reps).

describe('null value for non-exempt component - data fidelity', () => {
  it('null cardio value for non-exempt encodes as 0 (lossy)', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      cardio: { exercise: '2mile_run', value: null, exempt: false },
    })
    const decoded = decodeSCode(code)
    // This is a known lossy encoding: null becomes 0
    expect(decoded.cardio.value).toBe(0)
    expect(decoded.cardio.exempt).toBe(false)
  })

  it('undefined strength value for non-exempt encodes as 0 (lossy)', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      strength: { exercise: 'pushups', value: undefined, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.strength.value).toBe(0)
  })
})

// ─── GAP 6: HAMR exercise encoding as cardio ───────────────────────────────
// HAMR uses cardio exercise index 1. Verify it round-trips distinctly from run.

describe('HAMR cardio exercise encoding', () => {
  it('HAMR exercise index round-trips correctly', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      cardio: { exercise: 'hamr', value: 82, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.cardio.exercise).toBe('hamr')
    expect(decoded.cardio.value).toBe(82)
  })

  it('HAMR walkPass is null (not a walk exercise)', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      cardio: { exercise: 'hamr', value: 82, exempt: false },
    })
    const decoded = decodeSCode(code)
    expect(decoded.cardio.walkPass).toBeNull()
  })
})

// ─── GAP 7: All exercise types for core ─────────────────────────────────────
// situps=0, clrc=1, plank=2. Plank can have large values (up to 2047 seconds).

describe('All core exercise types round-trip', () => {
  it('situps round-trips with exercise index 0', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      core: { exercise: 'situps', value: 52, exempt: false },
    })
    expect(decodeSCode(code).core.exercise).toBe('situps')
    expect(decodeSCode(code).core.value).toBe(52)
  })

  it('clrc round-trips with exercise index 1', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      core: { exercise: 'clrc', value: 45, exempt: false },
    })
    expect(decodeSCode(code).core.exercise).toBe('clrc')
    expect(decodeSCode(code).core.value).toBe(45)
  })

  it('plank round-trips with large time value', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      core: { exercise: 'plank', value: 215, exempt: false },
    })
    expect(decodeSCode(code).core.exercise).toBe('plank')
    expect(decodeSCode(code).core.value).toBe(215)
  })
})

// ─── GAP 8: Feedback field clamping ─────────────────────────────────────────
// Fields exceeding their bit-width max should be clamped, not overflow.

describe('Feedback field clamping (overflow protection)', () => {
  it('rpe above 5 gets clamped to 5 (stored as 4)', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      feedback: { rpe: 10 },
    })
    const decoded = decodeSCode(code)
    // rpe stored as min(max(0, rpe-1), 4) = min(max(0, 9), 4) = 4, decoded as 5
    expect(decoded.feedback.rpe).toBe(5)
  })

  it('confidence above 5 gets clamped to 5', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      feedback: { confidence: 99 },
    })
    const decoded = decodeSCode(code)
    expect(decoded.feedback.confidence).toBe(5)
  })

  it('environmentFlags above 63 gets clamped to 63', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      feedback: { environmentFlags: 255 },
    })
    const decoded = decodeSCode(code)
    expect(decoded.feedback.environmentFlags).toBe(63)
  })

  it('baseId above 7 gets clamped to 7', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      feedback: { baseId: 100 },
    })
    const decoded = decodeSCode(code)
    expect(decoded.feedback.baseId).toBe(7)
  })

  it('sleepQuality above 3 gets clamped to 3', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      feedback: { sleepQuality: 10 },
    })
    const decoded = decodeSCode(code)
    expect(decoded.feedback.sleepQuality).toBe(3)
  })

  it('nutrition above 3 gets clamped to 3', () => {
    const code = encodeSCode({
      date: SCORED_DATE,
      feedback: { nutrition: 10 },
    })
    const decoded = decodeSCode(code)
    expect(decoded.feedback.nutrition).toBe(3)
  })
})

// ─── GAP 9: Missing date throws ─────────────────────────────────────────────

describe('Missing date handling', () => {
  it('null date throws "Assessment date is required"', () => {
    expect(() => encodeSCode({ date: null })).toThrow('Assessment date is required')
  })

  it('undefined date throws "Assessment date is required"', () => {
    expect(() => encodeSCode({})).toThrow('Assessment date is required')
  })
})

// ─── GAP 10: V2 backward compat with walk exercise ─────────────────────────
// V2 does not have the walkPass bit. Verify that a V2 walk code decodes
// with walkPass=null.

describe('V2 backward compat edge cases', () => {
  it('V2 code with walk exercise decodes with walkPass=null', () => {
    const v2code = _encodeV2ForTest({
      date: SCORED_DATE,
      cardio: { exercise: '2km_walk', value: 1200, exempt: false },
    })
    const decoded = decodeSCode(v2code)
    expect(decoded.cardio.exercise).toBe('2km_walk')
    expect(decoded.cardio.walkPass).toBeNull()
    expect(decoded.cardio.value).toBe(1200)
  })

  it('V2 code with exempt cardio decodes correctly', () => {
    const v2code = _encodeV2ForTest({
      date: SCORED_DATE,
      cardio: { exercise: '2mile_run', value: null, exempt: true },
    })
    const decoded = decodeSCode(v2code)
    expect(decoded.cardio.exempt).toBe(true)
    expect(decoded.cardio.value).toBeNull()
  })
})
