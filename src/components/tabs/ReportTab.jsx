/**
 * Report Tab - Supervisor report generation
 * Design refs: §10 Tab 5 (Report), §5.6 RP-01 through RP-08
 *
 * RP-01: Rank/name/unit at render time only. Never stored, never encoded.
 * UX-07: Tab blocked until 1+ self-checks scored.
 * RP-02: Report includes D-code and S-code(s) used.
 * RP-03: Watermark "UNOFFICIAL SELF-CHECK" on every page.
 * RP-04: Scoring chart version displayed.
 * RP-05: Diagnostic period flagged.
 * RP-06: Clipboard (plain text) + print-optimized HTML (window.print()).
 * RP-07: Footer "Prepared by member for supervisory awareness."
 * RP-08: Projection section optional toggle.
 * EC-03: All exempt = exemption-status-only report.
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { decodeSCode } from '../../utils/codec/scode.js'
import { calculateComponentScore, calculateCompositeScore, calculateWHtR, formatTime } from '../../utils/scoring/scoringEngine.js'
import {
  EXERCISES,
  COMPONENTS,
  COMPONENT_WEIGHTS,
  CHART_VERSION,
  calculateAge,
  getAgeBracket,
} from '../../utils/scoring/constants.js'
import { generateProjection } from '../../utils/projection/projectionEngine.js'

const EXERCISE_LABELS = {
  [EXERCISES.RUN_2MILE]: '2-Mile Run',
  [EXERCISES.HAMR]: 'HAMR Shuttle',
  [EXERCISES.WALK_2KM]: '2km Walk',
  [EXERCISES.PUSHUPS]: 'Push-ups',
  [EXERCISES.HRPU]: 'Hand-Release Push-ups',
  [EXERCISES.SITUPS]: 'Sit-ups',
  [EXERCISES.CLRC]: 'Reverse Crunches',
  [EXERCISES.PLANK]: 'Forearm Plank',
  [EXERCISES.WHTR]: 'Waist-to-Height Ratio',
}

const COMPONENT_LABELS = {
  [COMPONENTS.CARDIO]: 'Cardio',
  [COMPONENTS.STRENGTH]: 'Strength',
  [COMPONENTS.CORE]: 'Core',
  [COMPONENTS.BODY_COMP]: 'Body Comp (WHtR)',
}

const COMP_ORDER = [COMPONENTS.CARDIO, COMPONENTS.STRENGTH, COMPONENTS.CORE, COMPONENTS.BODY_COMP]

/** Decode an S-code and compute scores given demographics */
function decodeAndScore(code, demographics) {
  try {
    const decoded = decodeSCode(code)
    if (!demographics) return { code, decoded, scores: null, error: null }

    const age = calculateAge(demographics.dob, decoded.date)
    const ageBracket = getAgeBracket(age)
    const gender = demographics.gender
    const components = []

    if (decoded.cardio && !decoded.cardio.exempt && decoded.cardio.value != null) {
      const result = calculateComponentScore(
        { type: COMPONENTS.CARDIO, exercise: decoded.cardio.exercise, value: decoded.cardio.value, exempt: false, walkPass: decoded.cardio.walkPass },
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
      components.push({ ...result, type: COMPONENTS.BODY_COMP, exercise: EXERCISES.WHTR, whtr })
    } else if (decoded.bodyComp?.exempt) {
      components.push({ type: COMPONENTS.BODY_COMP, exempt: true, tested: false, pass: true })
    }

    const composite = calculateCompositeScore(components)
    return { code, decoded, scores: { components, composite }, error: null }
  } catch (err) {
    return { code, decoded: null, scores: null, error: err.message }
  }
}

/** Format a date for display */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Format exercise value for display */
function formatValue(value, exercise) {
  if (value == null) return '-'
  switch (exercise) {
    case EXERCISES.RUN_2MILE:
    case EXERCISES.WALK_2KM:
    case EXERCISES.PLANK:
      return formatTime(value)
    case EXERCISES.WHTR:
      return value.toFixed(2)
    case EXERCISES.HAMR:
      return `${value} shuttles`
    default:
      return `${value} reps`
  }
}

/** Format projected value for report text */
function formatProjectedValue(value, exercise) {
  if (value == null) return '-'
  switch (exercise) {
    case EXERCISES.RUN_2MILE:
    case EXERCISES.WALK_2KM:
    case EXERCISES.PLANK: {
      const m = Math.floor(value / 60)
      const s = Math.round(value % 60)
      return `${m}:${s.toString().padStart(2, '0')}`
    }
    case EXERCISES.WHTR:
      return value.toFixed(2)
    case EXERCISES.HAMR:
      return `${Math.round(value)} shuttles`
    default:
      return `${Math.round(value)} reps`
  }
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ReportTab() {
  const { scodes, demographics, dcode, targetPfaDate } = useApp()

  // RP-01: PII fields - never stored, cleared when component unmounts
  const [rank, setRank] = useState('')
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')

  // RP-08: Projection toggle
  const [includeProjection, setIncludeProjection] = useState(false)

  // S-code selection: which self-checks to include in the report
  const [selectedCodes, setSelectedCodes] = useState(() => new Set())

  const [copySuccess, setCopySuccess] = useState(false)

  // Decode all S-codes and compute scores
  const allEntries = useMemo(() => {
    return scodes
      .map(code => decodeAndScore(code, demographics))
      .reverse() // newest first
  }, [scodes, demographics])

  // UX-07: Only entries with a composite score (fully assessed, 4 components)
  const scoredEntries = useMemo(() => {
    return allEntries.filter(e => !e.error && e.scores?.composite?.composite != null)
  }, [allEntries])

  // Initialize selectedCodes when scored entries change (default: all selected).
  // useEffect (not useMemo) because this is a side effect, not a derived value.
  // Functional update avoids stale closure on selectedCodes.
  useEffect(() => {
    setSelectedCodes(prev => {
      if (prev.size === 0 && scoredEntries.length > 0) {
        return new Set(scoredEntries.map(e => e.code))
      }
      return prev
    })
  }, [scoredEntries])

  // Entries to show in the report (selected + scored)
  const reportEntries = useMemo(() => {
    return scoredEntries.filter(e => selectedCodes.has(e.code))
  }, [scoredEntries, selectedCodes])

  // EC-03: check if all components are exempt in selected entries
  const allExempt = useMemo(() => {
    if (reportEntries.length === 0) return false
    return reportEntries.every(e => {
      const comps = e.scores?.components ?? []
      return comps.length > 0 && comps.every(c => c.exempt)
    })
  }, [reportEntries])

  // RP-08: Projection data (only if demographics + target date available)
  const projectionData = useMemo(() => {
    if (!includeProjection || !demographics || !targetPfaDate || scodes.length === 0) return null
    try {
      const decoded = scodes.map(code => {
        try { return decodeSCode(code) } catch { return null }
      }).filter(Boolean)
      return generateProjection(decoded, demographics, targetPfaDate)
    } catch {
      return null
    }
  }, [includeProjection, demographics, targetPfaDate, scodes])

  const toggleCode = useCallback((code) => {
    setSelectedCodes(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }, [])

  // UX-07: Block if no scored self-checks
  if (scoredEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Supervisor Report</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            Complete at least one full self-check (all 4 components scored) to generate a report.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Setup form */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supervisor Report</h2>
          <p className="text-xs text-gray-500 mt-1">
            Rank, name, and unit are not saved or encoded. They exist only in this session.
          </p>
        </div>

        {/* RP-01: Member info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
            <input
              type="text"
              value={rank}
              onChange={e => setRank(e.target.value)}
              placeholder="e.g. SSgt"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Last, First MI"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <input
              type="text"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="e.g. 1 SFS / SFOL"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* S-code selector */}
        {scoredEntries.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Self-Checks to Include
            </label>
            <div className="space-y-2">
              {scoredEntries.map(e => {
                const dateStr = formatDate(e.decoded.date)
                const composite = e.scores.composite.composite
                const pass = e.scores.composite.pass
                const isDiag = e.decoded.isDiagnostic
                return (
                  <label key={e.code} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCodes.has(e.code)}
                      onChange={() => toggleCode(e.code)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-2 flex-wrap">
                      {dateStr}
                      {isDiag && (
                        <span className="px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                          DIAGNOSTIC
                        </span>
                      )}
                      <span className={`font-mono font-medium ${pass ? 'text-green-700' : 'text-red-700'}`}>
                        {composite.toFixed(1)} {pass ? 'PASS' : 'FAIL'}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* RP-08: Projection toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Include Readiness Projection</p>
            <p className="text-xs text-gray-500">
              {!demographics || !targetPfaDate
                ? 'Requires profile and target PFA date to be set.'
                : `Projection to ${new Date(targetPfaDate).toLocaleDateString()}`}
            </p>
          </div>
          <button
            onClick={() => setIncludeProjection(v => !v)}
            disabled={!demographics || !targetPfaDate}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
              includeProjection ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            aria-label="Toggle projection section"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              includeProjection ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Report preview */}
      {reportEntries.length > 0 && (
        <ReportPreview
          rank={rank}
          name={name}
          unit={unit}
          dcode={dcode}
          reportEntries={reportEntries}
          allExempt={allExempt}
          includeProjection={includeProjection}
          projectionData={projectionData}
          targetPfaDate={targetPfaDate}
          copySuccess={copySuccess}
          onCopy={() => handleCopy({ rank, name, unit, dcode, reportEntries, allExempt, includeProjection, projectionData, targetPfaDate, setCopySuccess })}
          onPrint={() => handlePrint({ rank, name, unit, dcode, reportEntries, allExempt, includeProjection, projectionData, targetPfaDate })}
        />
      )}

      {reportEntries.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-500">Select at least one self-check above to preview the report.</p>
        </div>
      )}
    </div>
  )
}

// ─── Report Preview ────────────────────────────────────────────────────────────

function ReportPreview({ rank, name, unit, dcode, reportEntries, allExempt, includeProjection, projectionData, targetPfaDate, copySuccess, onCopy, onPrint }) {
  const memberLine = [rank, name].filter(Boolean).join(' ') || '(Not specified)'
  const unitLine = unit || '(Not specified)'

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Preview header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Report Preview</p>
        <div className="flex gap-2">
          <button
            onClick={onCopy}
            aria-label={copySuccess ? 'Report text copied' : 'Copy report text to clipboard'}
            className="px-3 py-2 min-h-[44px] text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            {copySuccess ? 'Copied!' : 'Copy Text'}
          </button>
          <button
            onClick={onPrint}
            aria-label="Print report"
            className="px-3 py-2 min-h-[44px] text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Print
          </button>
        </div>
      </div>

      {/* Report body */}
      <div className="p-6 font-mono text-sm space-y-6">
        {/* RP-03: Watermark */}
        <div className="text-center border-2 border-gray-400 rounded py-3">
          <p className="text-lg font-bold tracking-widest text-gray-700">UNOFFICIAL SELF-CHECK</p>
          <p className="text-xs text-gray-500 mt-0.5">Not an official PFA score. For supervisory awareness only.</p>
        </div>

        {/* Member info */}
        <section className="space-y-1">
          <p className="font-semibold text-gray-900 font-sans">Member Information</p>
          <div className="pl-2 border-l-2 border-gray-200 space-y-0.5 text-gray-700">
            <p>Member: {memberLine}</p>
            <p>Unit: {unitLine}</p>
            {dcode && <p>Profile Code: {dcode}</p>}
          </div>
        </section>

        {/* EC-03: All exempt - simplified report */}
        {allExempt ? (
          <section className="bg-gray-50 rounded p-4">
            <p className="font-semibold text-gray-900 font-sans mb-1">Exemption Status</p>
            <p className="text-gray-700">All components exempt. No composite score possible.</p>
            <p className="text-xs text-gray-500 mt-2">Member holds exemption(s) via AF Form 469 for all components.</p>
          </section>
        ) : (
          /* Per S-code assessment sections */
          <section className="space-y-6">
            <p className="font-semibold text-gray-900 font-sans">Self-Check Results</p>
            {reportEntries.map((entry, idx) => (
              <AssessmentSection key={entry.code} entry={entry} index={idx} total={reportEntries.length} />
            ))}
          </section>
        )}

        {/* RP-08: Projection section */}
        {includeProjection && projectionData && targetPfaDate && (
          <ProjectionSection projectionData={projectionData} targetPfaDate={targetPfaDate} />
        )}

        {includeProjection && !projectionData && (
          <section className="bg-amber-50 border border-amber-200 rounded p-3">
            <p className="text-xs text-amber-800 font-sans">
              Projection unavailable. Ensure profile and target PFA date are set.
            </p>
          </section>
        )}

        {/* RP-04: Chart version */}
        <section className="text-xs text-gray-500 border-t border-gray-200 pt-4 space-y-1 font-sans">
          <p>Scoring Charts: {CHART_VERSION}</p>
          <p>Regulatory Basis: DAFMAN 36-2905 (Change 1, 22 Jan 2026)</p>
          <p>Component Weights: Cardio 50% | Body Comp (WHtR) 20% | Strength 15% | Core 15%</p>
        </section>

        {/* RP-07: Footer */}
        <footer className="border-t border-gray-300 pt-4 text-center text-xs text-gray-500 font-sans space-y-0.5">
          <p className="font-semibold text-gray-700">Prepared by member for supervisory awareness.</p>
          <p>This is an unofficial self-assessment estimate. It has no official standing.</p>
          <p>Generated by Trajectory PFA Readiness Tracker (272-cos.github.io/Trajectory)</p>
        </footer>
      </div>
    </div>
  )
}

// ─── Per S-code assessment section ────────────────────────────────────────────

function AssessmentSection({ entry, index, total }) {
  const { code, decoded, scores } = entry
  const composite = scores?.composite
  const components = scores?.components ?? []
  const dateStr = formatDate(decoded.date)
  const isDiag = decoded.isDiagnostic

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Section header */}
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {total > 1 && (
            <span className="text-xs text-gray-400 font-sans">#{index + 1}</span>
          )}
          <span className="font-semibold text-gray-800 font-sans">{dateStr}</span>
          {/* RP-05 / EC-14: Diagnostic period badge */}
          {isDiag && (
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded font-sans">
              Diagnostic Period (non-scored)
            </span>
          )}
        </div>
        {composite && composite.composite != null && (
          <div className="text-right font-sans">
            <span className={`font-bold text-lg ${composite.pass ? 'text-green-700' : 'text-red-700'}`}>
              {composite.composite.toFixed(1)}
            </span>
            <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded ${
              composite.pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {composite.pass ? 'PASS' : 'FAIL'}
            </span>
          </div>
        )}
      </div>

      {/* Component breakdown */}
      <div className="p-4 space-y-3">
        {COMP_ORDER.map(compType => {
          const comp = components.find(c => c.type === compType)
          if (!comp) return null

          let rawLine = null
          if (compType === COMPONENTS.CARDIO && decoded.cardio && !decoded.cardio.exempt && decoded.cardio.value != null) {
            rawLine = `${EXERCISE_LABELS[decoded.cardio.exercise] || decoded.cardio.exercise}: ${formatValue(decoded.cardio.value, decoded.cardio.exercise)}`
          } else if (compType === COMPONENTS.STRENGTH && decoded.strength && !decoded.strength.exempt && decoded.strength.value != null) {
            rawLine = `${EXERCISE_LABELS[decoded.strength.exercise] || decoded.strength.exercise}: ${formatValue(decoded.strength.value, decoded.strength.exercise)}`
          } else if (compType === COMPONENTS.CORE && decoded.core && !decoded.core.exempt && decoded.core.value != null) {
            rawLine = `${EXERCISE_LABELS[decoded.core.exercise] || decoded.core.exercise}: ${formatValue(decoded.core.value, decoded.core.exercise)}`
          } else if (compType === COMPONENTS.BODY_COMP && decoded.bodyComp && !decoded.bodyComp.exempt && decoded.bodyComp.heightInches) {
            const whtr = calculateWHtR(decoded.bodyComp.waistInches, decoded.bodyComp.heightInches)
            rawLine = `WHtR: ${whtr.toFixed(2)} (${decoded.bodyComp.waistInches}" waist / ${decoded.bodyComp.heightInches}" height)`
          }

          return (
            <div key={compType} className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-700 font-sans">
                    {COMPONENT_LABELS[compType]}
                    <span className="text-xs text-gray-400 ml-1">({COMPONENT_WEIGHTS[compType]} pts max)</span>
                  </span>
                  {!comp.exempt && comp.tested && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-sans font-medium ${
                      comp.pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {comp.pass ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                {rawLine && <p className="text-xs text-gray-500 mt-0.5">{rawLine}</p>}
                {comp.exempt && <p className="text-xs text-gray-500 mt-0.5">Exempt (AF Form 469)</p>}
                {comp.walkOnly && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    2km Walk (pass/fail only - 0 pts to composite)
                    {!comp.pass && <span className="text-red-600 font-medium ml-1">FAIL - Overall FAIL</span>}
                  </p>
                )}
              </div>
              {!comp.exempt && comp.tested && !comp.walkOnly && comp.points != null && (
                <div className="text-right flex-shrink-0 font-sans">
                  <span className={`text-sm font-bold ${comp.pass ? 'text-green-700' : 'text-red-700'}`}>
                    {comp.points.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400"> / {comp.maxPoints}</span>
                </div>
              )}
              {comp.exempt && (
                <span className="text-xs text-gray-400 flex-shrink-0 font-sans">0 / 0</span>
              )}
            </div>
          )
        })}

        {/* S-code (RP-02) */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-sans">Assessment Code: <span className="font-mono">{code}</span></p>
        </div>
      </div>
    </div>
  )
}

// ─── Projection section ───────────────────────────────────────────────────────

function ProjectionSection({ projectionData, targetPfaDate }) {
  const { components, composite } = projectionData
  const daysToTarget = Math.max(0, Math.round((new Date(targetPfaDate) - new Date()) / 86400000))
  const targetDateStr = new Date(targetPfaDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <section className="border border-blue-200 rounded-lg overflow-hidden">
      <div className="bg-blue-50 px-4 py-2">
        <p className="text-sm font-semibold text-blue-900 font-sans">
          Readiness Projection - Target: {targetDateStr}
        </p>
        <p className="text-xs text-blue-700 font-sans">
          {daysToTarget} days remaining. Model: {projectionData.model || 'Auto'}.
          Estimates only - not a guarantee.
        </p>
      </div>
      <div className="p-4 space-y-3">
        {/* Projected composite */}
        {composite && composite.projected != null && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 font-sans">Projected Composite</span>
            <div className="text-right font-sans">
              <span className={`font-bold ${composite.projected >= 75 ? 'text-green-700' : 'text-red-700'}`}>
                {composite.projected.toFixed(1)}
              </span>
              <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                composite.projected >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {composite.projected >= 75 ? 'ON TRACK' : 'AT RISK'}
              </span>
            </div>
          </div>
        )}

        {/* Per-component projections */}
        {components && Object.entries(components).map(([compType, proj]) => {
          if (!proj || proj.exempt) return null
          return (
            <div key={compType} className="flex items-start justify-between gap-2 pl-2 border-l-2 border-blue-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 font-sans">{COMPONENT_LABELS[compType]}</p>
                {proj.projected_value != null && proj.exercise && (
                  <p className="text-xs text-gray-500 font-sans">
                    Projected: {formatProjectedValue(proj.projected_value, proj.exercise)}
                  </p>
                )}
                {proj.required_weekly_improvement != null && proj.required_weekly_improvement !== 0 && (
                  <p className="text-xs text-amber-700 font-sans">
                    Needs {Math.abs(proj.required_weekly_improvement).toFixed(1)} units/wk improvement to pass
                  </p>
                )}
              </div>
              {proj.projected_points != null && (
                <div className="text-right flex-shrink-0 font-sans">
                  <span className={`text-sm font-bold ${proj.pass ? 'text-green-700' : 'text-red-700'}`}>
                    {proj.projected_points.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Copy / Print handlers ────────────────────────────────────────────────────

/** Escape user-supplied strings before injecting into print window HTML. */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildPlainText({ rank, name, unit, dcode, reportEntries, allExempt, includeProjection, projectionData, targetPfaDate }) {
  const memberLine = [rank, name].filter(Boolean).join(' ') || '(Not specified)'
  const unitLine = unit || '(Not specified)'
  const lines = []

  lines.push('================================================')
  lines.push('         UNOFFICIAL SELF-CHECK REPORT')
  lines.push('  Not an official PFA score. Unofficial estimate only.')
  lines.push('================================================')
  lines.push('')
  lines.push('MEMBER INFORMATION')
  lines.push(`  Member: ${memberLine}`)
  lines.push(`  Unit: ${unitLine}`)
  if (dcode) lines.push(`  Profile Code: ${dcode}`)
  lines.push('')

  if (allExempt) {
    lines.push('EXEMPTION STATUS')
    lines.push('  All components exempt (AF Form 469). No composite score possible.')
    lines.push('')
  } else {
    lines.push('SELF-CHECK RESULTS')
    lines.push('')
    reportEntries.forEach((entry, idx) => {
      const { code, decoded, scores } = entry
      const dateStr = formatDate(decoded.date)
      const isDiag = decoded.isDiagnostic
      const composite = scores?.composite

      if (reportEntries.length > 1) lines.push(`  --- Self-Check #${idx + 1} ---`)
      lines.push(`  Date: ${dateStr}${isDiag ? ' [Diagnostic Period (non-scored)]' : ''}`)
      if (composite?.composite != null) {
        lines.push(`  Composite Score: ${composite.composite.toFixed(1)} - ${composite.pass ? 'PASS' : 'FAIL'}`)
      }
      lines.push('')

      const components = scores?.components ?? []
      COMP_ORDER.forEach(compType => {
        const comp = components.find(c => c.type === compType)
        if (!comp) return
        const label = COMPONENT_LABELS[compType]
        const weight = COMPONENT_WEIGHTS[compType]
        if (comp.exempt) {
          lines.push(`  ${label} (${weight} pts max): EXEMPT`)
        } else if (comp.walkOnly) {
          lines.push(`  ${label}: 2km Walk - ${comp.pass ? 'PASS' : 'FAIL'}`)
        } else if (comp.tested && comp.points != null) {
          lines.push(`  ${label} (${weight} pts max): ${comp.points.toFixed(1)} pts - ${comp.pass ? 'PASS' : 'FAIL'}`)
        }
      })

      lines.push(`  Assessment Code: ${code}`)
      lines.push('')
    })
  }

  if (includeProjection && projectionData && targetPfaDate) {
    const targetStr = new Date(targetPfaDate).toLocaleDateString()
    const { components, composite } = projectionData
    const daysToTarget = Math.max(0, Math.round((new Date(targetPfaDate) - new Date()) / 86400000))
    lines.push('READINESS PROJECTION')
    lines.push(`  Target PFA Date: ${targetStr} (${daysToTarget} days remaining)`)
    lines.push('  Model: Auto - Estimates only.')
    if (composite?.projected != null) {
      lines.push(`  Projected Composite: ${composite.projected.toFixed(1)} - ${composite.projected >= 75 ? 'ON TRACK' : 'AT RISK'}`)
    }
    if (components) {
      Object.entries(components).forEach(([compType, proj]) => {
        if (!proj || proj.exempt) return
        const label = COMPONENT_LABELS[compType]
        const pts = proj.projected_points != null ? `${proj.projected_points.toFixed(1)} pts` : ''
        const val = proj.projected_value != null && proj.exercise ? `| ${formatProjectedValue(proj.projected_value, proj.exercise)}` : ''
        lines.push(`  ${label}: ${pts} ${val} - ${proj.pass ? 'PASS' : 'FAIL'}`)
      })
    }
    lines.push('')
  }

  lines.push('SCORING INFORMATION')
  lines.push(`  Charts: ${CHART_VERSION}`)
  lines.push('  Basis: DAFMAN 36-2905 (Change 1, 22 Jan 2026)')
  lines.push('  Weights: Cardio 50% | Body Comp (WHtR) 20% | Strength 15% | Core 15%')
  lines.push('')
  lines.push('================================================')
  lines.push('Prepared by member for supervisory awareness.')
  lines.push('This is an unofficial self-assessment. Not an official PFA score.')
  lines.push('Generated by Trajectory PFA Readiness Tracker')
  lines.push('================================================')

  return lines.join('\n')
}

function handleCopy({ rank, name, unit, dcode, reportEntries, allExempt, includeProjection, projectionData, targetPfaDate, setCopySuccess }) {
  const text = buildPlainText({ rank, name, unit, dcode, reportEntries, allExempt, includeProjection, projectionData, targetPfaDate })
  navigator.clipboard.writeText(text).then(() => {
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 3000)
  }).catch(() => {
    // Fallback: textarea select
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 3000)
  })
}

function handlePrint({ rank, name, unit, dcode, reportEntries, allExempt, includeProjection, projectionData, targetPfaDate }) {
  const memberLine = [rank, name].filter(Boolean).join(' ') || '(Not specified)'
  const unitLine = unit || '(Not specified)'
  const memberLineEsc = esc(memberLine)
  const unitLineEsc = esc(unitLine)

  const entryHtml = allExempt
    ? `<div class="section">
        <div class="section-title">Exemption Status</div>
        <p>All components exempt (AF Form 469). No composite score possible.</p>
       </div>`
    : reportEntries.map((entry, idx) => {
        const { code, decoded, scores } = entry
        const dateStr = esc(formatDate(decoded.date))
        const isDiag = decoded.isDiagnostic
        const composite = scores?.composite
        const components = scores?.components ?? []

        const compRows = COMP_ORDER.map(compType => {
          const comp = components.find(c => c.type === compType)
          if (!comp) return ''
          const label = COMPONENT_LABELS[compType]
          const weight = COMPONENT_WEIGHTS[compType]
          let scoreText = ''
          let statusClass = ''
          if (comp.exempt) {
            scoreText = 'Exempt'
            statusClass = ''
          } else if (comp.walkOnly) {
            scoreText = `2km Walk - ${comp.pass ? 'PASS' : 'FAIL'}`
            statusClass = comp.pass ? 'pass' : 'fail'
          } else if (comp.tested && comp.points != null) {
            scoreText = `${comp.points.toFixed(1)} / ${comp.maxPoints} pts`
            statusClass = comp.pass ? 'pass' : 'fail'
          } else {
            return ''
          }
          return `<tr>
            <td>${esc(label)} <span class="weight">(${esc(String(weight))} pts max)</span></td>
            <td class="${statusClass}">${esc(scoreText)}</td>
            <td class="${statusClass} status">${comp.exempt ? '' : (comp.pass ? 'PASS' : 'FAIL')}</td>
          </tr>`
        }).join('')

        return `<div class="assessment-block">
          <div class="assessment-header">
            ${reportEntries.length > 1 ? `<span class="counter">#${idx + 1}</span>` : ''}
            <span class="date">${dateStr}</span>
            ${isDiag ? '<span class="badge diag">Diagnostic Period (non-scored)</span>' : ''}
            ${composite?.composite != null ? `<span class="composite ${composite.pass ? 'pass' : 'fail'}">${composite.composite.toFixed(1)} ${composite.pass ? 'PASS' : 'FAIL'}</span>` : ''}
          </div>
          <table class="comp-table">
            <tbody>${compRows}</tbody>
          </table>
          <div class="scode-line">Assessment Code: <span class="mono">${esc(code)}</span></div>
        </div>`
      }).join('')

  const projHtml = (includeProjection && projectionData && targetPfaDate)
    ? (() => {
        const targetStr = new Date(targetPfaDate).toLocaleDateString()
        const { components, composite } = projectionData
        const daysToTarget = Math.max(0, Math.round((new Date(targetPfaDate) - new Date()) / 86400000))
        const compRows = components ? Object.entries(components).map(([compType, proj]) => {
          if (!proj || proj.exempt) return ''
          const label = COMPONENT_LABELS[compType] ?? compType
          const pts = proj.projected_points != null ? `${proj.projected_points.toFixed(1)} pts` : '-'
          const val = proj.projected_value != null && proj.exercise ? formatProjectedValue(proj.projected_value, proj.exercise) : '-'
          return `<tr>
            <td>${esc(label)}</td>
            <td>${esc(pts)}</td>
            <td>${esc(val)}</td>
            <td class="${proj.pass ? 'pass' : 'fail'}">${proj.pass ? 'PASS' : 'FAIL'}</td>
          </tr>`
        }).join('') : ''

        return `<div class="section projection-section">
          <div class="section-title">Readiness Projection - Target: ${esc(targetStr)}</div>
          <p class="proj-note">Days remaining: ${esc(String(daysToTarget))} | Model: Auto | Estimates only - not a guarantee.</p>
          ${composite?.projected != null ? `
            <p class="proj-composite ${composite.projected >= 75 ? 'pass' : 'fail'}">
              Projected Composite: ${esc(composite.projected.toFixed(1))} - ${composite.projected >= 75 ? 'ON TRACK' : 'AT RISK'}
            </p>` : ''}
          ${compRows ? `<table class="comp-table"><thead><tr><th>Component</th><th>Proj. Points</th><th>Proj. Value</th><th>Status</th></tr></thead><tbody>${compRows}</tbody></table>` : ''}
        </div>`
      })()
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PFA Self-Check Report - ${memberLineEsc}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11pt; color: #111; max-width: 700px; margin: 0 auto; padding: 24px; }
    .watermark { border: 2px solid #555; text-align: center; padding: 10px 16px; margin-bottom: 20px; }
    .watermark-title { font-size: 16pt; font-weight: bold; letter-spacing: 0.15em; color: #333; }
    .watermark-sub { font-size: 8pt; color: #666; margin-top: 4px; }
    h1 { font-size: 13pt; margin-bottom: 12px; }
    .member-block { background: #f5f5f5; border-left: 3px solid #888; padding: 8px 12px; margin-bottom: 16px; font-size: 10pt; }
    .member-block p { margin: 2px 0; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11pt; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 10px; }
    .assessment-block { border: 1px solid #ddd; border-radius: 4px; margin-bottom: 14px; overflow: hidden; }
    .assessment-header { background: #f5f5f5; padding: 8px 12px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 10pt; }
    .date { font-weight: bold; }
    .counter { color: #888; font-size: 9pt; }
    .badge { font-size: 8pt; font-weight: bold; padding: 2px 6px; border-radius: 3px; }
    .badge.diag { background: #dbeafe; color: #1d4ed8; }
    .composite { font-weight: bold; margin-left: auto; font-size: 12pt; }
    .comp-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    .comp-table td, .comp-table th { padding: 5px 12px; border-bottom: 1px solid #f0f0f0; text-align: left; }
    .comp-table th { background: #fafafa; font-weight: bold; font-size: 9pt; }
    .weight { color: #888; font-size: 9pt; }
    .scode-line { padding: 6px 12px; font-size: 8pt; color: #888; border-top: 1px solid #f0f0f0; }
    .mono { font-family: monospace; }
    .pass { color: #15803d; }
    .fail { color: #dc2626; }
    .status { font-weight: bold; }
    .projection-section { border: 1px solid #93c5fd; border-radius: 4px; padding: 12px; background: #eff6ff; }
    .proj-note { font-size: 9pt; color: #555; margin-bottom: 8px; }
    .proj-composite { font-weight: bold; margin-bottom: 8px; }
    .scoring-info { font-size: 9pt; color: #555; margin-bottom: 16px; }
    .scoring-info p { margin: 2px 0; }
    footer { border-top: 1px solid #ccc; padding-top: 12px; text-align: center; font-size: 9pt; color: #555; margin-top: 20px; }
    footer strong { display: block; margin-bottom: 4px; color: #333; }
    @media print {
      body { padding: 0; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="watermark">
    <div class="watermark-title">UNOFFICIAL SELF-CHECK</div>
    <div class="watermark-sub">Not an official PFA score. For supervisory awareness only.</div>
  </div>

  <div class="member-block">
    <p><strong>Member:</strong> ${memberLineEsc}</p>
    <p><strong>Unit:</strong> ${unitLineEsc}</p>
    ${dcode ? `<p><strong>Profile Code:</strong> <span class="mono">${esc(dcode)}</span></p>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Self-Check Results</div>
    ${entryHtml}
  </div>

  ${projHtml}

  <div class="scoring-info">
    <p>Scoring Charts: ${CHART_VERSION}</p>
    <p>Basis: DAFMAN 36-2905 (Change 1, 22 Jan 2026)</p>
    <p>Weights: Cardio 50% | Body Comp (WHtR) 20% | Strength 15% | Core 15%</p>
  </div>

  <footer>
    <strong>Prepared by member for supervisory awareness.</strong>
    <p>This is an unofficial self-assessment estimate. It has no official standing.</p>
    <p>Generated by Trajectory PFA Readiness Tracker - 272-cos.github.io/Trajectory</p>
  </footer>

  <${'script'}>window.onload = function() { window.print(); }</${'script'}>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}
