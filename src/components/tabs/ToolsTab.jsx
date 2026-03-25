/**
 * Tools Tab - Practice utilities and score planning tools
 * - Stopwatch + Lap Timer
 * - HAMR Practice Metronome
 * - "What Score Do I Need?" reverse lookup
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import Stopwatch from '../tools/Stopwatch.jsx'
import HamrMetronome from '../tools/HamrMetronome.jsx'
import RunPacer from '../tools/RunPacer.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { calculateAge, getAgeBracket } from '../../utils/scoring/constants.js'
import { generateTargetTable } from '../../utils/scoring/reverseScoring.js'
import { exportBackup, importBackup } from '../../utils/storage/localStorage.js'

// ── Component labels ──────────────────────────────────────────────────────────

const COMP_LABELS = {
  cardio:   'Cardio',
  strength: 'Strength',
  core:     'Core',
  bodyComp: 'Body Comp (WHtR)',
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
  const [expanded, setExpanded] = useState(false)

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
        aria-controls="score-target-content"
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
        <div id="score-target-content" className="mt-4 space-y-4">
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

// ── Backup & Restore ────────────────────────────────────────────────────────

function BackupRestore() {
  const { addToast } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [restoreResult, setRestoreResult] = useState(null)
  const fileInputRef = useRef(null)

  const handleExport = useCallback(() => {
    try {
      const json = exportBackup()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().split('T')[0]
      a.download = `trajectory-backup-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addToast('Backup downloaded', 'success')
    } catch {
      addToast('Export failed', 'error')
    }
  }, [addToast])

  const handleImport = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = importBackup(ev.target.result)
      setRestoreResult(result)
      if (result.ok) {
        addToast(`Restored ${result.keysRestored} settings - reloading`, 'success')
        setTimeout(() => window.location.reload(), 1200)
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }, [addToast])

  const handleCopyBackup = useCallback(() => {
    try {
      const json = exportBackup()
      navigator.clipboard.writeText(json).then(() => {
        addToast('Backup copied to clipboard', 'success')
      })
    } catch {
      addToast('Copy failed', 'error')
    }
  }, [addToast])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={expanded}
        aria-controls="backup-restore-content"
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Backup & Restore</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Move your data to a new device or create a local backup.
          </p>
        </div>
        <span className="text-gray-400 text-xs ml-4">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div id="backup-restore-content" className="mt-4 space-y-4">
          <p className="text-xs text-gray-500">
            Your profile, assessment codes, training progress, and preferences are exported
            as a single JSON file. No personal information beyond what you entered is included.
          </p>

          {/* Export */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Export</h4>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Download Backup
              </button>
              <button
                onClick={handleCopyBackup}
                className="px-4 py-2.5 min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Copy backup to clipboard"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Import */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Restore</h4>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="hidden"
              aria-label="Select backup file to restore"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2.5 min-h-[44px] bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              Import Backup File
            </button>
            <p className="text-xs text-gray-400">
              Importing overwrites matching settings. The page reloads automatically after restore.
            </p>
          </div>

          {/* Result feedback */}
          {restoreResult && !restoreResult.ok && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {restoreResult.error}
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
    <div className="space-y-8">
      {/* Practice Timers */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Practice Timers</h2>
        <div className="space-y-4">
          <Stopwatch />
          <RunPacer />
          <HamrMetronome />
        </div>
      </section>

      {/* Score Planning */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Score Planning</h2>
        <ScoreTargetLookup />
      </section>

      {/* Data Management */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Data Management</h2>
        <BackupRestore />
      </section>
    </div>
  )
}
