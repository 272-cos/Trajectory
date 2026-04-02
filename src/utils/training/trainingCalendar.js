/**
 * Training Plan Calendar - Task 10.2
 *
 * Generates a personalized, periodized training calendar from today to the
 * target PFA date. Structured around the Four-Phase Training Model:
 *
 *   Phase 0  - Pre-progression  (composite < 50 or PI push-ups < 5)
 *   Phase 1  - Base Building    (13+ weeks out)
 *   Phase 2  - Foundation Build (9-12 weeks out)
 *   Phase 3  - Intensity Peak   (5-8 weeks out)
 *   Phase 4  - Final Prep/Taper (1-4 weeks out, always includes taper)
 *
 * Key design rules:
 *   TR-01  Full PT test at most once before actual test: at -14 days
 *   TR-06  Scaling rules approximate; confidence note always shown
 *   TR-07  Phase 0 pre-progressions offered when user cannot complete Phase 1 baseline
 *   TR-08  Goal framing is confidence-building, not score-maximizing
 *   TR-09  Mock test window banner is informational only
 *   TR-10  Taper period (0-14 days out) suppresses aggressive training recommendations
 */

import { EXERCISES, COMPONENTS } from '../scoring/constants.js'
import { PI_EXERCISES, formatSecondsMMSS } from './practiceSession.js'
import {
  weekNumberFromWeeksOut,
  getProgressionRatio,
  getPhaseFromRatio,
  computePhaseBoundaries,
  getSpecialEventMilestones,
  getSpecialWeekInfoFromRatio,
  PHASE_NAMES,
  PHASE_DISPLAY,
  EFFORT_LABELS,
  capIntensity,
  getRepInstruction,
  WEEKLY_TEMPLATES,
} from './phaseEngine.js'

// ── Phase detection ───────────────────────────────────────────────────────────

export const PHASES = {
  PHASE_0: 0, // Pre-progression (deconditioning path)
  PHASE_1: 1, // Base Building (13+ weeks)
  PHASE_2: 2, // Foundation Build (9-12 weeks)
  PHASE_3: 3, // Intensity Peak (5-8 weeks)
  PHASE_4: 4, // Final Prep / Taper (1-4 weeks)
}

export const PHASE_LABELS = {
  [PHASES.PHASE_0]: 'Pre-Progression',
  [PHASES.PHASE_1]: 'Base Building',
  [PHASES.PHASE_2]: 'Foundation Build',
  [PHASES.PHASE_3]: 'Intensity Peak',
  [PHASES.PHASE_4]: 'Final Prep',
}

export const PHASE_DESCRIPTIONS = {
  [PHASES.PHASE_0]: 'Build a safe movement foundation before progressing to standard training.',
  [PHASES.PHASE_1]: 'Establish aerobic base and movement patterns with consistent, low-intensity work.',
  [PHASES.PHASE_2]: 'Add volume and early benchmark testing to track progress.',
  [PHASES.PHASE_3]: 'Sharpen fitness with higher intensity and partial test validation.',
  [PHASES.PHASE_4]: 'Lock in fitness gains, complete your mock test, and taper for peak performance.',
}

/**
 * Detect the appropriate training phase based on weeks remaining.
 * Uses the dynamic ratio-based system to scale phases to any plan duration.
 * TR-07: Phase 0 is returned when composite < 50 or PI push-ups < 5.
 *
 * @param {number} weeksOut - Weeks until target PFA date (from today)
 * @param {object} [options]
 * @param {boolean} [options.forcePhase0] - Force Phase 0 (deconditioning path)
 * @param {number} [options.totalWeeks] - Total plan duration (defaults to weeksOut)
 * @returns {number} PHASES constant
 */
export function detectPhase(weeksOut, { forcePhase0 = false, totalWeeks = null } = {}) {
  const total = totalWeeks || Math.max(weeksOut, 1)

  // Phase 0 only applies when there is enough time for pre-progression
  if (forcePhase0) {
    const { phases } = computePhaseBoundaries(total)
    const baseWeeks = phases[0].weeks
    if (weeksOut >= baseWeeks + 1) return PHASES.PHASE_0
  }

  const ratio = getProgressionRatio(weeksOut, total)
  const phaseName = getPhaseFromRatio(ratio, total)

  const nameToNumber = {
    [PHASE_NAMES.BASE]: PHASES.PHASE_1,
    [PHASE_NAMES.BUILD]: PHASES.PHASE_2,
    [PHASE_NAMES.BUILD_PLUS]: PHASES.PHASE_3,
    [PHASE_NAMES.SHARPEN]: PHASES.PHASE_4,
  }
  return nameToNumber[phaseName] ?? PHASES.PHASE_4
}

