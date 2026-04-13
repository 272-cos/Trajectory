/**
 * Scoring constants for 2026 PFA (50-20-15-15 model)
 * Per DAFMAN 36-2905 (Change 1, 22 Jan 2026) and AFPC scoring charts
 */

// Component weights (total = 100) - keys match COMPONENTS values
export const COMPONENT_WEIGHTS = {
  cardio: 50,
  bodyComp: 20,
  strength: 15,
  core: 15,
}

// Component types
export const COMPONENTS = {
  CARDIO: 'cardio',
  STRENGTH: 'strength',
  CORE: 'core',
  BODY_COMP: 'bodyComp',
}

// Exercise types
export const EXERCISES = {
  // Cardio
  RUN_2MILE: '2mile_run',
  HAMR: 'hamr',
  WALK_2KM: '2km_walk',

  // Strength
  PUSHUPS: 'pushups',
  HRPU: 'hrpu',

  // Core
  SITUPS: 'situps',
  CLRC: 'clrc',
  PLANK: 'plank',

  // Body Comp
  WHTR: 'whtr',
}

// Age brackets (AFPC 5-year brackets per DAFMAN 36-2905)
export const AGE_BRACKETS = {
  UNDER_25: '<25',
  AGE_25_29: '25-29',
  AGE_30_34: '30-34',
  AGE_35_39: '35-39',
  AGE_40_44: '40-44',
  AGE_45_49: '45-49',
  AGE_50_54: '50-54',
  AGE_55_59: '55-59',
  AGE_60_PLUS: '60+',
}

// Gender
export const GENDER = {
  MALE: 'M',
  FEMALE: 'F',
}

// Passing composite score
export const PASSING_COMPOSITE = 75.0

// Component minimum percentages (must pass component AND composite)
export const COMPONENT_MINIMUMS = {
  [COMPONENTS.CARDIO]: 60.0, // 30/50 points
  [COMPONENTS.STRENGTH]: 60.0, // 9/15 points
  [COMPONENTS.CORE]: 60.0, // 9/15 points
  [COMPONENTS.BODY_COMP]: 50.0, // 10/20 points
}

// 2km Walk time limits (seconds) per Table 3.1, DAFMAN 36-2905
// Walk uses 5 broader age brackets mapped to 9 AFPC brackets.
// Walk is pass/fail only - no points scored.
export const WALK_TIME_LIMITS = {
  M: {
    [AGE_BRACKETS.UNDER_25]: 976, // 16:16
    [AGE_BRACKETS.AGE_25_29]: 976, // 16:16 (under 30 bracket)
    [AGE_BRACKETS.AGE_30_34]: 978, // 16:18
    [AGE_BRACKETS.AGE_35_39]: 978, // 16:18 (30-39 bracket)
    [AGE_BRACKETS.AGE_40_44]: 983, // 16:23
    [AGE_BRACKETS.AGE_45_49]: 983, // 16:23 (40-49 bracket)
    [AGE_BRACKETS.AGE_50_54]: 1000, // 16:40
    [AGE_BRACKETS.AGE_55_59]: 1000, // 16:40 (50-59 bracket)
    [AGE_BRACKETS.AGE_60_PLUS]: 1018, // 16:58
  },
  F: {
    [AGE_BRACKETS.UNDER_25]: 1042, // 17:22
    [AGE_BRACKETS.AGE_25_29]: 1042, // 17:22 (under 30 bracket)
    [AGE_BRACKETS.AGE_30_34]: 1048, // 17:28
    [AGE_BRACKETS.AGE_35_39]: 1048, // 17:28 (30-39 bracket)
    [AGE_BRACKETS.AGE_40_44]: 1069, // 17:49
    [AGE_BRACKETS.AGE_45_49]: 1069, // 17:49 (40-49 bracket)
    [AGE_BRACKETS.AGE_50_54]: 1091, // 18:11
    [AGE_BRACKETS.AGE_55_59]: 1091, // 18:11 (50-59 bracket)
    [AGE_BRACKETS.AGE_60_PLUS]: 1133, // 18:53
  },
}

/**
 * Get walk time limit for a given gender and age bracket
 * @param {string} gender - 'M' or 'F'
 * @param {string} ageBracket - Age bracket constant
 * @returns {number|null} Time limit in seconds, or null if not found
 */
export function getWalkTimeLimit(gender, ageBracket) {
  return WALK_TIME_LIMITS[gender]?.[ageBracket] ?? null
}

// Improvement units per exercise for marginal return analysis (Task 8.1)
// These are the standard increments used to compute "points gained per unit of improvement"
// Run: 10 seconds faster; HAMR: 2 additional shuttles; reps: 5; Plank: 15s; WHtR: 0.01 ratio
export const IMPROVEMENT_UNITS = {
  [EXERCISES.RUN_2MILE]: 10,
  [EXERCISES.HAMR]: 2,
  [EXERCISES.PUSHUPS]: 5,
  [EXERCISES.HRPU]: 5,
  [EXERCISES.SITUPS]: 5,
  [EXERCISES.CLRC]: 5,
  [EXERCISES.PLANK]: 15,
  [EXERCISES.WHTR]: 0.01,
}

