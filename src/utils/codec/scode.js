/**
 * S-code (Self-Check Code) encoding/decoding
 *
 * VERSION 3 - Full design-spec payload
 * Format: S3-[base64url(bit-packed payload + CRC-8)]
 *
 * V3 bit layout (~110 bits, all 4 components present with run):
 *   Header    24  version:4, chart:4, date:15, diagnostic:1
 *   Flags      4  hasCardio:1, hasStrength:1, hasCore:1, hasBodyComp:1
 *   Cardio    14  exercise:2, exempt:1, [value:11]
 *             +1  [cardio_walk_pass:1]  - only when exercise=2km_walk AND not exempt
 *   Strength   9  exercise:1, exempt:1, [value:7]
 *   Core      14  exercise:2, exempt:1, [value:11]
 *   BodyComp  25  exempt:1, [height:11, waist:10, whtr_measured_offset:3]
 *   Feedback  20  base_id:3, rpe:3, sleep_quality:2, nutrition:2,
 *                 injured:1, environment_flags:6, confidence:3
 *
 * Backward compat: S2-prefixed codes decoded with V2 field layout; new fields → null.
 * CS-01/CS-09: schemaVersion > current → "Please update the app." error.
 *
 * Assessment object shape (encodeSCode input):
 *   date        {string|Date}  required
 *   cardio      {object|null}  exercise, value, exempt, walkPass (walk only)
 *   strength    {object|null}  exercise, value, exempt
 *   core        {object|null}  exercise, value, exempt
 *   bodyComp    {object|null}  heightInches, waistInches, measuredOffset (0-5), exempt
 *   feedback    {object|null}  baseId(0-7), rpe(1-5), sleepQuality(0-3),
 *                              nutrition(0-3), injured(bool), environmentFlags(0-63),
 *                              confidence(1-5)
 */

import { encodeBase64url, decodeBase64url } from './base64url.js'
import { crc8, verifyCrc8 } from './crc8.js'
import { isDiagnosticPeriod } from '../scoring/constants.js'
import {
  BitWriter,
  BitReader,
  CARDIO_EX,
  STRENGTH_EX,
  CORE_EX,
  CARDIO_EX_REV,
  STRENGTH_EX_REV,
  CORE_EX_REV,
  DATE_EPOCH,
} from './bitpack.js'

const SCHEMA_VERSION = 3
const CHART_VERSION  = 0
const PREFIX         = 'S3-'
const V2_PREFIX      = 'S2-'

function dateToDays(date) {
  const d = new Date(date)
  return Math.floor((d.getTime() - DATE_EPOCH.getTime()) / (1000 * 60 * 60 * 24))
}

function daysToDate(days) {
  return new Date(DATE_EPOCH.getTime() + days * 24 * 60 * 60 * 1000)
}

// ─── V3 encoder ──────────────────────────────────────────────────────────────

export function encodeSCode(assessment) {
  const {
    date,
    cardio    = null,
    strength  = null,
    core      = null,
    bodyComp  = null,
    feedback  = null,
  } = assessment

  if (!date) throw new Error('Assessment date is required')

  const writer     = new BitWriter()
  const dateDays   = dateToDays(date)
  const diagnostic = isDiagnosticPeriod(date) ? 1 : 0

  // ── Header (24 bits) ──
  writer.write(SCHEMA_VERSION, 4)
  writer.write(CHART_VERSION,  4)
  writer.write(dateDays,      15)
  writer.write(diagnostic,     1)

  // ── Presence flags (4 bits) ──
  writer.write(cardio   ? 1 : 0, 1)
  writer.write(strength ? 1 : 0, 1)
  writer.write(core     ? 1 : 0, 1)
  writer.write(bodyComp ? 1 : 0, 1)

  // ── Cardio (14 bits + optional walk_pass bit) ──
  if (cardio) {
    const exIdx = CARDIO_EX[cardio.exercise] ?? 0
    writer.write(exIdx,               2)
    writer.write(cardio.exempt ? 1 : 0, 1)
    if (!cardio.exempt) {
      writer.write(Math.min(Math.round(cardio.value ?? 0), 2047), 11)
      if (cardio.exercise === '2km_walk') {
        writer.write(cardio.walkPass ? 1 : 0, 1)   // cardio_walk_pass
      }
    }
  }

  // ── Strength (9 bits) ──
  if (strength) {
    writer.write(STRENGTH_EX[strength.exercise] ?? 0, 1)
    writer.write(strength.exempt ? 1 : 0, 1)
    if (!strength.exempt) writer.write(Math.min(Math.round(strength.value ?? 0), 127), 7)
  }

  // ── Core (14 bits) ──
  if (core) {
    writer.write(CORE_EX[core.exercise] ?? 0, 2)
    writer.write(core.exempt ? 1 : 0, 1)
    if (!core.exempt) writer.write(Math.min(Math.round(core.value ?? 0), 2047), 11)
  }

  // ── Body comp (25 bits when non-exempt) ──
  if (bodyComp) {
    writer.write(bodyComp.exempt ? 1 : 0, 1)
    if (!bodyComp.exempt) {
      const h      = Math.min(Math.round((bodyComp.heightInches ?? 0) * 10), 2047)
      const w      = Math.min(Math.round((bodyComp.waistInches  ?? 0) * 10), 1023)
      const offset = Math.min(Math.max(0, bodyComp.measuredOffset ?? 0), 7)
      writer.write(h,      11)
      writer.write(w,      10)
      writer.write(offset,  3)   // whtr_measured_offset
    }
  }

  // ── Feedback block (always 20 bits in V3) ──
  const fb = feedback ?? {}
  writer.write(Math.min(Math.max(0, fb.baseId           ?? 0), 7),  3)  // base_id
  writer.write(Math.min(Math.max(0, (fb.rpe        ?? 1) - 1), 4),  3)  // rpe 1-5 → 0-4
  writer.write(Math.min(Math.max(0, fb.sleepQuality ?? 0), 3),       2)  // sleep_quality
  writer.write(Math.min(Math.max(0, fb.nutrition    ?? 0), 3),       2)  // nutrition
  writer.write(fb.injured ? 1 : 0,                                   1)  // injured
  writer.write(Math.min(Math.max(0, fb.environmentFlags ?? 0), 63),  6)  // env bitmask
  writer.write(Math.min(Math.max(0, (fb.confidence ?? 1) - 1), 4),  3)  // confidence 1-5 → 0-4

  return _buildCode(PREFIX, writer)
}

