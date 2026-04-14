/**
 * Tools Tab - Practice utilities and score planning tools
 * Accordion pattern - one tool expanded at a time
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import Stopwatch from '../tools/Stopwatch.jsx'
import HamrMetronome from '../tools/HamrMetronome.jsx'
import RunPacer from '../tools/RunPacer.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { calculateAge, getAgeBracket, EXERCISES, COMPONENTS } from '../../utils/scoring/constants.js'
import { generateTargetTable } from '../../utils/scoring/reverseScoring.js'
import { decodeSCode } from '../../utils/codec/scode.js'
import { lookupScore, calculateWHtR } from '../../utils/scoring/scoringEngine.js'
import { exportBackup, importBackup } from '../../utils/storage/localStorage.js'

// -- Component labels ---------------------------------------------------------

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

// -- Accordion wrapper --------------------------------------------------------

function AccordionItem({ id, title, subtitle, isOpen, onToggle, children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex items-center justify-between w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors min-h-[56px]"
        aria-expanded={isOpen}
        aria-controls={`accordion-${id}`}
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-3 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div id={`accordion-${id}`} className="px-5 pb-5 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}

// -- What Score Do I Need? ----------------------------------------------------

function ScoreTargetContent() {
  const { demographics, scodes } = useApp()
  const [target, setTarget] = useState(80)

  const ageBracket = useMemo(() => {
    if (!demographics) return null
    const today = new Date().toISOString().split('T')[0]
    const age = calculateAge(demographics.dob, today)
    return getAgeBracket(age)
  }, [demographics])

  // Extract current scores from most recent S-code for personalized mode
  const currentScores = useMemo(() => {
    if (!demographics || !ageBracket || !scodes || scodes.length === 0) return null
    try {
      // Decode the most recent S-code
      const decoded = scodes.map(code => {
        try { return decodeSCode(code) } catch { return null }
      }).filter(Boolean).sort((a, b) => (String(a.date) > String(b.date) ? 1 : -1))
      if (decoded.length === 0) return null
      const latest = decoded[decoded.length - 1]
      const gender = demographics.gender

      const scores = {}
      if (latest.cardio && !latest.cardio.exempt && latest.cardio.value != null && latest.cardio.exercise !== EXERCISES.WALK_2KM) {
        const r = lookupScore(latest.cardio.exercise, latest.cardio.value, gender, ageBracket)
        if (r) scores[COMPONENTS.CARDIO] = { exercise: latest.cardio.exercise, value: latest.cardio.value, pts: r.points }
      }
      if (latest.strength && !latest.strength.exempt && latest.strength.value != null) {
        const r = lookupScore(latest.strength.exercise, latest.strength.value, gender, ageBracket)
        if (r) scores[COMPONENTS.STRENGTH] = { exercise: latest.strength.exercise, value: latest.strength.value, pts: r.points }
      }
      if (latest.core && !latest.core.exempt && latest.core.value != null) {
        const r = lookupScore(latest.core.exercise, latest.core.value, gender, ageBracket)
        if (r) scores[COMPONENTS.CORE] = { exercise: latest.core.exercise, value: latest.core.value, pts: r.points }
      }
      if (latest.bodyComp && !latest.bodyComp.exempt && latest.bodyComp.heightInches && latest.bodyComp.waistInches) {
        const whtr = calculateWHtR(latest.bodyComp.waistInches, latest.bodyComp.heightInches)
        const r = lookupScore(EXERCISES.WHTR, whtr, gender, ageBracket)
        if (r) scores[COMPONENTS.BODY_COMP] = { exercise: EXERCISES.WHTR, value: whtr, pts: r.points }
      }
      return Object.keys(scores).length > 0 ? scores : null
    } catch {
      return null
    }
  }, [demographics, ageBracket, scodes])

  const isPersonalized = currentScores !== null

  const tableRows = useMemo(() => {
    if (!demographics || !ageBracket) return null
    try {
      return generateTargetTable(target, demographics.gender, ageBracket, currentScores)
    } catch {
      return null
    }
  }, [target, demographics, ageBracket, currentScores])

  return (
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

      {!demographics && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          Set up your profile (age and gender) first to see personalized targets.
        </div>
      )}

      {tableRows && (
        <div className="space-y-3">
          {/* Mode indicator */}
          {isPersonalized ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
              <p className="text-xs text-blue-800 font-medium">
                Personalized targets based on your last assessment
                {tableRows.currentComposite != null && (
                  <span className="ml-1">(current: {tableRows.currentComposite})</span>
                )}
              </p>
              {tableRows.totalEffortWeeks != null && tableRows.totalEffortWeeks > 0 && (
                <p className="text-xs text-blue-600 mt-0.5">
                  Estimated total effort: ~{tableRows.totalEffortWeeks.toFixed(0)} weeks of training
                </p>
              )}
              {tableRows.achievable === false && (
                <p className="text-xs text-red-600 mt-0.5 font-medium">
                  Target may not be fully achievable - showing best-effort allocation.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Showing minimum performance at <strong>{target}%</strong> per component -
              equal distribution across all four components.
            </p>
          )}

          {tableRows.map(row => (
            <div
              key={row.component}
              className={`rounded-lg border-l-4 bg-gray-50 p-3 ${COMP_COLORS[row.component]} ${row.isBestBangForBuck ? 'ring-2 ring-blue-300' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-800">
                  {COMP_LABELS[row.component]}
                  {row.isBestBangForBuck && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold">
                      BEST ROI
                    </span>
                  )}
                  {row.belowMinimum && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-xs font-bold">
                      BELOW MIN
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-500">
                  {isPersonalized && row.currentPts != null
                    ? `${row.currentPts} -> ${row.targetPts} / ${row.maxPts} pts`
                    : `Need ${row.targetPts} / ${row.maxPts} pts`
                  }
                </span>
              </div>

              {/* Personalized gain/effort info */}
              {isPersonalized && row.ptsGain != null && row.ptsGain > 0 && (
                <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                  <span className="font-medium text-green-700">+{row.ptsGain} pts needed</span>
                  {row.effortWeeks != null && row.effortWeeks > 0 && (
                    <span>~{row.effortWeeks} wk effort</span>
                  )}
                </div>
              )}
              {isPersonalized && (row.ptsGain === 0 || row.ptsGain === null) && row.currentPts != null && (
                <div className="text-xs text-green-600 mb-2 font-medium">Already at target</div>
              )}

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
            {isPersonalized
              ? 'Targets optimized to minimize total training effort based on your current scores. Thresholds from DAFMAN 36-2905 scoring tables.'
              : 'Values shown are thresholds from DAFMAN 36-2905 scoring tables for your age and gender bracket. Actual component scores can be traded off.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

// -- Backup & Restore content -------------------------------------------------

function BackupRestoreContent() {
  const { addToast } = useApp()
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
    <div className="mt-4 space-y-4">
      <p className="text-xs text-gray-500">
        Your profile, assessment codes, training progress, and preferences are exported
        as a single JSON file. No personal information beyond what you entered is included.
      </p>

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

      {restoreResult && !restoreResult.ok && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {restoreResult.error}
        </div>
      )}
    </div>
  )
}

// -- Help / Walkthrough content -----------------------------------------------

function WalkthroughContent() {
  const { reopenTutorial } = useApp()
  return (
    <div className="mt-4">
      <p className="text-xs text-gray-500 mb-3">
        Re-run the getting started walkthrough to review features or find something you missed.
      </p>
      <button
        onClick={reopenTutorial}
        className="w-full px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Open Walkthrough
      </button>
    </div>
  )
}

// -- Main Tab -----------------------------------------------------------------

const TOOLS = [
  { id: 'stopwatch', title: 'Stopwatch', subtitle: 'Lap timer with auto-score lookup', section: 'practice' },
  { id: 'pacer', title: 'Run Pacer', subtitle: 'Audio-guided lap pacing for 2-mile run', section: 'practice' },
  { id: 'hamr', title: 'HAMR Metronome', subtitle: '20m shuttle run beep cadence', section: 'practice' },
  { id: 'score', title: 'What Score Do I Need?', subtitle: 'Reverse lookup by target composite', section: 'planning' },
  { id: 'backup', title: 'Backup & Restore', subtitle: 'Export or import your data', section: 'data' },
  { id: 'walkthrough', title: 'View Walkthrough', subtitle: 'Re-run the getting started guide', section: 'help' },
]

export default function ToolsTab() {
  const [openTool, setOpenTool] = useState('stopwatch')

  const handleToggle = (id) => {
    setOpenTool(prev => prev === id ? null : id)
  }

  const practiceTools = TOOLS.filter(t => t.section === 'practice')
  const planningTools = TOOLS.filter(t => t.section === 'planning')
  const dataTools = TOOLS.filter(t => t.section === 'data')
  const helpTools = TOOLS.filter(t => t.section === 'help')

  const renderToolContent = (id) => {
    switch (id) {
      case 'stopwatch': return <Stopwatch />
      case 'pacer': return <RunPacer />
      case 'hamr': return <HamrMetronome />
      case 'score': return <ScoreTargetContent />
      case 'backup': return <BackupRestoreContent />
      case 'walkthrough': return <WalkthroughContent />
      default: return null
    }
  }

  const renderSection = (label, tools) => (
    <section>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</h2>
      <div className="space-y-2">
        {tools.map(tool => (
          <AccordionItem
            key={tool.id}
            id={tool.id}
            title={tool.title}
            subtitle={tool.subtitle}
            isOpen={openTool === tool.id}
            onToggle={handleToggle}
          >
            {renderToolContent(tool.id)}
          </AccordionItem>
        ))}
      </div>
    </section>
  )

  return (
    <div className="space-y-6">
      {renderSection('Practice Timers', practiceTools)}
      {renderSection('Score Planning', planningTools)}
      {renderSection('Data Management', dataTools)}
      {renderSection('Help', helpTools)}
    </div>
  )
}
