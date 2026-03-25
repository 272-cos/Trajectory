/**
 * Unit tests for practiceSession.js
 * Covers: PI workout scaling, fractional test scaling, mock test window, taper period
 */

import { describe, it, expect } from 'vitest'
import {
  scalePIWorkout,
  scaleFractionalTest,
  isMockTestWindow,
  isInTaperPeriod,
  hasMockTestBeenRecorded,
  formatSecondsMMSS,
  PI_EXERCISES,
} from './practiceSession.js'
import { EXERCISES } from '../scoring/constants.js'

// ── scalePIWorkout ────────────────────────────────────────────────────────────

describe('scalePIWorkout - push-ups 30s', () => {
  it('doubles 30-second rep count', () => {
    const result = scalePIWorkout(PI_EXERCISES.PUSHUPS_30S, 21)
    expect(result.predictedFullValue).toBe(42)
    expect(result.fullExercise).toBe(EXERCISES.PUSHUPS)
    expect(result.displayText).toContain('42')
  })

  it('handles zero reps', () => {
    const result = scalePIWorkout(PI_EXERCISES.PUSHUPS_30S, 0)
    expect(result.predictedFullValue).toBe(0)
  })

  it('returns null for negative value', () => {
    expect(scalePIWorkout(PI_EXERCISES.PUSHUPS_30S, -5)).toBeNull()
  })

  it('returns null for null value', () => {
    expect(scalePIWorkout(PI_EXERCISES.PUSHUPS_30S, null)).toBeNull()
  })
})

describe('scalePIWorkout - sit-ups 30s', () => {
  it('doubles 30-second rep count', () => {
    const result = scalePIWorkout(PI_EXERCISES.SITUPS_30S, 18)
    expect(result.predictedFullValue).toBe(36)
    expect(result.fullExercise).toBe(EXERCISES.SITUPS)
  })
})

describe('scalePIWorkout - CLRC 30s', () => {
  it('doubles 30-second rep count', () => {
    const result = scalePIWorkout(PI_EXERCISES.CLRC_30S, 15)
    expect(result.predictedFullValue).toBe(30)
    expect(result.fullExercise).toBe(EXERCISES.CLRC)
  })
})

describe('scalePIWorkout - 1-mile run', () => {
  it('applies x2 + 45s fatigue buffer', () => {
    // 8:30 = 510s
    const result = scalePIWorkout(PI_EXERCISES.RUN_1MILE, 510)
    expect(result.predictedFullValue).toBe(510 * 2 + 45) // 1065s = 17:45
    expect(result.fullExercise).toBe(EXERCISES.RUN_2MILE)
    expect(result.displayText).toContain('17:45')
  })

  it('rounds the predicted value', () => {
    const result = scalePIWorkout(PI_EXERCISES.RUN_1MILE, 511)
    // 511 * 2 + 45 = 1067
    expect(result.predictedFullValue).toBe(1067)
  })
})

describe('scalePIWorkout - 400m run', () => {
  it('applies x8 + 60s fatigue buffer', () => {
    // 2:00 = 120s per 400m
    const result = scalePIWorkout(PI_EXERCISES.RUN_400M, 120)
    expect(result.predictedFullValue).toBe(120 * 8 + 60) // 1020s = 17:00
    expect(result.fullExercise).toBe(EXERCISES.RUN_2MILE)
  })
})

describe('scalePIWorkout - plank half hold', () => {
  it('doubles the half-time hold', () => {
    // 1:15 = 75s half hold -> predicted 150s full
    const result = scalePIWorkout(PI_EXERCISES.PLANK_HALF, 75)
    expect(result.predictedFullValue).toBe(150)
    expect(result.fullExercise).toBe(EXERCISES.PLANK)
    expect(result.displayText).toContain('2:30')
  })
})

