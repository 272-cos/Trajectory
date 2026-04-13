/**
 * Performance Recommendation Engine
 * Provides tiered training suggestions based on component scores
 */

import { COMPONENTS, EXERCISES, COMPONENT_MINIMUMS, RECOMMENDATION_TIERS } from '../scoring/constants.js'
import {
  getProgressionRatio,
  getPhaseFromRatio,
  phaseConfig,
  PHASE_DISPLAY,
  getRepInstruction,
} from '../training/phaseEngine.js'

// Recommendation tiers based on component percentage
const TIERS = {
  FAILING: 'failing', // < 75%
  MARGINAL: 'marginal', // 75-80%
  STRONG: 'strong', // > 80%
}

/**
 * Get recommendation tier from percentage
 * @param {number} percentage - Component percentage score
 * @returns {string} Tier constant
 */
function getTier(percentage) {
  if (percentage < RECOMMENDATION_TIERS.FAILING_BELOW) return TIERS.FAILING
  if (percentage <= RECOMMENDATION_TIERS.MARGINAL_BELOW) return TIERS.MARGINAL
  return TIERS.STRONG
}

/**
 * Recommendation database
 * Structure: { [component]: { [exercise]: { [tier]: [recommendations] } } }
 *
 * CRITICAL SAFETY NOTE:
 * - Cardio: 2-3×/week with 1-2 rest days between
 * - Strength: 2-3×/week with two days rest between sessions
 * - Core: 2-3×/week with two days rest between sessions
 * - NEVER train same muscle group daily - muscles need recovery time
 */
