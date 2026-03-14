/**
 * Tools Tab - Practice utilities and score planning tools
 * - Stopwatch + Lap Timer
 * - HAMR Practice Metronome
 * - "What Score Do I Need?" reverse lookup
 */

import { useState, useMemo } from 'react'
import Stopwatch from '../tools/Stopwatch.jsx'
import HamrMetronome from '../tools/HamrMetronome.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { calculateAge, getAgeBracket } from '../../utils/scoring/constants.js'
import { generateTargetTable } from '../../utils/scoring/reverseScoring.js'

// ── Component labels ──────────────────────────────────────────────────────────

const COMP_LABELS = {
  cardio:   'Cardio',
  strength: 'Strength',
  core:     'Core',
  bodyComp: 'Body Comp',
}

const COMP_COLORS = {
  cardio:   'border-blue-400',
  strength: 'border-green-400',
  core:     'border-amber-400',
  bodyComp: 'border-purple-400',
}

// ── What Score Do I Need? ─────────────────────────────────────────────────────

function ScoreTargetLookup() {
  const { demographics } = useApp()
  const [target, setTarget] = useState(80)
  const [expanded, setExpanded] = useState(true)

  // Derive age bracket from profile (today's date)
  const ageBracket = useMemo(() => {
    if (!demographics) return null
    const today = new Date().toISOString().split('T')[0]
    const age = calculateAge(demographics.dob, today)
    return getAgeBracket(age)
  }, [demographics])

  const tableRows = useMemo(() => {
    if (!demographics || !ageBracket) return null
    try {
      return generateTargetTable(target, demographics.gender, ageBracket)
    } catch {
      return null
    }
  }, [target, demographics, ageBracket])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={expanded}
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-700">What Score Do I Need?</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            See the raw performance required to hit a target composite.
          </p>
        </div>
        <span className="text-gray-400 text-xs ml-4">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Target slider */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              Target Composite Score
              <span className="text-2xl font-bold text-blue-600">{target}</span>
            </label>
            <input
              type="range"
              min="60"
              max="100"
              step="1"
              value={target}
              onChange={e => setTarget(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>60 (sub-min)</span>
              <span className="text-green-600 font-medium">75 (pass)</span>
              <span className="text-blue-600 font-medium">85 (strong)</span>
              <span>100 (perfect)</span>
            </div>
          </div>

          {/* Profile required notice */}
          {!demographics && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              Set up your profile (age and gender) first to see personalized targets.
            </div>
          )}

          {/* Results table */}
          {tableRows && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Showing minimum performance at <strong>{target}%</strong> per component -
                equal distribution across all four components.
              </p>
              {tableRows.map(row => (
                <div
                  key={row.component}
                  className={`rounded-lg border-l-4 bg-gray-50 p-3 ${COMP_COLORS[row.component]}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {COMP_LABELS[row.component]}
                    </span>
                    <span className="text-xs text-gray-500">
                      Need {row.targetPts} / {row.maxPts} pts
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {row.exercises.map(ex => (
                      <div key={ex.exercise} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{ex.label}</span>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">{ex.displayValue}</span>
                          {ex.lowerIsBetter && ex.rawValue !== null && (
                            <span className="text-xs text-gray-400 ml-1">or faster</span>
                          )}
                          {!ex.lowerIsBetter && ex.rawValue !== null && (
                            <span className="text-xs text-gray-400 ml-1">or more</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-xs text-gray-400 italic">
                Values shown are thresholds from DAFMAN 36-2905 scoring tables for your
                age and gender bracket. Performance at or better than these values earns
                the target score. Actual component scores can be traded off - e.g., extra
                cardio points can offset a weaker strength score.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

export default function ToolsTab() {
  return (
    <div
      role="tabpanel"
      id="tools-panel"
      aria-labelledby="tools-tab"
      className="space-y-4"
    >
      <ScoreTargetLookup />
      <HamrMetronome />
      <Stopwatch />
    </div>
  )
}
