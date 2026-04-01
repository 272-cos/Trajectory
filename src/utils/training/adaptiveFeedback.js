/**
 * Adaptive Feedback System
 *
 * Lightweight feedback loop using RPE (Rate of Perceived Exertion) ratings.
 * After each workout, user rates "How hard was this? (1-5)".
 *
 * Detects three states:
 *   FATIGUE:       Avg RPE >= 4.5 over last 5 sessions -> reduce intensity, insert recovery
 *   PLATEAU:       No PI improvement across 2 consecutive PI cycles -> change stimulus
 *   UNDERTRAINING: All sessions <= 2 RPE over last 5 sessions -> increase volume ~10%
 *
 * Storage: localStorage key 'pfa_workout_rpe' - JSON array of { date, rpe, weekNum, phase }
 */

// ── Constants ────────────────────────────────────────────────────────────────

const RPE_STORAGE_KEY = 'pfa_workout_rpe'
const LOOKBACK_SESSIONS = 5

export const ADAPTATION_STATES = {
  NORMAL: 'normal',
  FATIGUED: 'fatigued',
  PLATEAU: 'plateau',
  UNDERTRAINED: 'undertrained',
}

export const RPE_LABELS = {
  1: 'Very Easy - barely felt it',
  2: 'Easy - could do much more',
  3: 'Moderate - good effort',
  4: 'Hard - pushed my limits',
  5: 'Maximal - nothing left',
}

export const RPE_SHORT_LABELS = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Moderate',
  4: 'Hard',
  5: 'Maximal',
}

// ── RPE Storage ──────────────────────────────────────────────────────────────

/**
 * Get all stored RPE entries.
 * @returns {Array<{ date: string, rpe: number, weekNum: number, phase: string }>}
 */
