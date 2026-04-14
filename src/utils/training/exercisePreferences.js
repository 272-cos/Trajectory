/**
 * PFA Exercise Preferences
 *
 * Defines the supported PFA event variants for each component category,
 * and provides phase-aware session descriptions for each variant.
 *
 * Default exercises (Push-ups, Sit-ups, Distance Run) are handled by the
 * existing WEEKLY_TEMPLATES in phaseEngine.js. Non-default selections are
 * composed here and injected by generateCalendar().
 *
 * PHASE_NAMES values: 'BASE', 'BUILD', 'BUILD_PLUS', 'SHARPEN'
 * INTENSITY values:   'low', 'moderate', 'high'
 */

// ── Option enums ──────────────────────────────────────────────────────────────

export const UPPER_BODY = {
  PUSHUPS: 'pushups',
  HRPU:    'hrpu',
}

export const CORE = {
  SITUPS: 'situps',
  PLANK:  'plank',
}

export const CARDIO = {
  RUN:  'run',
  HAMR: 'hamr',
}

export const DEFAULT_PREFERENCES = {
  upperBody: UPPER_BODY.PUSHUPS,
  core:      CORE.SITUPS,
  cardio:    CARDIO.RUN,
}

// ── UI display labels ─────────────────────────────────────────────────────────

export const UPPER_BODY_LABELS = {
  [UPPER_BODY.PUSHUPS]: 'Push-ups',
  [UPPER_BODY.HRPU]:    'Hand-Release Push-ups',
}

export const CORE_LABELS = {
  [CORE.SITUPS]: 'Sit-ups',
  [CORE.PLANK]:  'Plank',
}

export const CARDIO_LABELS = {
  [CARDIO.RUN]:  'Distance Run',
  [CARDIO.HAMR]: 'HAMR Shuttle',
}

// ── Strength session prescription snippets ────────────────────────────────────
//
// Indexed by [exerciseKey][phaseName][intensity].
// These are combined to compose strength_core descriptions when preferences
// differ from the Push-ups + Sit-ups defaults already in WEEKLY_TEMPLATES.

const UPPER_BODY_SNIPPETS = {
  [UPPER_BODY.PUSHUPS]: {
    BASE:       { low:      'Push-ups: 3 sets, stop 3-4 reps before failure (90s rest).' },
    BUILD:      { moderate: 'Push-ups: 4 sets, stop 2-3 reps before failure (60s rest).' },
    BUILD_PLUS: {
      moderate:  'Push-ups: 4 sets, stop 1-2 reps before failure (45s rest).',
      high:      'Push-ups: 4 timed 30-sec sets, leaving 1-2 reps in reserve (2 min rest).',
    },
    SHARPEN:    { high:     'Push-ups: 2 sets, stop 1 rep before failure (2 min rest). Reduced volume to stay sharp.' },
  },
  [UPPER_BODY.HRPU]: {
    BASE:       { low:      'Hand-release push-ups: 3 sets, stop 4-5 reps before failure (90s rest). Focus on a clean hand lift on every rep before pressing back up.' },
    BUILD:      { moderate: 'Hand-release push-ups: 4 sets, stop 2-3 reps before failure (60s rest). Controlled descent, full chest-to-floor, clean hand lift, then press.' },
    BUILD_PLUS: {
      moderate:  'Hand-release push-ups: 4 sets, stop 2-3 reps before failure (60s rest). Timed 30-sec sets - count reps each set and try to match the count across all sets.',
      high:      'Hand-release push-ups: 4 timed 30-sec sets, leaving 1-2 reps in reserve (90s rest). Find your test rhythm now - a slightly slower, sustainable pace beats a hard sprint followed by a collapse.',
    },
    SHARPEN:    { high:     'Hand-release push-ups: 2 timed 1-min sets at near-test effort (2 min rest). Simulate the first two minutes of test conditions. Record your rep count each set.' },
  },
}

