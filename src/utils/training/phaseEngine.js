/**
 * Phase Engine - Adaptive Training Architecture
 *
 * Governs all training logic through a 16-week periodized model:
 *   BASE     (Weeks 1-4)   - Aerobic base, submax strength, no failure
 *   BUILD    (Weeks 5-8)   - Tempo work, strength, light intervals
 *   BUILD+   (Weeks 9-12)  - Hard intervals, density strength, specificity
 *   SHARPEN  (Weeks 13-16) - Test simulation, reduced volume, maintained intensity
 *
 * Subsystems:
 *   A. Phase detection (week -> phase)
 *   B. Phase configuration (intensity distribution per phase)
 *   C. Intensity governor (caps max effort by phase)
 *   D. Weekly structure templates (phase-appropriate workout patterns)
 *   E. Special week overrides (PI weeks, fractional tests)
 *   F. Daily stress budget (prevents multi-component overload)
 */

// ── Phase constants ──────────────────────────────────────────────────────────

export const PHASE_NAMES = {
  BASE: 'BASE',
  BUILD: 'BUILD',
  BUILD_PLUS: 'BUILD_PLUS',
  SHARPEN: 'SHARPEN',
}

export const PHASE_DISPLAY = {
  [PHASE_NAMES.BASE]: 'Base',
  [PHASE_NAMES.BUILD]: 'Build',
  [PHASE_NAMES.BUILD_PLUS]: 'Build+',
  [PHASE_NAMES.SHARPEN]: 'Sharpen',
}

// ── Dynamic phase boundary system ───────────────────────────────────────────

/**
 * Minimum weeks per phase. Prevents phases from becoming physiologically
 * meaningless when the plan is very short.
 */
export const MIN_PHASE_WEEKS = {
  [PHASE_NAMES.BASE]: 1,
  [PHASE_NAMES.BUILD]: 1,
  [PHASE_NAMES.BUILD_PLUS]: 1,
  [PHASE_NAMES.SHARPEN]: 1,
}

// Default ratios for the non-SHARPEN portion of a 16-week reference plan
// (13 non-sharpen weeks: BASE=4, BUILD=4, BUILD_PLUS=5)
const DEFAULT_NON_SHARPEN_RATIOS = {
  [PHASE_NAMES.BASE]: 4 / 13,
  [PHASE_NAMES.BUILD]: 4 / 13,
  [PHASE_NAMES.BUILD_PLUS]: 5 / 13,
}

const SHARPEN_WEEKS_DEFAULT = 3
const SHARPEN_WEEKS_SHORT = 2

/**
 * Compute progression ratio (0.0 to 1.0) for the current position in the plan.
 *
 * @param {number} weeksToTarget - Weeks remaining until test date
 * @param {number} totalWeeks - Total weeks in the plan
 * @returns {number} 0.0 (plan start) to 1.0 (test week)
 */
export function getProgressionRatio(weeksToTarget, totalWeeks) {
  if (totalWeeks <= 0) return 1.0
  const weeksElapsed = totalWeeks - weeksToTarget
  return Math.max(0, Math.min(1, weeksElapsed / totalWeeks))
}

/**
 * Compute phase boundaries for a plan of the given duration.
 *
 * Strategy:
 * - SHARPEN is anchored (2-3 weeks at the end)
 * - >16 weeks: extra time goes 60% to BASE, 40% to BUILD; BUILD_PLUS stays at 5
 * - <=16 weeks: all non-SHARPEN phases shrink proportionally with minimums
 *
 * @param {number} totalWeeks - Total plan duration in weeks
 * @returns {{ phases: Array<{name: string, startRatio: number, endRatio: number, weeks: number}>, totalWeeks: number, sharpenWeeks: number }}
 */