const RECOMMENDATIONS = {
  [COMPONENTS.CARDIO]: {
    [EXERCISES.RUN_2MILE]: {
      [TIERS.FAILING]: [
        'Walk-Run Intervals: 2 min run / 1 min walk × 10, cut walk by 15 sec each week',
        'Long Slow Distance: 3-5 mile runs at conversational pace, 2×/week',
        'Breathing Technique: Practice rhythmic breathing (3-step inhale, 2-step exhale)',
      ],
      [TIERS.MARGINAL]: [
        'Tempo Runs: 15-20 min at 80% max heart rate, 1×/week',
        'Fartlek Training: Varied pace for 20 minutes (fast 2 min, easy 3 min)',
        'Goal-Paced Running: Run 1 mile at target 2-mile pace, rest 3 min, repeat × 2',
      ],
      [TIERS.STRONG]: [
        'Norwegian 4×4: 4 minutes high intensity + 3 min recovery × 4',
        'Track Intervals: 400m repeats at faster than race pace (6-8 reps)',
        'Distance Extension: Push to 3-4 mile runs to build endurance reserve',
      ],
    },
    [EXERCISES.HAMR]: {
      [TIERS.FAILING]: [
        'Cone Drills: 5-10 yard shuttle runs × 12 reps, sharp plant-and-push on each turn',
        'Lateral Shuffles: Side-to-side movement for 30 seconds × 5',
        'Form Practice: Low center of gravity on turns, push off outside foot',
      ],
      [TIERS.MARGINAL]: [
        'Sprint Intervals: 20m sprints × 10 with 30-second rest',
        'Plyometrics: Jump squats, burpees for power development',
        'Tabata HAMR: 20 sec max effort / 10 sec rest × 8',
      ],
      [TIERS.STRONG]: [
        'Overspeed Training: Downhill sprints for speed adaptation',
        'Complex Training: Burpees + HAMR simulation for power endurance',
        'Mental Practice: Visualization of perfect runs, pacing strategy',
      ],
    },
    [EXERCISES.WALK_2KM]: {
      // Walk is pass/fail only - recommendations focus on meeting the time limit.
      // Percentage is always 0 for walk (no points scored), so all users hit FAILING tier.
      [TIERS.FAILING]: [
        'Pace Practice: Walk at 4.5+ mph (13:20/mile) to build speed for the time limit',
        'Interval Walking: 3 min brisk / 1 min easy × 8, progressively reduce easy time',
        'Pre-Walk Warm-up: 3-minute warm-up is allowed before the test - use it to set your rhythm',
      ],
      [TIERS.MARGINAL]: [
        'Course Familiarity: Practice on the exact test course to learn the distance and pacing',
        'Stride Length: Focus on longer strides rather than faster turnover to maintain speed',
        'Breathing: Steady, rhythmic breathing - inhale 3 steps, exhale 2 steps',
      ],
      [TIERS.STRONG]: [
        'Speed Walking Technique: Arms bent at 90 degrees, drive elbows back for power',
        'Hill Training: Walk hills 2×/week to build leg strength for flat course speed',
        'Time Trials: Practice full 2km at target pace 1×/week to build confidence',
      ],
    },
  },

  [COMPONENTS.STRENGTH]: {
    [EXERCISES.PUSHUPS]: {
      [TIERS.FAILING]: [
        'Incline Push-ups: 3×15 on elevated surface (stairs), 2-3×/week with two days rest between',
        'Knee Push-ups: Build to 20-40 reps before progressing, 2-3×/week',
        'Negative Reps: Lower slowly (5 sec) from plank to floor, 2×/week to build strength',
      ],
      [TIERS.MARGINAL]: [
        '200 Push-up Challenge: Complete 200 total in one session (sets as needed), 1×/week max',
        'Pyramid Sets: 1-2-3-4-5-4-3-2-1 reps with 10sec rest, 2-3×/week',
        'Tempo Push-ups: 3-1-3 rhythm (3 sec down, 1 hold, 3 up), 2×/week',
      ],
      [TIERS.STRONG]: [
        'Decline Push-ups: Feet elevated 12" for difficulty, 3-4×10-15, 2×/week',
        'Explosive Push-ups: Push hard to lift hands off ground, 2-3×/week',
        'Diamond Push-ups: Hands together for tricep emphasis, 2×/week',
      ],
    },
    [EXERCISES.HRPU]: {
      [TIERS.FAILING]: [
        'Dead Stop Practice: Complete hand lift each rep, 3×10, 2-3×/week with two days rest',
        'Regular Push-up Volume: Build to 40+ regular first, 2-3×/week',
        'Split Phases: Practice lowering and pushing separately, 2×/week',
      ],
      [TIERS.MARGINAL]: [
        'Timed Sets: 30sec max / 30sec rest × 4 rounds, 2-3×/week',
        'Form Drills: Slow HRPUs with complete hand lift, 2×/week',
        'EMOM Training: 15 HRPUs every minute × 10min, 2×/week',
      ],
      [TIERS.STRONG]: [
        '2-Min Test Practice: Full simulation 1×/week only (avoid overtraining)',
        'Overload Sets: 2.5min max effort beyond test duration, 1×/week',
        'Pacing Strategy: Test fast vs steady rhythm, 1-2×/week',
      ],
    },
  },

  [COMPONENTS.CORE]: {
    [EXERCISES.SITUPS]: {
      [TIERS.FAILING]: [
        'Crunches: Controlled movement, curl spine, 3×20, 2-3×/week with two days rest',
        'Dead Bug: Alternating arm/leg extension, 3×10 each side, 2-3×/week',
        'Form Focus: Don\'t pull neck, breathe out on up, 2-3×/week practice',
      ],
      [TIERS.MARGINAL]: [
        '100 Sit-up Challenge: 100 total per session (NOT daily), 2×/week max with rest days',
        'Cadence Training: Metronome at test pace (50-60 bpm), 2-3×/week',
        'Pyramid Training: 10-20-30-20-10 with minimal rest, 2×/week',
      ],
      [TIERS.STRONG]: [
        'Decline Sit-ups: Feet elevated for difficulty, 3×25, 2×/week',
        'Sprint Sit-ups: Max reps 30sec × 4 rounds, 2×/week',
        'Test Simulation: Full 1-min test 1-2×/week max (avoid overtraining)',
      ],
    },
    [EXERCISES.CLRC]: {
      [TIERS.FAILING]: [
        'Leg Raises: Lying down, raise to 90°, 3×10, 2-3×/week with two days rest',
        'Reverse Crunches: Knees to chest, lift hips, 3×15, 2-3×/week',
        'Cross Practice: Master position before adding reps, 2-3×/week',
      ],
      [TIERS.MARGINAL]: [
        'High Rep Sets: 30-40 reps × 3 with 1min rest, 2×/week',
        'Timed Intervals: 45sec work / 15sec rest × 8 rounds, 2×/week',
        'Slow Tempo: 2-1-2 rhythm for control, 2-3×/week',
      ],
      [TIERS.STRONG]: [
        'Bicycle Crunches: Alternating elbow to knee, 3×20, 2×/week',
        'V-Ups: Touch hands to toes for full engagement, 3×15, 2×/week',
        '2-Min+ Tests: Practice beyond test duration, 1×/week to build reserve',
      ],
    },
    [EXERCISES.PLANK]: {
      [TIERS.FAILING]: [
        'Short Holds: 20-30sec × 6 with 30sec rest, 2-3×/week with two days rest',
        'Progression: Add 5-10sec each week, train 2-3×/week consistently',
        'Form Check: Straight line head to heels, practice 2-3×/week',
      ],
      [TIERS.MARGINAL]: [
        '2-Min Goal: Build to 2+ min continuous hold, 2-3×/week training',
        'Pyramid Training: 30-60-90-60-30sec holds, 2×/week',
        'Mental Strategy: Break into 30sec segments, practice 2-3×/week',
      ],
      [TIERS.STRONG]: [
        'Single-Leg Plank: Lift one leg and hold, alternate, 2×/week',
        'Dynamic Planks: Hip dips, shoulder taps for stability, 2×/week',
        'Plank Complex: Standard + side + reverse plank circuit, 2×/week',
      ],
    },
  },

  [COMPONENTS.BODY_COMP]: {
    [EXERCISES.WHTR]: {
      [TIERS.FAILING]: [
        'Calorie Tracking: Use app (MyFitnessPal, Lose It!) to establish baseline',
        'Clean Eating: Focus on whole foods, lean proteins, vegetables, fruits',
        'Dietary Journal: Track what you eat for 2 weeks to identify problem areas',
      ],
      [TIERS.MARGINAL]: [
        'Meal Prep: Prepare 3-4 days of healthy meals at once for consistency',
        'Portion Control: Use hand-size portions (protein = palm, carbs = fist)',
        'Reduce Processed Foods: Limit packaged snacks, fast food, sugary drinks',
      ],
      [TIERS.STRONG]: [
        'Nutritionist Consultation: Get professional guidance for optimization',
        'Macro Tracking: Balance protein/carbs/fats for performance goals',
        'Meal Timing: Optimize pre/post-workout nutrition for body composition',
      ],
    },
  },
}

