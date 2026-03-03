/**
 * Task 2.2 acceptance tests — S-code V3
 *
 * Coverage:
 *  • V3 encode → decode round-trip (all components)
 *  • Every new field: whtr_measured_offset, cardio_walk_pass, base_id,
 *    rpe, sleep_quality, nutrition, injured, environment_flags, confidence
 *  • Boundary values for each new field
 *  • Cardio walk_pass only emitted / decoded when exercise = 2km_walk
 *  • Body comp measuredOffset included only in non-exempt blocks
 *  • V2 backward compat (S2- prefix decodes; feedback = null)
 *  • CS-01 / CS-09: future schema version → "Please update the app."
 *  • Output length ≈ 22 chars (acceptance: ≤ 26)
 *  • isValidSCode recognises V2 and V3; rejects garbage
 */

import { describe, it, expect } from 'vitest'
import { encodeSCode, decodeSCode, isValidSCode, _encodeV2ForTest } from './scode.js'
import { ENV_FLAGS, BASE_REGISTRY, BitWriter } from './bitpack.js'
import { crc8 } from './crc8.js'
import { encodeBase64url } from './base64url.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SCORED_DATE     = '2026-09-01'   // after Aug 31 → not diagnostic
const DIAGNOSTIC_DATE = '2026-04-01'   // Mar–Jun 2026 → diagnostic

const FULL_V3 = {
  date: SCORED_DATE,
  cardio:   { exercise: '2mile_run', value: 900,  exempt: false },
  strength: { exercise: 'pushups',   value: 42,   exempt: false },
  core:     { exercise: 'situps',    value: 52,    exempt: false },
  bodyComp: { heightInches: 70.5, waistInches: 32.1, measuredOffset: 3, exempt: false },
  feedback: {
    baseId:           2,
    rpe:              4,
    sleepQuality:     2,
    nutrition:        2,
    injured:          false,
    environmentFlags: ENV_FLAGS.HOT | ENV_FLAGS.HUMID,
    confidence:       3,
  },
}

// ─── Helper: build raw S3- code with arbitrary schema version ─────────────────
// Used for CS-01/CS-09 "future version" tests.

function buildRawSCode(schemaVersion) {
  const epoch  = new Date('2020-01-01')
  const date   = new Date(SCORED_DATE)
  const days   = Math.floor((date - epoch) / 86400000)
  const writer = new BitWriter()
  writer.write(schemaVersion, 4)  // schema version (e.g., 4 = future)
  writer.write(0,  4)             // chart version
  writer.write(days, 15)          // date
  writer.write(0,  1)             // not diagnostic
  writer.write(0,  4)             // no components
  // feedback block (20 bits of zeros)
  writer.write(0, 3); writer.write(0, 3); writer.write(0, 2); writer.write(0, 2)
  writer.write(0, 1); writer.write(0, 6); writer.write(0, 3)

  const bytes       = writer.getBytes()
  const crcVal      = crc8(bytes)
  const dataWithCrc = new Uint8Array(bytes.length + 1)
  dataWithCrc.set(bytes)
  dataWithCrc[bytes.length] = crcVal
  return 'S3-' + encodeBase64url(dataWithCrc)
}

// ─── Round-trip: basic ────────────────────────────────────────────────────────

describe('V3 round-trip – basic', () => {
  it('encodes and decodes all 4 components', () => {
    const code = encodeSCode(FULL_V3)
    expect(code).toMatch(/^S3-/)
    const result = decodeSCode(code)
    expect(result.schemaVersion).toBe(3)
    expect(result.cardio.exercise).toBe('2mile_run')
    expect(result.cardio.value).toBe(900)
    expect(result.strength.value).toBe(42)
    expect(result.core.value).toBe(52)
    expect(result.bodyComp.heightInches).toBeCloseTo(70.5, 1)
    expect(result.bodyComp.waistInches).toBeCloseTo(32.1, 1)
  })

  it('diagnostic flag round-trips', () => {
    const code   = encodeSCode({ date: DIAGNOSTIC_DATE })
    const result = decodeSCode(code)
    expect(result.isDiagnostic).toBe(true)
  })

  it('non-diagnostic date has isDiagnostic=false', () => {
    const result = decodeSCode(encodeSCode({ date: SCORED_DATE }))
    expect(result.isDiagnostic).toBe(false)
  })

  it('partial assessment (no components) encodes and decodes', () => {
    const code   = encodeSCode({ date: SCORED_DATE })
    const result = decodeSCode(code)
    expect(result.cardio).toBeNull()
    expect(result.strength).toBeNull()
    expect(result.core).toBeNull()
    expect(result.bodyComp).toBeNull()
  })

  it('exempt components round-trip', () => {
    const code = encodeSCode({
      date:     SCORED_DATE,
      cardio:   { exercise: '2mile_run', value: null, exempt: true },
      strength: { exercise: 'pushups',   value: null, exempt: true },
    })
    const result = decodeSCode(code)
    expect(result.cardio.exempt).toBe(true)
    expect(result.cardio.value).toBeNull()
    expect(result.strength.exempt).toBe(true)
  })
})