export function computePhaseBoundaries(totalWeeks) {
  if (totalWeeks <= 0) totalWeeks = 1

  // 1. Anchor SHARPEN duration
  let sharpenWeeks
  if (totalWeeks >= 13) sharpenWeeks = SHARPEN_WEEKS_DEFAULT
  else if (totalWeeks >= 6) sharpenWeeks = SHARPEN_WEEKS_SHORT
  else sharpenWeeks = Math.max(1, Math.floor(totalWeeks * 0.25))

  // 2. Remaining weeks for BASE + BUILD + BUILD_PLUS
  const remainingWeeks = Math.max(3, totalWeeks - sharpenWeeks)

  let baseWeeks, buildWeeks, buildPlusWeeks

  if (totalWeeks > 16) {
    // Extra time expands BASE (60%) and BUILD (40%). BUILD_PLUS stays at reference.
    const referenceRemaining = 13 // non-sharpen weeks in 16-week plan
    const extraWeeks = remainingWeeks - referenceRemaining
    const referenceBP = 5
    buildPlusWeeks = referenceBP

    const afterBP = remainingWeeks - buildPlusWeeks
    baseWeeks = Math.round(4 + extraWeeks * 0.6)
    buildWeeks = afterBP - baseWeeks
    // Guard: BUILD must be at least its reference value
    if (buildWeeks < 4) {
      buildWeeks = 4
      baseWeeks = afterBP - buildWeeks
    }
  } else {
    // Proportional distribution of remaining weeks
    baseWeeks = Math.max(
      MIN_PHASE_WEEKS[PHASE_NAMES.BASE],
      Math.round(remainingWeeks * DEFAULT_NON_SHARPEN_RATIOS[PHASE_NAMES.BASE]),
    )
    buildPlusWeeks = Math.max(
      MIN_PHASE_WEEKS[PHASE_NAMES.BUILD_PLUS],
      Math.round(remainingWeeks * DEFAULT_NON_SHARPEN_RATIOS[PHASE_NAMES.BUILD_PLUS]),
    )
    // BUILD absorbs rounding remainder
    buildWeeks = Math.max(
      MIN_PHASE_WEEKS[PHASE_NAMES.BUILD],
      remainingWeeks - baseWeeks - buildPlusWeeks,
    )
  }

  // Recalculate total in case of rounding adjustment
  const computedTotal = baseWeeks + buildWeeks + buildPlusWeeks + sharpenWeeks

  // Convert to progression ratio boundaries (cumulative)
  const baseEnd = baseWeeks / computedTotal
  const buildEnd = (baseWeeks + buildWeeks) / computedTotal
  const buildPlusEnd = (baseWeeks + buildWeeks + buildPlusWeeks) / computedTotal

  return {
    phases: [
      { name: PHASE_NAMES.BASE, startRatio: 0.0, endRatio: baseEnd, weeks: baseWeeks },
      { name: PHASE_NAMES.BUILD, startRatio: baseEnd, endRatio: buildEnd, weeks: buildWeeks },
      { name: PHASE_NAMES.BUILD_PLUS, startRatio: buildEnd, endRatio: buildPlusEnd, weeks: buildPlusWeeks },
      { name: PHASE_NAMES.SHARPEN, startRatio: buildPlusEnd, endRatio: 1.0, weeks: sharpenWeeks },
    ],
    totalWeeks: computedTotal,
    sharpenWeeks,
  }
}

/**
 * Get the phase name for a given progression ratio and plan duration.
 *
 * @param {number} ratio - 0.0 to 1.0
 * @param {number} totalWeeks - Total plan duration
 * @returns {string} PHASE_NAMES constant
 */
export function getPhaseFromRatio(ratio, totalWeeks) {
  const { phases } = computePhaseBoundaries(totalWeeks)
  for (const p of phases) {
    if (ratio < p.endRatio) return p.name
  }
  return PHASE_NAMES.SHARPEN
}

