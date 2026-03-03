/**
 * Scoring constants for 2026 PFA (50-20-15-15 model)
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

// Age groups (official USAF 5-year brackets per AFPC charts)
export const AGE_GROUPS = {
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

// Diagnostic period (non-scored)
export const DIAGNOSTIC_PERIOD_START = '2026-03-01'
export const DIAGNOSTIC_PERIOD_END = '2026-08-31'

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
 * Get age group from age
 * @param {number} age - Age in years
 * @returns {string} Age group constant
 */
export function getAgeGroup(age) {
  if (age < 25) return AGE_GROUPS.UNDER_25
  if (age < 30) return AGE_GROUPS.AGE_25_29
  if (age < 35) return AGE_GROUPS.AGE_30_34
  if (age < 40) return AGE_GROUPS.AGE_35_39
  if (age < 45) return AGE_GROUPS.AGE_40_44
  if (age < 50) return AGE_GROUPS.AGE_45_49
  if (age < 55) return AGE_GROUPS.AGE_50_54
  if (age < 60) return AGE_GROUPS.AGE_55_59
  return AGE_GROUPS.AGE_60_PLUS
}

/**
 * EC-02: Get age group at a target date (handles bracket rollover).
 * Projection calculations must use the Airman's age AT the target PFA date,
 * not today — someone who turns 30 before their PFA is scored on 30-34 tables.
 * @param {Date|string} dob - Date of birth
 * @param {Date|string} targetDate - Target PFA date
 * @returns {string} Age group constant
 */
export function getProjectionAgeGroup(dob, targetDate) {
  return getAgeGroup(calculateAge(dob, targetDate))
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