// ─── New field: whtr_measured_offset ─────────────────────────────────────────

describe('whtr_measured_offset', () => {
  function encodeWithOffset(offset) {
    return encodeSCode({
      date: SCORED_DATE,
      bodyComp: { heightInches: 68, waistInches: 32, measuredOffset: offset, exempt: false },
    })
  }

  it('offset=0 round-trips', () => {
    const r = decodeSCode(encodeWithOffset(0))
    expect(r.bodyComp.measuredOffset).toBe(0)
  })

  it('offset=3 round-trips', () => {
    const r = decodeSCode(encodeWithOffset(3))
    expect(r.bodyComp.measuredOffset).toBe(3)
  })

  it('offset=5 round-trips (max valid)', () => {
    const r = decodeSCode(encodeWithOffset(5))
    expect(r.bodyComp.measuredOffset).toBe(5)
  })

  it('offset=7 round-trips (max 3-bit value)', () => {
    const r = decodeSCode(encodeWithOffset(7))
    expect(r.bodyComp.measuredOffset).toBe(7)
  })

  it('measuredOffset is null for exempt body comp', () => {
    const r = decodeSCode(encodeSCode({
      date: SCORED_DATE,
      bodyComp: { exempt: true },
    }))
    expect(r.bodyComp.measuredOffset).toBeNull()
  })

  it('measuredOffset not present when bodyComp absent', () => {
    const r = decodeSCode(encodeSCode({ date: SCORED_DATE }))
    expect(r.bodyComp).toBeNull()
  })
})

// ─── New field: cardio_walk_pass ──────────────────────────────────────────────

describe('cardio_walk_pass', () => {
  it('walkPass=true round-trips for 2km_walk', () => {
    const code = encodeSCode({
      date:   SCORED_DATE,
      cardio: { exercise: '2km_walk', value: 1440, exempt: false, walkPass: true },
    })
    const r = decodeSCode(code)
    expect(r.cardio.exercise).toBe('2km_walk')
    expect(r.cardio.walkPass).toBe(true)
  })

  it('walkPass=false round-trips for 2km_walk', () => {
    const r = decodeSCode(encodeSCode({
      date:   SCORED_DATE,
      cardio: { exercise: '2km_walk', value: 1800, exempt: false, walkPass: false },
    }))
    expect(r.cardio.walkPass).toBe(false)
  })

  it('walkPass is null for run (not a walk exercise)', () => {
    const r = decodeSCode(encodeSCode({
      date:   SCORED_DATE,
      cardio: { exercise: '2mile_run', value: 900, exempt: false },
    }))
    expect(r.cardio.walkPass).toBeNull()
  })

  it('walkPass is null for HAMR', () => {
    const r = decodeSCode(encodeSCode({
      date:   SCORED_DATE,
      cardio: { exercise: 'hamr', value: 82, exempt: false },
    }))
    expect(r.cardio.walkPass).toBeNull()
  })

  it('walkPass is null when cardio is exempt (walk)', () => {
    const r = decodeSCode(encodeSCode({
      date:   SCORED_DATE,
      cardio: { exercise: '2km_walk', value: null, exempt: true },
    }))
    expect(r.cardio.walkPass).toBeNull()
  })
})

// ─── New field: base_id ───────────────────────────────────────────────────────

