/**
 * Project Tab - PFA readiness projection to target PFA date.
 * Task 4.2: Model selector, per-component gap bars, composite projection,
 * amber warning (PG-08), days remaining + required weekly improvement (PG-07).
 */

import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { decodeSCode } from '../../utils/codec/scode.js'
import { generateProjection, AMBER_MARGIN } from '../../utils/projection/projectionEngine.js'
import { COMPONENT_WEIGHTS, COMPONENT_MINIMUMS, EXERCISES, PASSING_COMPOSITE } from '../../utils/scoring/constants.js'
import { isDiagnosticPeriod, calculateAge, getAgeBracket } from '../../utils/scoring/constants.js'
import { calculateWHtR } from '../../utils/scoring/scoringEngine.js'
import { strategyEngine, EXERCISE_NAMES, IMPROVEMENT_UNIT_LABELS } from '../../utils/scoring/strategyEngine.js'
import { getRecommendations } from '../../utils/recommendations/recommendationEngine.js'
import { getExercisePrefs } from '../../utils/storage/localStorage.js'

// ─── Constants ─────────────────────────────────────────────────────────────────

const MODEL_OPTIONS = [
  { value: 'auto', label: 'Auto', description: 'Best model for your data count' },
  { value: 'linear', label: 'Linear', description: 'Available with 1+ self-checks' },
  { value: 'log', label: 'Logarithmic', description: 'Available with 2+ self-checks (diminishing returns)' },
  { value: 'trend', label: 'Historical Trend', description: '3+ self-checks required' },
]

const COMP_LABELS = {
  cardio:   'Cardio',
  strength: 'Strength',
  core:     'Core',
  bodyComp: 'Body Comp',
}

const COMP_ORDER = ['cardio', 'strength', 'core', 'bodyComp']


const CONFIDENCE_LABELS = {
  HIGH:   'Data Confidence: Mature',
  MEDIUM: 'Data Confidence: Established',
  LOW:    'Data Confidence: Emerging',
}

const CONFIDENCE_HINTS = {
  HIGH:   'Solid data behind this - keep logging check-ins to stay current.',
  MEDIUM: 'Keep logging self-checks to build toward a mature prediction model.',
  LOW:    'Based on a single check-in - log a few more to strengthen the forecast.',
}