/**
 * Get recommendations for a component
 * @param {string} componentType - Component type (cardio, strength, core, bodyComp)
 * @param {string} exercise - Exercise type
 * @param {number} percentage - Component percentage score
 * @param {boolean} exempt - Is component exempt?
 * @returns {Array|null} Array of recommendation strings or null
 */
export function getRecommendations(componentType, exercise, percentage, exempt = false) {
  // No recommendations for exempt components
  if (exempt) {
    return null
  }

  // Walk is pass/fail (percentage is always 0) - use a fixed tier based on pass status
  if (exercise === EXERCISES.WALK_2KM) {
    const walkTier = TIERS.FAILING // Walk has no points; show preparation tips
    const walkRecs = RECOMMENDATIONS[componentType]?.[exercise]?.[walkTier]
    return walkRecs ? walkRecs.slice(0, 3) : null
  }

  // No recommendations if no valid percentage
  if (percentage === null || percentage === undefined) {
    return null
  }

  const tier = getTier(percentage)

  const componentRecs = RECOMMENDATIONS[componentType]
  if (!componentRecs) {
    console.warn(`No recommendations for component: ${componentType}`)
    return null
  }

  const exerciseRecs = componentRecs[exercise]
  if (!exerciseRecs) {
    console.warn(`No recommendations for exercise: ${exercise}`)
    return null
  }

  const tierRecs = exerciseRecs[tier]
  if (!tierRecs || tierRecs.length === 0) {
    return null
  }

  // Return up to 3 recommendations
  return tierRecs.slice(0, 3)
}


// ─── Weekly Training Plan Generator ────────────────────────────────────────────

// Short display labels for exercises used in schedule output
const EXERCISE_SHORT_LABELS = {
  [EXERCISES.RUN_2MILE]: '2-Mile Run',
  [EXERCISES.HAMR]:      'HAMR Shuttle',
  [EXERCISES.WALK_2KM]:  '2km Walk',
  [EXERCISES.PUSHUPS]:   'Push-ups',
  [EXERCISES.HRPU]:      'Hand-Release Push-ups',
  [EXERCISES.SITUPS]:    'Sit-ups',
  [EXERCISES.CLRC]:      'Reverse Crunches',
  [EXERCISES.PLANK]:     'Forearm Plank',
  [EXERCISES.WHTR]:      'Body Comp (WHtR)',
}

