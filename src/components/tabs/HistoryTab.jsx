/**
 * History Tab - S-code management and assessment timeline
 * Paste S-codes, view decoded assessments, delete entries
 */

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { decodeSCode, isValidSCode } from '../../utils/codec/scode.js'
import { EXERCISES, COMPONENTS, calculateAge, getAgeBracket } from '../../utils/scoring/constants.js'
import { calculateComponentScore, calculateCompositeScore, calculateWHtR, formatTime } from '../../utils/scoring/scoringEngine.js'

const EXERCISE_LABELS = {
  [EXERCISES.RUN_2MILE]: '2-Mile Run',
  [EXERCISES.HAMR]: 'HAMR Shuttle',
  [EXERCISES.WALK_2KM]: '2km Walk',
  [EXERCISES.PUSHUPS]: 'Push-ups',
  [EXERCISES.HRPU]: 'HRPU',
  [EXERCISES.SITUPS]: 'Sit-ups',
  [EXERCISES.CLRC]: 'Reverse Crunches',
  [EXERCISES.PLANK]: 'Forearm Plank',
  [EXERCISES.WHTR]: 'WHtR',
}

export default function HistoryTab() {
  const { scodes, addSCode, removeSCode, demographics } = useApp()
  const [pasteValue, setPasteValue] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [pasteSuccess, setPasteSuccess] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Decode all S-codes and score them
  const decodedEntries = useMemo(() => {
    return scodes.map(code => {
      try {
        const decoded = decodeSCode(code)
        let scores = null

        if (demographics) {
          const age = calculateAge(demographics.dob, decoded.date)
          const ageBracket = getAgeBracket(age)
          const gender = demographics.gender
          const components = []

          if (decoded.cardio && !decoded.cardio.exempt && decoded.cardio.value != null) {
            const result = calculateComponentScore(
              { type: COMPONENTS.CARDIO, exercise: decoded.cardio.exercise, value: decoded.cardio.value, exempt: false },
              gender, ageBracket
            )
            components.push({ ...result, type: COMPONENTS.CARDIO, exercise: decoded.cardio.exercise })
          } else if (decoded.cardio?.exempt) {
            components.push({ type: COMPONENTS.CARDIO, exempt: true, tested: false, pass: true })
          }

          if (decoded.strength && !decoded.strength.exempt && decoded.strength.value != null) {
            const result = calculateComponentScore(
              { type: COMPONENTS.STRENGTH, exercise: decoded.strength.exercise, value: decoded.strength.value, exempt: false },
              gender, ageBracket
            )
            components.push({ ...result, type: COMPONENTS.STRENGTH, exercise: decoded.strength.exercise })
          } else if (decoded.strength?.exempt) {
            components.push({ type: COMPONENTS.STRENGTH, exempt: true, tested: false, pass: true })
          }

          if (decoded.core && !decoded.core.exempt && decoded.core.value != null) {
            const result = calculateComponentScore(
              { type: COMPONENTS.CORE, exercise: decoded.core.exercise, value: decoded.core.value, exempt: false },
              gender, ageBracket
            )
            components.push({ ...result, type: COMPONENTS.CORE, exercise: decoded.core.exercise })
          } else if (decoded.core?.exempt) {
            components.push({ type: COMPONENTS.CORE, exempt: true, tested: false, pass: true })
          }

          if (decoded.bodyComp && !decoded.bodyComp.exempt && decoded.bodyComp.heightInches && decoded.bodyComp.waistInches) {
            const whtr = calculateWHtR(decoded.bodyComp.waistInches, decoded.bodyComp.heightInches)
            const result = calculateComponentScore(
              { type: COMPONENTS.BODY_COMP, exercise: EXERCISES.WHTR, value: whtr, exempt: false },
              gender, ageBracket
            )
            components.push({ ...result, type: COMPONENTS.BODY_COMP, exercise: EXERCISES.WHTR })
          } else if (decoded.bodyComp?.exempt) {
            components.push({ type: COMPONENTS.BODY_COMP, exempt: true, tested: false, pass: true })
          }

          const composite = calculateCompositeScore(components)
          scores = { components, composite }
        }

        return { code, decoded, scores, error: null }
      } catch (err) {
        return { code, decoded: null, scores: null, error: err.message }
      }
    }).reverse()
  }, [scodes, demographics])

  const handlePaste = () => {
    setPasteError('')
    setPasteSuccess('')
    const trimmed = pasteValue.trim().replace(/\s+/g, '')

    if (!trimmed) {
      setPasteError('Please enter an S-code.')
      return
    }

    // CS-08: D-code in S-code field
    if (trimmed.startsWith('D')) {
      setPasteError('This is a D-code. Paste it in the Profile tab instead.')
      return
    }

    if (!trimmed.startsWith('S')) {
      setPasteError('Invalid code format. S-codes start with "S".')
      return
    }

    if (scodes.includes(trimmed)) {
      setPasteError('This S-code is already in your history.')
      return
    }

    if (!isValidSCode(trimmed)) {
      setPasteError('Invalid S-code. Check for typos or truncation.')
      return
    }

    addSCode(trimmed)
    setPasteValue('')
    setPasteSuccess('S-code added to history.')
    setTimeout(() => setPasteSuccess(''), 3000)
  }

  const handleDelete = (code) => {
    removeSCode(code)
    setConfirmDelete(null)
  }

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Silently fail on clipboard errors
    }
  }

  return (
    <div className="space-y-6">
      {/* Paste S-Code */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment History</h2>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Add S-Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePaste()}
              placeholder="S3-..."
              className={`flex-1 px-4 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${pasteError ? 'border-red-400' : 'border-gray-300'}`}
            />
            <button
              onClick={handlePaste}
              disabled={!pasteValue.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Add
            </button>
          </div>
          {pasteError && (
            <p className="text-xs text-red-600">{pasteError}</p>
          )}
          {pasteSuccess && (
            <p className="text-xs text-green-600">{pasteSuccess}</p>
          )}
          <p className="text-xs text-gray-500">
            Paste an S-code from a previous session or shared by another device.
          </p>
        </div>
      </div>

      {/* No demographics warning */}
      {!demographics && scodes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900">
            Set up your profile (DOB + gender) in the Profile tab to see scored results.
          </p>
        </div>
      )}

      {/* Assessment count */}
      {scodes.length > 0 && (
        <p className="text-sm text-gray-600">
          {scodes.length} assessment{scodes.length !== 1 ? 's' : ''} recorded
        </p>
      )}

      {/* Assessment timeline */}
      {decodedEntries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">
            No assessments yet. Complete a self-check or paste an S-code above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {decodedEntries.map((entry) => (
            <AssessmentCard
              key={entry.code}
              entry={entry}
              isConfirmingDelete={confirmDelete === entry.code}
              onRequestDelete={() => setConfirmDelete(entry.code)}
              onConfirmDelete={() => handleDelete(entry.code)}
              onCancelDelete={() => setConfirmDelete(null)}
              onCopy={() => copyCode(entry.code)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AssessmentCard({ entry, isConfirmingDelete, onRequestDelete, onConfirmDelete, onCancelDelete, onCopy }) {
  const { code, decoded, scores, error } = entry
  const [expanded, setExpanded] = useState(false)

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-400">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-700 font-medium">Decode Error</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
          <p className="font-mono text-xs text-gray-500 truncate max-w-32">{code}</p>
        </div>
      </div>
    )
  }

  const dateStr = decoded.date instanceof Date
    ? decoded.date.toLocaleDateString()
    : new Date(decoded.date).toLocaleDateString()
  const isDiag = decoded.isDiagnostic
  const composite = scores?.composite
  const hasComposite = composite && composite.composite != null

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
      hasComposite
        ? (composite.pass ? 'border-green-500' : 'border-red-500')
        : 'border-gray-300'
    }`}>
      {/* Header row - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">{dateStr}</p>
            {isDiag && (
              <span className="text-xs text-blue-600">Diagnostic Period</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasComposite && (
              <div className="text-right">
                <p className={`text-lg font-bold ${composite.pass ? 'text-green-600' : 'text-red-600'}`}>
                  {composite.composite.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">
                  {composite.pass ? 'PASS' : 'FAIL'}
                </p>
              </div>
            )}
            {!hasComposite && scores && (
              <p className="text-xs text-gray-500">Partial</p>
            )}
            <span className="text-gray-400 text-sm">{expanded ? '\u25B2' : '\u25BC'}</span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {/* Component scores */}
          {scores && scores.components.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {scores.components.map((comp, i) => (
                <ComponentBadge key={i} component={comp} />
              ))}
            </div>
          )}

          {/* Raw values */}
          <div className="text-xs text-gray-600 space-y-1">
            {decoded.cardio && !decoded.cardio.exempt && decoded.cardio.value != null && (
              <p>
                {EXERCISE_LABELS[decoded.cardio.exercise] || decoded.cardio.exercise}:{' '}
                {decoded.cardio.exercise === EXERCISES.RUN_2MILE || decoded.cardio.exercise === EXERCISES.WALK_2KM
                  ? formatTime(decoded.cardio.value)
                  : `${decoded.cardio.value} shuttles`}
              </p>
            )}
            {decoded.strength && !decoded.strength.exempt && decoded.strength.value != null && (
              <p>{EXERCISE_LABELS[decoded.strength.exercise]}: {decoded.strength.value} reps</p>
            )}
            {decoded.core && !decoded.core.exempt && decoded.core.value != null && (
              <p>
                {EXERCISE_LABELS[decoded.core.exercise]}:{' '}
                {decoded.core.exercise === EXERCISES.PLANK
                  ? formatTime(decoded.core.value)
                  : `${decoded.core.value} reps`}
              </p>
            )}
            {decoded.bodyComp && !decoded.bodyComp.exempt && decoded.bodyComp.heightInches && (
              <p>
                WHtR: {(decoded.bodyComp.waistInches / decoded.bodyComp.heightInches).toFixed(2)}
                {' '}({decoded.bodyComp.waistInches}&quot; / {decoded.bodyComp.heightInches}&quot;)
              </p>
            )}
          </div>

          {/* S-code display */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <p className="font-mono text-xs text-gray-500 flex-1 break-all">{code}</p>
            <button
              onClick={(e) => { e.stopPropagation(); onCopy() }}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              Copy
            </button>
          </div>

          {/* Delete */}
          <div className="pt-2">
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2">
                <p className="text-xs text-red-600 flex-1">Remove this assessment?</p>
                <button
                  onClick={(e) => { e.stopPropagation(); onConfirmDelete() }}
                  className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onCancelDelete() }}
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onRequestDelete() }}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Remove from history
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ComponentBadge({ component }) {
  if (component.exempt) {
    return (
      <div className="bg-gray-50 rounded p-2">
        <p className="text-xs text-gray-500 capitalize">{component.type}</p>
        <p className="text-sm text-gray-600">Exempt</p>
      </div>
    )
  }

  if (!component.tested) return null

  return (
    <div className={`rounded p-2 ${component.pass ? 'bg-green-50' : 'bg-red-50'}`}>
      <p className="text-xs text-gray-600 capitalize">{component.type}</p>
      <p className={`text-sm font-bold ${component.pass ? 'text-green-700' : 'text-red-700'}`}>
        {component.points.toFixed(1)} / {component.maxPoints}
      </p>
      <p className="text-xs text-gray-500">{component.percentage.toFixed(0)}%</p>
    </div>
  )
}
