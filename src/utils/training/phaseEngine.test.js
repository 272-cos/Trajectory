import { describe, it, expect } from 'vitest'
import { getHeartRateZones, formatHeartRateZone } from './phaseEngine.js'

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