/**
 * Compute milestone progression ratios for special events in any plan duration.
 *
 * - PI workouts: every piIntervalWeeks, from start to 2 weeks before SHARPEN
 * - Fractional 50%: midpoint of BUILD phase
 * - Fractional 75%: midpoint of BUILD_PLUS phase
 * - Mock test and taper are date-anchored (-14 days) and handled separately
 *
 * @param {number} totalWeeks
 * @param {object} [options]
 * @param {number} [options.piIntervalWeeks=2] - PI workout interval in weeks
 * @returns {{ piRatios: number[], fractional50Ratio: number, fractional75Ratio: number }}
 */
export function getSpecialEventMilestones(totalWeeks, { piIntervalWeeks = 2 } = {}) {
  const { phases } = computePhaseBoundaries(totalWeeks)
  const baseBoundary = phases[0].endRatio
  const buildBoundary = phases[1].endRatio
  const buildPlusBoundary = phases[2].endRatio

  // Fractional tests at phase midpoints
  const fractional50Ratio = (baseBoundary + buildBoundary) / 2
  const fractional75Ratio = (buildBoundary + buildPlusBoundary) / 2

  // PI workouts: every piIntervalWeeks, stop 2 weeks before SHARPEN
  const piStopRatio = Math.max(0, buildPlusBoundary - (2 / Math.max(totalWeeks, 1)))
  const piRatios = []
  for (let w = 0; w < totalWeeks; w += piIntervalWeeks) {
    const r = w / totalWeeks
    if (r <= piStopRatio) piRatios.push(r)
  }

  return { piRatios, fractional50Ratio, fractional75Ratio }
}

/**
 * Check if a given progression ratio corresponds to a special event.
 *
 * @param {number} ratio - 0.0 to 1.0
 * @param {number} totalWeeks
 * @param {object} [options]
 * @param {number} [options.tolerance] - Ratio tolerance for matching (default: 0.5/totalWeeks)
 * @returns {{ isSpecial: boolean, type: string|null, fraction: number|null, forceRestBefore: boolean, forceRestAfter: boolean, reducedLoad: boolean, label: string|null, description: string|null }}
 */
export function getSpecialWeekInfoFromRatio(ratio, totalWeeks, options = {}) {
  const tolerance = options.tolerance ?? (0.5 / Math.max(totalWeeks, 1))
  const milestones = getSpecialEventMilestones(totalWeeks)

  // Fractional 50%
  if (Math.abs(ratio - milestones.fractional50Ratio) <= tolerance) {
    return {
      isSpecial: true, type: 'fractional_test', fraction: 0.5,
      forceRestBefore: true, forceRestAfter: true, reducedLoad: true,
      label: '50% Partial Test',
      description: 'Perform 50% of your test standard. Predict your full score.',
    }
  }

  // Fractional 75%
  if (Math.abs(ratio - milestones.fractional75Ratio) <= tolerance) {
    return {
      isSpecial: true, type: 'fractional_test', fraction: 0.75,
      forceRestBefore: true, forceRestAfter: true, reducedLoad: true,
      label: '75% Partial Test',
      description: 'Perform 75% of your test standard. You should be well above passing.',
    }
  }

  // PI workout
  for (const piRatio of milestones.piRatios) {
    if (Math.abs(ratio - piRatio) <= tolerance) {
      return {
        isSpecial: true, type: 'pi_workout', fraction: null,
        forceRestBefore: true, forceRestAfter: true, reducedLoad: true,
        label: 'PI Benchmark Week',
        description: 'Submaximal benchmark - NOT a max test. Record and compare to previous.',
      }
    }
  }

  return {
    isSpecial: false, type: null, fraction: null,
    forceRestBefore: false, forceRestAfter: false, reducedLoad: false,
    label: null, description: null,
  }
}

// ── A. Phase detection (backward-compatible wrappers) ───────────────────────

/**
 * Determine training phase from the week number within a 16-week plan.
 * Now delegates to the ratio-based system internally.
 *
 * @param {number} week - Week number (1-16)
 * @returns {string} PHASE_NAMES constant
 */
