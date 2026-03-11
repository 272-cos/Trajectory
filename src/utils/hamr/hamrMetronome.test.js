/**
 * HAMR Metronome unit tests
 * Task 8.3 - HAMR Practice Metronome
 *
 * Verifies:
 * - Beep intervals match official Leger 20m protocol timing (within 1ms rounding)
 * - Shuttle-to-level mapping is correct
 * - Cumulative shuttle counts are accurate
 * - Level selector helpers return correct values
 * - formatElapsed formats time correctly
 */

import { describe, it, expect } from 'vitest'
import {
  HAMR_LEVELS,
  MAX_LEVEL,
  MAX_SHUTTLES,
  speedToIntervalMs,
  buildLevelTable,
  getLevelForShuttle,
  getIntervalForLevel,
  totalShuttlesAtEndOfLevel,
  firstShuttleOfLevel,
  formatElapsed,
} from './hamrMetronome.js'

// ─── speedToIntervalMs ────────────────────────────────────────────────────────

describe('speedToIntervalMs', () => {
  it('Level 1 (8.5 km/h) -> 8471ms (round(72000/8.5))', () => {
    expect(speedToIntervalMs(8.5)).toBe(Math.round(72000 / 8.5))
  })

  it('Level 2 (9.0 km/h) -> 8000ms', () => {
    expect(speedToIntervalMs(9.0)).toBe(8000)
  })

  it('Level 8 (12.0 km/h) -> 6000ms', () => {
    expect(speedToIntervalMs(12.0)).toBe(6000)
  })

  it('Level 21 (18.5 km/h) -> round(72000/18.5)', () => {
    expect(speedToIntervalMs(18.5)).toBe(Math.round(72000 / 18.5))
  })

  it('all intervals are positive', () => {
    HAMR_LEVELS.forEach(({ speedKmh }) => {
      expect(speedToIntervalMs(speedKmh)).toBeGreaterThan(0)
    })
  })

  it('intervals decrease as speed increases (faster levels = shorter intervals)', () => {
    for (let i = 1; i < HAMR_LEVELS.length; i++) {
      const prev = speedToIntervalMs(HAMR_LEVELS[i - 1].speedKmh)
      const curr = speedToIntervalMs(HAMR_LEVELS[i].speedKmh)
      expect(curr).toBeLessThan(prev)
    }
  })
})

// ─── HAMR_LEVELS table structure ──────────────────────────────────────────────

describe('HAMR_LEVELS table', () => {
  it('has 21 levels', () => {
    expect(HAMR_LEVELS.length).toBe(21)
  })

  it('starts at level 1', () => {
    expect(HAMR_LEVELS[0].level).toBe(1)
  })

  it('ends at level 21', () => {
    expect(HAMR_LEVELS[HAMR_LEVELS.length - 1].level).toBe(21)
  })

  it('level 1 speed is 8.5 km/h', () => {
    expect(HAMR_LEVELS[0].speedKmh).toBe(8.5)
  })

  it('level 21 speed is 18.5 km/h', () => {
    expect(HAMR_LEVELS[20].speedKmh).toBe(18.5)
  })

  it('speeds increase by 0.5 km/h per level', () => {
    for (let i = 1; i < HAMR_LEVELS.length; i++) {
      const diff = HAMR_LEVELS[i].speedKmh - HAMR_LEVELS[i - 1].speedKmh
      expect(diff).toBeCloseTo(0.5, 5)
    }
  })

  it('all levels have positive shuttlesInLevel', () => {
    HAMR_LEVELS.forEach(({ shuttlesInLevel }) => {
      expect(shuttlesInLevel).toBeGreaterThan(0)
    })
  })

  it('level 1 has 7 shuttles', () => {
    expect(HAMR_LEVELS[0].shuttlesInLevel).toBe(7)
  })

  it('level 2 has 8 shuttles', () => {
    expect(HAMR_LEVELS[1].shuttlesInLevel).toBe(8)
  })
})

// ─── buildLevelTable ──────────────────────────────────────────────────────────

describe('buildLevelTable', () => {
  const table = buildLevelTable()

  it('returns 21 rows', () => {
    expect(table.length).toBe(21)
  })

  it('level 1 shuttleStart = 0, shuttleEnd = 7', () => {
    expect(table[0].shuttleStart).toBe(0)
    expect(table[0].shuttleEnd).toBe(7)
  })

  it('level 2 shuttleStart = 7, shuttleEnd = 15', () => {
    expect(table[1].shuttleStart).toBe(7)
    expect(table[1].shuttleEnd).toBe(15)
  })

  it('level 3 shuttleStart = 15, shuttleEnd = 23', () => {
    expect(table[2].shuttleStart).toBe(15)
    expect(table[2].shuttleEnd).toBe(23)
  })

  it('level 4 shuttleStart = 23, shuttleEnd = 32', () => {
    expect(table[3].shuttleStart).toBe(23)
    expect(table[3].shuttleEnd).toBe(32)
  })

  it('cumulative shuttleEnd is monotonically increasing', () => {
    for (let i = 1; i < table.length; i++) {
      expect(table[i].shuttleEnd).toBeGreaterThan(table[i - 1].shuttleEnd)
    }
  })

  it('each row shuttleEnd - shuttleStart = shuttlesInLevel', () => {
    table.forEach(row => {
      expect(row.shuttleEnd - row.shuttleStart).toBe(row.shuttlesInLevel)
    })
  })

  it('computed intervalMs matches speedToIntervalMs for each level', () => {
    table.forEach(row => {
      expect(row.intervalMs).toBe(speedToIntervalMs(row.speedKmh))
    })
  })
})

