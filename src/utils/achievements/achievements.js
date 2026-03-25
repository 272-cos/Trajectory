/**
 * Achievement badge system - evaluates earned badges from S-codes and demographics
 */

import { decodeSCode } from '../codec/scode.js'
import { calculateComponentScore, calculateCompositeScore, calculateWHtR } from '../scoring/scoringEngine.js'
import { EXERCISES, COMPONENTS, calculateAge, getAgeBracket, COMPONENT_WEIGHTS } from '../scoring/constants.js'

export const TIER = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
}

export const BADGES = [
  // Count-based
  { id: 'first_check', name: 'First Check', description: 'Log your first assessment', tier: TIER.BRONZE },
  { id: 'consistent', name: 'Consistent', description: 'Log 3 assessments', tier: TIER.BRONZE },
  { id: 'dedicated', name: 'Dedicated', description: 'Log 5 assessments', tier: TIER.SILVER },
  { id: 'veteran', name: 'Veteran', description: 'Log 10 assessments', tier: TIER.GOLD },
  // Score-based
  { id: 'passing', name: 'Passing', description: 'Score 75+ composite', tier: TIER.BRONZE },
  { id: 'strong', name: 'Strong', description: 'Score 85+ composite', tier: TIER.SILVER },
  { id: 'elite', name: 'Elite', description: 'Score 95+ composite', tier: TIER.GOLD },
  // Progress-based
  { id: 'improving', name: 'Improving', description: 'Improve composite between consecutive assessments', tier: TIER.BRONZE },
  { id: 'streak_3', name: 'On a Roll', description: '3 consecutive passing assessments', tier: TIER.SILVER },
  // Component-based
  { id: 'well_rounded', name: 'Well-Rounded', description: 'Pass all 4 components in one assessment', tier: TIER.BRONZE },
  { id: 'max_component', name: 'Maxed Out', description: 'Score 100% on any component', tier: TIER.GOLD },
  { id: 'speed_demon', name: 'Speed Demon', description: '2-mile run under 12:00', tier: TIER.GOLD },
  { id: 'iron_core', name: 'Iron Core', description: 'Max score on core component', tier: TIER.SILVER },
  { id: 'push_power', name: 'Push Power', description: 'Max score on strength component', tier: TIER.SILVER },
]

const BADGE_MAP = Object.fromEntries(BADGES.map(b => [b.id, b]))

/**
 * Decode and score all S-codes for achievement evaluation
 */
function decodeAndScoreAll(scodes, demographics) {
  if (!scodes || !demographics) return []

  const results = []
  for (const code of scodes) {
    try {
      const decoded = decodeSCode(code)
      const age = calculateAge(demographics.dob, decoded.date)
      const ageBracket = getAgeBracket(age)
      const gender = demographics.gender

      const components = []
      const componentMap = {}

      // Score each component
      for (const compType of [COMPONENTS.CARDIO, COMPONENTS.STRENGTH, COMPONENTS.CORE, COMPONENTS.BODY_COMP]) {
        const comp = decoded[compType]
        if (!comp || comp.exempt) continue

        let score
        if (compType === COMPONENTS.BODY_COMP) {
          const whtr = calculateWHtR(comp.waistInches, comp.heightInches)
          score = calculateComponentScore(EXERCISES.WHTR, whtr, gender, ageBracket)
        } else {
          score = calculateComponentScore(comp.exercise, comp.value, gender, ageBracket)
        }

        if (score && !score.error) {
          components.push({ type: compType, ...score, exercise: comp.exercise, value: comp.value })
          componentMap[compType] = score
        }
      }

      const composite = calculateCompositeScore(components)

      results.push({
        date: decoded.date,
        components,
        componentMap,
        composite: composite?.compositeScore ?? null,
        pass: composite?.pass ?? false,
        allComponentsPass: components.every(c => c.pass),
        decoded,
      })
    } catch {
      // Skip invalid codes
    }
  }

  // Sort by date ascending
  results.sort((a, b) => a.date.localeCompare(b.date))
  return results
}

/**
 * Evaluate which badges are earned
 * @param {string[]} scodes - Array of S-code strings
 * @param {object} demographics - { dob, gender }
 * @returns {string[]} Array of earned badge IDs
 */
export function evaluateAchievements(scodes, demographics) {
  const scored = decodeAndScoreAll(scodes, demographics)
  const earned = new Set()
  const count = scored.length

  // Count-based
  if (count >= 1) earned.add('first_check')
  if (count >= 3) earned.add('consistent')
  if (count >= 5) earned.add('dedicated')
  if (count >= 10) earned.add('veteran')

  let consecutivePasses = 0

  for (let i = 0; i < scored.length; i++) {
    const entry = scored[i]

    // Score-based
    if (entry.composite != null) {
      if (entry.composite >= 75) earned.add('passing')
      if (entry.composite >= 85) earned.add('strong')
      if (entry.composite >= 95) earned.add('elite')
    }

    // Pass streak
    if (entry.pass) {
      consecutivePasses++
      if (consecutivePasses >= 3) earned.add('streak_3')
    } else {
      consecutivePasses = 0
    }

    // Improving
    if (i > 0 && entry.composite != null && scored[i - 1].composite != null) {
      if (entry.composite > scored[i - 1].composite) earned.add('improving')
    }

    // Well-rounded
    if (entry.allComponentsPass && entry.components.length >= 4) earned.add('well_rounded')

    // Component-specific
    for (const comp of entry.components) {
      const maxPts = COMPONENT_WEIGHTS[comp.type] || 0
      if (maxPts > 0 && comp.points >= maxPts) {
        earned.add('max_component')
        if (comp.type === COMPONENTS.CORE) earned.add('iron_core')
        if (comp.type === COMPONENTS.STRENGTH) earned.add('push_power')
      }

      // Speed demon - 2-mile under 12:00 (720 seconds)
      if (comp.exercise === EXERCISES.RUN_2MILE && comp.value <= 720) {
        earned.add('speed_demon')
      }
    }
  }

  return Array.from(earned)
}

export { BADGE_MAP }