// ─── V3 decoder ──────────────────────────────────────────────────────────────

export function decodeSCode(scode) {
  if (!scode) throw new Error('Invalid S-code: missing or incorrect prefix')

  // CS-01: S2- prefix → backward-compat V2 path
  if (scode.startsWith(V2_PREFIX)) return _decodeV2(scode.slice(V2_PREFIX.length))

  // CS-09: unknown prefix
  if (!scode.startsWith(PREFIX)) throw new Error('Invalid S-code: missing or incorrect prefix')

  const bytes = _decodePayload(scode.slice(PREFIX.length))
  const reader = new BitReader(bytes)

  const schemaVersion = reader.read(4)
  const chartVersion  = reader.read(4)
  const dateDays      = reader.read(15)
  const diagnostic    = reader.read(1)

  // CS-01: future schema → prompt update
  if (schemaVersion > SCHEMA_VERSION) {
    throw new Error('S-code from newer version. Please update the app.')
  }

  const hasCardio   = reader.read(1) === 1
  const hasStrength = reader.read(1) === 1
  const hasCore     = reader.read(1) === 1
  const hasBodyComp = reader.read(1) === 1

  let cardio = null
  if (hasCardio) {
    const exIdx  = reader.read(2)
    const exempt = reader.read(1) === 1
    let value    = null
    let walkPass = null
    if (!exempt) {
      value = reader.read(11)
      if (CARDIO_EX_REV[exIdx] === '2km_walk') walkPass = reader.read(1) === 1
    }
    cardio = { exercise: CARDIO_EX_REV[exIdx] ?? '2mile_run', value, exempt, walkPass }
  }

  let strength = null
  if (hasStrength) {
    const exIdx  = reader.read(1)
    const exempt = reader.read(1) === 1
    strength = {
      exercise: STRENGTH_EX_REV[exIdx] ?? 'pushups',
      value:    exempt ? null : reader.read(7),
      exempt,
    }
  }

  let core = null
  if (hasCore) {
    const exIdx  = reader.read(2)
    const exempt = reader.read(1) === 1
    core = {
      exercise: CORE_EX_REV[exIdx] ?? 'situps',
      value:    exempt ? null : reader.read(11),
      exempt,
    }
  }

  let bodyComp = null
  if (hasBodyComp) {
    const exempt = reader.read(1) === 1
    if (!exempt) {
      bodyComp = {
        heightInches:   reader.read(11) / 10,
        waistInches:    reader.read(10) / 10,
        measuredOffset: reader.read(3),
        exempt: false,
      }
    } else {
      bodyComp = { heightInches: null, waistInches: null, measuredOffset: null, exempt: true }
    }
  }

  // Feedback block (always present in V3)
  const baseId           = reader.read(3)
  const rpe              = reader.read(3) + 1    // stored 0-4, return 1-5
  const sleepQuality     = reader.read(2)
  const nutrition        = reader.read(2)
  const injured          = reader.read(1) === 1
  const environmentFlags = reader.read(6)
  const confidence       = reader.read(3) + 1    // stored 0-4, return 1-5

  return {
    date: daysToDate(dateDays),
    isDiagnostic: diagnostic === 1,
    schemaVersion,
    chartVersion,
    cardio,
    strength,
    core,
    bodyComp,
    feedback: { baseId, rpe, sleepQuality, nutrition, injured, environmentFlags, confidence },
  }
}

export function isValidSCode(scode) {
  try { decodeSCode(scode); return true }
  catch { return false }
}