// Format seconds as mm:ss
function fmtTime(seconds) {
  if (!seconds && seconds !== 0) return '-'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Format a projected raw value for display based on exercise type
function fmtValue(value, exercise) {
  if (value === null || value === undefined) return '-'
  switch (exercise) {
    case EXERCISES.RUN_2MILE:
    case EXERCISES.WALK_2KM:
      return fmtTime(value)
    case EXERCISES.WHTR:
      return value.toFixed(2)
    case EXERCISES.PLANK:
      return fmtTime(value)
    case EXERCISES.HAMR:
      return `${Math.round(value)} shuttles`
    default:
      return `${Math.round(value)} reps`
  }
}

// Return unit label for required weekly improvement
function improvementUnit(exercise) {
  switch (exercise) {
    case EXERCISES.RUN_2MILE:
    case EXERCISES.WALK_2KM:
      return 'sec/wk faster'
    case EXERCISES.PLANK:
      return 'sec/wk longer'
    case EXERCISES.WHTR:
      return 'ratio/wk lower'
    case EXERCISES.HAMR:
      return 'shuttles/wk'
    default:
      return 'reps/wk'
  }
}

// Friendly exercise name
function exerciseName(exercise) {
  const names = {
    [EXERCISES.RUN_2MILE]: '2-Mile Run',
    [EXERCISES.HAMR]:      'HAMR',
    [EXERCISES.WALK_2KM]:  '2km Walk',
    [EXERCISES.PUSHUPS]:   'Push-ups',
    [EXERCISES.HRPU]:      'HRPU',
    [EXERCISES.SITUPS]:    'Sit-ups',
    [EXERCISES.CLRC]:      'CLRC',
    [EXERCISES.PLANK]:     'Forearm Plank',
    [EXERCISES.WHTR]:      'Waist-to-Height Ratio',
  }
  return names[exercise] || exercise
}

// ─── Gap Bar ───────────────────────────────────────────────────────────────────

/**
 * Visual bar showing current %, projected %, and minimum threshold % on a 0-100% scale.
 */
function GapBar({ currentPct, projectedPct, minPct, pass }) {
  const clamp = v => Math.max(0, Math.min(100, v))
  const cur = clamp(currentPct)
  const proj = clamp(projectedPct)
  const min = clamp(minPct)

  const barColor = pass ? 'bg-green-500' : 'bg-red-400'
  const fillPct = clamp(Math.max(cur, proj)) // fill to the further of the two

  return (
    <div className="relative mt-2 mb-1">
      {/* Track */}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-visible relative">
        {/* Fill */}
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${fillPct}%` }}
        />

        {/* Minimum threshold line */}
        <div
          className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-gray-700 rounded"
          style={{ left: `${min}%` }}
          title={`Minimum: ${minPct.toFixed(0)}%`}
        />

        {/* Current marker */}
        {currentPct !== null && (
          <div
            className="absolute top-[-5px] w-2 h-5 bg-blue-500 rounded-sm border border-white"
            style={{ left: `calc(${cur}% - 4px)` }}
            title={`Current: ${currentPct.toFixed(1)}%`}
          />
        )}

        {/* Projected marker */}
        <div
          className="absolute top-[-5px] w-2 h-5 bg-white border-2 border-gray-800 rounded-sm"
          style={{ left: `calc(${proj}% - 4px)` }}
          title={`Projected: ${projectedPct.toFixed(1)}%`}
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-xs text-gray-400 mt-0.5 select-none">
        <span>0%</span>
        <span>{minPct.toFixed(0)}% min</span>
        <span>100%</span>
      </div>
    </div>
  )
}

// ─── Component Projection Card ─────────────────────────────────────────────────

function ComponentCard({ compType, proj, currentPct, daysToTarget, strategyItem, isTopPriority }) {
  if (!proj) return null

  const weight = COMPONENT_WEIGHTS[compType]
  const minPct = COMPONENT_MINIMUMS[compType]
  const label = COMP_LABELS[compType]

  if (proj.exempt) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-700">{label}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">Exempt</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Exempt components contribute 0 pts (0 possible).</p>
      </div>
    )
  }

  if (proj.cannotProject) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-700">{label}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">Cannot project</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">{proj.reason}</p>
      </div>
    )
  }

  const passColor = proj.pass ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
  const badgeColor = proj.pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'

  return (
    <div className={`rounded-lg border p-4 ${passColor}`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-semibold text-gray-900">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${badgeColor}`}>
          {proj.pass ? 'PASS' : 'FAIL'}
        </span>
      </div>

      {/* Projected score */}
      <div className="mt-2 flex items-baseline gap-3 flex-wrap">
        <span className="text-2xl font-bold text-gray-900">
          {proj.projected_points.toFixed(1)}
          <span className="text-sm font-normal text-gray-500"> / {weight} pts</span>
        </span>
        <span className="text-sm text-gray-600">
          ({proj.projected_percentage.toFixed(1)}%)
        </span>
        <span className="text-sm text-gray-500 ml-auto">
          {exerciseName(proj.exercise)}: {fmtValue(proj.projected_value, proj.exercise)}
        </span>
      </div>

      {/* Gap bar */}
      <GapBar
        currentPct={currentPct}
        projectedPct={proj.projected_percentage}
        minPct={minPct}
        pass={proj.pass}
      />

      {/* Gap label + required improvement */}
      <div className="mt-2 flex items-center justify-between gap-2 text-xs flex-wrap">
        <span className={proj.gap >= 0 ? 'text-green-700' : 'text-red-700'}>
          {proj.gap >= 0
            ? `+${proj.gap.toFixed(1)}% above minimum`
            : `${Math.abs(proj.gap).toFixed(1)}% below minimum`
          }
        </span>

        {/* PG-07: required weekly improvement */}
        {!proj.pass && proj.required_weekly_improvement > 0 && daysToTarget > 0 && (
          <span className="text-orange-700 font-medium">
            Need +{proj.required_weekly_improvement.toFixed(1)} {improvementUnit(proj.exercise)}/wk
          </span>
        )}
      </div>

      {/* Model used */}
      <div className="mt-1 text-xs text-gray-400">
        Model: {proj.model.replace('_', ' ')}
      </div>

      {/* Training Focus - inline strategy advice */}
      {strategyItem && strategyItem.status === 'improvable' && (
        <TrainingFocus item={strategyItem} isTopPriority={isTopPriority} compType={compType} proj={proj} />
      )}
    </div>
  )
}