const CORE_SNIPPETS = {
  [CORE.SITUPS]: {
    BASE:       { low:      'Sit-ups: 3 sets, stop 3-4 reps before failure (90s rest). Plank: 3 holds, maintain for maximum controlled effort (90s rest).' },
    BUILD:      { moderate: 'Core: 4 sets, as many quality reps as possible while maintaining perfect form (60s rest).' },
    BUILD_PLUS: {
      moderate:  'Core: 4 sets, perform at a brisk but controlled pace for the full duration (45s rest).',
      high:      'Core: timed sets matching test format - maximum controlled effort for the full duration (2 min rest).',
    },
    SHARPEN:    { high:     'Core: 2 sets, maximum controlled effort for the full duration (2 min rest). Reduced volume to stay sharp.' },
  },
  [CORE.PLANK]: {
    BASE:       { low:      'Plank: 4 holds of 20-30 seconds (60s rest). Focus on a neutral spine - ears, hips, and heels in a straight line. Stop when form breaks, not the clock.' },
    BUILD:      { moderate: 'Plank: 3 holds of 60-75 seconds (60s rest). Break the hold into 15-second mental blocks. If form holds at 75 seconds, add 10 seconds next session.' },
    BUILD_PLUS: {
      moderate:  'Plank: 3 holds of 90 seconds (45s rest). At the 60-second mark, consciously re-squeeze glutes and re-brace your abs - that reset adds 20-30 seconds to most athletes ceiling.',
      high:      'Plank: 2 holds, each pushed to 2 minutes or near-form failure (2 min rest). Record the exact time of each hold. The second hold reveals your true floor under fatigue.',
    },
    SHARPEN:    { high:     'Plank: 1 full hold at maximum controlled effort. No time target - hold until form fails. This is your dress rehearsal. Record the time.' },
  },
}

// ── HAMR cardio prescription descriptions ─────────────────────────────────────
//
// Keyed by WEEKLY_TEMPLATES template label (unique across all phases).
// Returned only when pfaPreferences.cardio === CARDIO.HAMR.

const HAMR_DESCRIPTION_BY_LABEL = {
  'Easy Aerobic':     '20-meter shuttle familiarization: 10 shuttles at a relaxed, controlled pace (30s rest between sets of 5). Focus on planting your outside foot before the turn and pushing back hard - not on speed.',
  'Aerobic Variation':'Aerobic base run - 20 min at a conversational pace. Aerobic capacity is the engine behind HAMR performance. Getting comfortable running easy builds the ceiling for later speed work.',
  'Endurance Cardio': 'Aerobic base run - 30 min at a comfortable, conversational pace. Consistent aerobic volume is the foundation of HAMR endurance.',
  'Tempo Cardio':     '4 shuttle sets of 8 reps each (20m per rep) at a moderate, sustainable effort (90s rest between sets). Each shuttle should finish in roughly the same time - no fading in later reps.',
  'Hard Intervals':   '6 shuttle sets of 6 reps each (20m per rep) at a hard but controlled effort (2 min rest between sets). Think level 6-8 on the HAMR scale - push on the shuttle, coast at the turn, push back.',
  'Moderate Cardio':  '5 shuttle sets of 8-10 reps each (20m per rep) at level 5-7 HAMR-equivalent pace (90s rest). Add one extra rep to at least two sets compared to last week.',
  'Race Simulation':  '3 shuttle sets of 10 reps each (20m per rep) at near-test effort (2 min rest). Simulate the pace and intensity of the final levels of your target score. Record how your breathing feels at the turn.',
  'Easy Maintenance': '4 shuttle sets of 6 reps each (20m per rep) at a relaxed, controlled effort (2 min rest). Maintain the movement pattern without adding fatigue before test day.',
}