describe('base_id', () => {
  function encodeWithBase(baseId) {
    return encodeSCode({ date: SCORED_DATE, feedback: { baseId } })
  }

  it('base_id=0 (N/A) round-trips', () => {
    expect(decodeSCode(encodeWithBase(0)).feedback.baseId).toBe(0)
  })

  it('base_id=1 (USAF Academy) round-trips', () => {
    expect(decodeSCode(encodeWithBase(1)).feedback.baseId).toBe(1)
  })

  it('base_id=7 (Kirtland, max) round-trips', () => {
    expect(decodeSCode(encodeWithBase(7)).feedback.baseId).toBe(7)
  })

  it('BASE_REGISTRY has 8 entries (null + 7 bases)', () => {
    expect(BASE_REGISTRY).toHaveLength(8)
    expect(BASE_REGISTRY[0]).toBeNull()
    expect(BASE_REGISTRY[1].name).toBe('USAF Academy')
    expect(BASE_REGISTRY[7].name).toBe('Kirtland AFB')
  })

  it('BASE_REGISTRY elevation values match design spec', () => {
    expect(BASE_REGISTRY[1].elevationFt).toBe(7258)
    expect(BASE_REGISTRY[4].elevationFt).toBe(6065)  // F.E. Warren
    expect(BASE_REGISTRY[7].elevationFt).toBe(5400)  // Kirtland
  })
})

// ─── New field: rpe ───────────────────────────────────────────────────────────

describe('rpe', () => {
  function encodeWithRpe(rpe) {
    return encodeSCode({ date: SCORED_DATE, feedback: { rpe } })
  }

  it('rpe=1 (EASY) round-trips (stored as 0)', () => {
    expect(decodeSCode(encodeWithRpe(1)).feedback.rpe).toBe(1)
  })

  it('rpe=3 (HARD) round-trips', () => {
    expect(decodeSCode(encodeWithRpe(3)).feedback.rpe).toBe(3)
  })

  it('rpe=5 (MAXIMAL) round-trips (stored as 4)', () => {
    expect(decodeSCode(encodeWithRpe(5)).feedback.rpe).toBe(5)
  })

  it('omitted rpe defaults to 1 (stored 0)', () => {
    // When feedback is null, rpe stored as 0 → decoded as 1
    expect(decodeSCode(encodeSCode({ date: SCORED_DATE })).feedback.rpe).toBe(1)
  })
})

// ─── New field: sleep_quality ─────────────────────────────────────────────────

describe('sleep_quality', () => {
  function encodeWithSleep(sleepQuality) {
    return encodeSCode({ date: SCORED_DATE, feedback: { sleepQuality } })
  }

  it('0 (POOR) round-trips', ()  => { expect(decodeSCode(encodeWithSleep(0)).feedback.sleepQuality).toBe(0) })
  it('1 (FAIR) round-trips', ()  => { expect(decodeSCode(encodeWithSleep(1)).feedback.sleepQuality).toBe(1) })
  it('2 (GOOD) round-trips', ()  => { expect(decodeSCode(encodeWithSleep(2)).feedback.sleepQuality).toBe(2) })
  it('3 (EXCELLENT) round-trips',() => { expect(decodeSCode(encodeWithSleep(3)).feedback.sleepQuality).toBe(3) })
})

// ─── New field: nutrition ─────────────────────────────────────────────────────

describe('nutrition', () => {
  function encodeWithNutrition(nutrition) {
    return encodeSCode({ date: SCORED_DATE, feedback: { nutrition } })
  }

  it('0 (FASTED) round-trips', () => { expect(decodeSCode(encodeWithNutrition(0)).feedback.nutrition).toBe(0) })
  it('1 (LIGHT) round-trips',  () => { expect(decodeSCode(encodeWithNutrition(1)).feedback.nutrition).toBe(1) })
  it('2 (NORMAL) round-trips', () => { expect(decodeSCode(encodeWithNutrition(2)).feedback.nutrition).toBe(2) })
  it('3 (HEAVY) round-trips',  () => { expect(decodeSCode(encodeWithNutrition(3)).feedback.nutrition).toBe(3) })
})

// ─── New field: injured ───────────────────────────────────────────────────────

describe('injured', () => {
  it('injured=true round-trips', () => {
    const r = decodeSCode(encodeSCode({ date: SCORED_DATE, feedback: { injured: true } }))
    expect(r.feedback.injured).toBe(true)
  })

  it('injured=false round-trips', () => {
    const r = decodeSCode(encodeSCode({ date: SCORED_DATE, feedback: { injured: false } }))
    expect(r.feedback.injured).toBe(false)
  })
})