// Effort weeks per unit improvement (baseline, at low-to-mid performance level)
// Source: docs/RESEARCH-FITNESS-PROGRAMS.md
// These represent physiological effort per improvement unit; the scoring table
// density (points per threshold step) is captured separately by the marginal cost
// schedule in optimalAllocation.js.
// Run 10s: ~1.5 weeks of interval/tempo training
// HAMR 2 shuttles: ~1.2 weeks (agility adaptation harder than generic reps)
// Push-ups 5 reps: ~1 week with daily push-up practice
// HRPU 5 reps: ~1.5 weeks (hand-release technique adds overhead)
// Sit-ups 5 reps: ~1 week with daily core work
// CLRC 5 reps: ~1.2 weeks (similar to sit-ups, moderate technique curve)
// Plank 15s: ~1.5 weeks (HPRC: "add 5-10 sec/week", 15s unit = 1.5-3 weeks midpoint)
// WHtR 0.01: ~4 weeks (body composition changes require sustained dietary changes)
// All factors scale up near performance ceiling via effortScaleFactor() in optimalAllocation.js
export const EFFORT_WEEKS_PER_UNIT = {
  [EXERCISES.RUN_2MILE]: 1.5,
  [EXERCISES.HAMR]: 1.2,
  [EXERCISES.PUSHUPS]: 1.0,
  [EXERCISES.HRPU]: 1.5,
  [EXERCISES.SITUPS]: 1.0,
  [EXERCISES.CLRC]: 1.2,
  [EXERCISES.PLANK]: 1.5,
  [EXERCISES.WHTR]: 4.0,
}

// Effort model version - bump when recalibrating effort constants or curve
export const EFFORT_MODEL_VERSION = '2.0'

// Diagnostic period (non-scored) per DTM Fitness SAF/MR 23 Sep 2025
// Six-month diagnostic period: 1 Mar 2026 - 31 Aug 2026
// Official scored testing begins: 1 Sep 2026
export const DIAGNOSTIC_PERIOD_START = '2026-03-01'
export const DIAGNOSTIC_PERIOD_END = '2026-08-31'

// Scoring chart version (EC-24, GR-15)
// To update: bump CHART_VERSION + CHART_RELEASE_DATE, add new table module to
// scoringTables.js. All existing S-codes re-score automatically because they
// store raw values (reps/times/measurements), not cached point totals.
export const CHART_VERSION = 'Sep 2025 Provisional'
export const CHART_RELEASE_DATE = '2025-09-01'

/**
 * Calculate age from DOB and date
 * @param {Date} dob - Date of birth
 * @param {Date} date - Date to calculate age at (default: today)
 * @returns {number} Age in years
 */
export function calculateAge(dob, date = new Date()) {
  const dobDate = new Date(dob)
  const checkDate = new Date(date)
  let age = checkDate.getFullYear() - dobDate.getFullYear()
  const monthDiff = checkDate.getMonth() - dobDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && checkDate.getDate() < dobDate.getDate())) {
    age--
  }
  return age
}

/**
 * Get age bracket from age per AFPC scoring charts
 * @param {number} age - Age in years
 * @returns {string} Age bracket constant
 */
export function getAgeBracket(age) {
  if (age < 25) return AGE_BRACKETS.UNDER_25
  if (age < 30) return AGE_BRACKETS.AGE_25_29
  if (age < 35) return AGE_BRACKETS.AGE_30_34
  if (age < 40) return AGE_BRACKETS.AGE_35_39
  if (age < 45) return AGE_BRACKETS.AGE_40_44
  if (age < 50) return AGE_BRACKETS.AGE_45_49
  if (age < 55) return AGE_BRACKETS.AGE_50_54
  if (age < 60) return AGE_BRACKETS.AGE_55_59
  return AGE_BRACKETS.AGE_60_PLUS
}

/**
 * EC-02: Get age bracket at a target date (handles bracket rollover).
 * Projection calculations must use the Airman's age AT the target PFA date,
 * not today - someone who turns 30 before their PFA is scored on 30-34 tables.
 * @param {Date|string} dob - Date of birth
 * @param {Date|string} targetDate - Target PFA date
 * @returns {string} Age bracket constant
 */
export function getProjectionAgeBracket(dob, targetDate) {
  return getAgeBracket(calculateAge(dob, targetDate))
}

/**
 * Check if date is in diagnostic period
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export function isDiagnosticPeriod(date) {
  const checkDate = new Date(date)
  const start = new Date(DIAGNOSTIC_PERIOD_START)
  const end = new Date(DIAGNOSTIC_PERIOD_END)
  return checkDate >= start && checkDate <= end
}
