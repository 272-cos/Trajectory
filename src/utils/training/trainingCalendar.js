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
 * TR-07: Phase 0 is returned when composite < 50 or PI push-ups < 5.
 *
 * @param {number} weeksOut - Weeks until target PFA date (from today)
 * @param {object} [options]
 * @param {boolean} [options.forcePhase0] - Force Phase 0 (deconditioning path)
 * @returns {number} PHASES constant
 */
export function detectPhase(weeksOut, { forcePhase0 = false } = {}) {
  if (forcePhase0) return PHASES.PHASE_0
  if (weeksOut >= 13) return PHASES.PHASE_1
  if (weeksOut >= 9) return PHASES.PHASE_2
  if (weeksOut >= 5) return PHASES.PHASE_3
  return PHASES.PHASE_4
}

// ── Event types ───────────────────────────────────────────────────────────────

export const EVENT_TYPES = {
  TRAINING:        'training',
  REST:            'rest',
  PI_WORKOUT:      'pi_workout',
  FRACTIONAL_TEST: 'fractional_test',
  MOCK_TEST:       'mock_test',
  TAPER:           'taper',
  TEST_DAY:        'test_day',
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
      [FITNESS_LEVELS.LOW]:  { target: '1-mile @ conversational pace', description: '1-mile run benchmark', notes: 'Predicted 2-mile: time x2 + 45s. No anaerobic effort today.' },
      [FITNESS_LEVELS.MED]:  { target: '1-mile @ goal race pace', description: '1-mile run benchmark', notes: 'Predicted 2-mile: time x2 + 45s. Should feel comfortably hard.' },
      [FITNESS_LEVELS.HIGH]: { target: '1-mile @ faster than race pace', description: '1-mile time trial', notes: 'Predicted 2-mile: time x2 + 45s. Controlled max effort.' },
    },
    [EXERCISES.HAMR]: {
      [FITNESS_LEVELS.LOW]:  { target: '5-8 shuttle intervals', description: 'HAMR interval set', notes: 'Focus on quick directional change, low center of gravity.' },
      [FITNESS_LEVELS.MED]:  { target: '9-14 shuttle intervals', description: 'HAMR interval set', notes: 'Push for consistent splits across all intervals.' },
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
    notes: `TR-04: This is a ${pct}% partial test. Your predicted full-test score will be calculated automatically. Results are approximate - always label as estimated.`,
  }
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function addDays(dateISO, days) {
  const d = new Date(dateISO)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
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
  if (compositeScore == null) return true  // No S-code data
  if (compositeScore < 50) return true     // Very low composite
  if (piPushups != null && piPushups < 5) return true // Cannot complete Phase 1 baseline
  return false
}

// ── Week event builder ────────────────────────────────────────────────────────

const TRAINING_DAYS_PER_WEEK = [1, 3, 5] // Mon, Wed, Fri (0=Sun)

/**
 * Get the ISO date strings for the training days within a given week.
 * Week starts on Monday.
 *
 * @param {string} weekStartISO - ISO date of the week's Monday
 * @returns {string[]} Array of ISO date strings (Tue, Thu, Sat for balanced spacing)
 */
function getTrainingDaysForWeek(weekStartISO) {
  // Use Tue (1), Thu (3), Sat (5) offsets from Monday start
  return TRAINING_DAYS_PER_WEEK.map(offset => addDays(weekStartISO, offset))
}

/**
 * Get the Monday of the week containing the given date.
 * @param {string} dateISO
 * @returns {string} ISO date of that Monday
 */