describe('scalePIWorkout - HAMR interval', () => {
  it('returns shuttle count directly as level equivalent', () => {
    const result = scalePIWorkout(PI_EXERCISES.HAMR_INTERVAL, 54)
    expect(result.predictedFullValue).toBe(54)
    expect(result.fullExercise).toBe(EXERCISES.HAMR)
  })
})

describe('scalePIWorkout - unknown exercise', () => {
  it('returns null for unknown exercise type', () => {
    expect(scalePIWorkout('unknown_exercise', 10)).toBeNull()
  })
})

// ── scaleFractionalTest ───────────────────────────────────────────────────────

describe('scaleFractionalTest - reps-based at 50%', () => {
  it('doubles reps for push-ups at 50%', () => {
    const result = scaleFractionalTest(EXERCISES.PUSHUPS, 0.5, 21)
    expect(result.predictedFullValue).toBe(42)
    expect(result.displayText).toContain('50%')
  })

  it('doubles reps for sit-ups at 50%', () => {
    const result = scaleFractionalTest(EXERCISES.SITUPS, 0.5, 20)
    expect(result.predictedFullValue).toBe(40)
  })

  it('scales reps for CLRC at 75%', () => {
    const result = scaleFractionalTest(EXERCISES.CLRC, 0.75, 30)
    expect(result.predictedFullValue).toBe(40) // 30 / 0.75 = 40
    expect(result.displayText).toContain('75%')
  })
})

describe('scaleFractionalTest - 2-mile run', () => {
  it('applies fatigue factor at 50%', () => {
    // 1-mile at 510s (8:30). Predicted = (510 / 0.5) * 1.05 = 1071s
    const result = scaleFractionalTest(EXERCISES.RUN_2MILE, 0.5, 510)
    expect(result.predictedFullValue).toBe(Math.round(1020 * 1.05)) // 1071
    expect(result.displayText).toContain('50%')
    expect(result.fullExercise).toBeUndefined() // not a field on fractional result
  })

  it('applies smaller fatigue factor at 75%', () => {
    // 1.5 miles at 765s. Predicted = (765 / 0.75) * 1.03
    const result = scaleFractionalTest(EXERCISES.RUN_2MILE, 0.75, 765)
    expect(result.predictedFullValue).toBe(Math.round(1020 * 1.03)) // 1051
  })
})

describe('scaleFractionalTest - plank', () => {
  it('scales plank hold at 50%', () => {
    // 75s hold at 50% -> predicted 150s full
    const result = scaleFractionalTest(EXERCISES.PLANK, 0.5, 75)
    expect(result.predictedFullValue).toBe(150)
    expect(result.displayText).toContain('2:30')
    expect(result.displayText).toContain('50%')
  })
})

describe('scaleFractionalTest - HAMR', () => {
  it('scales shuttle count at 50%', () => {
    const result = scaleFractionalTest(EXERCISES.HAMR, 0.5, 47)
    expect(result.predictedFullValue).toBe(94)
  })
})

describe('scaleFractionalTest - null/invalid input', () => {
  it('returns null for null value', () => {
    expect(scaleFractionalTest(EXERCISES.PUSHUPS, 0.5, null)).toBeNull()
  })

  it('returns null for zero fraction', () => {
    expect(scaleFractionalTest(EXERCISES.PUSHUPS, 0, 20)).toBeNull()
  })

  it('returns null for negative value', () => {
    expect(scaleFractionalTest(EXERCISES.PUSHUPS, 0.5, -1)).toBeNull()
  })
})

// ── isMockTestWindow ──────────────────────────────────────────────────────────

