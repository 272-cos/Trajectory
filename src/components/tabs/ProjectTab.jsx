/**
 * Trajectory Tab - Improvement tips and training recommendations
 * Shows personalized recommendations based on latest assessment
 */

import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { decodeSCode } from '../../utils/codec/scode.js'
import { COMPONENTS } from '../../utils/scoring/constants.js'
import { getProjectionAgeBracket } from '../../utils/scoring/constants.js'
import { calculateComponentScore, calculateCompositeScore } from '../../utils/scoring/scoringEngine.js'
import { getRecommendations, getTierLabel, getTierEmoji } from '../../utils/recommendations/recommendationEngine.js'

export default function ProjectTab() {
  const { scodes, demographics, targetPfaDate } = useApp()
  const [scores, setScores] = useState(null)

  // Calculate scores from latest S-code
  useEffect(() => {
    if (!scodes || scodes.length === 0 || !demographics) {
      setScores(null)
      return
    }

    try {
      // Get latest S-code
      const latestSCode = scodes[scodes.length - 1]
      const assessment = decodeSCode(latestSCode)

      // EC-02: use age at target PFA date (handles bracket rollover before PFA)
      const projectionDate = targetPfaDate ? new Date(targetPfaDate) : assessment.date
      const ageBracket = getProjectionAgeBracket(demographics.dob, projectionDate)
      const gender = demographics.gender

      const components = []

      // Cardio
      if (assessment.cardio && !assessment.cardio.exempt && assessment.cardio.value) {
        const cardioScore = calculateComponentScore(
          { type: COMPONENTS.CARDIO, exercise: assessment.cardio.exercise, value: assessment.cardio.value, exempt: false },
          gender,
          ageBracket
        )
        components.push({ ...cardioScore, type: COMPONENTS.CARDIO, exercise: assessment.cardio.exercise })
      } else if (assessment.cardio?.exempt) {
        components.push({ type: COMPONENTS.CARDIO, exempt: true, tested: false, pass: true })
      }

      // Strength
      if (assessment.strength && !assessment.strength.exempt && assessment.strength.value) {
        const strengthScore = calculateComponentScore(
          { type: COMPONENTS.STRENGTH, exercise: assessment.strength.exercise, value: assessment.strength.value, exempt: false },
          gender,
          ageBracket
        )
        components.push({ ...strengthScore, type: COMPONENTS.STRENGTH, exercise: assessment.strength.exercise })
      } else if (assessment.strength?.exempt) {
        components.push({ type: COMPONENTS.STRENGTH, exempt: true, tested: false, pass: true })
      }

      // Core
      if (assessment.core && !assessment.core.exempt && assessment.core.value) {
        const coreScore = calculateComponentScore(
          { type: COMPONENTS.CORE, exercise: assessment.core.exercise, value: assessment.core.value, exempt: false },
          gender,
          ageBracket
        )
        components.push({ ...coreScore, type: COMPONENTS.CORE, exercise: assessment.core.exercise })
      } else if (assessment.core?.exempt) {
        components.push({ type: COMPONENTS.CORE, exempt: true, tested: false, pass: true })
      }

      // Body Comp
      if (assessment.bodyComp && !assessment.bodyComp.exempt && assessment.bodyComp.heightInches && assessment.bodyComp.waistInches) {
        const whtr = assessment.bodyComp.waistInches / assessment.bodyComp.heightInches
        const bodyCompScore = calculateComponentScore(
          { type: COMPONENTS.BODY_COMP, exercise: 'whtr', value: whtr, exempt: false },
          gender,
          ageBracket
        )
        components.push({ ...bodyCompScore, type: COMPONENTS.BODY_COMP, exercise: 'whtr' })
      } else if (assessment.bodyComp?.exempt) {
        components.push({ type: COMPONENTS.BODY_COMP, exempt: true, tested: false, pass: true })
      }

      const composite = calculateCompositeScore(components)
      setScores({ components, composite, assessmentDate: assessment.date })
    } catch (err) {
      console.error('Error calculating scores from S-code:', err)
      setScores(null)
    }
  }, [scodes, demographics])

  if (!demographics) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-2">Profile Required</h3>
        <p className="text-yellow-800">
          Please create your profile first in the Profile tab.
        </p>
      </div>
    )
  }

  if (!scodes || scodes.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-2">No Assessments Yet</h3>
        <p className="text-blue-800">
          Complete a self-check in the Self-Check tab to get personalized improvement recommendations!
        </p>
      </div>
    )
  }

  if (!scores) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Loading recommendations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Training Trajectory</h2>
        <p className="text-sm text-gray-600">
          Based on your assessment from {scores.assessmentDate.toLocaleDateString()}
        </p>
      </div>

      {/* Composite Score Summary */}
      {scores.composite && scores.composite.composite !== null && (
        <div className={`rounded-lg p-4 ${scores.composite.pass ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {scores.composite.composite.toFixed(1)} / 100
              </h3>
              <p className={`text-sm font-medium ${scores.composite.pass ? 'text-green-800' : 'text-red-800'}`}>
                {scores.composite.pass ? '✓ PASSING' : '✗ NEEDS IMPROVEMENT'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {scores.composite.totalEarned.toFixed(1)} / {scores.composite.totalPossible} pts
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Improvement Tips */}
      {scores.components.length > 0 && (
        <ImprovementTips components={scores.components} />
      )}
    </div>
  )
}

// Improvement Tips Component
function ImprovementTips({ components }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">💪 Personalized Training Plan</h3>

      {components.map((component, idx) => {
        if (!component.tested || component.exempt) return null

        const recommendations = getRecommendations(
          component.type,
          component.exercise,
          component.percentage,
          component.exempt
        )

        if (!recommendations) return null

        const tierLabel = getTierLabel(component.percentage)
        const tierEmoji = getTierEmoji(component.percentage)

        return (
          <div key={idx} className="mb-6 last:mb-0 pb-6 last:pb-0 border-b last:border-b-0 border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{tierEmoji}</span>
              <h4 className="font-bold text-gray-900 capitalize">{component.type}</h4>
              <span className={`text-xs px-2 py-1 rounded ${
                component.percentage < 75 ? 'bg-red-100 text-red-800' :
                component.percentage <= 80 ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {tierLabel}
              </span>
              <span className="text-sm text-gray-600 ml-auto">
                {component.points.toFixed(1)} / {component.maxPoints} pts ({component.percentage.toFixed(1)}%)
              </span>
            </div>
            <ul className="space-y-2">
              {recommendations.map((tip, i) => (
                <li key={i} className="text-sm text-gray-700 pl-4 border-l-2 border-blue-400">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
