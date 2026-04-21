/**
 * exercisePreferences.js unit tests
 * Covers normalizePfaPreferences, inferPreferencesFromDecoded, prefsToExercises.
 */

import { describe, it, expect } from 'vitest'
import {
  UPPER_BODY, CORE, CARDIO, DEFAULT_PREFERENCES,
  normalizePfaPreferences,
  inferPreferencesFromDecoded,
  prefsToExercises,
} from './exercisePreferences.js'
import { EXERCISES } from '../scoring/constants.js'

// ─── normalizePfaPreferences ──────────────────────────────────────────────────

describe('normalizePfaPreferences - defaults for missing/null', () => {
  it('null input returns DEFAULT_PREFERENCES', () => {
    const result = normalizePfaPreferences(null)
    expect(result).toEqual(DEFAULT_PREFERENCES)
  })

  it('undefined input returns DEFAULT_PREFERENCES', () => {
    const result = normalizePfaPreferences(undefined)
    expect(result).toEqual(DEFAULT_PREFERENCES)
  })

  it('empty object returns DEFAULT_PREFERENCES', () => {
    const result = normalizePfaPreferences({})
    expect(result).toEqual(DEFAULT_PREFERENCES)
  })

  it('unknown values replaced with defaults', () => {
    const result = normalizePfaPreferences({ upperBody: 'invalid', core: 'unknown', cardio: 'bad' })
    expect(result).toEqual(DEFAULT_PREFERENCES)
  })
})

describe('normalizePfaPreferences - valid values pass through', () => {
  it('all valid values preserved', () => {
    const prefs = { upperBody: UPPER_BODY.HRPU, core: CORE.PLANK, cardio: CARDIO.HAMR }
    expect(normalizePfaPreferences(prefs)).toEqual(prefs)
  })

  it('CLRC core preserved', () => {
    const result = normalizePfaPreferences({ upperBody: UPPER_BODY.PUSHUPS, core: CORE.CLRC, cardio: CARDIO.RUN })
    expect(result.core).toBe(CORE.CLRC)
  })

  it('HRPU upperBody preserved', () => {
    const result = normalizePfaPreferences({ upperBody: UPPER_BODY.HRPU, core: CORE.SITUPS, cardio: CARDIO.RUN })
    expect(result.upperBody).toBe(UPPER_BODY.HRPU)
  })

  it('2km walk cardio preserved', () => {
    const result = normalizePfaPreferences({ upperBody: UPPER_BODY.PUSHUPS, core: CORE.SITUPS, cardio: CARDIO.WALK })
    expect(result.cardio).toBe(CARDIO.WALK)
  })

  it('HAMR cardio preserved', () => {
    const result = normalizePfaPreferences({ upperBody: UPPER_BODY.PUSHUPS, core: CORE.SITUPS, cardio: CARDIO.HAMR })
    expect(result.cardio).toBe(CARDIO.HAMR)
  })
})

describe('normalizePfaPreferences - partial objects', () => {
  it('missing upperBody falls back to default', () => {
    const result = normalizePfaPreferences({ core: CORE.PLANK, cardio: CARDIO.HAMR })
    expect(result.upperBody).toBe(DEFAULT_PREFERENCES.upperBody)
    expect(result.core).toBe(CORE.PLANK)
    expect(result.cardio).toBe(CARDIO.HAMR)
  })

  it('missing core falls back to default', () => {
    const result = normalizePfaPreferences({ upperBody: UPPER_BODY.HRPU, cardio: CARDIO.WALK })
    expect(result.core).toBe(DEFAULT_PREFERENCES.core)
    expect(result.upperBody).toBe(UPPER_BODY.HRPU)
  })

  it('missing cardio falls back to default', () => {
    const result = normalizePfaPreferences({ upperBody: UPPER_BODY.HRPU, core: CORE.CLRC })
    expect(result.cardio).toBe(DEFAULT_PREFERENCES.cardio)
  })
})

// ─── inferPreferencesFromDecoded ──────────────────────────────────────────────

