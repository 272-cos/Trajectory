/**
 * localStorage utilities for PFA Tracker
 * Primary storage for D-code, S-codes, and user preferences
 */

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
  try {
    localStorage.setItem(STORAGE_KEYS.DCODE, dcode)
  } catch (error) {
    console.error('Error saving D-code to localStorage:', error)
  }
}

/**
 * Get all S-codes from localStorage
 * @returns {string[]} Array of S-code strings
 */
export function getSCodes() {
  try {
    const scodes = localStorage.getItem(STORAGE_KEYS.SCODES)
    return scodes ? JSON.parse(scodes) : []
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
  try {
    const scodes = getSCodes()
    // Avoid duplicates
    if (!scodes.includes(scode)) {
      scodes.push(scode)
      localStorage.setItem(STORAGE_KEYS.SCODES, JSON.stringify(scodes))
    }
  } catch (error) {
    console.error('Error saving S-code to localStorage:', error)
  }
}

/**
 * Remove S-code from localStorage
 * @param {string} scode - S-code string to remove
 */
export function removeSCode(scode) {
  try {
    const scodes = getSCodes()
    const filtered = scodes.filter(s => s !== scode)
    localStorage.setItem(STORAGE_KEYS.SCODES, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error removing S-code from localStorage:', error)
  }
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
  try {
    localStorage.setItem(STORAGE_KEYS.TARGET_DATE, date)
  } catch (error) {
    console.error('Error saving target date to localStorage:', error)
  }
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
  try {
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true')
  } catch (error) {
    console.error('Error saving onboarding status to localStorage:', error)
  }
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
  try {
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(enabled))
  } catch {
    // ignore
  }
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
  try {
    localStorage.setItem(STORAGE_KEYS.PERSONAL_GOAL, String(goal))
  } catch {
    // ignore
  }
}

// ── Draft autosave ───────────────────────────────────────────────────────────

const DRAFT_KEY = 'pfa_draft'

/**
 * Save self-check draft to localStorage (debounced by caller)
 * @param {object} draft - Form state snapshot
 */
export function saveDraft(draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, _ts: Date.now() }))
  } catch (error) {
    console.error('Error saving draft:', error)
  }
}

/**
 * Load self-check draft from localStorage
 * @returns {object|null} Draft state or null
 */
export function loadDraft() {
  try {
    const val = localStorage.getItem(DRAFT_KEY)
    return val ? JSON.parse(val) : null
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
    localStorage.removeItem(DRAFT_KEY)
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
    return val ? JSON.parse(val) : []
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
    return val ? JSON.parse(val) : {}
  } catch {
    return {}
  }
}

/**
 * Save exercise preferences to localStorage
 * @param {object} prefs - Preferences map e.g. { cardio: 'hamr', strength: 'hrpu' }
 */
export function saveExercisePrefs(prefs) {
  try {
    localStorage.setItem('pfa_exercise_prefs', JSON.stringify(prefs))
  } catch (error) {
    console.error('Error saving exercise preferences:', error)
  }
}

/**
 * Toggle outlier flag for an S-code
 * @param {string} scode - S-code string to toggle
 * @returns {boolean} True if the code is NOW an outlier, false if unflagged
 */
export function toggleOutlier(scode) {
  try {
    const outliers = getOutliers()
    const isOutlier = outliers.includes(scode)
    const updated = isOutlier
      ? outliers.filter(s => s !== scode)
      : [...outliers, scode]
    localStorage.setItem('pfa_outliers', JSON.stringify(updated))
    return !isOutlier
  } catch {
    return false
  }
}