export function getPhase(week) {
  const ratio = (week - 0.5) / 16
  return getPhaseFromRatio(ratio, 16)
}

/**
 * Convert weeks-to-target into a plan week number (1-16 scale).
 * Now uses progression ratio internally so it distributes properly
 * for any plan duration.
 *
 * @deprecated Use getProgressionRatio() + getPhaseFromRatio() for new code.
 * @param {number} weeksToTarget - Weeks until PFA test date
 * @param {number} totalWeeks - Total weeks in the training plan
 * @returns {number} Week number 1-16
 */
export function weekNumberFromWeeksOut(weeksToTarget, totalWeeks) {
  if (totalWeeks <= 0) return 16
  const ratio = getProgressionRatio(weeksToTarget, totalWeeks)
  return Math.max(1, Math.min(16, Math.round(ratio * 15) + 1))
}

// ── B. Phase configuration ───────────────────────────────────────────────────

export const phaseConfig = {
  [PHASE_NAMES.BASE]: {
    intensity: { low: 0.75, moderate: 0.25, high: 0.0 },
    sessionsPerWeek: 3,
    maxEffortAllowed: false,
    stressCap: 12,
    description: 'Build aerobic base and movement patterns. All work is submaximal.',
    effortLabel: 'Easy to moderate - conversational pace',
  },
  [PHASE_NAMES.BUILD]: {
    intensity: { low: 0.60, moderate: 0.30, high: 0.10 },
    sessionsPerWeek: 3,
    maxEffortAllowed: false,
    stressCap: 16,
    description: 'Add tempo work and controlled strength. No max-effort sets.',
    effortLabel: 'Moderate - comfortably hard',
  },
  [PHASE_NAMES.BUILD_PLUS]: {
    intensity: { low: 0.50, moderate: 0.30, high: 0.20 },
    sessionsPerWeek: 4,
    maxEffortAllowed: 'limited',
    stressCap: 20,
    description: 'Increase specificity with hard intervals and density work.',
    effortLabel: 'Moderate to hard - controlled challenge',
  },
  [PHASE_NAMES.SHARPEN]: {
    intensity: { low: 0.40, moderate: 0.20, high: 0.40 },
    sessionsPerWeek: 4,
    maxEffortAllowed: true,
    stressCap: 18,
    description: 'Test simulation with reduced volume. Peak performance prep.',
    effortLabel: 'High intensity, low volume',
  },
}

// ── C. Intensity governor ────────────────────────────────────────────────────

/**
 * Intensity levels for workout prescription.
 */
export const INTENSITY = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
}

/**
 * Effort labels for each intensity level (user-facing).
 */
export const EFFORT_LABELS = {
  [INTENSITY.LOW]: 'Easy (conversational pace)',
  [INTENSITY.MODERATE]: 'Moderate (can speak short sentences)',
  [INTENSITY.HIGH]: 'Hard (single-word answers only)',
}

/**
 * Cap the intensity of a workout session based on the current phase.
 * Prevents max-effort training outside appropriate phases.
 *
 * @param {string} requestedIntensity - INTENSITY constant the workout wants
 * @param {string} phase - PHASE_NAMES constant
 * @returns {string} The allowed INTENSITY level (may be downgraded)
 */
export function capIntensity(requestedIntensity, phase) {
  const config = phaseConfig[phase]
  if (!config) return requestedIntensity

  if (requestedIntensity === INTENSITY.HIGH) {
    if (!config.maxEffortAllowed) return INTENSITY.MODERATE
    // 'limited' means allow but flag it
  }

  return requestedIntensity
}

/**
 * Get the rep instruction for a given phase (replaces "max reps" language).
 *
 * @param {string} phase - PHASE_NAMES constant
 * @returns {string} Instruction text
 */