describe('inferPreferencesFromDecoded - null/empty inputs', () => {
  it('null decoded returns null', () => {
    expect(inferPreferencesFromDecoded(null)).toBeNull()
  })

  it('decoded with all exempt returns null', () => {
    const decoded = {
      cardio:   { exercise: EXERCISES.RUN_2MILE, exempt: true },
      strength: { exercise: EXERCISES.PUSHUPS, exempt: true },
      core:     { exercise: EXERCISES.SITUPS, exempt: true },
    }
    expect(inferPreferencesFromDecoded(decoded)).toBeNull()
  })

  it('decoded with no components returns null', () => {
    expect(inferPreferencesFromDecoded({})).toBeNull()
  })
})

describe('inferPreferencesFromDecoded - standard exercises', () => {
  it('infers RUN from 2-mile run', () => {
    const decoded = { cardio: { exercise: EXERCISES.RUN_2MILE, exempt: false } }
    const result = inferPreferencesFromDecoded(decoded)
    expect(result.cardio).toBe(CARDIO.RUN)
  })

  it('infers HAMR from hamr', () => {
    const decoded = { cardio: { exercise: EXERCISES.HAMR, exempt: false } }
    const result = inferPreferencesFromDecoded(decoded)
    expect(result.cardio).toBe(CARDIO.HAMR)
  })

  it('infers WALK from 2km walk', () => {
    const decoded = { cardio: { exercise: EXERCISES.WALK_2KM, exempt: false } }
    const result = inferPreferencesFromDecoded(decoded)
    expect(result.cardio).toBe(CARDIO.WALK)
  })

  it('infers PUSHUPS from pushups', () => {
    const decoded = { strength: { exercise: EXERCISES.PUSHUPS, exempt: false } }
    const result = inferPreferencesFromDecoded(decoded)
    expect(result.upperBody).toBe(UPPER_BODY.PUSHUPS)
  })

  it('infers HRPU from hrpu', () => {
    const decoded = { strength: { exercise: EXERCISES.HRPU, exempt: false } }
    const result = inferPreferencesFromDecoded(decoded)
    expect(result.upperBody).toBe(UPPER_BODY.HRPU)
  })

  it('infers SITUPS from situps', () => {
    const decoded = { core: { exercise: EXERCISES.SITUPS, exempt: false } }
    const result = inferPreferencesFromDecoded(decoded)
    expect(result.core).toBe(CORE.SITUPS)
  })

  it('infers CLRC from clrc', () => {
    const decoded = { core: { exercise: EXERCISES.CLRC, exempt: false } }
    const result = inferPreferencesFromDecoded(decoded)
    expect(result.core).toBe(CORE.CLRC)
  })

  it('infers PLANK from plank', () => {
    const decoded = { core: { exercise: EXERCISES.PLANK, exempt: false } }
    const result = inferPreferencesFromDecoded(decoded)
    expect(result.core).toBe(CORE.PLANK)
  })
})

describe('inferPreferencesFromDecoded - full assessment inference', () => {
  it('full HRPU + CLRC + HAMR assessment infers all correctly', () => {
    const decoded = {
      cardio:   { exercise: EXERCISES.HAMR, exempt: false },
      strength: { exercise: EXERCISES.HRPU, exempt: false },
      core:     { exercise: EXERCISES.CLRC, exempt: false },
    }
    const result = inferPreferencesFromDecoded(decoded)
    expect(result.cardio).toBe(CARDIO.HAMR)
    expect(result.upperBody).toBe(UPPER_BODY.HRPU)
    expect(result.core).toBe(CORE.CLRC)
  })

  it('partial assessment with only cardio still returns inferred prefs with defaults for others', () => {
    const decoded = { cardio: { exercise: EXERCISES.HAMR, exempt: false } }
    const result = inferPreferencesFromDecoded(decoded)
    expect(result).not.toBeNull()
    expect(result.cardio).toBe(CARDIO.HAMR)
    expect(result.upperBody).toBe(DEFAULT_PREFERENCES.upperBody)
    expect(result.core).toBe(DEFAULT_PREFERENCES.core)
  })
})

// ─── prefsToExercises ─────────────────────────────────────────────────────────