// ─── MAX_LEVEL and MAX_SHUTTLES ───────────────────────────────────────────────

describe('MAX_LEVEL and MAX_SHUTTLES', () => {
  it('MAX_LEVEL is 21', () => {
    expect(MAX_LEVEL).toBe(21)
  })

  it('MAX_SHUTTLES equals totalShuttlesAtEndOfLevel(21)', () => {
    expect(MAX_SHUTTLES).toBe(totalShuttlesAtEndOfLevel(21))
  })

  it('MAX_SHUTTLES is positive and reasonable (> 100)', () => {
    expect(MAX_SHUTTLES).toBeGreaterThan(100)
  })
})

// ─── getLevelForShuttle ───────────────────────────────────────────────────────

describe('getLevelForShuttle', () => {
  it('shuttle 1 is in level 1, shuttle 1/7', () => {
    const info = getLevelForShuttle(1)
    expect(info.level).toBe(1)
    expect(info.shuttleWithinLevel).toBe(1)
    expect(info.shuttlesInLevel).toBe(7)
    expect(info.isLastInLevel).toBe(false)
  })

  it('shuttle 7 is the last in level 1', () => {
    const info = getLevelForShuttle(7)
    expect(info.level).toBe(1)
    expect(info.shuttleWithinLevel).toBe(7)
    expect(info.isLastInLevel).toBe(true)
  })

  it('shuttle 8 is first in level 2', () => {
    const info = getLevelForShuttle(8)
    expect(info.level).toBe(2)
    expect(info.shuttleWithinLevel).toBe(1)
    expect(info.isLastInLevel).toBe(false)
  })

  it('shuttle 15 is last in level 2 (7+8=15)', () => {
    const info = getLevelForShuttle(15)
    expect(info.level).toBe(2)
    expect(info.shuttleWithinLevel).toBe(8)
    expect(info.isLastInLevel).toBe(true)
  })

  it('shuttle 16 is first in level 3', () => {
    const info = getLevelForShuttle(16)
    expect(info.level).toBe(3)
    expect(info.shuttleWithinLevel).toBe(1)
  })

  it('returns correct intervalMs for level 1 (8471ms)', () => {
    const info = getLevelForShuttle(1)
    expect(info.intervalMs).toBe(speedToIntervalMs(8.5))
  })

  it('returns correct intervalMs for level 8 (6000ms)', () => {
    const info = getLevelForShuttle(getLevelStartShuttleForLevel8())
    expect(info.intervalMs).toBe(6000)
    expect(info.speedKmh).toBe(12.0)
  })

  it('returns null for shuttle 0', () => {
    expect(getLevelForShuttle(0)).toBeNull()
  })

  it('returns null for negative shuttle', () => {
    expect(getLevelForShuttle(-1)).toBeNull()
  })

  it('returns null for shuttle beyond max', () => {
    expect(getLevelForShuttle(MAX_SHUTTLES + 1)).toBeNull()
  })

  it('last shuttle of last level is marked isLastInLevel', () => {
    const info = getLevelForShuttle(MAX_SHUTTLES)
    expect(info).not.toBeNull()
    expect(info.level).toBe(MAX_LEVEL)
    expect(info.isLastInLevel).toBe(true)
  })
})

// Helper: find first shuttle of level 8 (cumulative sum)
function getLevelStartShuttleForLevel8() {
  return firstShuttleOfLevel(8)
}

// ─── getIntervalForLevel ──────────────────────────────────────────────────────

describe('getIntervalForLevel', () => {
  it('level 1 = 8471ms (round(72000/8.5))', () => {
    expect(getIntervalForLevel(1)).toBe(Math.round(72000 / 8.5))
  })

  it('level 2 = 8000ms', () => {
    expect(getIntervalForLevel(2)).toBe(8000)
  })

  it('level 8 = 6000ms (12.0 km/h)', () => {
    expect(getIntervalForLevel(8)).toBe(6000)
  })

  it('level 21 = round(72000/18.5)', () => {
    expect(getIntervalForLevel(21)).toBe(Math.round(72000 / 18.5))
  })

  it('returns null for level 0', () => {
    expect(getIntervalForLevel(0)).toBeNull()
  })

  it('returns null for level 22', () => {
    expect(getIntervalForLevel(22)).toBeNull()
  })

  it('all valid levels return positive numbers', () => {
    for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
      expect(getIntervalForLevel(lvl)).toBeGreaterThan(0)
    }
  })
})

// ─── totalShuttlesAtEndOfLevel ────────────────────────────────────────────────