export function getRepInstruction(phase) {
  switch (phase) {
    case PHASE_NAMES.BASE:
      return 'Stop 3-4 reps before failure. Focus on form.'
    case PHASE_NAMES.BUILD:
      return 'Stop 2-3 reps before failure. Controlled tempo.'
    case PHASE_NAMES.BUILD_PLUS:
      return 'Stop 1-2 reps before failure. Maintain a brisk, controlled tempo.'
    case PHASE_NAMES.SHARPEN:
      return 'Near-max effort. Simulate test conditions.'
    default:
      return 'Stop 2 reps before failure.'
  }
}

// ── D. Weekly structure templates ────────────────────────────────────────────

/**
 * Phase-specific workout session templates.
 * Each phase has a set of session descriptors that rotate across training days.
 * Sessions specify type, target component focus, and intensity.
 */
export const WEEKLY_TEMPLATES = {
  [PHASE_NAMES.BASE]: [
    {
      label: 'Easy Aerobic',
      type: 'cardio',
      intensity: INTENSITY.LOW,
      stress: 3,
      description: '20-30 min at conversational pace. You should be able to speak full sentences.',
      notes: 'Build your aerobic engine. Effort should feel sustainable and easy.',
    },
    {
      label: 'Submax Strength & Core',
      type: 'strength_core',
      intensity: INTENSITY.LOW,
      stress: 4,
      description: 'Push-ups: 3 sets, stop 3-4 reps before failure (90s rest). Sit-ups: 3 sets, stop 3-4 reps before failure (90s rest). Plank: 3 holds, maintain for maximum controlled effort (90s rest).',
      notes: 'No grinding reps. If form breaks down, the set is over.',
    },
    {
      label: 'Aerobic Variation',
      type: 'cardio',
      intensity: INTENSITY.LOW,
      stress: 3,
      description: '20 min at an easy, conversational pace (run/walk as needed), OR 8x2-min running intervals with 1-min walk recovery between each.',
      notes: 'Keep heart rate in Zone 2. This builds your base without adding fatigue.',
    },
  ],
  [PHASE_NAMES.BUILD]: [
    {
      label: 'Tempo Cardio',
      type: 'cardio',
      intensity: INTENSITY.MODERATE,
      stress: 5,
      description: '25-30 min with 2x5-min inserts at goal pace. Bookend with easy warm-up/cool-down.',
      notes: 'Goal-pace inserts should feel "comfortably hard" - you can say 2-3 words.',
    },
    {
      label: 'Strength Build',
      type: 'strength_core',
      intensity: INTENSITY.MODERATE,
      stress: 5,
      description: 'Push-ups: 4 sets, stop 2-3 reps before failure (60s rest). Core: 4 sets, as many quality reps as possible while maintaining perfect form (60s rest).',
      notes: 'Controlled tempo: 2 seconds down, 1 second up. Rest is shorter but effort stays submaximal.',
    },
    {
      label: 'Endurance Cardio',
      type: 'cardio',
      intensity: INTENSITY.LOW,
      stress: 4,
      description: '30-35 min sustained at a pace where you could hold a short conversation.',
      notes: 'This is your weekly long effort. Consistency matters more than speed.',
    },
  ],
  [PHASE_NAMES.BUILD_PLUS]: [
    {
      label: 'Hard Intervals',
      type: 'cardio',
      intensity: INTENSITY.HIGH,
      stress: 7,
      description: '6x400m at faster than goal pace (2 min rest between intervals), OR 20 min at a hard but sustainable effort (RPE 7-8).',
      notes: 'This is the hardest cardio session of the week. One hard day, then recover.',
    },
    {
      label: 'Density Strength',
      type: 'strength_core',
      intensity: INTENSITY.MODERATE,
      stress: 6,
      description: 'Push-ups: 4 sets, stop 1-2 reps before failure (45s rest). Core: 4 sets, perform at a brisk but controlled pace for the full duration (45s rest).',
      notes: 'Shorter rest periods build muscular endurance. Maintain form throughout.',
    },
    {
      label: 'Moderate Cardio',
      type: 'cardio',
      intensity: INTENSITY.MODERATE,
      stress: 5,
      description: '25-30 min of running at moderate effort (RPE 5-6). Include 4x1-min pickups at goal pace with easy running between.',
      notes: 'Not a hard day. Stay controlled and build confidence at race pace.',
    },
    {
      label: 'Specificity Strength',
      type: 'strength_core',
      intensity: INTENSITY.HIGH,
      stress: 6,
      description: 'Push-ups: 4 timed 30-sec sets, leaving 1-2 reps in reserve (2 min rest). Core: timed sets matching test format - maximum controlled effort for the full duration (2 min rest).',
      notes: 'Practice test-specific movements at near-test intensity. Stop 1 rep before failure.',
    },
  ],
  [PHASE_NAMES.SHARPEN]: [
    {
      label: 'Race Simulation',
      type: 'cardio',
      intensity: INTENSITY.HIGH,
      stress: 7,
      description: 'Full test-distance run at goal pace. Record splits at each half-mile or lap.',
      notes: 'Simulate test conditions. This is your dress rehearsal.',
    },
    {
      label: 'Test-Pace Strength',
      type: 'strength_core',
      intensity: INTENSITY.HIGH,
      stress: 5,
      description: 'Push-ups: 2 sets, stop 1 rep before failure (2 min rest). Core: 2 sets, maximum controlled effort for the full duration (2 min rest). Reduced volume to stay sharp.',
      notes: 'Fewer sets, higher intensity. Stay sharp without accumulating fatigue.',
    },
    {
      label: 'Easy Maintenance',
      type: 'cardio',
      intensity: INTENSITY.LOW,
      stress: 3,
      description: 'Easy recovery run - 20 min at conversational pace (RPE 4-5). Include dynamic stretching before and after.',
      notes: 'Active recovery. Keep the engine running without adding stress.',
    },
    {
      label: 'Light Movement',
      type: 'movement_prep',
      intensity: INTENSITY.LOW,
      stress: 2,
      description: 'Dynamic stretching, light core activation, 10-min walk. Feel sharp, not spent.',
      notes: 'Taper-prep: less is more. Show up to test day rested.',
    },
  ],
}