const HAMR_NOTES_BY_LABEL = {
  'Easy Aerobic':     'Shuttle discipline comes from the turn, not the sprint. Master the pivot and push-off now - it will save you 10+ shuttles on test day.',
  'Aerobic Variation':'Aerobic runs build the engine for HAMR. Even at easy pace, every minute of Zone 2 work extends your HAMR ceiling.',
  'Endurance Cardio': 'Long aerobic work builds the cardiorespiratory base. This session is not shuttle-specific but directly lifts your HAMR ceiling.',
  'Tempo Cardio':     'A steady tempo across all sets - fading in later reps indicates you started too fast. Dial back and finish strong.',
  'Hard Intervals':   'This is the hardest session of the week. Push the shuttle, recover at the cones. Do not rush the turn.',
  'Moderate Cardio':  'Progressive volume: more reps than last week. Controlled effort - this is not a max-out day.',
  'Race Simulation':  'Simulate actual test conditions. Note where your breathing becomes labored - that is your current ceiling.',
  'Easy Maintenance': 'Reduced volume this week. Keep the pattern sharp without accumulating fatigue heading into the test.',
}

// ── Baseline event definitions ─────────────────────────────────────────────────

const BASELINE_STRENGTH_DEFS = {
  [UPPER_BODY.PUSHUPS]: {
    [CORE.SITUPS]: {
      label:       'Baseline - Strength & Core',
      description: '30-sec max push-ups, then rest 2 min, then 30-sec max sit-ups.',
      notes:       'Not a test. Establishes your Day 1 numbers only. Record each in Practice Check > PI Workout. Training begins immediately after.',
      target:      '30-sec max push-ups + 30-sec max sit-ups',
    },
    [CORE.PLANK]: {
      label:       'Baseline - Strength & Core',
      description: '30-sec max push-ups, then rest 2 min, then forearm plank held to form failure - record the exact time in seconds.',
      notes:       'Not a test. Establishes your Day 1 numbers only. Record each in Practice Check > PI Workout. Stop the plank when hips drop or rise, not when it gets uncomfortable.',
      target:      '30-sec max push-ups + plank to form failure',
    },
  },
  [UPPER_BODY.HRPU]: {
    [CORE.SITUPS]: {
      label:       'Baseline - Strength & Core',
      description: '30-sec max hand-release push-ups, then rest 2 min, then 30-sec max sit-ups. Full chest-to-floor and hands lift on every HRPU rep.',
      notes:       'Not a test. Establishes your Day 1 numbers only. Record each in Practice Check > PI Workout. Training begins immediately after.',
      target:      '30-sec max hand-release push-ups + 30-sec max sit-ups',
    },
    [CORE.PLANK]: {
      label:       'Baseline - Strength & Core',
      description: '30-sec max hand-release push-ups, then rest 2 min, then forearm plank held to form failure - record the exact time in seconds.',
      notes:       'Not a test. Establishes your Day 1 numbers only. Record each in Practice Check > PI Workout. Full chest-to-floor and hands lift on every HRPU rep. Stop the plank when hips drop or rise.',
      target:      '30-sec max hand-release push-ups + plank to form failure',
    },
  },
}

const BASELINE_CARDIO_DEFS = {
  [CARDIO.RUN]: {
    label:       'Baseline - Cardio',
    description: '400m run at comfortable effort. Record your time.',
    notes:       'Predicts your 2-mile pace. Record in Practice Check > PI Workout > 400m Run.',
    target:      '400m run - record time',
  },
  [CARDIO.HAMR]: {
    label:       'Baseline - Cardio',
    description: '10 shuttle repeats at a comfortable, sustainable effort (20m each, 30s rest between reps). Record your average turnaround time.',
    notes:       'Establishes your shuttle baseline. Record in Practice Check > PI Workout > HAMR Interval. Focus on consistent turnaround times, not speed.',
    target:      'HAMR shuttle baseline - record turnaround time',
  },
}

// ── Exported helper functions ─────────────────────────────────────────────────

/**
 * Build a strength_core session description given the phase, template intensity,
 * and user preferences. Returns null when the default WEEKLY_TEMPLATES text applies.
 *
 * @param {string} phaseName - PHASE_NAMES constant ('BASE', 'BUILD', 'BUILD_PLUS', 'SHARPEN')
 * @param {string} templateIntensity - Template intensity ('low', 'moderate', 'high')
 * @param {object} preferences - pfaPreferences object
 * @returns {string|null}
 */