// ─── Training Focus (inline in ComponentCard) ────────────────────────────────

function TrainingFocus({ item, isTopPriority, compType, proj }) {
  const [expanded, setExpanded] = useState(false)

  // Get recommendations for this component
  const tips = proj && !proj.exempt
    ? getRecommendations(compType, proj.exercise, proj.projected_percentage)
    : null

  return (
    <div className="mt-3 border-t border-gray-200 pt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors w-full text-left"
      >
        <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>&#9656;</span>
        Training Focus
        {isTopPriority && (
          <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold">
            TOP ROI
          </span>
        )}
        <span className="ml-auto text-gray-400 font-normal">
          {item.roi.toFixed(2)} pts/wk
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 text-xs">
          {/* ROI and next gain */}
          <div className="flex items-center gap-2 flex-wrap text-gray-600">
            <span>
              Next gain: {IMPROVEMENT_UNIT_LABELS[item.exercise]} = +{item.ptsGain.toFixed(1)} pts
              in ~{item.effortWeeks.toFixed(1)} wk
            </span>
          </div>

          {/* Training tips */}
          {tips && tips.length > 0 && (
            <div className="space-y-1">
              {tips.slice(0, 2).map((tip, i) => (
                <p key={i} className="text-gray-600 pl-2 border-l-2 border-blue-200">
                  {tip}
                </p>
              ))}
            </div>
          )}

          {/* Alternative exercise suggestion */}
          {item.alternatives && item.alternatives.length > 0 && (
            <div className="text-gray-500">
              {item.alternatives.filter(a => a.status === 'improvable' && a.roi > item.roi + 0.1).map(alt => (
                <p key={alt.exercise} className="text-amber-700">
                  Consider: {EXERCISE_NAMES[alt.exercise]} ({alt.roi.toFixed(2)} pts/wk ROI)
                </p>
              ))}
            </div>
          )}

          {item.preferenceNote && (
            <p className="text-amber-700 italic">
              {item.preferenceNote.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Tab ──────────────────────────────────────────────────────────────────

export default function ProjectTab() {
  const { scodes, demographics, targetPfaDate, updateTargetPfaDate } = useApp()
  const [selectedModel, setSelectedModel] = useState('auto')
  const [targetDateInput, setTargetDateInput] = useState('')
  const [targetDateError, setTargetDateError] = useState('')

  // Sync local input with context value on mount / context change
  useEffect(() => {
    if (targetPfaDate && !targetDateInput) {
      setTargetDateInput(targetPfaDate)
    }
  }, [targetPfaDate])

  // Decode all S-codes (memoized - only re-runs when scodes changes)
  const decodedScodes = useMemo(() => {
    if (!scodes || scodes.length === 0) return []
    return scodes.flatMap(code => {
      try {
        const dec = decodeSCode(code)
        return [{ ...dec, date: dec.date instanceof Date ? dec.date.toISOString().split('T')[0] : dec.date }]
      } catch {
        return []
      }
    }).sort((a, b) => (a.date > b.date ? 1 : -1))
  }, [scodes])

  // Count non-outlier S-codes for model availability
  const nonOutlierCount = decodedScodes.filter(s => !s.outlier).length

  // Run projection engine
  const projection = useMemo(() => {
    if (!decodedScodes.length || !demographics || !targetPfaDate) return null
    const modelOverride = selectedModel === 'auto' ? null : selectedModel
    try {
      return generateProjection(decodedScodes, demographics, targetPfaDate, { modelOverride })
    } catch {
      return null
    }
  }, [decodedScodes, demographics, targetPfaDate, selectedModel])

  // Current component percentages from most recent S-code (for gap bar "current" marker)
  const currentPcts = useMemo(() => {
    return {}
  }, [])

  // Strategy engine analysis from most recent S-code
  const strategyData = useMemo(() => {
    if (!demographics || decodedScodes.length === 0) return null
    const latest = decodedScodes[decodedScodes.length - 1]
    const refDate = targetPfaDate || new Date().toISOString().split('T')[0]
    const age = calculateAge(demographics.dob, refDate)
    const ageBracket = getAgeBracket(age)
    const prefs = getExercisePrefs()

    // Map decoded S-code to strategy engine input format
    const inputs = {}
    if (latest.cardio) {
      if (latest.cardio.exempt) {
        inputs.cardio = { exempt: true }
      } else if (latest.cardio.exercise === '2km_walk') {
        inputs.cardio = { isWalk: true }
      } else {
        inputs.cardio = { exercise: latest.cardio.exercise, value: latest.cardio.value, exempt: false }
      }
    }
    if (latest.strength) {
      inputs.strength = latest.strength.exempt
        ? { exempt: true }
        : { exercise: latest.strength.exercise, value: latest.strength.value, exempt: false }
    }
    if (latest.core) {
      inputs.core = latest.core.exempt
        ? { exempt: true }
        : { exercise: latest.core.exercise, value: latest.core.value, exempt: false }
    }
    if (latest.bodyComp) {
      if (latest.bodyComp.exempt) {
        inputs.bodyComp = { exempt: true }
      } else if (latest.bodyComp.heightInches && latest.bodyComp.waistInches) {
        const whtr = calculateWHtR(latest.bodyComp.waistInches, latest.bodyComp.heightInches)
        inputs.bodyComp = { exercise: EXERCISES.WHTR, value: whtr, exempt: false }
      }
    }

    try {
      return strategyEngine({ gender: demographics.gender, ageBracket }, inputs, prefs)
    } catch {
      return null
    }
  }, [demographics, decodedScodes, targetPfaDate])

  // Days to target from today
  const today = new Date().toISOString().split('T')[0]
  const daysToTarget = targetPfaDate
    ? Math.max(0, Math.round((new Date(targetPfaDate) - new Date(today)) / 86400000))
    : null

  // ── IV-02 / IV-03: target date validation ────────────────────────────────────
  const validateAndSaveTargetDate = (value) => {
    setTargetDateInput(value)
    if (!value) {
      setTargetDateError('')
      updateTargetPfaDate(null)
      return
    }

    const target = new Date(value + 'T00:00:00')
    const todayDate = new Date(today + 'T00:00:00')

    // IV-02: must be after most recent self-check date
    if (decodedScodes.length > 0) {
      const latestDate = decodedScodes[decodedScodes.length - 1].date
      const latestDateObj = new Date(latestDate + 'T00:00:00')
      if (target <= latestDateObj) {
        setTargetDateError(`Must be after your most recent self-check (${latestDate}).`)
        return
      }
    }

    // IV-03: must be within 365 days
    const maxDate = new Date(todayDate)
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    if (target > maxDate) {
      setTargetDateError('Target date must be within 1 year (beyond 1 year is unreliable).')
      return
    }

    setTargetDateError('')
    updateTargetPfaDate(value)
  }

  // ── Blocked states ────────────────────────────────────────────────────────────

  if (!demographics) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-2">Profile Required</h3>
        <p className="text-yellow-800">Create your profile in the Profile tab first.</p>
      </div>
    )
  }

  // GR-05: blocked until 1+ S-codes
  if (!scodes || scodes.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-2">No Self-Checks Yet</h3>
        <p className="text-blue-800">
          Complete at least one self-check to enable readiness projection.
        </p>
      </div>
    )
  }

  const composite = projection?.composite ?? null

  return (
    <div className="space-y-4">

      {/* ── Target PFA Date ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Target PFA Date
        </label>
        <input
          type="date"
          value={targetDateInput}
          min={today}
          max={(() => { const d = new Date(today); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0] })()}
          onChange={e => validateAndSaveTargetDate(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-xs"
        />
        {targetDateError && (
          <p className="text-xs text-red-600 mt-1">{targetDateError}</p>
        )}
        {daysToTarget !== null && !targetDateError && (
          <p className="text-xs text-gray-500 mt-1">{daysToTarget} days remaining</p>
        )}
      </div>

      {/* ── No target date placeholder ────────────────────────────────────── */}
      {!targetPfaDate && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
          Set a target PFA date above to see your readiness projection.
        </div>
      )}

      {targetPfaDate && (
        <>
          {/* ── Model selector ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Projection Model</p>
            <div className="flex gap-2 flex-wrap">
              {MODEL_OPTIONS.map(opt => {
                const disabled = opt.value === 'trend' && nonOutlierCount < 3
                const active = selectedModel === opt.value
                return (
                  <button
                    key={opt.value}
                    disabled={disabled}
                    onClick={() => setSelectedModel(opt.value)}
                    title={opt.description}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                      ${disabled ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' :
                        active   ? 'border-blue-600 bg-blue-600 text-white' :
                                   'border-gray-300 text-gray-700 hover:border-blue-400'}`}
                  >
                    {opt.label}
                    {opt.value === 'trend' && nonOutlierCount < 3 && (
                      <span className="ml-1 opacity-70">(need {3 - nonOutlierCount} more)</span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {nonOutlierCount} non-outlier self-check{nonOutlierCount !== 1 ? 's' : ''} available for projection.
            </p>
          </div>

          {/* ── Diagnostic period warning ──────────────────────────────────── */}
          {isDiagnosticPeriod(targetPfaDate) && (
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 text-sm text-blue-800">
              <strong>DIAGNOSTIC PERIOD</strong> - target date is within the Mar-Jun 2026 diagnostic
              period. Scored PFAs begin Jul 1, 2026.
            </div>
          )}

          {/* ── PG-08: Amber warning ───────────────────────────────────────── */}
          {composite && !composite.pass && composite.amberWarning && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-amber-600 font-bold text-lg">!</span>
                <div>
                  <p className="font-semibold text-amber-900">Marginal Projection</p>
                  <p className="text-sm text-amber-800">
                    Projected composite ({composite.projected.toFixed(1)}) is within {AMBER_MARGIN} points of
                    the {PASSING_COMPOSITE} passing threshold. Small improvements could push you over.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Composite score card ───────────────────────────────────────── */}
          {composite ? (
            <div className={`rounded-lg p-4 ${
              composite.pass
                ? 'bg-green-50 border-2 border-green-500'
                : 'bg-red-50 border-2 border-red-400'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Projected Composite</p>
                  <p className="text-3xl font-bold text-gray-900">{composite.projected.toFixed(1)}</p>
                  <p className={`text-sm font-semibold ${composite.pass ? 'text-green-700' : 'text-red-700'}`}>
                    {composite.pass ? 'ON TRACK TO PASS' : 'ON TRACK TO FAIL'}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p className="text-sm text-gray-600">
                    {CONFIDENCE_LABELS[composite.confidence] || composite.confidence}
                  </p>
                  {CONFIDENCE_HINTS[composite.confidence] && (
                    <p className="text-xs text-gray-500 mt-1">{CONFIDENCE_HINTS[composite.confidence]}</p>
                  )}
                </div>
              </div>
              {strategyData?.topPriority && (
                <div className="mt-3 pt-3 border-t border-gray-200/50">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Best focus:</span>{' '}
                    {COMP_LABELS[strategyData.topPriority.component]} ({EXERCISE_NAMES[strategyData.topPriority.exercise]})
                    - +{strategyData.topPriority.ptsGain.toFixed(1)} pts in ~{strategyData.topPriority.effortWeeks.toFixed(1)} wk
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500 text-center">
              {projection
                ? 'Not enough component data for a composite projection.'
                : 'Calculating projection...'}
            </div>
          )}

          {/* ── Per-component cards ────────────────────────────────────────── */}
          {projection && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 px-1">Component Projections</h3>
              {COMP_ORDER.map(compType => {
                const strategyItem = strategyData?.ranked?.find(r => r.component === compType) ?? null
                const isTopPriority = strategyData?.topPriority?.component === compType
                return (
                  <ComponentCard
                    key={compType}
                    compType={compType}
                    proj={projection.components[compType] ?? null}
                    currentPct={currentPcts[compType] ?? null}
                    daysToTarget={daysToTarget}
                    strategyItem={strategyItem}
                    isTopPriority={isTopPriority}
                  />
                )
              })}
            </div>
          )}

          {/* ── Legend ────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-lg border border-gray-100 p-3 text-xs text-gray-400 space-y-1">
            <p className="font-medium text-gray-500">Legend</p>
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-4 bg-blue-500 rounded-sm" />
                Current
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-4 border-2 border-gray-800 bg-white rounded-sm" />
                Projected
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-0.5 h-4 bg-gray-700" />
                Minimum threshold
              </span>
            </div>
            <p className="italic">Log more self-checks to refine your projected score.</p>
          </div>
        </>
      )}
    </div>
  )
}