// ── E. Special week overrides ────────────────────────────────────────────────

/**
 * PI (Performance Indicator) workout weeks within a 16-week plan.
 * @deprecated Use getSpecialEventMilestones(totalWeeks) for dynamic plans.
 */
export const PI_WEEKS = [1, 4, 6, 10, 13]

/**
 * Fractional test schedule for a 16-week plan.
 * @deprecated Use getSpecialEventMilestones(totalWeeks) for dynamic plans.
 */
export const TEST_WEEKS = {
  FRACTIONAL_50: 8,
  FRACTIONAL_75: 12,
  MOCK_TEST: 14,
  ACTUAL_TEST: 16,
}

/**
 * Check if a given plan week is a special week (PI, fractional, mock, or test).
 * Backward-compatible wrapper - delegates to ratio-based system.
 *
 * @deprecated Use getSpecialWeekInfoFromRatio(ratio, totalWeeks) for dynamic plans.
 * @param {number} weekNum - Plan week number (1-16)
 * @returns {{ isSpecial: boolean, type: string|null, fraction: number|null, forceRestBefore: boolean, forceRestAfter: boolean, reducedLoad: boolean }}
 */
export function getSpecialWeekInfo(weekNum) {
  // Mock test and test day are date-anchored, not ratio-based - keep hardcoded for 16-week compat
  if (weekNum === TEST_WEEKS.MOCK_TEST) {
    return {
      isSpecial: true, type: 'mock_test', fraction: 1.0,
      forceRestBefore: true, forceRestAfter: true, reducedLoad: true,
      label: 'Full Mock Test',
      description: 'One full practice test. After this, taper begins.',
    }
  }
  if (weekNum === TEST_WEEKS.ACTUAL_TEST) {
    return {
      isSpecial: true, type: 'test_day', fraction: null,
      forceRestBefore: true, forceRestAfter: false, reducedLoad: true,
      label: 'PFA Test Day',
      description: 'Arrive rested, hydrated, and warmed up.',
    }
  }

  const ratio = (weekNum - 0.5) / 16
  return getSpecialWeekInfoFromRatio(ratio, 16)
}