describe('isMockTestWindow', () => {
  it('returns true at exactly 10 days before target', () => {
    expect(isMockTestWindow('2026-07-01', '2026-06-21')).toBe(true)
  })

  it('returns true at 14 days before target', () => {
    expect(isMockTestWindow('2026-07-01', '2026-06-17')).toBe(true)
  })

  it('returns true at 16 days before target', () => {
    expect(isMockTestWindow('2026-07-01', '2026-06-15')).toBe(true)
  })

  it('returns false at 17 days before target (too early)', () => {
    expect(isMockTestWindow('2026-07-01', '2026-06-14')).toBe(false)
  })

  it('returns false at 9 days before target (too late)', () => {
    expect(isMockTestWindow('2026-07-01', '2026-06-22')).toBe(false)
  })

  it('returns false when target date is today', () => {
    expect(isMockTestWindow('2026-07-01', '2026-07-01')).toBe(false)
  })

  it('returns false when today is after target', () => {
    expect(isMockTestWindow('2026-07-01', '2026-07-05')).toBe(false)
  })

  it('returns false for null inputs', () => {
    expect(isMockTestWindow(null, '2026-06-17')).toBe(false)
    expect(isMockTestWindow('2026-07-01', null)).toBe(false)
  })
})

// ── isInTaperPeriod ───────────────────────────────────────────────────────────

describe('isInTaperPeriod', () => {
  it('returns true on the day of the test', () => {
    expect(isInTaperPeriod('2026-07-01', '2026-07-01')).toBe(true)
  })

  it('returns true at 1 day before test', () => {
    expect(isInTaperPeriod('2026-07-01', '2026-06-30')).toBe(true)
  })

  it('returns true at 14 days before test', () => {
    expect(isInTaperPeriod('2026-07-01', '2026-06-17')).toBe(true)
  })

  it('returns false at 15 days before test', () => {
    expect(isInTaperPeriod('2026-07-01', '2026-06-16')).toBe(false)
  })

  it('returns false after the test date', () => {
    expect(isInTaperPeriod('2026-07-01', '2026-07-02')).toBe(false)
  })

  it('returns false for null inputs', () => {
    expect(isInTaperPeriod(null, '2026-06-25')).toBe(false)
  })
})

// ── hasMockTestBeenRecorded ───────────────────────────────────────────────────

describe('hasMockTestBeenRecorded', () => {
  it('returns true when an S-code date is in the mock test window', () => {
    const scodes = ['S3-abc']
    const decodeFn = () => ({ date: new Date('2026-06-17') }) // 14 days before 2026-07-01
    expect(hasMockTestBeenRecorded(scodes, decodeFn, '2026-07-01')).toBe(true)
  })

  it('returns false when no S-codes fall in the window', () => {
    const scodes = ['S3-abc']
    const decodeFn = () => ({ date: new Date('2026-05-01') }) // 61 days before - not in window
    expect(hasMockTestBeenRecorded(scodes, decodeFn, '2026-07-01')).toBe(false)
  })

  it('returns false for empty scodes array', () => {
    expect(hasMockTestBeenRecorded([], () => {}, '2026-07-01')).toBe(false)
  })

  it('returns false when target date is null', () => {
    expect(hasMockTestBeenRecorded(['S3-abc'], () => ({ date: new Date() }), null)).toBe(false)
  })

  it('returns false when decode throws', () => {
    const decodeFn = () => { throw new Error('decode fail') }
    expect(hasMockTestBeenRecorded(['S3-abc'], decodeFn, '2026-07-01')).toBe(false)
  })
})

// ── formatSecondsMMSS ─────────────────────────────────────────────────────────

describe('formatSecondsMMSS', () => {
  it('formats 90 seconds as 1:30', () => {
    expect(formatSecondsMMSS(90)).toBe('1:30')
  })

  it('formats 510 seconds as 8:30', () => {
    expect(formatSecondsMMSS(510)).toBe('8:30')
  })

  it('formats 0 seconds as 0:00', () => {
    expect(formatSecondsMMSS(0)).toBe('0:00')
  })

  it('formats 1065 seconds as 17:45', () => {
    expect(formatSecondsMMSS(1065)).toBe('17:45')
  })

  it('returns "-" for null', () => {
    expect(formatSecondsMMSS(null)).toBe('-')
  })

  it('returns "-" for NaN', () => {
    expect(formatSecondsMMSS(NaN)).toBe('-')
  })
})