/**
 * Urgency tiers for weekly plan - based on weeks remaining to target PFA date.
 * Urgent (<4 weeks): test-simulation focus, peak intensity.
 * Standard (4-12 weeks): progressive training, balanced volume.
 * Long-term (>12 weeks): aerobic/strength base building.
 */
const URGENCY = {
  URGENT: 'urgent',
  STANDARD: 'standard',
  LONG_TERM: 'long_term',
}

export const URGENCY_LABELS = {
  [URGENCY.URGENT]: 'Final Push',      // < 4 weeks
  [URGENCY.STANDARD]: 'Build Phase',   // 4-12 weeks
  [URGENCY.LONG_TERM]: 'Foundation',   // > 12 weeks
}

/**
 * Time-aware, gap-scaled weekly workout sessions per component/exercise/urgency.
 * Source: docs/RESEARCH-FITNESS-PROGRAMS.md
 * Each urgency tier has 3 session descriptions matching the tier's training goal.
 */
const WEEKLY_WORKOUTS = {
  [COMPONENTS.CARDIO]: {
    [EXERCISES.RUN_2MILE]: {
      [URGENCY.URGENT]: [
        'Race Simulation: Full 2-mile at goal pace, record split at mile 1',
        'Interval Sprint: 6x400m at 5-10 sec faster than goal pace (2 min rest)',
        'Tempo Run: 20 min at 80% max HR - maintain uncomfortable-but-sustainable pace',
        'Short Fartlek: 20 min alternating 2 min fast / 1 min easy',
        'Active Recovery: 20-30 min easy jog or brisk walk to flush legs',
      ],
      [URGENCY.STANDARD]: [
        'Interval Day: 6x400m at faster than target pace (90 sec rest between)',
        'Tempo Run: 15-20 min at 80% max heart rate, 10 min warm-up/cool-down',
        'Long Slow Distance: 4-mile run at conversational pace (build aerobic base)',
        'Hill Sprints: 8x30 sec hill sprint with walk-down recovery (no impact overload)',
      ],
      [URGENCY.LONG_TERM]: [
        'Easy Base Run: 3-4 miles at fully conversational pace (talk-test breathing)',
        'Walk-Run Intervals: 2 min run / 1 min walk x10, reduce walk time each week',
        'Aerobic Build: 30 min continuous easy run - focus on consistent breathing',
      ],
    },
    [EXERCISES.HAMR]: {
      [URGENCY.URGENT]: [
        'HAMR Simulation: Full test run with official beep timing, record level reached',
        'Sprint Intervals: 20m x15 with 20 sec rest - match test pace',
        'Tabata HAMR: 20 sec max shuttle effort / 10 sec rest x8 rounds',
        'Turn Drills: 10m sprints focusing on foot plant and push-off technique x15',
        'Active Recovery: Lateral shuffles at easy pace 10 min + stretching',
      ],
      [URGENCY.STANDARD]: [
        'Sprint Intervals: 20m sprints x10 with 30-sec rest - build speed',
        'Agility Circuit: Cone drills + lateral shuffles for 20 min continuous',
        'Tabata HAMR: 20 sec max effort / 10 sec rest x8 rounds',
        'Plyometrics: Jump squats + burpees 3x10 (builds shuttle power)',
      ],
      [URGENCY.LONG_TERM]: [
        'Shuttle Basics: 5-10m cone drills focusing on low center of gravity on turns',
        'Lateral Movement Foundation: Side-to-side shuffles 30 sec x6 sets with 30 sec rest',
        'Deceleration Drills: Sprint 20m, plant foot, sprint back - 8 reps (stop technique)',
      ],
    },
    [EXERCISES.WALK_2KM]: {
      [URGENCY.URGENT]: [
        'Full 2km Timed Walk: Complete course at race pace, record finish time',
        'Pace Intervals: 800m at goal pace x3 with 2 min rest',
        'Technique Walk: 30 min brisk walk - arms at 90 degrees, drive elbows back',
      ],
      [URGENCY.STANDARD]: [
        'Interval Walking: 3 min brisk / 1 min easy x8, progressively reduce easy time',
        'Course Familiarity: Walk test course at target pace, note landmarks at halfway',
        'Speed Walk Drill: 20 min focusing on stride length (longer, not faster turnover)',
      ],
      [URGENCY.LONG_TERM]: [
        'Pace Practice: Walk 30 min at target speed (4.5+ mph / 13:20/mile)',
        'Hill Training: 30 min brisk walk on hilly terrain to build leg power',
        'Interval Base: 3 min brisk / 2 min easy x6, reduce easy intervals each week',
      ],
    },
  },

  [COMPONENTS.STRENGTH]: {
    [EXERCISES.PUSHUPS]: {
      [URGENCY.URGENT]: [
        'Near-Max Sets: 5 sets, stop 1 rep before failure, 2 min rest (test simulation)',
        'Pyramid: 1-2-3-4-5-4-3-2-1 reps with 10 sec rest (repeat x2 for volume)',
        'Test Simulation: 1-min near-max push-ups under test conditions, record count',
      ],
      [URGENCY.STANDARD]: [
        'Volume Day: Accumulate 150 total push-ups in session, stop 2-3 reps before failure each set',
        'Pyramid Sets: 1-2-3-4-5-4-3-2-1 reps with 10 sec rest between each set',
        'Tempo Push-ups: 3-1-3 rhythm (3 sec down, 1 sec hold, 3 sec up) x3 sets of 10',
      ],
      [URGENCY.LONG_TERM]: [
        'Foundation: 3x15 incline push-ups (hands on stairs/bench) - build base strength',
        'Strength Builder: 5x10 standard push-ups with 2 min rest - stop 3-4 reps before failure',
        'Negative Reps: 3x8 slow 5-sec lowering phase from plank to floor',
      ],
    },
    [EXERCISES.HRPU]: {
      [URGENCY.URGENT]: [
        'Test Simulation: Full 2-min HRPU under test conditions, record count',
        'EMOM: 15 HRPUs every minute for 10 rounds (150 total reps)',
        'Near-Max Sets: 3 sets, stop 1 rep before failure, 3 min rest',
      ],
      [URGENCY.STANDARD]: [
        'Timed Sets: 30 sec controlled effort / 30 sec rest x6 rounds - stop 2 reps before failure',
        'EMOM: 15 HRPUs every minute for 8 rounds (form focus - complete hand lift each rep)',
        'Form Drill: 3x12 slow HRPUs with deliberate full hand lift and chest contact',
      ],
      [URGENCY.LONG_TERM]: [
        'Dead Stop Foundation: 3x10 with full hand lift and 2 sec pause on ground',
        'Volume Base: 3x15 standard push-ups to build pressing strength before HRPU',
        'Phase Training: 3x8 lowering phase only (eccentric), then 3x8 pressing only (concentric)',
      ],
    },
  },

  [COMPONENTS.CORE]: {
    [EXERCISES.SITUPS]: {
      [URGENCY.URGENT]: [
        'Test Simulation: Full 1-min near-max sit-ups under test conditions, record count',
        'Sprint Rounds: 30 sec near-max / 30 sec rest x6 sets - test-pace conditioning',
        'Cadence Drill: Metronome at 55 bpm for 3 sets of 30 reps - race rhythm training',
      ],
      [URGENCY.STANDARD]: [
        '80 Sit-up Session: Complete 80 total, stop 2-3 reps before failure each set',
        'Cadence Training: Metronome at 55 bpm for 3 sets of 30 reps - build pace tolerance',
        'Pyramid: 10-20-30-20-10 sit-ups with 30 sec rest - controlled volume with limited rest',
      ],
      [URGENCY.LONG_TERM]: [
        'Core Foundation: 3x20 crunches with controlled curl - no neck pulling',
        'Dead Bug Drill: 3x10 alternating arm/leg extensions with lower back flat',
        'Volume Build: 5x15 sit-ups with 90 sec rest - emphasize full range of motion',
      ],
    },
    [EXERCISES.CLRC]: {
      [URGENCY.URGENT]: [
        'Test Simulation: Full 2-min CLRC under test conditions, record count',
        'Timed Intervals: 45 sec near-max / 15 sec rest x8 rounds - threshold conditioning',
        'Near-Max Sets: 3 sets, stop 1 rep before failure, 2 min rest - build top-end capacity',
      ],
      [URGENCY.STANDARD]: [
        'High Rep Sets: 35 reps x3 with 1 min rest - build specific endurance',
        'Timed Intervals: 45 sec work / 15 sec rest x6 rounds - pacing practice',
        'Slow Tempo: 3x20 at 2-1-2 rhythm (2 sec up, 1 hold, 2 sec down) - form control',
      ],
      [URGENCY.LONG_TERM]: [
        'Movement Pattern: 3x10 reverse crunches (knees to chest, lift hips off ground)',
        'Position Practice: 3x15 with deliberate cross-leg setup - master form before speed',
        'Hip Flexor Foundation: 3x10 lying leg raises to 90 degrees (isolate lower abs)',
      ],
    },
    [EXERCISES.PLANK]: {
      [URGENCY.URGENT]: [
        'Extended Hold: 2+ min continuous hold x2 sets with 3 min rest',
        'Pyramid: 60-90-120 sec holds with 30 sec rest (builds target duration)',
        'Test Prep: Hold to near-failure, rest 3 min, repeat x2 - simulate test conditions',
      ],
      [URGENCY.STANDARD]: [
        '2-Min Goal: Build to 2+ min continuous hold - add 10 sec per session',
        'Pyramid Training: 30-60-90-60-30 sec holds with 20 sec rest between',
        'Interval Plank: 45 sec on / 15 sec rest x8 rounds - high total time-under-tension',
      ],
      [URGENCY.LONG_TERM]: [
        'Short Holds: 30 sec x6 with 30 sec rest - add 5 sec per week per set',
        'Form Foundation: 3x20 sec holds - straight line head to heels, neutral spine',
        'Progressive Build: 45 sec x4 this week, 50 sec x4 next week - systematic progression',
      ],
    },
  },

  [COMPONENTS.BODY_COMP]: {
    [EXERCISES.WHTR]: {
      [URGENCY.URGENT]: [
        'Daily calorie deficit: 500-750 cal/day below maintenance - track with app',
        'Hydration: 64+ oz water daily - reduces water retention before measurement',
        'Limit sodium: Under 2,300 mg/day - cut processed foods and restaurant meals',
      ],
      [URGENCY.STANDARD]: [
        'Meal prep: Cook 3-4 days of healthy meals at once for consistency',
        'Calorie tracking: Log all food for 2 weeks to identify problem areas',
        'Portion control: Use hand-size method (protein = palm, carbs = fist)',
      ],
      [URGENCY.LONG_TERM]: [
        'Dietary journal: Track all food intake for 2 weeks to find patterns',
        'One swap per day: Replace one processed food with a whole food alternative',
        'Hydration habit: Replace sugary drinks with water - saves 200-400 cal/day',
      ],
    },
  },
}

