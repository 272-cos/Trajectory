/**
 * Practice Session utilities - Three-Layer Training Model
 *
 * Supports:
 * - Layer 2: PI (Performance Indicator) Workouts - short sub-maximal benchmarks
 * - Layer 3: Fractional Tests - 50% / 75% of standard
 *
 * TR-03: PI results always labeled "predicted" - never shown as definitive scores
 * TR-04: Fractional results always labeled with fraction used
 * TR-05: Practice sessions NEVER contribute to S-code history or report generation
 * TR-06: Scaling rules approximate; confidence note always shown
 */

import { EXERCISES } from '../scoring/constants.js'

// ── PI Workout exercise types ─────────────────────────────────────────────────

export const PI_EXERCISES = {
  PUSHUPS_30S:   'pushups_30s',
  SITUPS_30S:    'situps_30s',
  CLRC_30S:      'clrc_30s',
  RUN_1MILE:     'run_1mile',
  RUN_400M:      'run_400m',
  PLANK_HALF:    'plank_half',
  HAMR_INTERVAL: 'hamr_interval',
}

export const PI_EXERCISE_LABELS = {
  [PI_EXERCISES.PUSHUPS_30S]:   'Push-ups (30 sec)',
  [PI_EXERCISES.SITUPS_30S]:    'Sit-ups (30 sec)',
  [PI_EXERCISES.CLRC_30S]:      'Reverse Crunches (30 sec)',
  [PI_EXERCISES.RUN_1MILE]:     '1-Mile Run',
  [PI_EXERCISES.RUN_400M]:      '400m Run',
  [PI_EXERCISES.PLANK_HALF]:    'Plank (held to half target)',
  [PI_EXERCISES.HAMR_INTERVAL]: 'HAMR Interval Set',
}

// Maps each PI exercise to the full-test exercise it predicts
export const PI_TO_FULL_EXERCISE = {
  [PI_EXERCISES.PUSHUPS_30S]:   EXERCISES.PUSHUPS,
  [PI_EXERCISES.SITUPS_30S]:    EXERCISES.SITUPS,
  [PI_EXERCISES.CLRC_30S]:      EXERCISES.CLRC,
  [PI_EXERCISES.RUN_1MILE]:     EXERCISES.RUN_2MILE,
  [PI_EXERCISES.RUN_400M]:      EXERCISES.RUN_2MILE,
  [PI_EXERCISES.PLANK_HALF]:    EXERCISES.PLANK,
  [PI_EXERCISES.HAMR_INTERVAL]: EXERCISES.HAMR,
}

// Whether each PI exercise value is time-based (seconds) or reps
export const PI_IS_TIME = {
  [PI_EXERCISES.PUSHUPS_30S]:   false,
  [PI_EXERCISES.SITUPS_30S]:    false,
  [PI_EXERCISES.CLRC_30S]:      false,
  [PI_EXERCISES.RUN_1MILE]:     true,
  [PI_EXERCISES.RUN_400M]:      true,
  [PI_EXERCISES.PLANK_HALF]:    true,
  [PI_EXERCISES.HAMR_INTERVAL]: false,
}

// ── PI Workout Scaling ────────────────────────────────────────────────────────

/**
 * Scale a PI Workout result to predicted full-test equivalent.
 * TR-03: result always labeled "predicted" with a confidence note.
 *
 * @param {string} piExercise - PI_EXERCISES constant
 * @param {number} value - measured value (reps or seconds)
 * @returns {{ predictedFullValue: number, displayText: string, confidenceNote: string, fullExercise: string }}
 */
export function scalePIWorkout(piExercise, value) {
  if (value == null || isNaN(value) || value < 0) {
    return null
  }

  switch (piExercise) {
    case PI_EXERCISES.PUSHUPS_30S:
      return {
        predictedFullValue: value * 2,
        displayText: `Predicted 1-min push-up max: ~${value * 2} reps`,
        confidenceNote: '30-second count x2, +/- 3 reps',
        fullExercise: EXERCISES.PUSHUPS,
      }

    case PI_EXERCISES.SITUPS_30S:
      return {
        predictedFullValue: value * 2,
        displayText: `Predicted 1-min sit-up max: ~${value * 2} reps`,
        confidenceNote: '30-second count x2, +/- 3 reps',
        fullExercise: EXERCISES.SITUPS,
      }

    case PI_EXERCISES.CLRC_30S:
      return {
        predictedFullValue: value * 2,
        displayText: `Predicted 2-min CLRC max: ~${value * 2} reps`,
        confidenceNote: '30-second count x2, +/- 4 reps',
        fullExercise: EXERCISES.CLRC,
      }

    case PI_EXERCISES.RUN_1MILE: {
      const predicted = Math.round(value * 2 + 45)
      return {
        predictedFullValue: predicted,
        displayText: `Predicted 2-mile: ~${formatSecondsMMSS(predicted)}`,
        confidenceNote: '1-mile x2 + 45s fatigue buffer, +/- 30s',
        fullExercise: EXERCISES.RUN_2MILE,
      }
    }

    case PI_EXERCISES.RUN_400M: {
      const predicted = Math.round(value * 8 + 60)
      return {
        predictedFullValue: predicted,
        displayText: `Predicted 2-mile: ~${formatSecondsMMSS(predicted)}`,
        confidenceNote: '400m x8 + 60s fatigue buffer, +/- 45s',
        fullExercise: EXERCISES.RUN_2MILE,
      }
    }

    case PI_EXERCISES.PLANK_HALF: {
      const predicted = value * 2
      return {
        predictedFullValue: predicted,
        displayText: `Predicted full plank: ~${formatSecondsMMSS(predicted)}`,
        confidenceNote: 'Half-time hold x2, +/- 15s',
        fullExercise: EXERCISES.PLANK,
      }
    }

    case PI_EXERCISES.HAMR_INTERVAL:
      return {
        predictedFullValue: value,
        displayText: `HAMR interval: ${value} shuttles (direct level equivalent)`,
        confidenceNote: 'Interval shuttle count scales to test level',
        fullExercise: EXERCISES.HAMR,
      }

    default:
      return null
  }
}