// ─── New field: environment_flags ────────────────────────────────────────────

describe('environment_flags', () => {
  function encodeWithEnv(environmentFlags) {
    return encodeSCode({ date: SCORED_DATE, feedback: { environmentFlags } })
  }

  it('0 (no flags) round-trips', () => {
    expect(decodeSCode(encodeWithEnv(0)).feedback.environmentFlags).toBe(0)
  })

  it('HOT flag (0b000001) round-trips', () => {
    expect(decodeSCode(encodeWithEnv(ENV_FLAGS.HOT)).feedback.environmentFlags).toBe(ENV_FLAGS.HOT)
  })

  it('COLD flag (0b000010) round-trips', () => {
    expect(decodeSCode(encodeWithEnv(ENV_FLAGS.COLD)).feedback.environmentFlags).toBe(ENV_FLAGS.COLD)
  })

  it('ALTITUDE_NOTABLE flag round-trips', () => {
    const f = ENV_FLAGS.ALTITUDE_NOTABLE
    expect(decodeSCode(encodeWithEnv(f)).feedback.environmentFlags).toBe(f)
  })

  it('all 6 flags set (0b111111=63) round-trips', () => {
    expect(decodeSCode(encodeWithEnv(63)).feedback.environmentFlags).toBe(63)
  })

  it('combined HOT+HUMID round-trips', () => {
    const flags = ENV_FLAGS.HOT | ENV_FLAGS.HUMID
    expect(decodeSCode(encodeWithEnv(flags)).feedback.environmentFlags).toBe(flags)
  })
})

// ─── New field: confidence ────────────────────────────────────────────────────

describe('confidence', () => {
  function encodeWithConf(confidence) {
    return encodeSCode({ date: SCORED_DATE, feedback: { confidence } })
  }

  it('confidence=1 (LOW) round-trips (stored as 0)', () => {
    expect(decodeSCode(encodeWithConf(1)).feedback.confidence).toBe(1)
  })

  it('confidence=3 (MODERATE) round-trips', () => {
    expect(decodeSCode(encodeWithConf(3)).feedback.confidence).toBe(3)
  })

  it('confidence=5 (PEAK) round-trips (stored as 4)', () => {
    expect(decodeSCode(encodeWithConf(5)).feedback.confidence).toBe(5)
  })
})

// ─── All new feedback fields together ────────────────────────────────────────

describe('full feedback block round-trip', () => {
  it('all feedback fields survive encode/decode', () => {
    const code = encodeSCode(FULL_V3)
    const r    = decodeSCode(code)
    expect(r.feedback.baseId).toBe(2)
    expect(r.feedback.rpe).toBe(4)
    expect(r.feedback.sleepQuality).toBe(2)
    expect(r.feedback.nutrition).toBe(2)
    expect(r.feedback.injured).toBe(false)
    expect(r.feedback.environmentFlags).toBe(ENV_FLAGS.HOT | ENV_FLAGS.HUMID)
    expect(r.feedback.confidence).toBe(3)
  })

  it('null feedback produces default values (not crash)', () => {
    const r = decodeSCode(encodeSCode({ date: SCORED_DATE, feedback: null }))
    expect(r.feedback).toBeDefined()
    expect(r.feedback.baseId).toBe(0)
    expect(r.feedback.injured).toBe(false)
    expect(r.feedback.environmentFlags).toBe(0)
  })
})

// ─── V2 backward compat ───────────────────────────────────────────────────────

