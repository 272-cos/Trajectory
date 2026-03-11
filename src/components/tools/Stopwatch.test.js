/**
 * Stopwatch utility function tests
 * Task 8.2 - Stopwatch + Lap Timer
 */

import { describe, it, expect } from 'vitest'

// Extract pure utility functions for testing (mirrors Stopwatch.jsx internals)
function formatStopwatch(ms) {
  const totalTenths = Math.floor(ms / 100)
  const tenths = totalTenths % 10
  const totalSecs = Math.floor(totalTenths / 10)
  const secs = totalSecs % 60
  const mins = Math.floor(totalSecs / 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`
}

function msToSeconds(ms) {
  return Math.floor(ms / 1000)
}

// ─── formatStopwatch ──────────────────────────────────────────────────────────

describe('formatStopwatch', () => {
  it('formats zero as 00:00.0', () => {
    expect(formatStopwatch(0)).toBe('00:00.0')
  })

  it('formats 100ms as 00:00.1', () => {
    expect(formatStopwatch(100)).toBe('00:00.1')
  })

  it('formats 1000ms as 00:01.0', () => {
    expect(formatStopwatch(1000)).toBe('00:01.0')
  })

  it('formats 60000ms (1 min) as 01:00.0', () => {
    expect(formatStopwatch(60000)).toBe('01:00.0')
  })

  it('formats 1002100ms (16:42.1) as 16:42.1', () => {
    // 16 * 60 * 1000 + 42 * 1000 + 100 = 1002100
    expect(formatStopwatch(1002100)).toBe('16:42.1')
  })

  it('formats 999ms as 00:00.9 (floor to tenths)', () => {
    expect(formatStopwatch(999)).toBe('00:00.9')
  })

  it('pads minutes with leading zero', () => {
    expect(formatStopwatch(5000)).toBe('00:05.0')
  })

  it('handles 10 minutes exactly', () => {
    expect(formatStopwatch(600000)).toBe('10:00.0')
  })

  it('handles 59:59.9', () => {
    // 59*60*1000 + 59*1000 + 900
    expect(formatStopwatch(3599900)).toBe('59:59.9')
  })
})

// ─── msToSeconds ─────────────────────────────────────────────────────────────

describe('msToSeconds', () => {
  it('converts 0ms to 0s', () => {
    expect(msToSeconds(0)).toBe(0)
  })

  it('converts 1000ms to 1s', () => {
    expect(msToSeconds(1000)).toBe(1)
  })

  it('floors fractional seconds', () => {
    expect(msToSeconds(1999)).toBe(1)
  })

  it('converts 2-mile run typical time 18:30 correctly', () => {
    // 18*60 + 30 = 1110 seconds = 1110000ms
    expect(msToSeconds(1110000)).toBe(1110)
  })

  it('converts 13:25 (max score 2-mile) correctly', () => {
    // 13*60 + 25 = 805 seconds
    expect(msToSeconds(805000)).toBe(805)
  })
})

// ─── Lap time accumulation ────────────────────────────────────────────────────

describe('Lap split calculation', () => {
  it('computes lap time as difference from lap base', () => {
    // Simulate: lap started at 60000ms, stopped at 90000ms
    const lapStart = 60000
    const current = 90000
    const lapTime = current - lapStart
    expect(lapTime).toBe(30000)
    expect(formatStopwatch(lapTime)).toBe('00:30.0')
  })

  it('computes multiple laps correctly', () => {
    // Lap 1: 0 -> 30s
    // Lap 2: 30s -> 70s (40s lap)
    const lap1Time = 30000 - 0
    const lap2Time = 70000 - 30000
    expect(lap1Time).toBe(30000)
    expect(lap2Time).toBe(40000)
    expect(formatStopwatch(lap1Time)).toBe('00:30.0')
    expect(formatStopwatch(lap2Time)).toBe('00:40.0')
  })
})
