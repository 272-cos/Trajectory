/**
 * localStorage utilities for PFA Tracker
 * Primary storage for D-code, S-codes, and user preferences
 */

// ── Storage error notification ──────────────────────────────────────────────
// Callback for surfacing write failures to the UI (connected by AppContext).
let _onStorageError = null

/**
 * Register a callback for storage write failures (quota exceeded, etc.).
 * @param {function} cb - Called with (message: string) when a write fails
 */
export function onStorageError(cb) { _onStorageError = cb }

/**
 * Attempt a localStorage.setItem, catching QuotaExceededError and notifying.
 * @returns {boolean} true if the write succeeded
 */
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    if (error?.name === 'QuotaExceededError' || error?.code === 22) {
      _onStorageError?.('Storage is full. Your data was not saved. Export a backup from the Tools tab and clear old data.')
    } else {
      _onStorageError?.('Could not save data to browser storage.')
    }
    console.error('localStorage write failed:', error)
    return false
  }
}

const STORAGE_KEYS = {
  DCODE: 'pfa_dcode',
  SCODES: 'pfa_scodes',
  TARGET_DATE: 'pfa_target_date',
  ONBOARDED: 'pfa_onboarded',
  DARK_MODE: 'pfa_dark_mode',
  PERSONAL_GOAL: 'pfa_personal_goal',
}

/**
 * Get D-code from localStorage
 * @returns {string|null} D-code or null if not found
 */
export function getDCode() {
  try {
    return localStorage.getItem(STORAGE_KEYS.DCODE)
  } catch (error) {
    console.error('Error reading D-code from localStorage:', error)
    return null
  }
}

/**
 * Save D-code to localStorage
 * @param {string} dcode - D-code string
 */
export function saveDCode(dcode) {
  safeSetItem(STORAGE_KEYS.DCODE, dcode)
}

/**
 * Get all S-codes from localStorage
 * @returns {string[]} Array of S-code strings
 */
export function getSCodes() {
  try {
    const scodes = localStorage.getItem(STORAGE_KEYS.SCODES)
    if (!scodes) return []
    const parsed = JSON.parse(scodes)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Error reading S-codes from localStorage:', error)
    return []
  }
}

/**
 * Add S-code to localStorage
 * @param {string} scode - S-code string to add
 */
export function addSCode(scode) {
  const scodes = getSCodes()
  if (!scodes.includes(scode)) {
    scodes.push(scode)
    safeSetItem(STORAGE_KEYS.SCODES, JSON.stringify(scodes))
  }
}

/**
 * Remove S-code from localStorage
 * @param {string} scode - S-code string to remove
 */
export function removeSCode(scode) {
  const scodes = getSCodes()
  const filtered = scodes.filter(s => s !== scode)
  safeSetItem(STORAGE_KEYS.SCODES, JSON.stringify(filtered))
}

/**
 * Get target PFA date from localStorage
 * @returns {string|null} ISO date string or null
 */
export function getTargetDate() {
  try {
    return localStorage.getItem(STORAGE_KEYS.TARGET_DATE)
  } catch (error) {
    console.error('Error reading target date from localStorage:', error)
    return null
  }
}

/**
 * Save target PFA date to localStorage
 * @param {string} date - ISO date string
 */
export function saveTargetDate(date) {
  safeSetItem(STORAGE_KEYS.TARGET_DATE, date)
}

/**
 * Check if user has completed onboarding
 * @returns {boolean}
 */
export function isOnboarded() {
  try {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true'
  } catch (error) {
    console.error('Error reading onboarding status from localStorage:', error)
    return false
  }
}

/**
 * Mark user as onboarded
 */
export function setOnboarded() {
  safeSetItem(STORAGE_KEYS.ONBOARDED, 'true')
}

// ── Dark mode ────────────────────────────────────────────────────────────────

export function getDarkMode() {
  try {
    return localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true'
  } catch {
    return false
  }
}

export function saveDarkMode(enabled) {
  safeSetItem(STORAGE_KEYS.DARK_MODE, String(enabled))
}

// ── Personal score goal ──────────────────────────────────────────────────────

export function getPersonalGoal() {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.PERSONAL_GOAL)
    const num = val ? parseFloat(val) : null
    return num != null && !isNaN(num) ? num : 75.0
  } catch {
    return 75.0
  }
}

export function savePersonalGoal(goal) {
  safeSetItem(STORAGE_KEYS.PERSONAL_GOAL, String(goal))
}

// ── Draft autosave ───────────────────────────────────────────────────────────

const DRAFT_KEY = 'pfa_draft'

/**
 * Save self-check draft to localStorage (debounced by caller)
 * @param {object} draft - Form state snapshot
 */