export function buildStrengthDescription(phaseName, templateIntensity, preferences) {
  const upperBody = preferences?.upperBody || UPPER_BODY.PUSHUPS
  const core      = preferences?.core      || CORE.SITUPS

  // Default combination - use existing WEEKLY_TEMPLATES text unchanged
  if (upperBody === UPPER_BODY.PUSHUPS && core === CORE.SITUPS) return null

  const upperSnippet = UPPER_BODY_SNIPPETS[upperBody]?.[phaseName]?.[templateIntensity]
    ?? UPPER_BODY_SNIPPETS[UPPER_BODY.PUSHUPS]?.[phaseName]?.[templateIntensity]
    ?? ''

  const coreSnippet = CORE_SNIPPETS[core]?.[phaseName]?.[templateIntensity]
    ?? CORE_SNIPPETS[CORE.SITUPS]?.[phaseName]?.[templateIntensity]
    ?? ''

  const composed = [upperSnippet, coreSnippet].filter(Boolean).join(' ')
  return composed || null
}

/**
 * Build a cardio session description for HAMR given a template label.
 * Returns null when the default WEEKLY_TEMPLATES description applies (i.e. RUN selected).
 *
 * @param {string} templateLabel - The WEEKLY_TEMPLATES 'label' field
 * @param {object} preferences - pfaPreferences object
 * @returns {string|null}
 */
export function buildCardioDescription(templateLabel, preferences) {
  if (preferences?.cardio !== CARDIO.HAMR) return null
  return HAMR_DESCRIPTION_BY_LABEL[templateLabel] ?? null
}

/**
 * Build HAMR-specific cardio notes for a given template label.
 * Returns null when the default notes apply.
 *
 * @param {string} templateLabel - The WEEKLY_TEMPLATES 'label' field
 * @param {object} preferences - pfaPreferences object
 * @returns {string|null}
 */
export function buildCardioNotes(templateLabel, preferences) {
  if (preferences?.cardio !== CARDIO.HAMR) return null
  return HAMR_NOTES_BY_LABEL[templateLabel] ?? null
}

/**
 * Get the baseline strength event definition for the given preferences.
 *
 * @param {object} preferences - pfaPreferences object
 * @returns {{ label, description, notes, target }}
 */
export function getBaselineStrengthDef(preferences) {
  const upperBody = preferences?.upperBody || UPPER_BODY.PUSHUPS
  const core      = preferences?.core      || CORE.SITUPS
  return (
    BASELINE_STRENGTH_DEFS[upperBody]?.[core]
    ?? BASELINE_STRENGTH_DEFS[UPPER_BODY.PUSHUPS][CORE.SITUPS]
  )
}

/**
 * Get the baseline cardio event definition for the given preferences.
 *
 * @param {object} preferences - pfaPreferences object
 * @returns {{ label, description, notes, target }}
 */
export function getBaselineCardioDef(preferences) {
  const cardio = preferences?.cardio || CARDIO.RUN
  return BASELINE_CARDIO_DEFS[cardio] ?? BASELINE_CARDIO_DEFS[CARDIO.RUN]
}

/**
 * Validate and normalize a raw pfaPreferences object from storage.
 * Returns DEFAULT_PREFERENCES values for any missing or unrecognized fields.
 *
 * @param {object} raw - Raw object from localStorage
 * @returns {{ upperBody: string, core: string, cardio: string }}
 */
export function normalizePfaPreferences(raw) {
  return {
    upperBody: Object.values(UPPER_BODY).includes(raw?.upperBody) ? raw.upperBody : DEFAULT_PREFERENCES.upperBody,
    core:      Object.values(CORE).includes(raw?.core)            ? raw.core      : DEFAULT_PREFERENCES.core,
    cardio:    Object.values(CARDIO).includes(raw?.cardio)        ? raw.cardio    : DEFAULT_PREFERENCES.cardio,
  }
}
