/**
 * Bit-packing primitives and codec constants for S-code V3
 *
 * V3 bit layout (~104 bits, all components present):
 * - Header:    24 bits  (version:4, chart:4, date:15, diagnostic:1)
 * - Flags:      4 bits  (component presence ×4)
 * - Cardio:   14-15 bits if present (exercise:2, exempt:1, [value:11], [walk_pass:1])
 * - Strength:   9 bits if present   (exercise:1, exempt:1, [value:7])
 * - Core:      14 bits if present   (exercise:2, exempt:1, [value:11])
 * - Body Comp: 25 bits if present   (exempt:1, [height:11, waist:10, whtr_offset:3])
 * - Feedback:  20 bits always       (base_id:3, rpe:3, sleep:2, nutrition:2,
 *                                    injured:1, env_flags:6, confidence:3)
 * Typical total: ~110 bits = 14 bytes → ~23 chars with S3- prefix + CRC
 */

// Date epoch: days since 2020-01-01 (covers 2020-2110 with 15 bits)
export const DATE_EPOCH = new Date('2020-01-01')

export class BitWriter {
  constructor() {
    this.bytes = []
    this.currentByte = 0
    this.bitPosition = 0
  }

  /**
   * Write bits to stream
   * @param {number} value - Value to write
   * @param {number} numBits - Number of bits
   */
  write(value, numBits) {
    for (let i = numBits - 1; i >= 0; i--) {
      const bit = (value >> i) & 1
      this.currentByte = (this.currentByte << 1) | bit
      this.bitPosition++

      if (this.bitPosition === 8) {
        this.bytes.push(this.currentByte)
        this.currentByte = 0
        this.bitPosition = 0
      }
    }
  }

  /**
   * Get packed bytes
   */
  getBytes() {
    // Flush remaining bits
    if (this.bitPosition > 0) {
      this.currentByte <<= (8 - this.bitPosition)
      this.bytes.push(this.currentByte)
    }
    return new Uint8Array(this.bytes)
  }
}

export class BitReader {
  constructor(bytes) {
    this.bytes = bytes
    this.bytePosition = 0
    this.bitPosition = 0
  }

  /**
   * Read bits from stream
   * @param {number} numBits - Number of bits to read
   */
  read(numBits) {
    let value = 0
    for (let i = 0; i < numBits; i++) {
      if (this.bytePosition >= this.bytes.length) return 0

      const bit = (this.bytes[this.bytePosition] >> (7 - this.bitPosition)) & 1
      value = (value << 1) | bit
      this.bitPosition++

      if (this.bitPosition === 8) {
        this.bytePosition++
        this.bitPosition = 0
      }
    }
    return value
  }
}

// Exercise encodings (minimal bits)
export const CARDIO_EX = { '2mile_run': 0, 'hamr': 1, '2km_walk': 2 }
export const STRENGTH_EX = { 'pushups': 0, 'hrpu': 1 }
export const CORE_EX = { 'situps': 0, 'clrc': 1, 'plank': 2 }

export const CARDIO_EX_REV = { 0: '2mile_run', 1: 'hamr', 2: '2km_walk' }
export const STRENGTH_EX_REV = { 0: 'pushups', 1: 'hrpu' }
export const CORE_EX_REV = { 0: 'situps', 1: 'clrc', 2: 'plank' }

// Base registry: 7 USAF installations ≥5,000 ft elevation (§4, design.md)
// Index 0 = N/A; indices 1-7 correspond to base_id values in the S-code.
export const BASE_REGISTRY = [
  null,
  { id: 1, name: 'USAF Academy',          state: 'CO', elevationFt: 7258 },
  { id: 2, name: 'Schriever SFB',         state: 'CO', elevationFt: 6200 },
  { id: 3, name: 'Cheyenne Mountain SFS', state: 'CO', elevationFt: 6100 },
  { id: 4, name: 'F.E. Warren AFB',       state: 'WY', elevationFt: 6065 },
  { id: 5, name: 'Peterson SFB',          state: 'CO', elevationFt: 6035 },
  { id: 6, name: 'Buckley SFB',           state: 'CO', elevationFt: 5662 },
  { id: 7, name: 'Kirtland AFB',          state: 'NM', elevationFt: 5400 },
]

// Environment condition bitmasks (6 bits, bit 0 = LSB)
export const ENV_FLAGS = {
  HOT:              0b000001,
  COLD:             0b000010,
  HUMID:            0b000100,
  WINDY:            0b001000,
  ALTITUDE_NOTABLE: 0b010000,
  INDOOR:           0b100000,
}

// Feedback label arrays (index = stored bit value)
export const RPE_LABELS          = ['EASY', 'MODERATE', 'HARD', 'VERY_HARD', 'MAXIMAL']
export const SLEEP_QUALITY_LABELS = ['POOR', 'FAIR', 'GOOD', 'EXCELLENT']
export const NUTRITION_LABELS     = ['FASTED', 'LIGHT', 'NORMAL', 'HEAVY']
export const CONFIDENCE_LABELS    = ['LOW', 'FAIR', 'MODERATE', 'HIGH', 'PEAK']