// ─── V2 backward-compat decoder (internal) ───────────────────────────────────

function _decodeV2(payload) {
  const bytes  = _decodePayload(payload)
  const reader = new BitReader(bytes)

  const schemaVersion = reader.read(4)
  const chartVersion  = reader.read(4)
  const dateDays      = reader.read(15)
  const diagnostic    = reader.read(1)

  if (schemaVersion > 2) throw new Error('S-code from newer version. Please update the app.')

  const hasCardio   = reader.read(1) === 1
  const hasStrength = reader.read(1) === 1
  const hasCore     = reader.read(1) === 1
  const hasBodyComp = reader.read(1) === 1

  let cardio = null
  if (hasCardio) {
    const exIdx  = reader.read(2)
    const exempt = reader.read(1) === 1
    cardio = {
      exercise: CARDIO_EX_REV[exIdx] ?? '2mile_run',
      value:    exempt ? null : reader.read(11),
      exempt,
      walkPass: null,
    }
  }

  let strength = null
  if (hasStrength) {
    const exIdx  = reader.read(1)
    const exempt = reader.read(1) === 1
    strength = {
      exercise: STRENGTH_EX_REV[exIdx] ?? 'pushups',
      value:    exempt ? null : reader.read(7),
      exempt,
    }
  }

  let core = null
  if (hasCore) {
    const exIdx  = reader.read(2)
    const exempt = reader.read(1) === 1
    core = {
      exercise: CORE_EX_REV[exIdx] ?? 'situps',
      value:    exempt ? null : reader.read(11),
      exempt,
    }
  }

  let bodyComp = null
  if (hasBodyComp) {
    const exempt = reader.read(1) === 1
    if (!exempt) {
      bodyComp = {
        heightInches:   reader.read(11) / 10,
        waistInches:    reader.read(10) / 10,
        measuredOffset: null,   // not in V2
        exempt: false,
      }
    } else {
      bodyComp = { heightInches: null, waistInches: null, measuredOffset: null, exempt: true }
    }
  }

  return {
    date: daysToDate(dateDays),
    isDiagnostic: diagnostic === 1,
    schemaVersion,
    chartVersion,
    cardio,
    strength,
    core,
    bodyComp,
    feedback: null,   // not in V2
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function _decodePayload(b64) {
  let bytes
  try { bytes = decodeBase64url(b64) }
  catch { throw new Error('Invalid S-code: base64url decode failed') }
  if (!verifyCrc8(bytes)) throw new Error('Invalid S-code: checksum mismatch')
  return bytes.slice(0, -1)   // strip CRC byte before returning
}

function _buildCode(prefix, writer) {
  const bytes       = writer.getBytes()
  const crcValue    = crc8(bytes)
  const dataWithCrc = new Uint8Array(bytes.length + 1)
  dataWithCrc.set(bytes)
  dataWithCrc[bytes.length] = crcValue
  return prefix + encodeBase64url(dataWithCrc)
}

// ─── Test helper: V2 encoder (exported for backward-compat tests only) ────────

export function _encodeV2ForTest(assessment) {
  const { date, cardio = null, strength = null, core = null, bodyComp = null } = assessment
  if (!date) throw new Error('Assessment date is required')

  const writer     = new BitWriter()
  const dateDays   = dateToDays(date)
  const diagnostic = isDiagnosticPeriod(date) ? 1 : 0

  writer.write(2,            4)   // schema version 2
  writer.write(CHART_VERSION, 4)
  writer.write(dateDays,     15)
  writer.write(diagnostic,    1)
  writer.write(cardio   ? 1 : 0, 1)
  writer.write(strength ? 1 : 0, 1)
  writer.write(core     ? 1 : 0, 1)
  writer.write(bodyComp ? 1 : 0, 1)

  if (cardio) {
    writer.write(CARDIO_EX[cardio.exercise] ?? 0, 2)
    writer.write(cardio.exempt ? 1 : 0, 1)
    if (!cardio.exempt) writer.write(Math.min(Math.round(cardio.value ?? 0), 2047), 11)
  }
  if (strength) {
    writer.write(STRENGTH_EX[strength.exercise] ?? 0, 1)
    writer.write(strength.exempt ? 1 : 0, 1)
    if (!strength.exempt) writer.write(Math.min(Math.round(strength.value ?? 0), 127), 7)
  }
  if (core) {
    writer.write(CORE_EX[core.exercise] ?? 0, 2)
    writer.write(core.exempt ? 1 : 0, 1)
    if (!core.exempt) writer.write(Math.min(Math.round(core.value ?? 0), 2047), 11)
  }
  if (bodyComp) {
    writer.write(bodyComp.exempt ? 1 : 0, 1)
    if (!bodyComp.exempt) {
      writer.write(Math.min(Math.round((bodyComp.heightInches ?? 0) * 10), 2047), 11)
      writer.write(Math.min(Math.round((bodyComp.waistInches  ?? 0) * 10), 1023), 10)
    }
  }

  return _buildCode(V2_PREFIX, writer)
}
