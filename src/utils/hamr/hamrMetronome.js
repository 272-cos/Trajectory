/**
 * HAMR Metronome - Pure timing logic for USAF HAMR shuttle run
 *
 * Based on the official Leger 20m Multi-Stage Fitness Test (MSFT) protocol.
 * The USAF HAMR (High Aerobic Multi-level Run) follows this standard.
 *
 * Interval formula: time_per_shuttle = 20m / speed_in_m_per_s
 *   = 20 / (speedKmh * 1000 / 3600) ms
 *   = 72000 / speedKmh  ms
 *
 * Speed increases by 0.5 km/h each level starting at 8.5 km/h.
 * Shuttles per level follow the published Leger protocol table.
 */

/**
 * Official HAMR level data following Leger 20m shuttle run protocol.
 * Each entry defines the level number, shuttles required, and running speed.
 * Level 1 starts at 8.5 km/h; each subsequent level adds 0.5 km/h.
 */
export const HAMR_LEVELS = [
  { level: 1,  shuttlesInLevel: 7,  speedKmh: 8.5  },
  { level: 2,  shuttlesInLevel: 8,  speedKmh: 9.0  },
  { level: 3,  shuttlesInLevel: 8,  speedKmh: 9.5  },
  { level: 4,  shuttlesInLevel: 9,  speedKmh: 10.0 },
  { level: 5,  shuttlesInLevel: 9,  speedKmh: 10.5 },
  { level: 6,  shuttlesInLevel: 10, speedKmh: 11.0 },
  { level: 7,  shuttlesInLevel: 10, speedKmh: 11.5 },
  { level: 8,  shuttlesInLevel: 11, speedKmh: 12.0 },
  { level: 9,  shuttlesInLevel: 11, speedKmh: 12.5 },
  { level: 10, shuttlesInLevel: 11, speedKmh: 13.0 },
  { level: 11, shuttlesInLevel: 12, speedKmh: 13.5 },
  { level: 12, shuttlesInLevel: 12, speedKmh: 14.0 },
  { level: 13, shuttlesInLevel: 13, speedKmh: 14.5 },
  { level: 14, shuttlesInLevel: 13, speedKmh: 15.0 },
  { level: 15, shuttlesInLevel: 14, speedKmh: 15.5 },
  { level: 16, shuttlesInLevel: 14, speedKmh: 16.0 },
  { level: 17, shuttlesInLevel: 14, speedKmh: 16.5 },
  { level: 18, shuttlesInLevel: 15, speedKmh: 17.0 },
  { level: 19, shuttlesInLevel: 15, speedKmh: 17.5 },
  { level: 20, shuttlesInLevel: 16, speedKmh: 18.0 },
  { level: 21, shuttlesInLevel: 17, speedKmh: 18.5 },
]

/**
 * Compute shuttle interval in milliseconds for a given speed.
 * interval = 72000 / speedKmh  (rounded to nearest ms)
 * @param {number} speedKmh - Running speed in km/h
 * @returns {number} Interval in milliseconds
 */
export function speedToIntervalMs(speedKmh) {
  return Math.round(72000 / speedKmh)
}

/**
 * Build cumulative shuttle table for all HAMR levels.
 * Each row includes shuttleStart (cumulative before this level) and
 * shuttleEnd (cumulative after this level, inclusive), plus the
 * computed intervalMs for the level's speed.
 *
 * @returns {Array<{level, shuttlesInLevel, speedKmh, intervalMs, shuttleStart, shuttleEnd}>}
 */
export function buildLevelTable() {
  let cumulative = 0
  return HAMR_LEVELS.map(lvl => {
    const shuttleStart = cumulative
    cumulative += lvl.shuttlesInLevel
    return {
      level: lvl.level,
      shuttlesInLevel: lvl.shuttlesInLevel,
      speedKmh: lvl.speedKmh,
      intervalMs: speedToIntervalMs(lvl.speedKmh),
      shuttleStart,
      shuttleEnd: cumulative,
    }
  })
}

// Precomputed table used by all lookup helpers
const LEVEL_TABLE = buildLevelTable()

/** Maximum level number in the HAMR protocol */
export const MAX_LEVEL = HAMR_LEVELS[HAMR_LEVELS.length - 1].level

/** Total shuttles across all levels */
export const MAX_SHUTTLES = LEVEL_TABLE[LEVEL_TABLE.length - 1].shuttleEnd

/**
 * Get level info for a given 1-indexed total shuttle number.
 *
 * @param {number} shuttleNum - 1-indexed total shuttle count
 * @returns {{
 *   level: number,
 *   shuttleWithinLevel: number,
 *   shuttlesInLevel: number,
 *   intervalMs: number,
 *   speedKmh: number,
 *   isLastInLevel: boolean
 * }|null} Level info, or null if shuttleNum exceeds all levels
 */
export function getLevelForShuttle(shuttleNum) {
  if (shuttleNum < 1) return null
  for (const row of LEVEL_TABLE) {
    if (shuttleNum <= row.shuttleEnd) {
      return {
        level: row.level,
        shuttleWithinLevel: shuttleNum - row.shuttleStart,
        shuttlesInLevel: row.shuttlesInLevel,
        intervalMs: row.intervalMs,
        speedKmh: row.speedKmh,
        isLastInLevel: shuttleNum === row.shuttleEnd,
      }
    }
  }
  return null
}

/**
 * Get the interval in milliseconds for a given level number.
 * @param {number} level - Level number (1-indexed)
 * @returns {number|null} Interval in ms, or null if level not found
 */
export function getIntervalForLevel(level) {
  const row = LEVEL_TABLE.find(r => r.level === level)
  return row ? row.intervalMs : null
}

/**
 * Total cumulative shuttles completed at the end of a given level.
 * @param {number} level - Level number (1-indexed)
 * @returns {number} Cumulative shuttles at end of this level
 */
export function totalShuttlesAtEndOfLevel(level) {
  const row = LEVEL_TABLE.find(r => r.level === level)
  return row ? row.shuttleEnd : 0
}

/**
 * First 1-indexed shuttle number at the start of a given level.
 * @param {number} level - Level number (1-indexed)
 * @returns {number} First shuttle number of this level
 */
export function firstShuttleOfLevel(level) {
  const row = LEVEL_TABLE.find(r => r.level === level)
  return row ? row.shuttleStart + 1 : 1
}

/**
 * Format elapsed milliseconds as mm:ss display string.
 * @param {number} ms - Elapsed time in milliseconds
 * @returns {string} Formatted as "mm:ss"
 */
export function formatElapsed(ms) {
  const totalSecs = Math.floor(ms / 1000)
  const secs = totalSecs % 60
  const mins = Math.floor(totalSecs / 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