function getMondayOfWeek(dateISO) {
  const d = new Date(dateISO)
  const day = d.getDay() // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
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
 * @returns {object} Calendar structure
 */
export function generateCalendar(demographics, targetDateISO, currentScores, todayISO, options = {}) {
  const { piPushups = null, practiceSessionMap = {} } = options

  const totalDays = daysBetween(todayISO, targetDateISO)
  const totalWeeks = weeksBetween(todayISO, targetDateISO)

  const composite = currentScores?.composite ?? null
  const isPhase0 = shouldUsePhase0(composite, piPushups)
  const startingPhase = detectPhase(totalWeeks, { forcePhase0: isPhase0 })

  const cardioScore   = currentScores?.cardio   ?? null
  const strengthScore = currentScores?.strength  ?? null
  const coreScore     = currentScores?.core      ?? null

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
      description: 'TR-01: One full practice test, done exactly once at -14 days.',
      notes:       'Simulate test conditions. After this, shift to taper. Reduce training volume by 50%.',
      priority:    'high',
    })
  }

  // ── Taper period: -14 to -1 days (TR-10) ─────────────────────────────────
  const taperStart = addDays(targetDateISO, -14)
  for (let i = 0; i <= 13; i++) {
    const d = addDays(taperStart, i)
    if (daysBetween(todayISO, d) < 0) continue
    if (isSameDay(d, mockTestDate)) continue // mock test day already has its event
    if (isSameDay(d, targetDateISO)) continue // test day already set
    addEvent(d, {
      type:        EVENT_TYPES.TAPER,
      date:        d,
      label:       'Taper Period',
      description: 'Reduce volume 50%. Maintain intensity, cut frequency.',
      notes:       'TR-10: Do not add new training stress. Sleep, hydrate, and recover.',
      priority:    'medium',
    })
  }

  // ── Build week-by-week schedule ───────────────────────────────────────────

  // Walk week by week from today to target, skip taper weeks (already covered)
  const firstMonday = getMondayOfWeek(todayISO)
  const weeks = []

  let weekStart = firstMonday
  let weekIndex = 0

  while (daysBetween(weekStart, targetDateISO) > 0) {
    const weekEnd      = addDays(weekStart, 6)
    const daysToTarget = daysBetween(weekStart, targetDateISO)
    const weeksToTarget = Math.ceil(daysToTarget / 7)

    const phaseForWeek = detectPhase(weeksToTarget, { forcePhase0: isPhase0 })

    // PI workout every other week (alternating by weekIndex parity)
    const isPIWeek = (weekIndex % 2 === 0) && weeksToTarget > 2

    // Fractional test: once in Phase 2 (50%) and once in Phase 3 (75%)
    const is50TestWeek = phaseForWeek === PHASES.PHASE_2 && weeksToTarget === 10
    const is75TestWeek = phaseForWeek === PHASES.PHASE_3 && weeksToTarget === 6

    const trainingDays = getTrainingDaysForWeek(weekStart)

    trainingDays.forEach((dayISO, idx) => {
      // Skip days before today
      if (daysBetween(todayISO, dayISO) < 0) return
      // Skip taper days and days at/after test day (handled above)
      if (daysBetween(dayISO, taperStart) <= 0) return
      if (daysBetween(dayISO, targetDateISO) <= 0) return

      // First training day of the PI week -> PI workout
      if (isPIWeek && idx === 0) {
        // Cycle through: cardio PI, strength PI, core PI
        const piCycle = [
          { component: COMPONENTS.CARDIO,   exercise: EXERCISES.RUN_2MILE, fitnessLevel: getFitnessLevel(cardioScore) },
          { component: COMPONENTS.STRENGTH,  exercise: EXERCISES.PUSHUPS,   fitnessLevel: getFitnessLevel(strengthScore) },
          { component: COMPONENTS.CORE,      exercise: EXERCISES.SITUPS,    fitnessLevel: getFitnessLevel(coreScore) },
        ]
        const piItem = piCycle[Math.floor(weekIndex / 2) % 3]
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

      // 50% fractional test week
      if (is50TestWeek && idx === 1) {
        addEvent(dayISO, {
          type:        EVENT_TYPES.FRACTIONAL_TEST,
          date:        dayISO,
          label:       '50% Partial Test',
          description: 'Run a 50% effort test across all components.',
          notes:       'TR-04: Label all results as "50% test estimates". Record actual reps/times.',
          fraction:    0.5,
          priority:    'high',
          completed:   !!(practiceSessionMap[dayISO]),
        })
        return
      }

      // 75% fractional test week
      if (is75TestWeek && idx === 1) {
        addEvent(dayISO, {
          type:        EVENT_TYPES.FRACTIONAL_TEST,
          date:        dayISO,
          label:       '75% Partial Test',
          description: 'Run a 75% effort test across all components.',
          notes:       'TR-04: Label all results as "75% test estimates". You should be well above passing at this point.',
          fraction:    0.75,
          priority:    'high',
          completed:   !!(practiceSessionMap[dayISO]),
        })
        return
      }

      // Regular training day
      const dayLabel = phaseForWeek === PHASES.PHASE_0
        ? 'Pre-Progression Training'
        : phaseForWeek === PHASES.PHASE_4
          ? 'Taper-Prep Training'
          : `Phase ${phaseForWeek} Training`

      addEvent(dayISO, {
        type:        EVENT_TYPES.TRAINING,
        date:        dayISO,
        label:       dayLabel,
        description: getTrainingDayDescription(phaseForWeek, idx),
        notes:       getTrainingDayNotes(phaseForWeek),
        phase:       phaseForWeek,
        priority:    'normal',
      })
    })

    // Rest days in the week (not tracked as events - absence of events = rest day)

    weeks.push({
      weekNumber:     weekIndex + 1,
      weekStart,
      weekEnd,
      daysToTarget,
      weeksToTarget,
      phase:          phaseForWeek,
      isPIWeek,
      is50TestWeek,
      is75TestWeek,
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
    mockTestDate:   daysBetween(todayISO, mockTestDate) >= 0 ? mockTestDate : null,
    taperStart:     daysBetween(todayISO, taperStart) >= 0 ? taperStart : taperStart, // always include
    weeks,
    eventsByDate,
  }
}

// ── Training day copy helpers ─────────────────────────────────────────────────

function getTrainingDayDescription(phase, sessionIndex) {
  const sessions = {
    [PHASES.PHASE_0]: [
      'Wall push-ups, chair-assisted sit-ups, 10-min brisk walk',
      'Incline push-ups, glute bridges, 15-min light walk',
      'Knee push-ups, modified crunches, 20-min easy walk or bike',
    ],
    [PHASES.PHASE_1]: [
      'Cardio base: 20-30 min conversational-pace run/walk',
      'Strength + Core: 3x max push-ups, 3x max sit-ups with 90s rest',
      'Cardio variation: 20 min sustained run or long walk intervals',
    ],
    [PHASES.PHASE_2]: [
      'Cardio build: 30 min with 2x5-min goal-pace inserts',
      'Strength + Core: 4x max push-ups, 4x max sit-ups; reduce rest to 60s',
      'Cardio endurance: 30-35 min sustained, slightly faster than Phase 1',
    ],
    [PHASES.PHASE_3]: [
      'Cardio intensity: Tempo run 20 min @ 80% max heart rate',
      'Strength + Core: 4x max push-ups, max sit-ups; 45s rest (race simulation)',
      'Cardio speed: 6x400m @ faster than goal pace, 2 min rest between',
    ],
    [PHASES.PHASE_4]: [
      'Cardio maintenance: 20 min easy run - no hard efforts',
      'Strength + Core: 2x moderate push-ups and sit-ups - feel sharp, not spent',
      'Movement prep: Light jog, dynamic stretching, no intensity',
    ],
  }

  const phaseSessions = sessions[phase] || sessions[PHASES.PHASE_1]
  return phaseSessions[sessionIndex % phaseSessions.length]
}

function getTrainingDayNotes(phase) {
  const notes = {
    [PHASES.PHASE_0]: 'TR-07: Pre-progression. Focus on form and consistency - not intensity.',
    [PHASES.PHASE_1]: 'TR-08: Goal is to build confidence and habits. Effort should feel sustainable.',
    [PHASES.PHASE_2]: 'TR-08: Add effort gradually. If something hurts, back off immediately.',
    [PHASES.PHASE_3]: 'TR-08: This is the hardest phase. One hard day between recovery days.',
    [PHASES.PHASE_4]: 'TR-10: Taper-prep. Less is more. Show up to test day rested, not exhausted.',
  }
  return notes[phase] || notes[PHASES.PHASE_1]
}

// ── Utility re-exports ────────────────────────────────────────────────────────

export { daysBetween, weeksBetween, addDays, getFitnessLevel, FITNESS_LEVELS }