export function saveDraft(draft) {
  safeSetItem(DRAFT_KEY, JSON.stringify({ ...draft, _ts: Date.now() }))
}

/**
 * Load self-check draft from localStorage
 * @returns {object|null} Draft state or null
 */
export function loadDraft() {
  try {
    const val = localStorage.getItem(DRAFT_KEY)
    if (!val) return null
    const parsed = JSON.parse(val)
    return (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Clear self-check draft from localStorage
 */
export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}

/**
 * Clear all app data from localStorage
 */
export function clearAllData() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    localStorage.removeItem('pfa_outliers')
    localStorage.removeItem('pfa_exercise_prefs')
    localStorage.removeItem('pfa_personal_goal')
    localStorage.removeItem('pfa_practice_sessions')
    localStorage.removeItem(PREFERRED_DAYS_KEY)
    localStorage.removeItem(DRAFT_KEY)
    localStorage.removeItem('pfa_selected_base')
    localStorage.removeItem('pfa_completed_days')
    localStorage.removeItem('pfa_show_milestones')
    localStorage.removeItem('pfa_chart_banner_dismissed')
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

/**
 * Get all outlier-flagged S-codes from localStorage
 * @returns {string[]} Array of S-code strings flagged as outliers
 */
export function getOutliers() {
  try {
    const val = localStorage.getItem('pfa_outliers')
    if (!val) return []
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Get saved exercise preferences (pfa_exercise_prefs)
 * Used by strategy engine to respect locked exercise choices per component.
 * @returns {object} Preferences map e.g. { cardio: 'hamr', strength: 'hrpu' }
 */
export function getExercisePrefs() {
  try {
    const val = localStorage.getItem('pfa_exercise_prefs')
    if (!val) return {}
    const parsed = JSON.parse(val)
    return (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Save exercise preferences to localStorage
 * @param {object} prefs - Preferences map e.g. { cardio: 'hamr', strength: 'hrpu' }
 */
export function saveExercisePrefs(prefs) {
  safeSetItem('pfa_exercise_prefs', JSON.stringify(prefs))
}

// ── Practice sessions ────────────────────────────────────────────────────────

const PRACTICE_SESSIONS_KEY = 'pfa_practice_sessions'

/**
 * Get all practice sessions from localStorage.
 * @returns {object[]} Array of practice session objects
 */
export function getPracticeSessions() {
  try {
    const val = localStorage.getItem(PRACTICE_SESSIONS_KEY)
    if (!val) return []
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Save a new practice session to localStorage.
 * TR-05: Practice sessions are never encoded into S-codes.
 * @param {object} session - Practice session object
 */
export function savePracticeSession(session) {
  const sessions = getPracticeSessions()
  sessions.push(session)
  safeSetItem(PRACTICE_SESSIONS_KEY, JSON.stringify(sessions))
}

/**
 * Remove a practice session by its id field.
 * @param {number|string} id - Session id
 */
export function removePracticeSession(id) {
  const sessions = getPracticeSessions().filter(s => s.id !== id)
  safeSetItem(PRACTICE_SESSIONS_KEY, JSON.stringify(sessions))
}

/**
 * Clear all practice sessions from localStorage.
 */
export function clearPracticeSessions() {
  try {
    localStorage.removeItem(PRACTICE_SESSIONS_KEY)
  } catch {
    // ignore
  }
}

// ── Preferred training days ───────────────────────────────────────────────────

const PREFERRED_DAYS_KEY = 'pfa_preferred_days'
/**
 * Get preferred training days from localStorage.
 * @returns {number[]} Array of DOW ints (0=Sun ... 6=Sat), sorted ascending.
 *   Returns [] when the user has not yet made a selection (no default imposed).
 */
export function getPreferredDays() {
  try {
    const val = localStorage.getItem(PREFERRED_DAYS_KEY)
    if (!val) return []
    const parsed = JSON.parse(val)
    if (!Array.isArray(parsed)) return []
    // Validate each element is an integer 0-6
    return parsed.filter(d => Number.isInteger(d) && d >= 0 && d <= 6)
  } catch {
    return []
  }
}

/**
 * Save preferred training days to localStorage.
 * @param {number[]} days - Array of DOW ints (0=Sun ... 6=Sat)
 */
export function savePreferredDays(days) {
  safeSetItem(PREFERRED_DAYS_KEY, JSON.stringify(days))
}

// ── Completed training days ───────────────────────────────────────────────────

const COMPLETED_DAYS_KEY = 'pfa_completed_days'

/**
 * Get the set of ISO date strings the user has manually marked complete.
 * @returns {Set<string>}
 */
export function getCompletedDays() {
  try {
    const val = localStorage.getItem(COMPLETED_DAYS_KEY)
    if (!val) return new Set()
    const parsed = JSON.parse(val)
    if (!Array.isArray(parsed)) return new Set()
    // Validate each entry is an ISO date string (YYYY-MM-DD)
    const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
    return new Set(parsed.filter(d => typeof d === 'string' && ISO_DATE_RE.test(d)))
  } catch {
    return new Set()
  }
}

/**
 * Toggle a date's completed state. Returns true if now complete, false if unchecked.
 * @param {string} dateISO - ISO date string e.g. '2026-03-18'
 * @returns {boolean}
 */
export function toggleCompletedDay(dateISO) {
  const days = getCompletedDays()
  if (days.has(dateISO)) {
    days.delete(dateISO)
  } else {
    days.add(dateISO)
  }
  safeSetItem(COMPLETED_DAYS_KEY, JSON.stringify([...days]))
  return days.has(dateISO)
}

// ── Milestone overlay toggle ─────────────────────────────────────────────────

const SHOW_MILESTONES_KEY = 'pfa_show_milestones'

/**
 * Get the milestone overlay preference (defaults OFF).
 * @returns {boolean}
 */
export function getShowMilestones() {
  try {
    return localStorage.getItem(SHOW_MILESTONES_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Set the milestone overlay preference.
 * @param {boolean} show
 */
export function setShowMilestones(show) {
  safeSetItem(SHOW_MILESTONES_KEY, show ? 'true' : 'false')
}

// ── Backup / Restore ────────────────────────────────────────────────────────

/** All localStorage keys managed by this app. */
const ALL_KEYS = [
  'pfa_dcode', 'pfa_scodes', 'pfa_target_date', 'pfa_onboarded',
  'pfa_dark_mode', 'pfa_personal_goal', 'pfa_draft', 'pfa_outliers',
  'pfa_exercise_prefs', 'pfa_practice_sessions', 'pfa_preferred_days',
  'pfa_completed_days', 'pfa_show_milestones', 'pfa_chart_banner_dismissed',
  'pfa_selected_base',
]

/**
 * Export all app data as a JSON string.
 * @returns {string} JSON backup payload
 */
export function exportBackup() {
  const data = {}
  for (const key of ALL_KEYS) {
    const val = localStorage.getItem(key)
    if (val !== null) data[key] = val
  }
  return JSON.stringify({
    _format: 'trajectory_backup',
    _version: 1,
    _exported: new Date().toISOString(),
    data,
  }, null, 2)
}

/**
 * Validate and import a backup payload.
 * Overwrites all matching keys; keys not in the backup are left untouched.
 * @param {string} jsonString - Backup JSON string
 * @returns {{ ok: boolean, error?: string, keysRestored: number }}
 */
export function importBackup(jsonString) {
  let parsed
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    return { ok: false, error: 'Invalid JSON', keysRestored: 0 }
  }
  if (!parsed || parsed._format !== 'trajectory_backup' || !parsed.data) {
    return { ok: false, error: 'Not a Trajectory backup file', keysRestored: 0 }
  }
  const allowedSet = new Set(ALL_KEYS)
  let count = 0
  for (const [key, val] of Object.entries(parsed.data)) {
    if (allowedSet.has(key) && typeof val === 'string') {
      safeSetItem(key, val)
      count++
    }
  }
  return { ok: true, keysRestored: count }
}

// ── Selected base (altitude) ─────────────────────────────────────────────────

const SELECTED_BASE_KEY = 'pfa_selected_base'

/**
 * Get the user's selected base ID for altitude tracking.
 * @returns {number} Base ID (0 = none selected)
 */
export function getSelectedBase() {
  try {
    const val = localStorage.getItem(SELECTED_BASE_KEY)
    const num = val ? parseInt(val, 10) : 0
    return Number.isInteger(num) && num >= 0 && num <= 7 ? num : 0
  } catch {
    return 0
  }
}

/**
 * Save the user's selected base ID.
 * @param {number} baseId - 0-7
 */
export function saveSelectedBase(baseId) {
  safeSetItem(SELECTED_BASE_KEY, String(baseId))
}

/**
 * Toggle outlier flag for an S-code
 * @param {string} scode - S-code string to toggle
 * @returns {boolean} True if the code is NOW an outlier, false if unflagged
 */
export function toggleOutlier(scode) {
  const outliers = getOutliers()
  const isOutlier = outliers.includes(scode)
  const updated = isOutlier
    ? outliers.filter(s => s !== scode)
    : [...outliers, scode]
  safeSetItem('pfa_outliers', JSON.stringify(updated))
  return !isOutlier
}
