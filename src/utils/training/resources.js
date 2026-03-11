/**
 * Curated Training Resource Registry
 *
 * Static list of verified training resource links per PFA component and exercise.
 * All links open in new tab (target="_blank"). No embedded content.
 *
 * --- Source types ---
 *   'official'  - DoD / USAF official channels (DVIDS, AFPC, af.mil, hprc-online.org,
 *                 base FSS sites ending in .af.mil or .mil)
 *   'vetted'    - Reputable non-government sources with accurate military fitness content
 *                 (Military.com, Task & Purpose, Total Force Hub)
 *
 * --- Link verification ---
 *   'lastVerified' is the date the URL was confirmed present in active web search results.
 *   It does NOT mean every byte of content was audited - owners can change pages.
 *   Periodic review process:
 *     1. Quarterly (Jan, Apr, Jul, Oct): paste each URL in a browser and confirm it loads.
 *     2. Update lastVerified for any link that still resolves correctly.
 *     3. Remove or replace any link that returns 404 or redirects to unrelated content.
 *     4. Add new official resources as AFPC, HPRC, or DVIDS publish them.
 *
 * --- YouTube / Video note ---
 *   DVIDS (dvidshub.net) is the DoD's official video distribution service. DVIDS video
 *   links are real, watchable video content - functionally equivalent to YouTube for this
 *   use case. Direct YouTube video IDs for USAF fitness content were not reliably surfaced
 *   by automated search tools; prefer DVIDS official videos over unverified YouTube links.
 */

import { COMPONENTS, EXERCISES } from '../scoring/constants.js'

/**
 * @typedef {Object} TrainingResource
 * @property {string} title        - Display name for the link
 * @property {string} url          - Full absolute URL
 * @property {string} source       - 'official' | 'vetted'
 * @property {string} description  - One-sentence description shown below the title
 * @property {string} lastVerified - ISO date (YYYY-MM-DD) URL last confirmed in search results
 */