// ── Event types ───────────────────────────────────────────────────────────────

export const EVENT_TYPES = {
  TRAINING:           'training',
  REST:               'rest',
  PI_WORKOUT:         'pi_workout',
  BASELINE_PI:        'baseline_pi',        // Week 1: establish Day 1 numbers
  FOUNDATION_CHECKIN: 'foundation_checkin', // Week 4: repeat Week 1, measure delta
  FRACTIONAL_TEST:    'fractional_test',
  MOCK_TEST:          'mock_test',
  TAPER:              'taper',
  TEST_DAY:           'test_day',
}

// ── PI Workout prescriptions ──────────────────────────────────────────────────

const FITNESS_LEVELS = {
  LOW:    'low',    // component score < 60
  MED:    'medium', // component score 60-74
  HIGH:   'high',   // component score >= 75
}

/**
 * Get the fitness level label based on component score.
 * @param {number|null} score - Component score 0-100
 * @returns {string} FITNESS_LEVELS constant
 */
function getFitnessLevel(score) {
  if (score == null || score < 60) return FITNESS_LEVELS.LOW
  if (score < 75) return FITNESS_LEVELS.MED
  return FITNESS_LEVELS.HIGH
}

/**
 * Prescribe a PI Workout target for a given exercise and fitness level.
 *
 * @param {string} exercise - EXERCISES constant
 * @param {string} fitnessLevel - FITNESS_LEVELS constant
 * @returns {{ target: string, description: string, notes: string }}
 */
export function prescribePIWorkout(exercise, fitnessLevel) {
  const level = fitnessLevel || FITNESS_LEVELS.LOW

  const prescriptions = {
    [EXERCISES.PUSHUPS]: {
      [FITNESS_LEVELS.LOW]:  { target: '10-15 reps (30 sec)', description: 'Push-ups in 30 seconds', notes: 'Predicted 1-min: ~20-30 reps. Focus on full range of motion.' },
      [FITNESS_LEVELS.MED]:  { target: '18-24 reps (30 sec)', description: 'Push-ups in 30 seconds', notes: 'Predicted 1-min: ~36-48 reps. Maintain strict form.' },
      [FITNESS_LEVELS.HIGH]: { target: '25+ reps (30 sec)',   description: 'Push-ups in 30 seconds', notes: 'Predicted 1-min: ~50+ reps. Challenge your ceiling.' },
    },
    [EXERCISES.HRPU]: {
      [FITNESS_LEVELS.LOW]:  { target: '8-12 reps (30 sec)', description: 'Hand-Release Push-ups in 30 seconds', notes: 'Predicted 2-min: ~20-28 reps. Reset fully on each rep.' },
      [FITNESS_LEVELS.MED]:  { target: '13-18 reps (30 sec)', description: 'Hand-Release Push-ups in 30 seconds', notes: 'Predicted 2-min: ~30-40 reps. Keep hips level.' },
      [FITNESS_LEVELS.HIGH]: { target: '19+ reps (30 sec)',  description: 'Hand-Release Push-ups in 30 seconds', notes: 'Predicted 2-min: ~42+ reps. Maximize hip drive off the floor.' },
    },
    [EXERCISES.SITUPS]: {
      [FITNESS_LEVELS.LOW]:  { target: '12-16 reps (30 sec)', description: 'Sit-ups in 30 seconds', notes: 'Predicted 1-min: ~24-32 reps. Breathe on the way up.' },
      [FITNESS_LEVELS.MED]:  { target: '17-22 reps (30 sec)', description: 'Sit-ups in 30 seconds', notes: 'Predicted 1-min: ~34-44 reps. Reach past your knees.' },
      [FITNESS_LEVELS.HIGH]: { target: '23+ reps (30 sec)',   description: 'Sit-ups in 30 seconds', notes: 'Predicted 1-min: ~46+ reps. Smooth, consistent rhythm.' },
    },
    [EXERCISES.CLRC]: {
      [FITNESS_LEVELS.LOW]:  { target: '10-14 reps (30 sec)', description: 'Cross-Leg Reverse Crunches in 30 seconds', notes: 'Predicted 2-min: ~24-32 reps. Drive hips straight up.' },
      [FITNESS_LEVELS.MED]:  { target: '15-20 reps (30 sec)', description: 'Cross-Leg Reverse Crunches in 30 seconds', notes: 'Predicted 2-min: ~34-44 reps. Controlled descent.' },
      [FITNESS_LEVELS.HIGH]: { target: '21+ reps (30 sec)',   description: 'Cross-Leg Reverse Crunches in 30 seconds', notes: 'Predicted 2-min: ~46+ reps. Hold the peak contraction.' },
    },
    [EXERCISES.PLANK]: {
      [FITNESS_LEVELS.LOW]:  { target: '45-60 sec hold', description: 'Forearm Plank (hold half your target)', notes: 'Predicted full plank: ~90-120 sec. Keep hips level - no sagging.' },
      [FITNESS_LEVELS.MED]:  { target: '90-120 sec hold', description: 'Forearm Plank (hold half your target)', notes: 'Predicted full plank: ~180-240 sec. Squeeze glutes and core together.' },
      [FITNESS_LEVELS.HIGH]: { target: '2+ min hold',     description: 'Forearm Plank (hold half your target)', notes: 'Predicted full plank: ~4+ min. Breathing pattern is key at this level.' },
    },
    [EXERCISES.RUN_2MILE]: {
      [FITNESS_LEVELS.LOW]:  { target: '1-mile @ easy effort (can speak full sentences)', description: '1-mile run benchmark', notes: 'Predicted 2-mile: time x2 + 45s. No anaerobic effort today.' },
      [FITNESS_LEVELS.MED]:  { target: '1-mile @ comfortably hard (2-3 word answers only)', description: '1-mile run benchmark', notes: 'Predicted 2-mile: time x2 + 45s. Should feel sustainably hard.' },
      [FITNESS_LEVELS.HIGH]: { target: '1-mile @ near-max (hard breathing, single words only)', description: '1-mile time trial', notes: 'Predicted 2-mile: time x2 + 45s. Controlled max effort.' },
    },
    [EXERCISES.HAMR]: {
      [FITNESS_LEVELS.LOW]:  { target: '5-8 shuttle intervals', description: 'HAMR interval set', notes: 'Plant foot wide on turns and push off hard - technique over speed.' },
      [FITNESS_LEVELS.MED]:  { target: '9-14 shuttle intervals', description: 'HAMR interval set', notes: 'Each shuttle should finish in the same time - no fading in later reps.' },
      [FITNESS_LEVELS.HIGH]: { target: '15+ shuttle intervals', description: 'HAMR interval set', notes: 'Race pace effort on each shuttle. Rest 1:1 between.' },
    },
  }

  const exercisePrescriptions = prescriptions[exercise]
  if (!exercisePrescriptions) {
    return {
      target: 'Max effort in the time limit',
      description: 'Quick Benchmark',
      notes: 'Record your result and compare to previous sessions.',
    }
  }

  return exercisePrescriptions[level] || exercisePrescriptions[FITNESS_LEVELS.LOW]
}