export function getRPEHistory() {
  try {
    const val = localStorage.getItem(RPE_STORAGE_KEY)
    if (!val) return []
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Record an RPE rating for a workout session.
 *
 * @param {string} dateISO - Date of the workout
 * @param {number} rpe - RPE rating 1-5
 * @param {number} weekNum - Plan week number
 * @param {string} phase - Phase name
 * @returns {boolean} true if saved
 */
export function recordRPE(dateISO, rpe, weekNum, phase) {
  if (rpe < 1 || rpe > 5 || !dateISO) return false

  const history = getRPEHistory()

  // Replace if same date exists (re-rating)
  const existingIdx = history.findIndex(e => e.date === dateISO)
  const entry = { date: dateISO, rpe: Math.round(rpe), weekNum, phase, ts: Date.now() }

  if (existingIdx >= 0) {
    history[existingIdx] = entry
  } else {
    history.push(entry)
  }

  // Keep only last 60 entries to avoid unbounded growth
  const trimmed = history.slice(-60)

  try {
    localStorage.setItem(RPE_STORAGE_KEY, JSON.stringify(trimmed))
    return true
  } catch {
    return false
  }
}

/**
 * Get RPE for a specific date, if recorded.
 * @param {string} dateISO
 * @returns {number|null}
 */
export function getRPEForDate(dateISO) {
  const history = getRPEHistory()
  const entry = history.find(e => e.date === dateISO)
  return entry ? entry.rpe : null
}

// ── Adaptation Detection ─────────────────────────────────────────────────────

/**
 * Analyze recent RPE history to detect adaptation state.
 *
 * @param {Array<{ date: string, rpe: number }>} [history] - RPE history (defaults to stored)
 * @returns {{ state: string, avgRPE: number, recommendation: string, adjustments: object }}
 */
export function detectAdaptationState(history) {
  const entries = history || getRPEHistory()

  if (entries.length < 3) {
    return {
      state: ADAPTATION_STATES.NORMAL,
      avgRPE: 0,
      recommendation: 'Not enough data yet. Keep logging workouts.',
      adjustments: { intensityMod: 0, volumeMod: 0, insertRecovery: false },
    }
  }

  // Look at last N sessions
  const recent = entries.slice(-LOOKBACK_SESSIONS)
  const avgRPE = recent.reduce((sum, e) => sum + e.rpe, 0) / recent.length

  // FATIGUE: Avg >= 4.5 over last 5 sessions
  if (avgRPE >= 4.5) {
    return {
      state: ADAPTATION_STATES.FATIGUED,
      avgRPE: Math.round(avgRPE * 10) / 10,
      recommendation: 'You are accumulating fatigue. Reducing intensity this week and adding a recovery session.',
      adjustments: {
        intensityMod: -1, // drop one intensity level
        volumeMod: -0.2,  // reduce volume 20%
        insertRecovery: true,
      },
    }
  }

  // UNDERTRAINING: All sessions <= 2 RPE
  if (recent.every(e => e.rpe <= 2)) {
    return {
      state: ADAPTATION_STATES.UNDERTRAINED,
      avgRPE: Math.round(avgRPE * 10) / 10,
      recommendation: 'Training feels very easy. Increasing volume by 10% to maintain progression.',
      adjustments: {
        intensityMod: 0,
        volumeMod: 0.1, // increase volume 10%
        insertRecovery: false,
      },
    }
  }

  // NORMAL
  return {
    state: ADAPTATION_STATES.NORMAL,
    avgRPE: Math.round(avgRPE * 10) / 10,
    recommendation: 'Training load is appropriate. Continue as planned.',
    adjustments: { intensityMod: 0, volumeMod: 0, insertRecovery: false },
  }
}

/**
 * Detect plateau by comparing PI workout results across cycles.
 * A plateau is flagged when 2 consecutive PI sessions show no improvement.
 *
 * @param {Array<{ date: string, value: number, exercise: string }>} piResults - PI workout results
 * @returns {{ isPlateaued: boolean, exercise: string|null, recommendation: string }}
 */
export function detectPlateau(piResults) {
  if (!piResults || piResults.length < 3) {
    return { isPlateaued: false, exercise: null, recommendation: '' }
  }

  // Group by exercise
  const byExercise = {}
  for (const r of piResults) {
    if (!byExercise[r.exercise]) byExercise[r.exercise] = []
    byExercise[r.exercise].push(r)
  }

  // Check each exercise for plateau
  for (const [exercise, results] of Object.entries(byExercise)) {
    if (results.length < 3) continue

    // Sort by date
    const sorted = [...results].sort((a, b) => a.date.localeCompare(b.date))
    const last3 = sorted.slice(-3)

    // Plateau: last 3 PI sessions show no meaningful improvement (< 2% gain)
    const first = last3[0].value
    const last = last3[2].value

    if (first > 0) {
      const changePercent = ((last - first) / first) * 100
      if (Math.abs(changePercent) < 2) {
        return {
          isPlateaued: true,
          exercise,
          recommendation: `Performance has plateaued on ${exercise}. Consider changing your training stimulus - try different exercises, rep schemes, or add tempo variation.`,
        }
      }
    }
  }

  return { isPlateaued: false, exercise: null, recommendation: '' }
}

/**
 * Apply adaptation adjustments to a workout prescription.
 * Modifies intensity and volume based on detected adaptation state.
 *
 * @param {object} session - Workout session from prescribeSession()
 * @param {object} adaptationResult - Result from detectAdaptationState()
 * @returns {object} Modified session
 */
export function applyAdaptation(session, adaptationResult) {
  if (!adaptationResult || adaptationResult.state === ADAPTATION_STATES.NORMAL) {
    return session
  }

  const { adjustments, state } = adaptationResult
  const modified = { ...session }

  // Intensity modification
  if (adjustments.intensityMod < 0) {
    const levels = ['low', 'moderate', 'high']
    const currentIdx = levels.indexOf(modified.intensity)
    const newIdx = Math.max(0, currentIdx + adjustments.intensityMod)
    modified.intensity = levels[newIdx]
    modified.adaptationNote = 'Intensity reduced - fatigue management'
  }

  // Volume modification flag (consumed by UI to show fewer sets)
  if (adjustments.volumeMod !== 0) {
    modified.volumeModifier = 1 + adjustments.volumeMod
  }

  // Recovery insertion flag
  if (adjustments.insertRecovery) {
    modified.insertRecoveryDay = true
  }

  modified.adaptationState = state

  return modified
}

// ── Cleanup utility ──────────────────────────────────────────────────────────

/**
 * Clear all RPE history from localStorage.
 */
export function clearRPEHistory() {
  try {
    localStorage.removeItem(RPE_STORAGE_KEY)
  } catch {
    // ignore
  }
}