describe('V2 backward compat (CS-01)', () => {
  it('S2- prefix is accepted by decodeSCode', () => {
    const v2code = _encodeV2ForTest({
      date:   SCORED_DATE,
      cardio: { exercise: '2mile_run', value: 900, exempt: false },
    })
    expect(v2code).toMatch(/^S2-/)
    expect(() => decodeSCode(v2code)).not.toThrow()
  })

  it('decoded V2 cardio data is preserved', () => {
    const v2code = _encodeV2ForTest({
      date:   SCORED_DATE,
      cardio: { exercise: '2mile_run', value: 900, exempt: false },
    })
    const r = decodeSCode(v2code)
    expect(r.cardio.exercise).toBe('2mile_run')
    expect(r.cardio.value).toBe(900)
    expect(r.schemaVersion).toBe(2)
  })

  it('decoded V2 result has feedback=null', () => {
    const v2code = _encodeV2ForTest({ date: SCORED_DATE })
    expect(decodeSCode(v2code).feedback).toBeNull()
  })

  it('decoded V2 result has cardio.walkPass=null', () => {
    const v2code = _encodeV2ForTest({
      date:   SCORED_DATE,
      cardio: { exercise: '2mile_run', value: 900, exempt: false },
    })
    expect(decodeSCode(v2code).cardio.walkPass).toBeNull()
  })

  it('decoded V2 bodyComp has measuredOffset=null', () => {
    const v2code = _encodeV2ForTest({
      date:     SCORED_DATE,
      bodyComp: { heightInches: 68, waistInches: 32, exempt: false },
    })
    expect(decodeSCode(v2code).bodyComp.measuredOffset).toBeNull()
  })

  it('isValidSCode accepts V2 codes', () => {
    const v2code = _encodeV2ForTest({ date: SCORED_DATE })
    expect(isValidSCode(v2code)).toBe(true)
  })

  it('V2 all-components round-trip preserves data', () => {
    const input = {
      date:     SCORED_DATE,
      cardio:   { exercise: '2mile_run', value: 720,  exempt: false },
      strength: { exercise: 'hrpu',      value: 60,   exempt: false },
      core:     { exercise: 'plank',     value: 180,  exempt: false },
      bodyComp: { heightInches: 65,      waistInches: 30, exempt: false },
    }
    const r = decodeSCode(_encodeV2ForTest(input))
    expect(r.cardio.value).toBe(720)
    expect(r.strength.exercise).toBe('hrpu')
    expect(r.core.exercise).toBe('plank')
    expect(r.bodyComp.heightInches).toBeCloseTo(65, 1)
  })
})

// ─── CS-01 / CS-09: version detection ────────────────────────────────────────

describe('version detection (CS-01 / CS-09)', () => {
  it('schema version 3 decodes without error', () => {
    const code = buildRawSCode(3)
    expect(() => decodeSCode(code)).not.toThrow()
    expect(decodeSCode(code).schemaVersion).toBe(3)
  })

  it('schema version 4 (future) throws "Please update the app."', () => {
    const code = buildRawSCode(4)
    expect(() => decodeSCode(code)).toThrow('Please update the app.')
  })

  it('unknown prefix throws "missing or incorrect prefix"', () => {
    expect(() => decodeSCode('S4-abc')).toThrow('missing or incorrect prefix')
    expect(() => decodeSCode('X2-abc')).toThrow('missing or incorrect prefix')
  })

  it('corrupted CRC throws "checksum mismatch"', () => {
    const code    = encodeSCode({ date: SCORED_DATE })
    const corrupt = code.slice(0, -2) + 'ZZ'
    expect(() => decodeSCode(corrupt)).toThrow()
  })

  it('null/empty input throws', () => {
    expect(() => decodeSCode(null)).toThrow()
    expect(() => decodeSCode('')).toThrow()
  })
})

// ─── Output size ──────────────────────────────────────────────────────────────

describe('output size', () => {
  it('full V3 code (all 4 components) is ≤ 26 chars', () => {
    expect(encodeSCode(FULL_V3).length).toBeLessThanOrEqual(26)
  })

  it('full V3 code is ≥ 20 chars', () => {
    expect(encodeSCode(FULL_V3).length).toBeGreaterThanOrEqual(20)
  })

  it('minimal code (no components) is shorter than full', () => {
    const minimal = encodeSCode({ date: SCORED_DATE })
    const full    = encodeSCode(FULL_V3)
    expect(minimal.length).toBeLessThan(full.length)
  })
})

// ─── isValidSCode ─────────────────────────────────────────────────────────────

describe('isValidSCode', () => {
  it('returns true for valid V3 code', () => {
    expect(isValidSCode(encodeSCode(FULL_V3))).toBe(true)
  })

  it('returns false for garbage string', () => {
    expect(isValidSCode('not-a-code')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isValidSCode(null)).toBe(false)
  })

  it('returns false for truncated code', () => {
    const code = encodeSCode(FULL_V3)
    expect(isValidSCode(code.slice(0, 8))).toBe(false)
  })
})