// ── Fractional test prescriptions ─────────────────────────────────────────────

/**
 * Prescribe fractional test targets for a given exercise, bracket, and fraction.
 *
 * @param {string} exercise - EXERCISES constant
 * @param {string} ageBracket - e.g. '25-29'
 * @param {string} gender - 'M' or 'F'
 * @param {number} fraction - 0.5 or 0.75
 * @returns {{ target: string, description: string, notes: string }}
 */
export function prescribeFractionalTest(exercise, ageBracket, gender, fraction) {
  const pct = Math.round(fraction * 100)
  const label = `${pct}% Partial Test`

  return {
    target: `Perform ${pct}% of your passing standard for this exercise`,
    description: label,
    notes: `This is a ${pct}% partial test. Your predicted full-test score will be calculated automatically. Results are approximate - always label as estimated.`,
  }
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function addDays(dateISO, days) {
  const d = new Date(dateISO)
  return new Date(d.getTime() + days * 86400000).toISOString().split('T')[0]
}

function daysBetween(fromISO, toISO) {
  const from = new Date(fromISO)
  const to = new Date(toISO)
  return Math.round((to - from) / (1000 * 60 * 60 * 24))
}

function weeksBetween(fromISO, toISO) {
  return Math.floor(daysBetween(fromISO, toISO) / 7)
}

function isSameDay(a, b) {
  return a === b
}

// ── Phase 0 detection ─────────────────────────────────────────────────────────

/**
 * Determine if the user should be placed in Phase 0 (pre-progression).
 *
 * @param {number|null} compositeScore - Most recent composite (0-100), or null
 * @param {number|null} piPushups - Most recent PI push-up count (30-sec), or null
 * @returns {boolean}
 */
export function shouldUsePhase0(compositeScore, piPushups) {
  if (compositeScore == null) return false // No data - default to normal phase progression
  if (compositeScore < 50) return true     // Very low composite
  if (piPushups != null && piPushups < 5) return true // Cannot complete Phase 1 baseline
  return false
}

// ── Week event builder ────────────────────────────────────────────────────────

const DEFAULT_TRAINING_DAYS = [2, 4, 6] // Tue, Thu, Sat (DOW 0=Sun)

/**
 * Returns true if the preferredDays array contains any two back-to-back days
 * (including the Sun/Sat wrap-around pair).
 *
 * @param {number[]} days - Array of DOW ints (0=Sun ... 6=Sat)
 * @returns {boolean}
 */
export function hasConsecutiveDays(days) {
  const sorted = [...days].sort((a, b) => a - b)
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) return true
  }
  // Sun (0) and Sat (6) are adjacent in the weekly cycle
  return sorted.includes(0) && sorted.includes(6)
}