describe('totalShuttlesAtEndOfLevel', () => {
  it('level 1 ends at shuttle 7', () => {
    expect(totalShuttlesAtEndOfLevel(1)).toBe(7)
  })

  it('level 2 ends at shuttle 15 (7+8)', () => {
    expect(totalShuttlesAtEndOfLevel(2)).toBe(15)
  })

  it('level 3 ends at shuttle 23 (7+8+8)', () => {
    expect(totalShuttlesAtEndOfLevel(3)).toBe(23)
  })

  it('level 4 ends at shuttle 32 (7+8+8+9)', () => {
    expect(totalShuttlesAtEndOfLevel(4)).toBe(32)
  })

  it('returns 0 for invalid level', () => {
    expect(totalShuttlesAtEndOfLevel(0)).toBe(0)
    expect(totalShuttlesAtEndOfLevel(22)).toBe(0)
  })

  it('level end matches cumulative sum of shuttlesInLevel', () => {
    let cumulative = 0
    for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
      cumulative += HAMR_LEVELS[lvl - 1].shuttlesInLevel
      expect(totalShuttlesAtEndOfLevel(lvl)).toBe(cumulative)
    }
  })
})

// ─── firstShuttleOfLevel ──────────────────────────────────────────────────────

describe('firstShuttleOfLevel', () => {
  it('level 1 first shuttle is 1', () => {
    expect(firstShuttleOfLevel(1)).toBe(1)
  })

  it('level 2 first shuttle is 8 (after 7 level-1 shuttles)', () => {
    expect(firstShuttleOfLevel(2)).toBe(8)
  })

  it('level 3 first shuttle is 16 (after 7+8=15)', () => {
    expect(firstShuttleOfLevel(3)).toBe(16)
  })

  it('firstShuttleOfLevel(N) = totalShuttlesAtEndOfLevel(N-1) + 1', () => {
    for (let lvl = 2; lvl <= MAX_LEVEL; lvl++) {
      expect(firstShuttleOfLevel(lvl)).toBe(totalShuttlesAtEndOfLevel(lvl - 1) + 1)
    }
  })

  it('getLevelForShuttle of firstShuttleOfLevel returns shuttleWithinLevel = 1', () => {
    for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
      const info = getLevelForShuttle(firstShuttleOfLevel(lvl))
      expect(info.shuttleWithinLevel).toBe(1)
      expect(info.level).toBe(lvl)
    }
  })
})

// ─── Official timing accuracy (within 50ms tolerance per acceptance criteria) ─

describe('Official HAMR timing accuracy (within 50ms of 72000/speed)', () => {
  it('level 1 interval within 50ms of exact (72000/8.5 = 8470.59ms)', () => {
    const exact = 72000 / 8.5
    const computed = getIntervalForLevel(1)
    expect(Math.abs(computed - exact)).toBeLessThan(50)
  })

  it('level 5 interval within 50ms of exact (72000/10.5 = 6857.1ms)', () => {
    const exact = 72000 / 10.5
    const computed = getIntervalForLevel(5)
    expect(Math.abs(computed - exact)).toBeLessThan(50)
  })

  it('level 10 interval within 50ms of exact (72000/13.0 = 5538.5ms)', () => {
    const exact = 72000 / 13.0
    const computed = getIntervalForLevel(10)
    expect(Math.abs(computed - exact)).toBeLessThan(50)
  })

  it('level 15 interval within 50ms of exact (72000/15.5 = 4645.2ms)', () => {
    const exact = 72000 / 15.5
    const computed = getIntervalForLevel(15)
    expect(Math.abs(computed - exact)).toBeLessThan(50)
  })

  it('level 21 interval within 50ms of exact (72000/18.5 = 3891.9ms)', () => {
    const exact = 72000 / 18.5
    const computed = getIntervalForLevel(21)
    expect(Math.abs(computed - exact)).toBeLessThan(50)
  })

  it('all 21 levels are within 1ms of round(72000/speed) - rounding only', () => {
    HAMR_LEVELS.forEach(({ level, speedKmh }) => {
      const expected = Math.round(72000 / speedKmh)
      const computed = getIntervalForLevel(level)
      expect(Math.abs(computed - expected)).toBeLessThanOrEqual(1)
    })
  })
})

// ─── formatElapsed ────────────────────────────────────────────────────────────

describe('formatElapsed', () => {
  it('formats 0ms as "00:00"', () => {
    expect(formatElapsed(0)).toBe('00:00')
  })

  it('formats 1000ms as "00:01"', () => {
    expect(formatElapsed(1000)).toBe('00:01')
  })

  it('formats 60000ms as "01:00"', () => {
    expect(formatElapsed(60000)).toBe('01:00')
  })

  it('formats 90000ms as "01:30"', () => {
    expect(formatElapsed(90000)).toBe('01:30')
  })

  it('formats 599000ms as "09:59"', () => {
    expect(formatElapsed(599000)).toBe('09:59')
  })

  it('floors fractional seconds', () => {
    expect(formatElapsed(1999)).toBe('00:01')
  })

  it('pads minutes and seconds with leading zeros', () => {
    expect(formatElapsed(5000)).toBe('00:05')
  })
})
