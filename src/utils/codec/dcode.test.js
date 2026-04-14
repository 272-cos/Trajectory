import { describe, it, expect } from 'vitest'
import { encodeDCode, decodeDCode, isValidDCode } from './dcode.js'

describe('encodeDCode', () => {
  it('returns a string starting with D1-', () => {
    const code = encodeDCode({ dob: '1987-03-15', gender: 'M' })
    expect(code.startsWith('D1-')).toBe(true)
  })

  it('produces a short code (~9 chars)', () => {
    const code = encodeDCode({ dob: '1990-06-01', gender: 'F' })
    expect(code.length).toBeLessThan(15)
    expect(code.length).toBeGreaterThan(5)
  })

  it('throws on missing dob', () => {
    expect(() => encodeDCode({ gender: 'M' })).toThrow('Missing required')
  })

  it('throws on missing gender', () => {
    expect(() => encodeDCode({ dob: '1990-01-01' })).toThrow('Missing required')
  })

  it('produces different codes for different genders', () => {
    const m = encodeDCode({ dob: '1990-01-01', gender: 'M' })
    const f = encodeDCode({ dob: '1990-01-01', gender: 'F' })
    expect(m).not.toBe(f)
  })

  it('produces different codes for different DOBs', () => {
    const a = encodeDCode({ dob: '1990-01-01', gender: 'M' })
    const b = encodeDCode({ dob: '1991-01-01', gender: 'M' })
    expect(a).not.toBe(b)
  })

  it('encodes URL-safe characters only', () => {
    const code = encodeDCode({ dob: '1985-12-25', gender: 'F' })
    const payload = code.slice(3)
    expect(payload).not.toMatch(/[+/= ]/)
  })
})

describe('decodeDCode', () => {
  it('throws on null input', () => {
    expect(() => decodeDCode(null)).toThrow()
  })

  it('throws on wrong prefix', () => {
    expect(() => decodeDCode('X1-abc')).toThrow('prefix')
  })

  it('throws on corrupted payload', () => {
    expect(() => decodeDCode('D1-!!!!')).toThrow()
  })

  it('throws on tampered CRC', () => {
    const code = encodeDCode({ dob: '1990-01-01', gender: 'M' })
    // Flip last character to corrupt CRC
    const tampered = code.slice(0, -1) + (code.slice(-1) === 'A' ? 'B' : 'A')
    expect(() => decodeDCode(tampered)).toThrow('checksum')
  })
})

describe('roundtrip', () => {
  it('encode then decode preserves gender M', () => {
    const result = decodeDCode(encodeDCode({ dob: '1987-03-15', gender: 'M' }))
    expect(result.gender).toBe('M')
  })

  it('encode then decode preserves gender F', () => {
    const result = decodeDCode(encodeDCode({ dob: '1987-03-15', gender: 'F' }))
    expect(result.gender).toBe('F')
  })

  it('encode then decode preserves DOB (within 1 day)', () => {
    const dob = '1987-03-15'
    const result = decodeDCode(encodeDCode({ dob, gender: 'M' }))
    const original = new Date(dob)
    const decoded = new Date(result.dob)
    const diffDays = Math.abs(decoded - original) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeLessThan(1)
  })

  it('handles edge DOB: 1950-01-01 (epoch)', () => {
    const result = decodeDCode(encodeDCode({ dob: '1950-01-01', gender: 'M' }))
    expect(result.gender).toBe('M')
    const decoded = new Date(result.dob)
    const epoch = new Date('1950-01-01')
    const diffDays = Math.abs(decoded - epoch) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeLessThan(1)
  })

  it('handles recent DOB: 2005-12-31', () => {
    const result = decodeDCode(encodeDCode({ dob: '2005-12-31', gender: 'F' }))
    expect(result.gender).toBe('F')
  })

  it('returns schemaVersion 1', () => {
    const result = decodeDCode(encodeDCode({ dob: '1990-01-01', gender: 'M' }))
    expect(result.schemaVersion).toBe(1)
  })
})

describe('isValidDCode', () => {
  it('returns true for valid code', () => {
    const code = encodeDCode({ dob: '1990-06-15', gender: 'M' })
    expect(isValidDCode(code)).toBe(true)
  })

  it('returns false for garbage', () => {
    expect(isValidDCode('garbage')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isValidDCode(null)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isValidDCode('')).toBe(false)
  })

  it('returns false for wrong prefix', () => {
    expect(isValidDCode('S3-abc')).toBe(false)
  })
})