/**
 * Get the ISO date strings for the training days within a given week.
 * Week starts on Monday.
 *
 * @param {string} weekStartISO - ISO date of the week's Monday
 * @param {number[]} preferredDays - DOW ints (0=Sun ... 6=Sat) the user wants to train
 * @returns {string[]} Sorted array of ISO date strings within that Mon-Sun week
 */
function getTrainingDaysForWeek(weekStartISO, preferredDays = DEFAULT_TRAINING_DAYS) {
  // Convert DOW to offset from Monday: Mon=0, Tue=1, ..., Sun=6
  return preferredDays
    .map(dow => addDays(weekStartISO, (dow - 1 + 7) % 7))
    .sort()
}

/**
 * Get the Monday of the week containing the given date.
 * @param {string} dateISO
 * @returns {string} ISO date of that Monday
 */
function getMondayOfWeek(dateISO) {
  const d = new Date(dateISO)
  const day = d.getUTCDay() // use UTC to match how ISO strings are parsed
  const diff = day === 0 ? -6 : 1 - day
  return new Date(d.getTime() + diff * 86400000).toISOString().split('T')[0]
}

// ── Main calendar generator ───────────────────────────────────────────────────

/**
 * Generate a personalized periodized training calendar.
 *
 * @param {object} demographics - Decoded D-code data: { gender, dob, ageBracket }
 * @param {string} targetDateISO - Target PFA date (ISO)
 * @param {object} currentScores - Latest component scores: { composite, cardio, strength, core, bodyComp }
 * @param {string} todayISO - Today's date (ISO)
 * @param {object} [options]
 * @param {number|null} [options.piPushups] - Most recent 30-sec PI push-up count
 * @param {object} [options.practiceSessionMap] - Map of date -> practice session (for completion marking)
 * @param {number[]} [options.preferredDays] - DOW ints (0=Sun...6=Sat) for training days per week
 * @returns {object} Calendar structure
 */
