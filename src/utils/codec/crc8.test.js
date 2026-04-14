import { describe, it, expect } from 'vitest'
import { crc8, verifyCrc8 } from './crc8.js'

describe('crc8', () => {
  it('returns 0 for empty data', () => {
    expect(crc8(new Uint8Array([]))).toBe(0)
  })

  it('returns consistent hash for same input', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03])
    expect(crc8(data)).toBe(crc8(data))
  })

  it('returns value in 0-255 range', () => {
    const data = new Uint8Array([0xff, 0xfe, 0xfd, 0xfc])
    const result = crc8(data)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(255)
  })

  it('produces different hashes for different inputs', () => {
    const a = crc8(new Uint8Array([0x01]))
    const b = crc8(new Uint8Array([0x02]))
    expect(a).not.toBe(b)
  })

  it('is sensitive to byte order', () => {
    const a = crc8(new Uint8Array([0x01, 0x02]))
    const b = crc8(new Uint8Array([0x02, 0x01]))
    expect(a).not.toBe(b)
  })
})

describe('verifyCrc8', () => {
  it('returns false for data shorter than 2 bytes', () => {
    expect(verifyCrc8(new Uint8Array([]))).toBe(false)
    expect(verifyCrc8(new Uint8Array([0x01]))).toBe(false)
  })

  it('verifies data with correct CRC appended', () => {
    const data = new Uint8Array([0x10, 0x20, 0x30])
    const checksum = crc8(data)
    const withCrc = new Uint8Array([...data, checksum])
    expect(verifyCrc8(withCrc)).toBe(true)
  })

  it('rejects data with wrong CRC', () => {
    const data = new Uint8Array([0x10, 0x20, 0x30])
    const wrongCrc = new Uint8Array([...data, 0x00])
    expect(verifyCrc8(wrongCrc)).toBe(false)
  })

  it('rejects data with flipped bit', () => {
    const data = new Uint8Array([0x10, 0x20, 0x30])
    const checksum = crc8(data)
    const corrupted = new Uint8Array([0x10, 0x21, 0x30, checksum])
    expect(verifyCrc8(corrupted)).toBe(false)
  })
})