/**
 * Calculate sessions per week for a component based on gap to minimum and urgency.
 * Respects safety limits: strength/core max 3x/week, cardio max 5x/week.
 * Body comp returns 0 (tracked as daily habits, not sessions).
 * @param {string} component - Component type constant
 * @param {number} gapBelowMin - Percentage points below minimum (0 if passing)
 * @param {string} urgency - URGENCY constant
 * @returns {number} Sessions per week
 */
function getSessionsPerWeek(component, gapBelowMin, urgency) {
  if (component === COMPONENTS.BODY_COMP) return 0 // Body comp = daily habits

  // Safety maximums from RESEARCH-FITNESS-PROGRAMS.md
  const MAX = component === COMPONENTS.CARDIO ? 5 : 3

  let base
  if (urgency === URGENCY.URGENT) {
    // Short timeline: higher frequency to maximize remaining weeks
    if (gapBelowMin > 10) base = 4
    else if (gapBelowMin > 3) base = 3
    else base = 2
  } else if (urgency === URGENCY.STANDARD) {
    // Standard timeline: progressive loading
    if (gapBelowMin > 15) base = 4
    else if (gapBelowMin > 5) base = 3
    else base = 2
  } else {
    // Long-term: base building phase - consistency over intensity
    if (gapBelowMin > 15) base = 3
    else if (gapBelowMin > 5) base = 3
    else base = 2
  }

  return Math.min(base, MAX)
}