export function generateCalendar(demographics, targetDateISO, currentScores, todayISO, options = {}) {
  const { piPushups = null, practiceSessionMap = {}, preferredDays = DEFAULT_TRAINING_DAYS } = options

  const totalDays = daysBetween(todayISO, targetDateISO)
  const totalWeeks = weeksBetween(todayISO, targetDateISO)

  // Extract earliest PI recordings per exercise for check-in comparisons
  const baselineScores = extractBaselineScores(practiceSessionMap)

  const composite = currentScores?.composite ?? null
  const isPhase0 = shouldUsePhase0(composite, piPushups)
  const startingPhase = detectPhase(totalWeeks, { forcePhase0: isPhase0, totalWeeks })

  const cardioScore   = currentScores?.cardio   ?? null
  const strengthScore = currentScores?.strength  ?? null
  const coreScore     = currentScores?.core      ?? null

  // Precompute phase boundaries and milestone ratios for the dynamic plan
  const boundaries = computePhaseBoundaries(totalWeeks)
  const milestones = totalWeeks >= 6 ? getSpecialEventMilestones(totalWeeks) : { piRatios: [], fractional50Ratio: -1, fractional75Ratio: -1 }
  const milestoneTolerance = 0.5 / Math.max(totalWeeks, 1)
  const baseEndWeekIndex = Math.min(3, boundaries.phases[0].weeks - 1)

  // Track which milestones have been placed (each fires once)
  let placed50 = false
  let placed75 = false
  const placedPI = new Set()

  // Build a flat event map: date -> event[]
  const eventsByDate = {}

  function addEvent(dateISO, event) {
    if (!eventsByDate[dateISO]) eventsByDate[dateISO] = []
    eventsByDate[dateISO].push(event)
  }

  // ── Test day ──────────────────────────────────────────────────────────────
  addEvent(targetDateISO, {
    type:        EVENT_TYPES.TEST_DAY,
    date:        targetDateISO,
    label:       'PFA Test Day',
    description: 'Official Physical Fitness Assessment',
    notes:       'This is the goal. Arrive rested, hydrated, and warmed up.',
    priority:    'critical',
  })

  // ── Mock test at -14 days (TR-01) ─────────────────────────────────────────
  const mockTestDate = addDays(targetDateISO, -14)
  if (daysBetween(todayISO, mockTestDate) >= 0) {
    addEvent(mockTestDate, {
      type:        EVENT_TYPES.MOCK_TEST,
      date:        mockTestDate,
      label:       'Full Mock Test',
      description: 'One full practice test, 14 days before your actual assessment.',
      notes:       'Simulate test conditions as closely as possible. After today, your calendar switches to a structured 2-week taper with specific daily guidance.',
      priority:    'high',
    })
  }

  // ── Taper period: -14 to -1 days (TR-10) ─────────────────────────────────
  // Structured 14-day taper with specific daily guidance.
  // Week 1 (days -14 to -8): reduced training with short, sharp sessions.
  // Week 2 (days -7 to -1): minimal activity, full recovery focus.
  const TAPER_SCHEDULE = [
    // Day 0 = mock test day (skipped below)
    { day: 1,  label: 'Taper - Easy Recovery',      description: 'Light 15-min walk or easy bike. Gentle dynamic stretching for 10 min.',                                              notes: 'Active recovery from yesterday\'s mock test. Keep moving but stay well below training effort.' },
    { day: 2,  label: 'Taper - Short Strength',      description: 'Push-ups: 2 sets of 10-15 at an easy pace (90s rest). Core: 2 sets of 10-15 at an easy pace (90s rest).',             notes: 'Half your normal sets and reps. Focus on smooth form, not max effort.' },
    { day: 3,  label: 'Taper - Rest Day',             description: 'Full rest. No training.',                                                                                            notes: 'Walk if you feel restless, but no structured exercise. Hydrate well.' },
    { day: 4,  label: 'Taper - Light Cardio',         description: '15-min easy run at conversational pace. You should be able to speak full sentences comfortably.',                     notes: 'Keep the pace relaxed. This is about maintaining your aerobic base, not building it.' },
    { day: 5,  label: 'Taper - Short Strength',       description: 'Push-ups: 2 sets of 8-12, stopping well before failure (90s rest). Core: 2 sets of 8-12 with controlled form (90s rest).', notes: 'Last strength session of the taper. Crisp reps, perfect form, no grinding.' },
    { day: 6,  label: 'Taper - Rest Day',             description: 'Full rest. No training.',                                                                                            notes: 'Recovery is the priority now. Sleep 7-9 hours tonight.' },
    { day: 7,  label: 'Taper - Easy Movement',        description: '10-min easy walk and 10 min of dynamic stretching (leg swings, arm circles, hip openers).',                          notes: 'Stay loose without adding fatigue. This is the start of your final rest week.' },
    { day: 8,  label: 'Taper - Rest Day',             description: 'Full rest. No training.',                                                                                            notes: 'Trust your preparation. Fitness gains are already locked in.' },
    { day: 9,  label: 'Taper - Light Shakeout',       description: '10-min easy jog at a very relaxed pace, followed by 5 min of dynamic stretching.',                                   notes: 'Just enough movement to stay loose. Effort should feel effortless.' },
    { day: 10, label: 'Taper - Rest Day',             description: 'Full rest. No training.',                                                                                            notes: 'Continue hydrating well and eating balanced meals.' },
    { day: 11, label: 'Taper - Light Activation',     description: '5 push-ups, 5 sit-ups, 5-min easy walk. Just enough to wake up the muscles.',                                        notes: 'This is not a workout. It is a brief reminder to your body of what test day feels like.' },
    { day: 12, label: 'Taper - Rest Day',             description: 'Full rest. No training.',                                                                                            notes: 'Two days out. Lay out your test-day gear and review your pacing plan.' },
    { day: 13, label: 'Taper - Day Before Test',      description: 'Full rest. Optional 5-min walk if you feel antsy.',                                                                  notes: 'Eat a normal dinner, hydrate, and get to bed early. You are ready.' },
  ]

  const taperStart = addDays(targetDateISO, -14)
  for (const entry of TAPER_SCHEDULE) {
    const d = addDays(taperStart, entry.day)
    if (daysBetween(todayISO, d) < 0) continue
    if (isSameDay(d, targetDateISO)) continue
    addEvent(d, {
      type:        EVENT_TYPES.TAPER,
      date:        d,
      label:       entry.label,
      description: entry.description,
      notes:       entry.notes,
      priority:    entry.day >= 7 ? 'high' : 'medium',
    })
  }

  // ── Build week-by-week schedule ───────────────────────────────────────────

  const firstMonday = getMondayOfWeek(todayISO)
  const weeks = []

  let weekStart = firstMonday
  let weekIndex = 0
  let piCycleIndex = 0 // tracks which PI component to cycle to next

  while (daysBetween(weekStart, targetDateISO) > 0) {
    const weekEnd      = addDays(weekStart, 6)
    const daysToTarget = daysBetween(weekStart, targetDateISO)
    const weeksToTarget = Math.ceil(daysToTarget / 7)

    // Dynamic phase detection using progression ratio
    const weekRatio = getProgressionRatio(weeksToTarget, totalWeeks)
    const phaseForWeek = detectPhase(weeksToTarget, { forcePhase0: isPhase0, totalWeeks })
    const phaseName = isPhase0 ? null : getPhaseFromRatio(weekRatio, totalWeeks)

    // Week 1 baseline PI
    const isBaselineWeek = weekIndex === 0 && totalWeeks >= 10 && !isPhase0

    // Foundation check-in: at end of BASE phase (capped at weekIndex 3)
    const isFoundationCheckin = weekIndex === baseEndWeekIndex
      && weekIndex > 0 && totalWeeks >= 10
      && (startingPhase === PHASES.PHASE_1 || startingPhase === PHASES.PHASE_0)

    // PI workout: check if this week's ratio matches any PI milestone
    let isPIWeek = false
    if (!isBaselineWeek && !isFoundationCheckin && weeksToTarget > 2) {
      for (const piR of milestones.piRatios) {
        if (!placedPI.has(piR) && Math.abs(weekRatio - piR) <= milestoneTolerance) {
          isPIWeek = true
          break
        }
      }
    }

    // Fractional tests: match against ratio milestones (fire once each)
    const is50TestWeek = !placed50 && totalWeeks >= 10
      && Math.abs(weekRatio - milestones.fractional50Ratio) <= milestoneTolerance
    const is75TestWeek = !placed75 && totalWeeks >= 6
      && Math.abs(weekRatio - milestones.fractional75Ratio) <= milestoneTolerance

    const trainingDays = getTrainingDaysForWeek(weekStart, preferredDays)

    trainingDays.forEach((dayISO, idx) => {
      // Skip days before today
      if (daysBetween(todayISO, dayISO) < 0) return
      // Skip taper days and days at/after test day
      if (daysBetween(dayISO, taperStart) <= 0) return
      if (daysBetween(dayISO, targetDateISO) <= 0) return

      // ── Week 1 baseline: Day 1 = strength + core, Day 2 = cardio ────────────
      if (isBaselineWeek && idx === 0) {
        addEvent(dayISO, {
          type:        EVENT_TYPES.BASELINE_PI,
          date:        dayISO,
          label:       'Week 1 Baseline - Strength & Core',
          description: '30-sec max push-ups, then rest 2 min, then 30-sec max sit-ups.',
          notes:       'Not a test. Establishes your Day 1 numbers only. Record each in Practice Check > PI Workout. Training begins immediately after.',
          target:      '30-sec max push-ups + 30-sec max sit-ups',
          priority:    'high',
        })
        return
      }
      if (isBaselineWeek && idx === 1) {
        addEvent(dayISO, {
          type:        EVENT_TYPES.BASELINE_PI,
          date:        dayISO,
          label:       'Week 1 Baseline - Cardio',
          description: '400m run at comfortable effort. Record your time.',
          notes:       'Predicts your 2-mile pace. Record in Practice Check > PI Workout > 400m Run.',
          target:      '400m run - record time',
          priority:    'high',
        })
        return
      }

      // ── Foundation check-in: repeat Week 1, measure delta ──────────────────
      if (isFoundationCheckin && idx === 0) {
        const scTarget = baselineScores.hasStrengthCore
          ? `Beat your Week 1 scores: ${[baselineScores.pushups, baselineScores.situps].filter(Boolean).join(', ')}`
          : 'Beat your Week 1 push-up and sit-up counts'
        addEvent(dayISO, {
          type:        EVENT_TYPES.FOUNDATION_CHECKIN,
          date:        dayISO,
          label:       'Phase 1 Check-in - Strength & Core',
          description: 'Repeat exactly: 30-sec max push-ups, rest 2 min, 30-sec max sit-ups.',
          notes:       'Compare to Week 1 numbers. This is your first visible evidence of progress. Record in Practice Check > PI Workout.',
          target:      scTarget,
          priority:    'medium',
        })
        return
      }
      if (isFoundationCheckin && idx === 1) {
        const cardioTarget = baselineScores.hasCardio
          ? `Beat your Week 1 time: ${baselineScores.run400}`
          : 'Beat your Week 1 400m time'
        addEvent(dayISO, {
          type:        EVENT_TYPES.FOUNDATION_CHECKIN,
          date:        dayISO,
          label:       'Phase 1 Check-in - Cardio',
          description: '400m run. Compare to Week 1 time.',
          notes:       'A faster time is your first visible cardio evidence. Record in Practice Check > PI Workout > 400m Run.',
          target:      cardioTarget,
          priority:    'medium',
        })
        return
      }

      // ── 50% fractional test (ratio-based) ─────────────────────────────────
      if (is50TestWeek && idx === 1 && !placed50) {
        placed50 = true
        addEvent(dayISO, {
          type:        EVENT_TYPES.FRACTIONAL_TEST,
          date:        dayISO,
          label:       '50% Partial Test',
          description: 'Run a 50% effort test across all components.',
          notes:       'Label all results as "50% test estimates". Record actual reps/times.',
          fraction:    0.5,
          priority:    'high',
          completed:   !!(practiceSessionMap[dayISO]),
        })
        return
      }

      // ── 75% fractional test (ratio-based) ─────────────────────────────────
      if (is75TestWeek && idx === 1 && !placed75) {
        placed75 = true
        addEvent(dayISO, {
          type:        EVENT_TYPES.FRACTIONAL_TEST,
          date:        dayISO,
          label:       '75% Partial Test',
          description: 'Run a 75% effort test across all components.',
          notes:       'Label all results as "75% test estimates". You should be well above passing at this point.',
          fraction:    0.75,
          priority:    'high',
          completed:   !!(practiceSessionMap[dayISO]),
        })
        return
      }

      // ── PI workout (ratio-based) ──────────────────────────────────────────
      if (isPIWeek && idx === 0) {
        // Mark the matching PI ratio as placed
        for (const piR of milestones.piRatios) {
          if (!placedPI.has(piR) && Math.abs(weekRatio - piR) <= milestoneTolerance) {
            placedPI.add(piR)
            break
          }
        }

        const piCycle = [
          { component: COMPONENTS.CARDIO,   exercise: EXERCISES.RUN_2MILE, fitnessLevel: getFitnessLevel(cardioScore) },
          { component: COMPONENTS.STRENGTH,  exercise: EXERCISES.PUSHUPS,   fitnessLevel: getFitnessLevel(strengthScore) },
          { component: COMPONENTS.CORE,      exercise: EXERCISES.SITUPS,    fitnessLevel: getFitnessLevel(coreScore) },
        ]
        const piItem = piCycle[piCycleIndex % 3]
        piCycleIndex++
        const rx = prescribePIWorkout(piItem.exercise, piItem.fitnessLevel)

        addEvent(dayISO, {
          type:        EVENT_TYPES.PI_WORKOUT,
          date:        dayISO,
          label:       `Quick Benchmark - ${rx.description}`,
          description: rx.description,
          notes:       rx.notes,
          target:      rx.target,
          component:   piItem.component,
          exercise:    piItem.exercise,
          priority:    'medium',
          completed:   !!(practiceSessionMap[dayISO]),
        })
        return
      }

      // ── Regular training day ──────────────────────────────────────────────
      const phaseLabel = phaseName ? PHASE_DISPLAY[phaseName] : null
      const specialInfo = phaseName
        ? getSpecialWeekInfoFromRatio(weekRatio, totalWeeks)
        : { isSpecial: false }

      const dayLabel = phaseForWeek === PHASES.PHASE_0
        ? 'Pre-Progression Training'
        : `${phaseLabel} Phase Training`

      // Get phase-governed session prescription
      let effortLabel = null
      let intensity = null
      let stress = null
      let sessionType = null
      if (phaseName) {
        const phaseTemplates = WEEKLY_TEMPLATES[phaseName] || WEEKLY_TEMPLATES[PHASE_NAMES.BASE]
        const sessionTemplate = phaseTemplates[idx % phaseTemplates.length]
        intensity = capIntensity(sessionTemplate.intensity, phaseName)
        effortLabel = EFFORT_LABELS[intensity]
        stress = sessionTemplate.stress || 3
        sessionType = sessionTemplate.type || null
      }

      addEvent(dayISO, {
        type:        EVENT_TYPES.TRAINING,
        date:        dayISO,
        label:       dayLabel,
        description: getTrainingDayDescription(phaseName, phaseForWeek, idx),
        notes:       getTrainingDayNotes(phaseName, phaseForWeek, idx),
        phase:       phaseForWeek,
        phaseName,
        phaseLabel,
        intensity,
        effortLabel,
        stress,
        weekNum:     weekNumberFromWeeksOut(weeksToTarget, totalWeeks),
        displayWeekNum: weekIndex + 1,
        progressionRatio: weekRatio,
        repInstruction: phaseName ? getRepInstruction(phaseName, sessionType) : null,
        isSpecialWeek: specialInfo.isSpecial,
        specialWeekType: specialInfo.type || null,
        priority:    'normal',
      })
    })

    // Week metadata
    const specialWeekMeta = phaseName
      ? getSpecialWeekInfoFromRatio(weekRatio, totalWeeks)
      : { isSpecial: false }

    weeks.push({
      weekNumber:     weekIndex + 1,
      planWeekNum:    weekNumberFromWeeksOut(weeksToTarget, totalWeeks),
      progressionRatio: weekRatio,
      weekStart,
      weekEnd,
      daysToTarget,
      weeksToTarget,
      phase:            phaseForWeek,
      phaseName,
      phaseLabel:       phaseName ? PHASE_DISPLAY[phaseName] : null,
      isPIWeek,
      isBaselineWeek,
      isFoundationCheckin,
      is50TestWeek,
      is75TestWeek,
      isSpecialWeek:    specialWeekMeta.isSpecial,
      specialWeekType:  specialWeekMeta.type,
      specialWeekLabel: specialWeekMeta.label,
    })

    weekStart = addDays(weekStart, 7)
    weekIndex++
  }

  return {
    targetDate:     targetDateISO,
    today:          todayISO,
    totalDays,
    totalWeeks,
    startingPhase,
    isPhase0,
    phaseBoundaries: boundaries,
    mockTestDate:   daysBetween(todayISO, mockTestDate) >= 0 ? mockTestDate : null,
    taperStart,
    weeks,
    eventsByDate,
  }
}

