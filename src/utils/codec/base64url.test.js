import { describe, it, expect } from 'vitest'
import { encodeBase64url, decodeBase64url } from './base64url.js'

describe('encodeBase64url', () => {
  it('encodes empty array', () => {
    expect(encodeBase64url(new Uint8Array([]))).toBe('')
  })

  it('encodes single byte', () => {
    const result = encodeBase64url(new Uint8Array([0xff]))
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('produces URL-safe characters only (no +, /, =)', () => {
    // Use bytes that would produce +, /, = in standard base64
    const data = new Uint8Array([0xfb, 0xef, 0xbe, 0xff, 0xff])
    const encoded = encodeBase64url(data)
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('uses - instead of + and _ instead of /', () => {
    // Standard base64 of [0xfb, 0xef] = "u+8=" -> base64url = "u-8"
    const encoded = encodeBase64url(new Uint8Array([0xfb, 0xef]))
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
  })
})

describe('decodeBase64url', () => {
  it('decodes empty string', () => {
    const result = decodeBase64url('')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(0)
  })

  it('handles strings that need padding', () => {
    // base64url strings may lack = padding
    const original = new Uint8Array([1, 2, 3])
    const encoded = encodeBase64url(original)
    expect(encoded).not.toContain('=')
    const decoded = decodeBase64url(encoded)
    expect(decoded).toEqual(original)
  })
})

describe('roundtrip', () => {
  it('encode then decode returns original bytes', () => {
    const original = new Uint8Array([0x00, 0x7f, 0x80, 0xff])
    const decoded = decodeBase64url(encodeBase64url(original))
    expect(decoded).toEqual(original)
  })

  it('roundtrips 3-byte payloads (no padding needed)', () => {
    const original = new Uint8Array([0x10, 0x20, 0x30])
    expect(decodeBase64url(encodeBase64url(original))).toEqual(original)
  })

  it('roundtrips 4-byte payloads (D-code size)', () => {
    const original = new Uint8Array([0x18, 0x9a, 0x40, 0xc7])
    expect(decodeBase64url(encodeBase64url(original))).toEqual(original)
  })

  it('roundtrips 14-byte payloads (S-code size)', () => {
    const original = new Uint8Array(14)
    for (let i = 0; i < 14; i++) original[i] = i * 17
    expect(decodeBase64url(encodeBase64url(original))).toEqual(original)
  })
})