/** @type {Record<string, TrainingResource[]>} */
const RESOURCES = {

  // ---------------------------------------------------------------------------
  // CARDIO - component level (shown when cardio exempt or as fallback)
  // ---------------------------------------------------------------------------
  [COMPONENTS.CARDIO]: [
    {
      title: 'Air Force Physical Fitness Assessment Training Series (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/physical-fitness-training-series-air-force-physical-fitness',
      source: 'official',
      description: 'Official Human Performance Resource Center guide covering 2-mile run, HAMR, push-ups, and core training for the USAF PFA.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'Best Running Workouts for Military Fitness Test Timed Runs (Military.com)',
      url: 'https://www.military.com/military-fitness/best-running-workouts-military-fitness-test-timed-runs',
      source: 'vetted',
      description: 'Interval, tempo, and long-run training plans by Stew Smith (former Navy SEAL, CSCS) specifically for timed military run events.',
      lastVerified: '2026-03-11',
    },
  ],

  // ---------------------------------------------------------------------------
  // CARDIO - 2-mile run specific
  // ---------------------------------------------------------------------------
  [EXERCISES.RUN_2MILE]: [
    {
      title: 'Air Force Physical Fitness Assessment Training Series (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/physical-fitness-training-series-air-force-physical-fitness',
      source: 'official',
      description: 'Official HPRC guide covering 2-mile run pacing, aerobic base building, and recovery specific to the USAF PFA.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'Best Running Workouts for Military Fitness Test Timed Runs (Military.com)',
      url: 'https://www.military.com/military-fitness/best-running-workouts-military-fitness-test-timed-runs',
      source: 'vetted',
      description: 'Structured interval and tempo run workouts to shave time off your 2-mile run, with guidance on weekly volume progression.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'How to Pass the New Air Force Fitness Test (Task & Purpose)',
      url: 'https://taskandpurpose.com/news/air-force-physical-fitness-test-tips/',
      source: 'vetted',
      description: 'Practical tips from a fitness officer who oversaw 600+ PFAs, covering run strategy, HAMR vs. run tradeoffs, and common mistakes.',
      lastVerified: '2026-03-11',
    },
  ],

  // ---------------------------------------------------------------------------
  // CARDIO - HAMR shuttle run specific
  // ---------------------------------------------------------------------------
  [EXERCISES.HAMR]: [
    {
      title: 'USAF HAMR Instruction Video (DVIDS - official video)',
      url: 'https://www.dvidshub.net/video/909599/usaf-hamr-instruction-video',
      source: 'official',
      description: 'Official DoD video demonstrating proper HAMR shuttle run execution, line-touch technique, and disqualification rules for the USAF PFA.',
      lastVerified: '2026-03-11',
    },
    {
      title: '20M High Aerobic Multi-Shuttle Run Demo (DVIDS - official video)',
      url: 'https://www.dvidshub.net/video/825282/20m-high-aerobic-multi-shuttle-run',
      source: 'official',
      description: 'Official DVIDS video showing the 20-meter HAMR course layout, pacing cues, and shuttle run mechanics.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'HAMR Audio File - Ellsworth AFB (official base resource)',
      url: 'https://ellsworthfss.com/hamr-audio-file/',
      source: 'official',
      description: 'Ellsworth Air Force Base Force Support Squadron page hosting the official HAMR beep-test audio track for practice sessions.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'How to Pass the New Air Force Fitness Test (Task & Purpose)',
      url: 'https://taskandpurpose.com/news/air-force-physical-fitness-test-tips/',
      source: 'vetted',
      description: 'Insights from a fitness officer who oversaw hundreds of PFAs - covers HAMR pacing, shuttle strategy, and how the scoring compares to the run.',
      lastVerified: '2026-03-11',
    },
  ],

  // ---------------------------------------------------------------------------
  // STRENGTH - component level
  // ---------------------------------------------------------------------------
  [COMPONENTS.STRENGTH]: [
    {
      title: 'USAF PFA Instruction Video - Strength and Core (DVIDS - official video)',
      url: 'https://www.dvidshub.net/video/909597/usaf-pfa-instruction-video',
      source: 'official',
      description: 'Official DoD video covering USAF PFA strength and core endurance event technique, standards, and common grading errors.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'Air Force Physical Fitness Assessment Training Series (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/physical-fitness-training-series-air-force-physical-fitness',
      source: 'official',
      description: 'Official HPRC guide for the USAF push-up and HRPU events, including form cues, recovery guidance, and common errors.',
      lastVerified: '2026-03-11',
    },
    {
      title: '5 Most Effective Push-Up and Pull-Up Workouts (Military.com)',
      url: 'https://www.military.com/military-fitness/5-most-effective-push-and-pull-workouts',
      source: 'vetted',
      description: 'Five push-up training methods - pyramid sets, supersets, pacing blocks, and more - by Stew Smith (former Navy SEAL, CSCS).',
      lastVerified: '2026-03-11',
    },
    {
      title: 'Push-Up Instructions - Air Combat Command (ACC)',
      url: 'https://www.acc.af.mil/Home/ACC-Safety/Are-You-Ready/Written-push-up-instructions/',
      source: 'official',
      description: 'Official Air Combat Command written instructions for standard USAF push-up form and common errors that result in uncounted reps.',
      lastVerified: '2026-03-11',
    },
  ],

  // ---------------------------------------------------------------------------
  // STRENGTH - standard push-ups
  // ---------------------------------------------------------------------------
  [EXERCISES.PUSHUPS]: [
    {
      title: 'Push-Up Instructions - Air Combat Command (ACC)',
      url: 'https://www.acc.af.mil/Home/ACC-Safety/Are-You-Ready/Written-push-up-instructions/',
      source: 'official',
      description: 'Official USAF written guidance on push-up starting position, full range of motion, and grader standards for the 1-minute event.',
      lastVerified: '2026-03-11',
    },
    {
      title: '5 Most Effective Push-Up and Pull-Up Workouts (Military.com)',
      url: 'https://www.military.com/military-fitness/5-most-effective-push-and-pull-workouts',
      source: 'vetted',
      description: 'Pyramid method, pacing blocks, and superset approaches for building push-up volume for military fitness tests.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'Air Force Physical Fitness Assessment Training Series (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/physical-fitness-training-series-air-force-physical-fitness',
      source: 'official',
      description: 'HPRC guide covering push-up standards, training frequency, and recovery for the USAF PFA.',
      lastVerified: '2026-03-11',
    },
  ],

  // ---------------------------------------------------------------------------
  // STRENGTH - hand-release push-ups (HRPU)
  // ---------------------------------------------------------------------------
  [EXERCISES.HRPU]: [
    {
      title: 'Become a Push-Up Pro - HRPU Demo (DVIDS - official video)',
      url: 'https://www.dvidshub.net/video/832909/become-push-up-pro',
      source: 'official',
      description: 'Official DVIDS video demonstrating correct hand-release push-up execution for the 2-minute USAF PFA strength event.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'USAF PFA Instruction Video - Strength and Core (DVIDS - official video)',
      url: 'https://www.dvidshub.net/video/909597/usaf-pfa-instruction-video',
      source: 'official',
      description: 'Official DoD PFA instruction video covering HRPU standards, grading criteria, and technique cues.',
      lastVerified: '2026-03-11',
    },
    {
      title: '5 Most Effective Push-Up and Pull-Up Workouts (Military.com)',
      url: 'https://www.military.com/military-fitness/5-most-effective-push-and-pull-workouts',
      source: 'vetted',
      description: 'Training volume strategies for building HRPU endurance - pyramid sets and pacing blocks that translate directly to the 2-minute event.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'Air Force Physical Fitness Assessment Training Series (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/physical-fitness-training-series-air-force-physical-fitness',
      source: 'official',
      description: 'HPRC guidance on hand-release push-up form, training progression, and differences from standard push-ups in the USAF PFA context.',
      lastVerified: '2026-03-11',
    },
  ],

  // ---------------------------------------------------------------------------
  // CORE - component level
  // ---------------------------------------------------------------------------
  [COMPONENTS.CORE]: [
    {
      title: 'Military Workout: Core Strength 101 (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/military-workout-core-strength-101',
      source: 'official',
      description: 'Official HPRC core training poster and guide covering plank, sit-up, V sit-up, bridge, and stability exercises for military fitness.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'The Core: Foundation of Movement for Military Fitness (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/core-foundation-movement-military-fitness',
      source: 'official',
      description: 'HPRC article on core stability, spine protection, and how to build the foundational strength that underlies every PFA core event.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'Train Smarter: Improve Sit-Up Performance with Core Exercises (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/train-smarter-improve-your-sit-performance-core-exercises',
      source: 'official',
      description: 'Evidence-based guidance on why general core training (planks, bridges, lunges) improves sit-up scores as well as sit-up-only training - with less spinal stress.',
      lastVerified: '2026-03-11',
    },
  ],

  // ---------------------------------------------------------------------------
  // CORE - cross-leg reverse crunch (CLRC) specific
  // ---------------------------------------------------------------------------
  [EXERCISES.CLRC]: [
    {
      title: 'Crush Those Crunches - CLRC and Plank Demo (DVIDS - official video)',
      url: 'https://www.dvidshub.net/video/832907/crush-those-crunches',
      source: 'official',
      description: 'Official DVIDS video demonstrating cross-leg reverse crunch technique and forearm plank form for the 2-minute USAF PFA core event.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'Military Workout: Core Strength 101 (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/military-workout-core-strength-101',
      source: 'official',
      description: 'HPRC core training guide covering stability and endurance exercises that build the hip flexor and abdominal strength needed for CLRC.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'Train Smarter: Improve Sit-Up Performance with Core Exercises (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/train-smarter-improve-your-sit-performance-core-exercises',
      source: 'official',
      description: 'Evidence-based guidance on core training progressions applicable to CLRC volume and endurance development.',
      lastVerified: '2026-03-11',
    },
  ],

  // ---------------------------------------------------------------------------
  // CORE - forearm plank specific
  // ---------------------------------------------------------------------------
  [EXERCISES.PLANK]: [
    {
      title: 'Crush Those Crunches - CLRC and Plank Demo (DVIDS - official video)',
      url: 'https://www.dvidshub.net/video/832907/crush-those-crunches',
      source: 'official',
      description: 'Official DVIDS video demonstrating forearm plank form and cross-leg reverse crunch technique for the USAF PFA core event.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'Military Workout: Core Strength 101 (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/military-workout-core-strength-101',
      source: 'official',
      description: 'Official HPRC guide featuring plank progressions and accessory core exercises for military fitness assessments.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'Planking for Military Fitness Tests: How to Train for It (Military.com)',
      url: 'https://www.military.com/military-fitness/acft-now-requires-planking-heres-how-train-it',
      source: 'vetted',
      description: 'Progressive plank training protocol - daily 30-90 second sets, form cues, and common errors - applicable directly to the USAF forearm plank event.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'The Core: Foundation of Movement for Military Fitness (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/core-foundation-movement-military-fitness',
      source: 'official',
      description: 'HPRC explanation of how core stability training translates to longer plank hold times and reduced injury risk.',
      lastVerified: '2026-03-11',
    },
  ],

  // ---------------------------------------------------------------------------
  // BODY COMPOSITION - component level
  // ---------------------------------------------------------------------------
  [COMPONENTS.BODY_COMP]: [
    {
      title: 'Optimal Body Fat and Body Composition for Military Fitness (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/optimal-body-fat-and-body-composition-military-fitness',
      source: 'official',
      description: 'Official HPRC article on healthy body composition targets, waist circumference measurement methodology, and the relationship between fitness and body comp.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'Fighting-Weight Strategies (HPRC)',
      url: 'https://www.hprc-online.org/nutrition/fighting-weight-strategies',
      source: 'official',
      description: 'Evidence-based nutrition and lifestyle strategies from HPRC for achieving and maintaining a healthy fighting weight without crash dieting.',
      lastVerified: '2026-03-11',
    },
    {
      title: 'Weight Management Resources (HPRC)',
      url: 'https://www.hprc-online.org/physical-fitness/training-performance/weight-management-resources',
      source: 'official',
      description: 'HPRC curated resources on weight management, body composition measurement, and sustainable approaches for meeting military standards.',
      lastVerified: '2026-03-11',
    },
  ],
}

/**
 * Get training resources for a given component or exercise.
 *
 * Priority: exercise-specific resources first; falls back to component-level.
 * Deduplicates by URL so the same link never appears twice.
 *
 * @param {string} component - COMPONENTS constant (e.g. COMPONENTS.CARDIO)
 * @param {string|null} [exercise] - EXERCISES constant (e.g. EXERCISES.HAMR); optional
 * @returns {TrainingResource[]} Deduplicated list of resources
 */
export function getTrainingResources(component, exercise) {
  const exerciseResources = exercise ? (RESOURCES[exercise] ?? []) : []
  const componentResources = RESOURCES[component] ?? []

  if (exerciseResources.length === 0) return componentResources

  // Exercise-level URLs take precedence; skip component ones already present
  const seen = new Set(exerciseResources.map(r => r.url))
  const extras = componentResources.filter(r => !seen.has(r.url))
  return [...exerciseResources, ...extras]
}

export default RESOURCES
