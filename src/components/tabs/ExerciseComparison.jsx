/**
 * Exercise Comparison View - Task 8.4
 *
 * Shows side-by-side how a user's current performance translates
 * across all exercise alternatives within each component.
 * "If you did X push-ups, you'd need Y HRPU for the same score."
 */

import { useState } from 'react'
import { EXERCISES, COMPONENTS } from '../../utils/scoring/constants.js'
import { lookupScore } from '../../utils/scoring/scoringEngine.js'
import {
  COMPONENT_EXERCISES,
  EXERCISE_NAMES,
  findValueAtScorePct,
} from '../../utils/scoring/strategyEngine.js'
import { formatTime } from '../../utils/scoring/scoringEngine.js'

/**
 * Format a performance value for display given the exercise type.
 */
function formatValue(exercise, value) {
  if (value === null || value === undefined) return '-'
  switch (exercise) {
    case EXERCISES.RUN_2MILE:
      return formatTime(value)
    case EXERCISES.HAMR:
      return `${value} shuttles`
    case EXERCISES.PUSHUPS:
    case EXERCISES.HRPU:
      return `${value} reps`
    case EXERCISES.SITUPS:
    case EXERCISES.CLRC:
      return `${value} reps`
    case EXERCISES.PLANK:
      return formatTime(value)
    case EXERCISES.WHTR:
      return value.toFixed(2)
    default:
      return String(value)
  }
}

/**
 * Score bar - horizontal bar showing percentage of max points earned.
 */
function ScoreBar({ pct, pass }) {
  const clampedPct = Math.min(100, Math.max(0, pct))
  const color = pass ? 'bg-green-500' : 'bg-red-500'
  return (
    <div className="w-full bg-gray-200 rounded-full h-2" aria-hidden="true">
      <div
        className={`h-2 rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${clampedPct}%` }}
      />
    </div>
  )
}

/**
 * Single exercise row in the comparison table.
 */
function ExerciseRow({ exercise, value, points, maxPoints, pct, isCurrent, isEquivalent }) {
  const pass = pct >= 60 // cardio/strength/core all have 60% minimum

  return (
    <tr className={isCurrent ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}>
      <td className="py-2 px-3">
        <div className="flex items-center gap-1.5">
          {isCurrent && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shrink-0">
              YOURS
            </span>
          )}
          <span className={`text-sm ${isCurrent ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
            {EXERCISE_NAMES[exercise] || exercise}
          </span>
        </div>
      </td>
      <td className="py-2 px-3 text-sm text-right">
        <span className={isCurrent ? 'font-semibold text-blue-900' : 'text-gray-600'}>
          {isEquivalent && !isCurrent ? '~' : ''}{formatValue(exercise, value)}
        </span>
      </td>
      <td className="py-2 px-3 text-sm text-right">
        <span className={`font-medium ${pass ? 'text-green-700' : 'text-red-600'}`}>
          {points.toFixed(1)}/{maxPoints}
        </span>
      </td>
      <td className="py-2 px-3 w-24">
        <div className="flex items-center gap-1.5">
          <ScoreBar pct={pct} pass={pass} />
          <span className={`text-xs shrink-0 ${pass ? 'text-green-700' : 'text-red-600'}`}>
            {pct.toFixed(0)}%
          </span>
        </div>
      </td>
    </tr>
  )
}

/**
 * Comparison section for one component (e.g. Strength, Core, Cardio).
 */
function ComponentComparison({ componentType, currentExercise, currentValue, gender, ageBracket }) {
  const allExercises = COMPONENT_EXERCISES[componentType] || []
  if (allExercises.length <= 1) return null

  // Get the current score to determine score percentage
  const currentScoreResult = lookupScore(currentExercise, currentValue, gender, ageBracket)
  if (!currentScoreResult) return null

  const { points: currentPoints, maxPoints } = currentScoreResult
  const currentPct = (currentPoints / maxPoints) * 100

  // Build rows: current exercise + all alternatives at equivalent score level
  const rows = allExercises.map((exercise) => {
    if (exercise === currentExercise) {
      return {
        exercise,
        value: currentValue,
        points: currentPoints,
        maxPoints,
        pct: currentPct,
        isCurrent: true,
        isEquivalent: false,
      }
    }

    // Find what value on the alternative exercise achieves the same score percentage
    const equivalentValue = findValueAtScorePct(exercise, currentPoints / maxPoints, gender, ageBracket)
    if (equivalentValue === null) return null

    const altScoreResult = lookupScore(exercise, equivalentValue, gender, ageBracket)
    if (!altScoreResult) return null

    return {
      exercise,
      value: equivalentValue,
      points: altScoreResult.points,
      maxPoints: altScoreResult.maxPoints,
      pct: (altScoreResult.points / altScoreResult.maxPoints) * 100,
      isCurrent: false,
      isEquivalent: true,
    }
  }).filter(Boolean)

  const componentNames = {
    [COMPONENTS.CARDIO]: 'Cardio',
    [COMPONENTS.STRENGTH]: 'Strength',
    [COMPONENTS.CORE]: 'Core',
  }
  const title = componentNames[componentType] || componentType

  return (
    <div className="mb-4 last:mb-0">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left min-w-[320px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-1.5 px-3 text-xs font-medium text-gray-500">Exercise</th>
              <th className="py-1.5 px-3 text-xs font-medium text-gray-500 text-right">Performance</th>
              <th className="py-1.5 px-3 text-xs font-medium text-gray-500 text-right">Points</th>
              <th className="py-1.5 px-3 text-xs font-medium text-gray-500">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <ExerciseRow key={row.exercise} {...row} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-400 mt-1.5">
        ~ indicates equivalent performance on alternative exercises at the same score level
      </p>
    </div>
  )
}

/**
 * ExerciseComparison - top-level component rendered in SelfCheckTab results.
 *
 * Props:
 *   scores      - scores object from SelfCheckTab (components array + composite)
 *   demographics - { gender, dob } from app context
 *   ageBracket  - age bracket string
 */
export default function ExerciseComparison({ scores, ageBracket, gender }) {
  const [expanded, setExpanded] = useState(false)

  if (!scores || !scores.components || scores.components.length === 0) return null
  if (!gender || !ageBracket) return null

  // Only show comparison for tested, non-exempt, non-walk components with multiple exercise options
  const comparableComponents = scores.components.filter((c) => {
    if (!c.tested || c.exempt) return false
    if (c.walkOnly) return false
    if (c.points === null) return false
    const exercises = COMPONENT_EXERCISES[c.type] || []
    return exercises.length > 1
  })

  if (comparableComponents.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
        aria-expanded={expanded}
      >
        <div>
          <h3 className="text-base font-bold text-gray-900">Exercise Comparison</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            See how your score translates across exercise alternatives
          </p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {comparableComponents.map((c) => (
            <ComponentComparison
              key={c.type}
              componentType={c.type}
              currentExercise={c.exercise}
              currentValue={
                c.type === COMPONENTS.BODY_COMP
                  ? c.whtr
                  : c.exercise === EXERCISES.PLANK || c.exercise === EXERCISES.RUN_2MILE
                    ? c.value
                    : c.value
              }
              gender={gender}
              ageBracket={ageBracket}
            />
          ))}
        </div>
      )}
    </div>
  )
}
