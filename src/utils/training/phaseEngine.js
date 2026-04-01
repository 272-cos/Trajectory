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

// ── A. Phase detection ───────────────────────────────────────────────────────

/**
 * Determine training phase from the week number within a 16-week plan.
 * Week 1 = first week of training; Week 16 = test week.
 *
 * @param {number} week - Week number (1-16)
 * @returns {string} PHASE_NAMES constant
 */
export function getPhase(week) {
  if (week <= 4) return PHASE_NAMES.BASE
  if (week <= 8) return PHASE_NAMES.BUILD
  if (week <= 12) return PHASE_NAMES.BUILD_PLUS
  return PHASE_NAMES.SHARPEN
}

/**
 * Convert weeks-to-target into a plan week number (1-16 scale).
 * If more than 16 weeks remain, caps at week 1 (extended BASE).
 * If fewer than 1 week, returns 16.
 *
 * @param {number} weeksToTarget - Weeks until PFA test date
 * @param {number} totalWeeks - Total weeks in the training plan
 * @returns {number} Week number 1-16
 */
export function weekNumberFromWeeksOut(weeksToTarget, totalWeeks) {
  if (totalWeeks <= 0) return 16
  // Map to a 16-week scale
  const planLength = Math.min(totalWeeks, 16)
  const weekNum = planLength - weeksToTarget + 1
  return Math.max(1, Math.min(16, weekNum))
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
      return 'Stop 1-2 reps before failure. Push the pace.'
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
      description: 'Push-ups: 3 sets, stop 3-4 reps before failure (90s rest). Sit-ups/Plank: 3 sets, same rule.',
      notes: 'No grinding reps. If form breaks down, the set is over.',
    },
    {
      label: 'Aerobic Variation',
      type: 'cardio',
      intensity: INTENSITY.LOW,
      stress: 3,
      description: '20 min easy run/walk, OR 8x2-min run/walk intervals with 1-min walk rest.',
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
      description: 'Push-ups: 4 sets, stop 2-3 reps before failure (60s rest). Core: 4 sets same approach.',
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
      description: '6x400m at faster than goal pace (2 min rest), OR tempo run 20 min at 80% max HR.',
      notes: 'This is the hardest cardio session of the week. One hard day, then recover.',
    },
    {
      label: 'Density Strength',
      type: 'strength_core',
      intensity: INTENSITY.MODERATE,
      stress: 6,
      description: 'Push-ups: 4 sets, stop 1-2 reps before failure (45s rest). Core: 4 sets, push the pace.',
      notes: 'Shorter rest periods build muscular endurance. Maintain form throughout.',
    },
    {
      label: 'Moderate Cardio',
      type: 'cardio',
      intensity: INTENSITY.MODERATE,
      stress: 5,
      description: '25-30 min at moderate effort. Include 4x1-min pickups at goal pace.',
      notes: 'Not a hard day. Stay controlled and build confidence at race pace.',
    },
    {
      label: 'Specificity Strength',
      type: 'strength_core',
      intensity: INTENSITY.HIGH,
      stress: 6,
      description: 'Push-ups: timed 30-sec max sets x4 (2 min rest). Core: timed sets matching test format.',
      notes: 'Practice test-specific movements at near-test intensity. Stop 1 rep before failure.',
    },
  ],
  [PHASE_NAMES.SHARPEN]: [
    {
      label: 'Race Simulation',
      type: 'cardio',
      intensity: INTENSITY.HIGH,
      stress: 7,
      description: 'Full test-distance run at goal pace. Record splits.',
      notes: 'Simulate test conditions. This is your dress rehearsal.',
    },
    {
      label: 'Test-Pace Strength',
      type: 'strength_core',
      intensity: INTENSITY.HIGH,
      stress: 5,
      description: 'Push-ups: 2 sets at near-max (2 min rest). Core: 2 sets at near-max. Reduced volume.',
      notes: 'Fewer sets, higher intensity. Stay sharp without accumulating fatigue.',
    },
    {
      label: 'Easy Maintenance',
      type: 'cardio',
      intensity: INTENSITY.LOW,
      stress: 3,
      description: '20 min easy jog. Movement prep and dynamic stretching.',
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
 * Submaximal, repeatable benchmarks - NOT max tests.
 */
export const PI_WEEKS = [1, 4, 6, 10, 13]

/**
 * Fractional test schedule.
 * Week 8: 50% effort test
 * Week 12: 75% effort test
 * Week 14: Full mock test (once only)
 * Week 16: Actual test
 */
export const TEST_WEEKS = {
  FRACTIONAL_50: 8,
  FRACTIONAL_75: 12,
  MOCK_TEST: 14,
  ACTUAL_TEST: 16,
}

/**
 * Check if a given plan week is a special week (PI, fractional, mock, or test).
 *
 * @param {number} weekNum - Plan week number (1-16)
 * @returns {{ isSpecial: boolean, type: string|null, fraction: number|null, forceRestBefore: boolean, forceRestAfter: boolean, reducedLoad: boolean }}
 */
export function getSpecialWeekInfo(weekNum) {
  if (PI_WEEKS.includes(weekNum)) {
    return {
      isSpecial: true,
      type: 'pi_workout',
      fraction: null,
      forceRestBefore: true,
      forceRestAfter: true,
      reducedLoad: true,
      label: 'PI Benchmark Week',
      description: 'Submaximal benchmark - NOT a max test. Record and compare to previous.',
    }
  }

  if (weekNum === TEST_WEEKS.FRACTIONAL_50) {
    return {
      isSpecial: true,
      type: 'fractional_test',
      fraction: 0.5,
      forceRestBefore: true,
      forceRestAfter: true,
      reducedLoad: true,
      label: '50% Partial Test',
      description: 'Perform 50% of your test standard. Predict your full score.',
    }
  }

  if (weekNum === TEST_WEEKS.FRACTIONAL_75) {
    return {
      isSpecial: true,
      type: 'fractional_test',
      fraction: 0.75,
      forceRestBefore: true,
      forceRestAfter: true,
      reducedLoad: true,
      label: '75% Partial Test',
      description: 'Perform 75% of your test standard. You should be well above passing.',
    }
  }

  if (weekNum === TEST_WEEKS.MOCK_TEST) {
    return {
      isSpecial: true,
      type: 'mock_test',
      fraction: 1.0,
      forceRestBefore: true,
      forceRestAfter: true,
      reducedLoad: true,
      label: 'Full Mock Test',
      description: 'One full practice test. After this, taper begins.',
    }
  }

  if (weekNum === TEST_WEEKS.ACTUAL_TEST) {
    return {
      isSpecial: true,
      type: 'test_day',
      fraction: null,
      forceRestBefore: true,
      forceRestAfter: false,
      reducedLoad: true,
      label: 'PFA Test Day',
      description: 'Arrive rested, hydrated, and warmed up.',
    }
  }

  return {
    isSpecial: false,
    type: null,
    fraction: null,
    forceRestBefore: false,
    forceRestAfter: false,
    reducedLoad: false,
    label: null,
    description: null,
  }
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
 * Get the prescribed workout sessions for a given week and day-of-week index.
 * Integrates phase config, intensity governor, stress budget, and special weeks.
 *
 * @param {number} weekNum - Plan week number (1-16)
 * @param {number} sessionIndex - 0-based session index within the week
 * @param {object} [options]
 * @param {string} [options.fitnessLevel] - 'low', 'medium', 'high'
 * @returns {{ label: string, description: string, notes: string, intensity: string, phase: string, stress: number, effortLabel: string }}
 */
export function prescribeSession(weekNum, sessionIndex) {
  const phase = getPhase(weekNum)
  const templates = WEEKLY_TEMPLATES[phase] || WEEKLY_TEMPLATES[PHASE_NAMES.BASE]
  const specialInfo = getSpecialWeekInfo(weekNum)

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