/**
 * Generate a personalized weekly training plan based on current scores and time to target date.
 * Plans are scaled to the user's gap to passing and adjusted for weeks remaining.
 * Evidence basis: docs/RESEARCH-FITNESS-PROGRAMS.md
 *
 * @param {Object} componentData - Per-component data: { [compType]: { percentage, exercise, exempt } }
 *   - percentage: current component percentage score (null if not yet tested)
 *   - exercise: exercise type constant
 *   - exempt: boolean
 * @param {string} targetDate - ISO date string for target PFA date
 * @returns {Object|null} Weekly plan or null if insufficient data
 */
export function generateWeeklyPlan(componentData, targetDate, totalPlanWeeks) {
  if (!componentData || !targetDate) return null

  const today = new Date().toISOString().split('T')[0]
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeksToTarget = Math.max(
    0,
    Math.round((new Date(targetDate) - new Date(today)) / msPerWeek)
  )

  // Determine urgency tier
  let urgency
  if (weeksToTarget < 4) urgency = URGENCY.URGENT
  else if (weeksToTarget <= 12) urgency = URGENCY.STANDARD
  else urgency = URGENCY.LONG_TERM

  // Phase engine integration (dynamic - no 16-week clamping)
  const planTotal = totalPlanWeeks || weeksToTarget
  const ratio = getProgressionRatio(weeksToTarget, planTotal)
  const phase = getPhaseFromRatio(ratio, planTotal)
  const config = phaseConfig[phase]
  const repInstruction = getRepInstruction(phase)

  // Build priority list from non-exempt, tested components
  const priorities = []
  for (const [comp, data] of Object.entries(componentData)) {
    if (!data || data.exempt) continue
    if (data.percentage === null || data.percentage === undefined) continue

    const minPct = COMPONENT_MINIMUMS[comp] ?? 60
    const gapBelowMin = Math.max(0, minPct - data.percentage)
    const isFailing = data.percentage < minPct

    priorities.push({
      component: comp,
      exercise: data.exercise,
      percentage: data.percentage,
      isFailing,
      gapBelowMin,
    })
  }

  if (priorities.length === 0) return null

  // Sort: failing components first (by gap desc), then marginal (close to min), then passing
  priorities.sort((a, b) => {
    if (a.isFailing && !b.isFailing) return -1
    if (!a.isFailing && b.isFailing) return 1
    return b.gapBelowMin - a.gapBelowMin
  })

  // Build plan items with session counts and workout descriptions
  const planItems = priorities.map((p, index) => {
    const sessionsPerWeek = getSessionsPerWeek(p.component, p.gapBelowMin, urgency)
    const allWorkouts = WEEKLY_WORKOUTS[p.component]?.[p.exercise]?.[urgency] ?? []

    // Select workouts matching session count (up to what's available)
    const selectedWorkouts = allWorkouts.slice(0, Math.max(sessionsPerWeek, 3))

    const tier = p.percentage < RECOMMENDATION_TIERS.FAILING_BELOW ? TIERS.FAILING
      : p.percentage <= RECOMMENDATION_TIERS.MARGINAL_BELOW ? TIERS.MARGINAL
        : TIERS.STRONG

    return {
      component: p.component,
      exercise: p.exercise,
      percentage: p.percentage,
      isFailing: p.isFailing,
      gapBelowMin: p.gapBelowMin,
      tier,
      sessionsPerWeek,
      workouts: selectedWorkouts,
      priorityRank: index + 1,
    }
  })

  const schedule = buildWeekSchedule(planItems)
  const bodyCompPlanItem = planItems.find(p => p.component === COMPONENTS.BODY_COMP)
  const bodyCompHabits = bodyCompPlanItem?.workouts ?? []

  return {
    weeksToTarget,
    urgency,
    urgencyLabel: URGENCY_LABELS[urgency],
    phase,
    phaseLabel: PHASE_DISPLAY[phase],
    phaseDescription: config.description,
    effortLabel: config.effortLabel,
    repInstruction,
    maxEffortAllowed: config.maxEffortAllowed,
    sessionsPerWeekCap: config.sessionsPerWeek,
    planWeekNum: Math.max(1, Math.min(16, Math.round(ratio * 15) + 1)),
    planItems,
    schedule,
    bodyCompHabits,
    restNote: 'Allow 1-2 complete rest days per week. Never train the same muscle group on consecutive days.',
  }
}