describe('prefsToExercises - maps to EXERCISES constants', () => {
  it('default prefs maps to run/pushups/situps', () => {
    const result = prefsToExercises(DEFAULT_PREFERENCES)
    expect(result.cardio).toBe(EXERCISES.RUN_2MILE)
    expect(result.strength).toBe(EXERCISES.PUSHUPS)
    expect(result.core).toBe(EXERCISES.SITUPS)
  })

  it('HAMR cardio maps to EXERCISES.HAMR', () => {
    const result = prefsToExercises({ ...DEFAULT_PREFERENCES, cardio: CARDIO.HAMR })
    expect(result.cardio).toBe(EXERCISES.HAMR)
  })

  it('WALK cardio maps to EXERCISES.WALK_2KM', () => {
    const result = prefsToExercises({ ...DEFAULT_PREFERENCES, cardio: CARDIO.WALK })
    expect(result.cardio).toBe(EXERCISES.WALK_2KM)
  })

  it('HRPU strength maps to EXERCISES.HRPU', () => {
    const result = prefsToExercises({ ...DEFAULT_PREFERENCES, upperBody: UPPER_BODY.HRPU })
    expect(result.strength).toBe(EXERCISES.HRPU)
  })

  it('CLRC core maps to EXERCISES.CLRC', () => {
    const result = prefsToExercises({ ...DEFAULT_PREFERENCES, core: CORE.CLRC })
    expect(result.core).toBe(EXERCISES.CLRC)
  })

  it('PLANK core maps to EXERCISES.PLANK', () => {
    const result = prefsToExercises({ ...DEFAULT_PREFERENCES, core: CORE.PLANK })
    expect(result.core).toBe(EXERCISES.PLANK)
  })

  it('null prefs falls back to defaults', () => {
    const result = prefsToExercises(null)
    expect(result.cardio).toBe(EXERCISES.RUN_2MILE)
    expect(result.strength).toBe(EXERCISES.PUSHUPS)
    expect(result.core).toBe(EXERCISES.SITUPS)
  })

  it('full non-default prefs round-trips correctly', () => {
    const prefs = { upperBody: UPPER_BODY.HRPU, core: CORE.CLRC, cardio: CARDIO.HAMR }
    const result = prefsToExercises(prefs)
    expect(result.cardio).toBe(EXERCISES.HAMR)
    expect(result.strength).toBe(EXERCISES.HRPU)
    expect(result.core).toBe(EXERCISES.CLRC)
  })
})

// ─── Round-trip: decode exercise -> infer prefs -> map back to exercises ──────

describe('Round-trip: S-code exercise -> infer prefs -> prefsToExercises', () => {
  it('HAMR round-trip', () => {
    const decoded = { cardio: { exercise: EXERCISES.HAMR, exempt: false } }
    const prefs = inferPreferencesFromDecoded(decoded)
    const exs = prefsToExercises(prefs)
    expect(exs.cardio).toBe(EXERCISES.HAMR)
  })

  it('WALK round-trip', () => {
    const decoded = { cardio: { exercise: EXERCISES.WALK_2KM, exempt: false } }
    const prefs = inferPreferencesFromDecoded(decoded)
    const exs = prefsToExercises(prefs)
    expect(exs.cardio).toBe(EXERCISES.WALK_2KM)
  })

  it('HRPU round-trip', () => {
    const decoded = { strength: { exercise: EXERCISES.HRPU, exempt: false } }
    const prefs = inferPreferencesFromDecoded(decoded)
    const exs = prefsToExercises(prefs)
    expect(exs.strength).toBe(EXERCISES.HRPU)
  })

  it('CLRC round-trip', () => {
    const decoded = { core: { exercise: EXERCISES.CLRC, exempt: false } }
    const prefs = inferPreferencesFromDecoded(decoded)
    const exs = prefsToExercises(prefs)
    expect(exs.core).toBe(EXERCISES.CLRC)
  })

  it('PLANK round-trip', () => {
    const decoded = { core: { exercise: EXERCISES.PLANK, exempt: false } }
    const prefs = inferPreferencesFromDecoded(decoded)
    const exs = prefsToExercises(prefs)
    expect(exs.core).toBe(EXERCISES.PLANK)
  })

  it('all non-default exercises round-trip together', () => {
    const decoded = {
      cardio:   { exercise: EXERCISES.WALK_2KM, exempt: false },
      strength: { exercise: EXERCISES.HRPU, exempt: false },
      core:     { exercise: EXERCISES.CLRC, exempt: false },
    }
    const prefs = inferPreferencesFromDecoded(decoded)
    const exs = prefsToExercises(prefs)
    expect(exs.cardio).toBe(EXERCISES.WALK_2KM)
    expect(exs.strength).toBe(EXERCISES.HRPU)
    expect(exs.core).toBe(EXERCISES.CLRC)
  })
})