// ── F. Daily stress budget ───────────────────────────────────────────────────

/**
 * Stress values by workout type and intensity.
 */
export const STRESS_VALUES = {
  cardio: {
    [INTENSITY.LOW]: 3,
    [INTENSITY.MODERATE]: 5,
    [INTENSITY.HIGH]: 7,
  },
  strength_core: {
    [INTENSITY.LOW]: 2,
    [INTENSITY.MODERATE]: 4,
    [INTENSITY.HIGH]: 6,
  },
  movement_prep: {
    [INTENSITY.LOW]: 1,
    [INTENSITY.MODERATE]: 2,
    [INTENSITY.HIGH]: 3,
  },
}

/**
 * Calculate the total stress for a set of planned sessions.
 *
 * @param {Array<{ type: string, intensity: string }>} sessions - Planned sessions
 * @returns {number} Total stress score
 */
export function calculateDailyStress(sessions) {
  return sessions.reduce((total, session) => {
    const typeStress = STRESS_VALUES[session.type] || STRESS_VALUES.strength_core
    return total + (typeStress[session.intensity] || 3)
  }, 0)
}

/**
 * Enforce the daily stress budget. If total stress exceeds the phase cap,
 * downgrade the highest-intensity session(s) until within budget.
 *
 * @param {Array<{ type: string, intensity: string, stress: number }>} sessions - Planned sessions (mutated in place)
 * @param {string} phase - PHASE_NAMES constant
 * @returns {Array} The sessions array (possibly with reduced intensities)
 */
export function enforceStressBudget(sessions, phase) {
  const config = phaseConfig[phase]
  if (!config) return sessions

  let totalStress = sessions.reduce((sum, s) => sum + (s.stress || 0), 0)
  const cap = config.stressCap

  if (totalStress <= cap) return sessions

  // Sort by stress descending to downgrade the heaviest first
  const sorted = [...sessions].sort((a, b) => (b.stress || 0) - (a.stress || 0))

  for (const session of sorted) {
    if (totalStress <= cap) break

    if (session.intensity === INTENSITY.HIGH) {
      const oldStress = session.stress || 0
      session.intensity = INTENSITY.MODERATE
      const typeStress = STRESS_VALUES[session.type] || STRESS_VALUES.strength_core
      session.stress = typeStress[INTENSITY.MODERATE] || 4
      totalStress -= (oldStress - session.stress)
    } else if (session.intensity === INTENSITY.MODERATE && totalStress > cap) {
      const oldStress = session.stress || 0
      session.intensity = INTENSITY.LOW
      const typeStress = STRESS_VALUES[session.type] || STRESS_VALUES.strength_core
      session.stress = typeStress[INTENSITY.LOW] || 2
      totalStress -= (oldStress - session.stress)
    }
  }

  return sessions
}

/**
 * Check if a high-intensity cardio day should force low-intensity strength.
 * Rule: If cardio is HIGH, strength must be LOW on the same day.
 *
 * @param {Array<{ type: string, intensity: string }>} sessions
 * @returns {Array} Sessions with strength downgraded if cardio is high
 */