/**
 * Build a 7-day weekly schedule from plan items.
 * Cardio gets its own days (30-40 min each). Strength and core are paired into
 * combined sessions (30-35 min total). Body comp is handled separately as daily habits.
 *
 * Session counts:
 *   Cardio failing/marginal -> 3x/week; passing -> 2x/week (maintenance)
 *   Strength + Core (combined) -> 2x/week whenever either component is tested
 *
 * @param {Array} planItems - Sorted plan items from generateWeeklyPlan
 * @returns {Array} 7-element array, one object per day (Monday-Sunday)
 */
function buildWeekSchedule(planItems) {
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const cardioItem    = planItems.find(p => p.component === COMPONENTS.CARDIO)
  const strengthItem  = planItems.find(p => p.component === COMPONENTS.STRENGTH)
  const coreItem      = planItems.find(p => p.component === COMPONENTS.CORE)

  // Cardio: 3x if failing/marginal, 2x if passing, 0 if not tested
  const cardioSessions = !cardioItem ? 0
    : (cardioItem.isFailing || cardioItem.tier === TIERS.MARGINAL) ? 3 : 2

  // Strength + Core always paired, always 2x/week if any SC component is tested
  const scSessions = (strengthItem || coreItem) ? 2 : 0

  // Pick a weekly template. Each slot is a string: C0/C1/C2 = cardio session N,
  // SC0/SC1 = combined strength+core session N, REC = active recovery, REST = rest.
  let template
  if (cardioSessions >= 3 && scSessions >= 2) {
    // 5 active days: alternate cardio and SC, one recovery
    template = ['C0', 'SC0', 'C1', 'SC1', 'C2', 'REC', 'REST']
  } else if (cardioSessions >= 3 && scSessions === 0) {
    // 3 active days: cardio only, rest between each
    template = ['C0', 'REST', 'C1', 'REST', 'C2', 'REC', 'REST']
  } else if (cardioSessions === 2 && scSessions >= 2) {
    // 4 active days: balanced split with a mid-week rest
    template = ['C0', 'SC0', 'REST', 'C1', 'SC1', 'REC', 'REST']
  } else if (cardioSessions === 2 && scSessions === 0) {
    // 2 active days: cardio only
    template = ['C0', 'REST', 'REST', 'C1', 'REST', 'REC', 'REST']
  } else if (cardioSessions === 0 && scSessions >= 2) {
    // 2 active days: SC only (no cardio tested)
    template = ['REST', 'SC0', 'REST', 'SC1', 'REST', 'REC', 'REST']
  } else {
    template = ['REST', 'REST', 'REST', 'REST', 'REST', 'REST', 'REST']
  }

  return template.map((slot, i) => {
    const day = DAYS[i]

    if (slot === 'REST') {
      return { day, type: 'rest', label: 'Rest', duration: null, sessions: [] }
    }

    if (slot === 'REC') {
      return {
        day, type: 'recovery', label: 'Active Recovery', duration: '20-30 min',
        sessions: [{
          exerciseLabel: '',
          workout: 'Light walk, gentle stretching, or mobility work. Keep effort easy - this helps muscles recover without adding fatigue.',
          tier: TIERS.STRONG,
        }],
      }
    }

    if (slot.startsWith('C')) {
      const idx = parseInt(slot[1])
      const workouts = cardioItem.workouts
      const workout = workouts[idx % workouts.length]
      const isMaintain = !cardioItem.isFailing && cardioItem.tier === TIERS.STRONG
      return {
        day,
        type: 'cardio',
        label: isMaintain ? 'Cardio - Maintain' : 'Cardio',
        duration: '30-40 min',
        sessions: [{
          exerciseLabel: EXERCISE_SHORT_LABELS[cardioItem.exercise] ?? 'Cardio',
          workout,
          tier: cardioItem.tier,
          component: COMPONENTS.CARDIO,
        }],
      }
    }

    if (slot.startsWith('SC')) {
      const idx = parseInt(slot[2])
      const sessions = []
      if (strengthItem) {
        const workouts = strengthItem.workouts
        sessions.push({
          exerciseLabel: EXERCISE_SHORT_LABELS[strengthItem.exercise] ?? 'Strength',
          workout: workouts[idx % workouts.length],
          tier: strengthItem.tier,
          component: COMPONENTS.STRENGTH,
        })
      }
      if (coreItem) {
        const workouts = coreItem.workouts
        sessions.push({
          exerciseLabel: EXERCISE_SHORT_LABELS[coreItem.exercise] ?? 'Core',
          workout: workouts[idx % workouts.length],
          tier: coreItem.tier,
          component: COMPONENTS.CORE,
        })
      }
      const allMaintain = sessions.length > 0 && sessions.every(s => !planItems.find(p => p.component === s.component)?.isFailing && s.tier === TIERS.STRONG)
      return {
        day,
        type: 'sc',
        label: allMaintain ? 'Strength & Core - Maintain' : 'Strength & Core',
        duration: sessions.length === 2 ? '30-35 min' : '20-25 min',
        sessions,
      }
    }

    return { day, type: 'rest', label: 'Rest', duration: null, sessions: [] }
  })
}
