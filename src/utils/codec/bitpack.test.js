import { describe, it, expect } from 'vitest'
import { BitWriter, BitReader } from './bitpack.js'

describe('BitWriter', () => {
  it('writes single bits correctly', () => {
    const w = new BitWriter()
    w.write(1, 1) // bit 1
    w.write(0, 1) // bit 0
    w.write(1, 1) // bit 1
    w.write(0, 1) // bit 0
    w.write(1, 1) // bit 1
    w.write(0, 1) // bit 0
    w.write(1, 1) // bit 1
    w.write(0, 1) // bit 0
    const bytes = w.getBytes()
    expect(bytes.length).toBe(1)
    expect(bytes[0]).toBe(0b10101010)
  })

  it('writes multi-bit values', () => {
    const w = new BitWriter()
    w.write(0b1111, 4)
    w.write(0b0000, 4)
    const bytes = w.getBytes()
    expect(bytes[0]).toBe(0xf0)
  })

  it('writes across byte boundaries', () => {
    const w = new BitWriter()
    w.write(0b111, 3)     // 3 bits
    w.write(0b11111, 5)   // 5 bits -> first byte done
    w.write(0b1010, 4)    // 4 bits into second byte
    const bytes = w.getBytes()
    expect(bytes.length).toBe(2)
    expect(bytes[0]).toBe(0b11111111)
    expect(bytes[1]).toBe(0b10100000) // 1010 + 0000 padding
  })

  it('pads remaining bits with zeros on getBytes', () => {
    const w = new BitWriter()
    w.write(1, 1) // just one bit
    const bytes = w.getBytes()
    expect(bytes.length).toBe(1)
    expect(bytes[0]).toBe(0b10000000)
  })

  it('clamps negative values to 0', () => {
    const w = new BitWriter()
    w.write(-5, 8)
    const bytes = w.getBytes()
    expect(bytes[0]).toBe(0)
  })

  it('clamps NaN to 0', () => {
    const w = new BitWriter()
    w.write(NaN, 8)
    const bytes = w.getBytes()
    expect(bytes[0]).toBe(0)
  })

  it('writes 16-bit values correctly', () => {
    const w = new BitWriter()
    w.write(0xabcd, 16)
    const bytes = w.getBytes()
    expect(bytes[0]).toBe(0xab)
    expect(bytes[1]).toBe(0xcd)
  })
})

describe('BitReader', () => {
  it('reads single bits', () => {
    const r = new BitReader(new Uint8Array([0b10110000]))
    expect(r.read(1)).toBe(1)
    expect(r.read(1)).toBe(0)
    expect(r.read(1)).toBe(1)
    expect(r.read(1)).toBe(1)
  })

  it('reads multi-bit values', () => {
    const r = new BitReader(new Uint8Array([0xf0]))
    expect(r.read(4)).toBe(0b1111)
    expect(r.read(4)).toBe(0b0000)
  })

  it('reads across byte boundaries', () => {
    const r = new BitReader(new Uint8Array([0xff, 0xa0]))
    r.read(3) // skip 3 bits
    expect(r.read(5)).toBe(0b11111) // last 5 of first byte
    expect(r.read(4)).toBe(0b1010)  // first 4 of second byte
  })

  it('returns 0 when reading past end', () => {
    const r = new BitReader(new Uint8Array([0xff]))
    r.read(8) // consume all
    expect(r.read(4)).toBe(0) // past end
  })

  it('reads 16-bit values', () => {
    const r = new BitReader(new Uint8Array([0xab, 0xcd]))
    expect(r.read(16)).toBe(0xabcd)
  })
})

describe('BitWriter/BitReader roundtrip', () => {
  it('write then read returns same values', () => {
    const w = new BitWriter()
    w.write(1, 4)       // schema version
    w.write(0, 1)       // gender
    w.write(27000, 16)  // dob days
    w.write(3, 4)       // flags

    const bytes = w.getBytes()
    const r = new BitReader(bytes)
    expect(r.read(4)).toBe(1)
    expect(r.read(1)).toBe(0)
    expect(r.read(16)).toBe(27000)
    expect(r.read(4)).toBe(3)
  })

  it('handles S-code-sized payloads (110 bits)', () => {
    const values = [3, 4, 25000, 1, 1, 0, 1, 850, 0, 41, 1, 0, 155, 2, 3, 1, 2, 0b010100, 3]
    const bits =   [4, 4, 15,    1, 1, 1, 2, 11,  1, 7,  1, 1, 11,  3, 3, 2, 2, 6,       3]

    const w = new BitWriter()
    for (let i = 0; i < values.length; i++) {
      w.write(values[i], bits[i])
    }

    const bytes = w.getBytes()
    const r = new BitReader(bytes)
    for (let i = 0; i < values.length; i++) {
      expect(r.read(bits[i])).toBe(values[i])
    }
  })
})