export function enforceCardioStrengthBalance(sessions) {
  const hasHighCardio = sessions.some(
    s => s.type === 'cardio' && s.intensity === INTENSITY.HIGH
  )

  if (!hasHighCardio) return sessions

  return sessions.map(s => {
    if (s.type === 'strength_core' && s.intensity !== INTENSITY.LOW) {
      return {
        ...s,
        intensity: INTENSITY.LOW,
        stress: STRESS_VALUES.strength_core[INTENSITY.LOW],
        notes: s.notes
          ? s.notes + ' (Reduced - paired with hard cardio day.)'
          : 'Reduced intensity - paired with hard cardio day.',
      }
    }
    return s
  })
}

// ── Workout prescription by phase ────────────────────────────────────────────

/**
 * Get the prescribed workout sessions for a given position in the plan.
 *
 * Supports two calling conventions:
 * - Legacy: prescribeSession(weekNum, sessionIndex) - assumes 16-week plan
 * - New:    prescribeSession(ratio, totalWeeks, sessionIndex) - dynamic plan
 *
 * @param {number} weekNumOrRatio - Plan week (1-16) or progression ratio (0.0-1.0)
 * @param {number} sessionIndexOrTotalWeeks - Session index (legacy) or total weeks (new)
 * @param {number} [maybeSessionIndex] - Session index when using new API
 * @returns {{ label: string, description: string, notes: string, intensity: string, phase: string, stress: number, effortLabel: string }}
 */
export function prescribeSession(weekNumOrRatio, sessionIndexOrTotalWeeks, maybeSessionIndex) {
  let phase, weekNum, specialInfo

  if (maybeSessionIndex !== undefined) {
    // New API: (ratio, totalWeeks, sessionIndex)
    const ratio = weekNumOrRatio
    const totalWeeks = sessionIndexOrTotalWeeks
    phase = getPhaseFromRatio(ratio, totalWeeks)
    weekNum = Math.max(1, Math.min(16, Math.round(ratio * 15) + 1))
    specialInfo = getSpecialWeekInfoFromRatio(ratio, totalWeeks)
    return _prescribeSessionImpl(phase, weekNum, maybeSessionIndex, specialInfo)
  } else {
    // Legacy API: (weekNum, sessionIndex)
    weekNum = weekNumOrRatio
    const sessionIndex = sessionIndexOrTotalWeeks
    phase = getPhase(weekNum)
    specialInfo = getSpecialWeekInfo(weekNum)
    return _prescribeSessionImpl(phase, weekNum, sessionIndex, specialInfo)
  }
}

function _prescribeSessionImpl(phase, weekNum, sessionIndex, specialInfo) {
  const templates = WEEKLY_TEMPLATES[phase] || WEEKLY_TEMPLATES[PHASE_NAMES.BASE]

  // For reduced-load weeks (PI, fractional, mock), limit to 2 training sessions
  // and reduce intensity
  if (specialInfo.reducedLoad) {
    const reducedTemplates = templates.filter(t => t.intensity !== INTENSITY.HIGH)
    const template = reducedTemplates[sessionIndex % reducedTemplates.length] || templates[0]
    const capped = capIntensity(template.intensity, phase)

    return {
      ...template,
      intensity: capped === INTENSITY.HIGH ? INTENSITY.MODERATE : capped,
      phase,
      phaseName: PHASE_DISPLAY[phase],
      effortLabel: EFFORT_LABELS[capped === INTENSITY.HIGH ? INTENSITY.MODERATE : capped],
      repInstruction: getRepInstruction(phase),
      weekNum,
      isSpecialWeek: true,
      specialWeekType: specialInfo.type,
    }
  }

  const template = templates[sessionIndex % templates.length]
  const governedIntensity = capIntensity(template.intensity, phase)

  return {
    ...template,
    intensity: governedIntensity,
    phase,
    phaseName: PHASE_DISPLAY[phase],
    effortLabel: EFFORT_LABELS[governedIntensity],
    repInstruction: getRepInstruction(phase),
    weekNum,
    isSpecialWeek: false,
    specialWeekType: null,
  }
}