// ── Baseline score extraction ────────────────────────────────────────────────

/**
 * Scan practice sessions for the earliest PI recording per exercise.
 * Returns an object with formatted display values for check-in comparisons.
 */
function extractBaselineScores(practiceSessionMap) {
  const earliest = {}
  const sessions = Object.values(practiceSessionMap)
    .filter(s => s.type === 'pi_workout' && s.piExercise && s.piValue != null)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  for (const s of sessions) {
    if (!earliest[s.piExercise]) {
      earliest[s.piExercise] = s.piValue
    }
  }

  const pushups = earliest[PI_EXERCISES.PUSHUPS_30S]
  const situps  = earliest[PI_EXERCISES.SITUPS_30S]
  const run400  = earliest[PI_EXERCISES.RUN_400M]

  return {
    pushups: pushups != null ? `${pushups} push-ups in 30 sec` : null,
    situps:  situps != null  ? `${situps} sit-ups in 30 sec`   : null,
    run400:  run400 != null  ? `${formatSecondsMMSS(run400)} for 400m` : null,
    hasPushups: pushups != null,
    hasSitups:  situps != null,
    hasRun400:  run400 != null,
    hasStrengthCore: pushups != null || situps != null,
    hasCardio: run400 != null,
  }
}

// ── Training day copy helpers ─────────────────────────────────────────────────