// ── Fractional Test Scaling ───────────────────────────────────────────────────

/**
 * Scale a Fractional Test result to predicted full-test equivalent.
 * At 50%: user performs half the standard (half reps, half distance).
 * TR-04: result always labeled with the fraction used.
 *
 * @param {string} fullExercise - EXERCISES constant for the full-test exercise
 * @param {number} fraction - 0.5 or 0.75
 * @param {number} value - actual reps or seconds achieved at the fraction
 * @returns {{ predictedFullValue: number, displayText: string, confidenceNote: string }}
 */
export function scaleFractionalTest(fullExercise, fraction, value) {
  if (value == null || isNaN(value) || value < 0 || !fraction) {
    return null
  }

  const pct = Math.round(fraction * 100)
  const multiplier = (1 / fraction).toFixed(2)

  // Run: time-based, lower is better. Fractional distance -> scale with fatigue factor.
  if (fullExercise === EXERCISES.RUN_2MILE) {
    // Fatigue factor: 50% distance -> slightly faster pace than full test
    // 1-mile x2 + 45s (same as PI workout) for 50%; 1.5-mile proportional for 75%
    const fatigueFactor = fraction <= 0.5 ? 1.05 : 1.03
    const predicted = Math.round((value / fraction) * fatigueFactor)
    return {
      predictedFullValue: predicted,
      displayText: `Predicted 2-mile: ~${formatSecondsMMSS(predicted)} (${pct}% test)`,
      confidenceNote: `${pct}% distance with fatigue adjustment, +/- 45s`,
    }
  }

  // Plank: time-based, higher is better
  if (fullExercise === EXERCISES.PLANK) {
    const predicted = Math.round(value / fraction)
    return {
      predictedFullValue: predicted,
      displayText: `Predicted full plank: ~${formatSecondsMMSS(predicted)} (${pct}% test)`,
      confidenceNote: `${pct}% hold x${multiplier}, +/- 15s`,
    }
  }

  // HAMR: reps-based (shuttles), higher is better
  if (fullExercise === EXERCISES.HAMR) {
    const predicted = Math.round(value / fraction)
    return {
      predictedFullValue: predicted,
      displayText: `Predicted full HAMR: ~${predicted} shuttles (${pct}% test)`,
      confidenceNote: `${pct}% shuttle count x${multiplier}`,
    }
  }

  // All other reps-based exercises (push-ups, sit-ups, CLRC, HRPU)
  const predicted = Math.round(value / fraction)
  return {
    predictedFullValue: predicted,
    displayText: `Predicted full-test reps: ~${predicted} (${pct}% test)`,
    confidenceNote: `${pct}% reps x${multiplier}, +/- 3 reps`,
  }
}

// ── Date Window Checks ────────────────────────────────────────────────────────

/**
 * Check if today is within the mock test window (10-16 days before target).
 * TR-01: Full PT test performed at most once: at -14 days.
 * TR-09: Banner is informational only.
 *
 * @param {string} targetDateISO - ISO date string e.g. '2026-07-01'
 * @param {string} todayISO - ISO date string e.g. '2026-06-15'
 * @returns {boolean}
 */
export function isMockTestWindow(targetDateISO, todayISO) {
  if (!targetDateISO || !todayISO) return false
  const target = new Date(targetDateISO)
  const today = new Date(todayISO)
  const daysOut = Math.round((target - today) / (1000 * 60 * 60 * 24))
  return daysOut >= 10 && daysOut <= 16
}

/**
 * Check if today is in the taper period (0-14 days before target).
 * TR-10: Taper period suppresses aggressive training recommendations.
 *
 * @param {string} targetDateISO - ISO date string
 * @param {string} todayISO - ISO date string
 * @returns {boolean}
 */
export function isInTaperPeriod(targetDateISO, todayISO) {
  if (!targetDateISO || !todayISO) return false
  const target = new Date(targetDateISO)
  const today = new Date(todayISO)
  const daysOut = Math.round((target - today) / (1000 * 60 * 60 * 24))
  return daysOut >= 0 && daysOut <= 14
}

/**
 * Check if a full S-code was recorded during the mock test window,
 * meaning the user has done their mock test and should now taper.
 *
 * @param {string[]} scodes - Array of S-code strings
 * @param {Function} decodeFn - decodeSCode function
 * @param {string} targetDateISO - ISO date string
 * @returns {boolean}
 */
export function hasMockTestBeenRecorded(scodes, decodeFn, targetDateISO) {
  if (!scodes?.length || !targetDateISO || !decodeFn) return false
  return scodes.some(code => {
    try {
      const decoded = decodeFn(code)
      const dateISO = decoded.date instanceof Date ? decoded.date.toISOString().split('T')[0] : String(decoded.date).split('T')[0]
      return isMockTestWindow(targetDateISO, dateISO)
    } catch {
      return false
    }
  })
}

// ── Display helpers ───────────────────────────────────────────────────────────

/**
 * Format seconds as mm:ss for display.
 * @param {number} seconds
 * @returns {string}
 */
export function formatSecondsMMSS(seconds) {
  if (seconds == null || isNaN(seconds)) return '-'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