function getTrainingDayDescription(phaseName, phaseNumber, sessionIndex) {
  // Phase 0 retains its own pre-progression descriptions
  if (phaseNumber === PHASES.PHASE_0 || !phaseName) {
    const phase0Sessions = [
      'Wall push-ups: 3x10, Chair-assisted sit-ups: 3x8, 10-min brisk walk',
      'Incline push-ups: 3x8, Glute bridges: 3x12, 15-min light walk',
      'Knee push-ups: 3x6, Modified crunches: 3x10, 20-min easy walk or bike',
    ]
    return phase0Sessions[sessionIndex % phase0Sessions.length]
  }

  const templates = WEEKLY_TEMPLATES[phaseName] || WEEKLY_TEMPLATES[PHASE_NAMES.BASE]
  const template = templates[sessionIndex % templates.length]
  return template.description
}

function getTrainingDayNotes(phaseName, phaseNumber, sessionIndex) {
  if (phaseNumber === PHASES.PHASE_0 || !phaseName) {
    return 'Pre-progression: Rest 60-90s between sets. Stop a rep or two short of failure - form matters more than count right now.'
  }

  const templates = WEEKLY_TEMPLATES[phaseName] || WEEKLY_TEMPLATES[PHASE_NAMES.BASE]
  const template = templates[sessionIndex % templates.length]
  const effortInstruction = getRepInstruction(phaseName, template.type)
  return `${template.notes} ${effortInstruction}`
}

// ── Utility re-exports ────────────────────────────────────────────────────────

export { daysBetween, weeksBetween, addDays, getFitnessLevel, FITNESS_LEVELS }

// Re-export phase engine types for consumers
export {
  PHASE_NAMES,
  PHASE_DISPLAY,
  INTENSITY,
  EFFORT_LABELS,
  getPhase,
  weekNumberFromWeeksOut,
  getProgressionRatio,
  getPhaseFromRatio,
  computePhaseBoundaries,
  getSpecialEventMilestones,
  phaseConfig,
  getRepInstruction,
  getSpecialWeekInfo,
  PI_WEEKS,
} from './phaseEngine.js'
