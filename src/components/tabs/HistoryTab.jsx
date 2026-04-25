/**
 * History Tab - S-code management, trend charts, and assessment timeline
 * Features: paste/validate S-codes, composite + component sparklines, outlier flagging
 */

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { useApp } from '../../context/AppContext.jsx'
import { decodeSCode, isValidSCode } from '../../utils/codec/scode.js'
import { EXERCISES, COMPONENTS, calculateAge, getAgeBracket } from '../../utils/scoring/constants.js'
import { calculateComponentScore, calculateCompositeScore, calculateWHtR, formatTime } from '../../utils/scoring/scoringEngine.js'
import { getOutliers, toggleOutlier, saveDraft, getPracticeSessions, removePracticeSession, exportBackup, importBackup } from '../../utils/storage/localStorage.js'
import ShareModal from '../shared/ShareModal.jsx'
import AchievementBadges from '../shared/AchievementBadges.jsx'
import OverwriteConfirmModal from '../shared/OverwriteConfirmModal.jsx'
import { PI_EXERCISE_LABELS, formatSecondsMMSS } from '../../utils/training/practiceSession.js'
import { generatePDFAndDownload } from '../../utils/pdf/generateFormPDF.js'

const BASE_URL = import.meta.env.BASE_URL

/** Build a shareable URL for a given dcode + optional single scode. */
function buildShareUrl(dcode, scode) {
  const origin = window.location.origin
  const base = BASE_URL.replace(/\/$/, '')
  const params = new URLSearchParams()
  if (dcode) params.set('d', dcode)
  if (scode) params.append('s', scode)
  return `${origin}${base}/?${params.toString()}`
}

const EXERCISE_LABELS = {
  [EXERCISES.RUN_2MILE]: '2-Mile Run',
  [EXERCISES.HAMR]: 'HAMR Shuttle',
  [EXERCISES.WALK_2KM]: '2km Walk',
  [EXERCISES.PUSHUPS]: 'Push-ups',
  [EXERCISES.HRPU]: 'Hand-Release Push-ups',
  [EXERCISES.SITUPS]: 'Sit-ups',
  [EXERCISES.CLRC]: 'Reverse Crunches',
  [EXERCISES.PLANK]: 'Forearm Plank',
  [EXERCISES.WHTR]: 'WHtR',
}

const COMPONENT_LABELS = {
  [COMPONENTS.CARDIO]: 'Cardio',
  [COMPONENTS.STRENGTH]: 'Strength',
  [COMPONENTS.CORE]: 'Core',
  [COMPONENTS.BODY_COMP]: 'Body Comp (WHtR)',
}

const COMPONENT_COLORS = {
  [COMPONENTS.CARDIO]: '#3b82f6',
  [COMPONENTS.STRENGTH]: '#10b981',
  [COMPONENTS.CORE]: '#f59e0b',
  [COMPONENTS.BODY_COMP]: '#8b5cf6',
}

/** Extract component percentage (0-100) from decoded scores, or null if unavailable */
function getComponentPct(components, type) {
  const comp = components?.find(c => c.type === type)
  if (!comp || comp.exempt || !comp.tested || comp.walkOnly) return null
  return comp.percentage ?? null
}

/** Format a date for chart X-axis labels (noon UTC avoids timezone day shift) */
function formatChartDate(date) {
  const iso = date instanceof Date ? date.toISOString().split('T')[0] : String(date).split('T')[0]
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Custom dot for composite chart - colored by pass/fail
function CompositeDot({ cx, cy, payload }) {
  if (!payload || payload.composite == null || !cx || !cy) return null
  const color = payload.composite >= 75 ? '#16a34a' : '#dc2626'
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={1.5} />
}

// Significant composite drop threshold that triggers the outlier suggestion banner
const OUTLIER_DROP_THRESHOLD = 5.0

export default function HistoryTab() {
  const { scodes, addSCode, removeSCode, demographics, dcode, setActiveTab } = useApp()
  const [pasteValue, setPasteValue] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [pasteSuccess, setPasteSuccess] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [outliers, setOutliers] = useState(() => new Set(getOutliers()))
  const [showImport, setShowImport] = useState(false)
  const [importValue, setImportValue] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [exportSuccess, setExportSuccess] = useState('')
  const [undoDeletes, setUndoDeletes] = useState([]) // [{ code, timer }] - stack of pending undos
  const [shareState, setShareState] = useState(null) // { url, title } for ShareModal
  const [practiceSessions, setPracticeSessions] = useState(() => getPracticeSessions())
  const [restorePending, setRestorePending] = useState(null) // { jsonString, fileName, keysCount }

  // Edit: convert decoded S-code to draft and navigate to Self-Check
  const handleEditAssessment = (decoded) => {
    const draft = {
      assessmentDate: String(decoded.date).split('T')[0],
    }
    if (decoded.cardio) {
      draft.cardioExercise = decoded.cardio.exercise
      draft.cardioExempt = decoded.cardio.exempt || false
      if (!decoded.cardio.exempt && decoded.cardio.value != null) {
        if (decoded.cardio.exercise === EXERCISES.RUN_2MILE || decoded.cardio.exercise === EXERCISES.WALK_2KM) {
          draft.cardioValue = formatTime(decoded.cardio.value)
        } else {
          draft.cardioValue = String(decoded.cardio.value)
        }
      }
    }
    if (decoded.strength) {
      draft.strengthExercise = decoded.strength.exercise
      draft.strengthExempt = decoded.strength.exempt || false
      if (!decoded.strength.exempt && decoded.strength.value != null) {
        draft.strengthValue = String(decoded.strength.value)
      }
    }
    if (decoded.core) {
      draft.coreExercise = decoded.core.exercise
      draft.coreExempt = decoded.core.exempt || false
      if (!decoded.core.exempt && decoded.core.value != null) {
        if (decoded.core.exercise === EXERCISES.PLANK) {
          draft.coreValue = formatTime(decoded.core.value)
        } else {
          draft.coreValue = String(decoded.core.value)
        }
      }
    }
    if (decoded.bodyComp) {
      draft.bodyCompExempt = decoded.bodyComp.exempt || false
      if (!decoded.bodyComp.exempt) {
        if (decoded.bodyComp.heightInches) draft.heightInches = String(decoded.bodyComp.heightInches)
        if (decoded.bodyComp.waistInches) draft.waistInches = String(decoded.bodyComp.waistInches)
      }
    }
    saveDraft(draft)
    setActiveTab('selfcheck')
  }

  // Decode all S-codes and compute scores
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
    }).reverse() // newest first for display
  }, [scodes, demographics])

  // EC-20: detect same-date collisions
  const sameDateCodes = useMemo(() => {
    const dateCounts = {}
    decodedEntries.forEach(e => {
      if (!e.error && e.decoded?.date) {
        const key = String(e.decoded.date).split('T')[0]
        dateCounts[key] = (dateCounts[key] || 0) + 1
      }
    })
    return new Set(
      decodedEntries
        .filter(e => !e.error && e.decoded?.date && dateCounts[String(e.decoded.date).split('T')[0]] > 1)
        .map(e => e.code)
    )
  }, [decodedEntries])

  // Chart data: chronological, excluding outliers, only entries with composite score
  const chartData = useMemo(() => {
    return [...decodedEntries]
      .filter(e => !e.error && !outliers.has(e.code) && e.scores?.composite?.composite != null)
      .sort((a, b) => new Date(a.decoded.date) - new Date(b.decoded.date))
      .map(e => ({
        date: formatChartDate(e.decoded.date),
        composite: e.scores.composite.composite,
        cardio: getComponentPct(e.scores.components, COMPONENTS.CARDIO),
        strength: getComponentPct(e.scores.components, COMPONENTS.STRENGTH),
        core: getComponentPct(e.scores.components, COMPONENTS.CORE),
        bodyComp: getComponentPct(e.scores.components, COMPONENTS.BODY_COMP),
      }))
  }, [decodedEntries, outliers])

  const handlePaste = () => {
    setPasteError('')
    setPasteSuccess('')
    // UX-09: strip whitespace/newlines
    const trimmed = pasteValue.trim().replace(/\s+/g, '')

    if (!trimmed) {
      setPasteError('Please enter an assessment code.')
      return
    }

    // CS-08: D-code pasted into S-code field
    if (trimmed.startsWith('D')) {
      setPasteError(<>This is a profile code. Paste it in the <strong>Profile tab</strong> instead.</>)
      return
    }

    if (!trimmed.startsWith('S')) {
      setPasteError('Invalid code format. Assessment codes start with "S".')
      return
    }

    if (scodes.includes(trimmed)) {
      setPasteError('This assessment code is already in your history.')
      return
    }

    // CS-02/CS-03: validate CRC
    if (!isValidSCode(trimmed)) {
      setPasteError('Invalid assessment code. Check for typos or truncation.')
      return
    }

    addSCode(trimmed)
    setPasteValue('')
    setPasteSuccess('Assessment added to history.')
    setTimeout(() => setPasteSuccess(''), 3000)
  }

  const handleDelete = (code) => {
    removeSCode(code)
    setConfirmDelete(null)
    // Stack-based undo: each delete gets its own 60s window
    const timer = setTimeout(() => {
      setUndoDeletes(prev => prev.filter(u => u.code !== code))
    }, 60000)
    setUndoDeletes(prev => [...prev, { code, timer }])
  }

  const handleUndoDelete = (code) => {
    const entry = undoDeletes.find(u => u.code === code)
    if (!entry) return
    addSCode(entry.code)
    clearTimeout(entry.timer)
    // Clear outlier flag so restored assessment doesn't show strikethrough
    setOutliers(prev => {
      if (!prev.has(entry.code)) return prev
      const next = new Set(prev)
      next.delete(entry.code)
      return next
    })
    setUndoDeletes(prev => prev.filter(u => u.code !== code))
  }

  const handleOutlierToggle = (code) => {
    const nowOutlier = toggleOutlier(code)
    setOutliers(prev => {
      const next = new Set(prev)
      if (nowOutlier) next.add(code)
      else next.delete(code)
      return next
    })
  }

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Silently fail on clipboard errors
    }
  }

  const handleDownloadPDF = async (entry) => {
    if (!demographics || !entry?.decoded || !entry?.scores) return
    try {
      await generatePDFAndDownload(demographics, entry.decoded, entry.scores, entry.decoded.date)
    } catch (err) {
      console.error('PDF generation failed:', err)
    }
  }

  const handleExport = async () => {
    if (scodes.length === 0) return
    const text = scodes.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setExportSuccess(`${scodes.length} assessment${scodes.length !== 1 ? 's' : ''} copied to clipboard`)
      setTimeout(() => setExportSuccess(''), 3000)
    } catch {
      // Fallback: select textarea content
      setExportSuccess('Copy failed - use the import/export area below')
    }
  }

  const handleImport = () => {
    setImportResult(null)
    if (!importValue.trim()) return

    // Split on newlines, commas, or whitespace to support multiple formats
    const candidates = importValue
      .split(/[\n,]+/)
      .map(s => s.trim().replace(/\s+/g, ''))
      .filter(Boolean)

    let added = 0
    let duplicates = 0
    let invalid = 0

    for (const code of candidates) {
      if (!code.startsWith('S')) {
        invalid++
        continue
      }
      if (scodes.includes(code)) {
        duplicates++
        continue
      }
      if (!isValidSCode(code)) {
        invalid++
        continue
      }
      addSCode(code)
      added++
    }

    setImportResult({ added, duplicates, invalid, total: candidates.length })
    if (added > 0) {
      setImportValue('')
    }
  }

  // Full-state backup download
  const handleExportJSON = () => {
    const json = exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pfa-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // File-picker restore flow
  const handleRestoreFileChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const jsonString = ev.target.result
      let parsed
      try { parsed = JSON.parse(jsonString) } catch { return }
      const keysCount = parsed?.data ? Object.keys(parsed.data).length : null
      setRestorePending({ jsonString, fileName: file.name, keysCount })
    }
    reader.readAsText(file)
  }

  const handleConfirmRestore = () => {
    if (!restorePending) return
    const result = importBackup(restorePending.jsonString)
    setRestorePending(null)
    if (result.ok) {
      window.location.reload()
    }
  }

  // Detect significant score drops for trend annotation
  const significantDrops = useMemo(() => {
    const scored = [...decodedEntries]
      .filter(e => !e.error && !outliers.has(e.code) && e.scores?.composite?.composite != null)
      .sort((a, b) => new Date(a.decoded.date) - new Date(b.decoded.date))
    const dropSet = new Set()
    for (let i = 1; i < scored.length; i++) {
      const prev = scored[i - 1].scores.composite.composite
      const curr = scored[i].scores.composite.composite
      if (prev - curr >= OUTLIER_DROP_THRESHOLD) {
        dropSet.add(scored[i].code)
      }
    }
    return dropSet
  }, [decodedEntries, outliers])

  const hasScored = decodedEntries.some(e => !e.error && e.scores?.composite?.composite != null)

  return (
    <div className="space-y-6">
      {/* Undo delete banner(s) */}
      {undoDeletes.map(u => (
        <div key={u.code} className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-2">
          <p className="text-sm text-amber-800">Assessment removed.</p>
          <button
            onClick={() => handleUndoDelete(u.code)}
            className="px-3 py-1.5 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            Undo
          </button>
        </div>
      ))}

      {/* Profile code display */}
      {dcode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-gray-500">Profile Code</p>
            <p className="font-mono text-sm text-blue-900">{dcode}</p>
          </div>
          <button
            onClick={async () => { try { await navigator.clipboard.writeText(dcode) } catch { /* ignore */ } }}
            className="px-3 py-2 min-h-[44px] text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Copy
          </button>
        </div>
      )}

      {/* Add Assessment Code */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment History</h2>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Add Assessment Code
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
            Paste an assessment code from a previous session or shared by another device.
          </p>
        </div>

        {/* Export / Import controls */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={handleExport}
            disabled={scodes.length === 0}
            className="px-3 py-2 min-h-[44px] text-xs bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors font-medium"
          >
            Export All (Text)
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-2 min-h-[44px] text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
          >
            Back Up
          </button>
          <label className="px-3 py-2 min-h-[44px] text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium cursor-pointer flex items-center">
            Restore Backup
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={handleRestoreFileChange}
            />
          </label>
          {dcode && scodes.length > 0 && (
            <button
              onClick={() => setShareState({ url: buildShareUrl(dcode, null), title: 'Share All Assessments' })}
              className="px-3 py-2 min-h-[44px] text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors font-medium"
            >
              Share All
            </button>
          )}
          <button
            onClick={() => { setShowImport(!showImport); setImportResult(null) }}
            className="px-3 py-2 min-h-[44px] text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
          >
            {showImport ? 'Hide Import' : 'Bulk Import'}
          </button>
          {exportSuccess && (
            <span className="text-xs text-green-600">{exportSuccess}</span>
          )}
        </div>

        {showImport && (
          <div className="pt-3 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Paste multiple assessment codes (one per line or comma-separated)
            </label>
            <textarea
              value={importValue}
              onChange={(e) => setImportValue(e.target.value)}
              placeholder={"S3-abc123...\nS3-def456...\nS3-ghi789..."}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleImport}
              disabled={!importValue.trim()}
              className="px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              Import
            </button>
            {importResult && (
              <div className="text-xs space-y-0.5">
                {importResult.added > 0 && (
                  <p className="text-green-600">{importResult.added} assessment{importResult.added !== 1 ? 's' : ''} imported successfully.</p>
                )}
                {importResult.duplicates > 0 && (
                  <p className="text-gray-500">{importResult.duplicates} already in history (skipped).</p>
                )}
                {importResult.invalid > 0 && (
                  <p className="text-red-600">{importResult.invalid} invalid or unrecognized (skipped).</p>
                )}
                {importResult.added === 0 && importResult.total > 0 && (
                  <p className="text-amber-600">No new assessments were added.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Milestones */}
      <AchievementBadges />

      {/* Trend Chart - only show when demographics available and there are scored entries */}
      {demographics && hasScored && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Composite Score Trend</h3>

          {/* EC-12: Need 3+ S-codes for meaningful trend */}
          {chartData.length < 3 && (
            <p className="text-xs text-amber-600 mb-3">
              Need 3+ assessments for a meaningful trend. Showing available data.
            </p>
          )}

          <CompositeChart data={chartData} />

          {/* Per-component sparklines */}
          <SparklineGrid data={chartData} />
        </div>
      )}

      {/* No demographics warning */}
      {!demographics && scodes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900">
            Set up your profile (DOB + gender) in the <strong>Profile tab</strong> to see scored results and trend charts.
          </p>
        </div>
      )}

      {/* Assessment count */}
      {scodes.length > 0 && (
        <p className="text-sm text-gray-600">
          {scodes.length} assessment{scodes.length !== 1 ? 's' : ''} recorded
          {outliers.size > 0 && ` (${outliers.size} flagged as outlier${outliers.size !== 1 ? 's' : ''})`}
        </p>
      )}

      {/* Share modal */}
      {shareState && (
        <ShareModal
          url={shareState.url}
          title={shareState.title}
          onClose={() => setShareState(null)}
        />
      )}

      {/* Restore overwrite confirmation */}
      {restorePending && (
        <OverwriteConfirmModal
          fileName={restorePending.fileName}
          keysCount={restorePending.keysCount}
          onConfirm={handleConfirmRestore}
          onCancel={() => setRestorePending(null)}
        />
      )}

      {/* Assessment timeline */}
      {decodedEntries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-2">Assessment Timeline</h3>
          <p className="text-sm text-gray-600 mb-3">
            Your self-check history appears here as a trend chart and timeline. Paste a code above or complete an assessment to get started.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('selfcheck')}
            className="text-sm underline font-medium text-blue-700 hover:text-blue-900"
          >
            Go to Self-Check
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decodedEntries.map((entry) => (
            <AssessmentCard
              key={entry.code}
              entry={entry}
              isOutlier={outliers.has(entry.code)}
              hasSameDate={sameDateCodes.has(entry.code)}
              hasSignificantDrop={significantDrops.has(entry.code)}
              isConfirmingDelete={confirmDelete === entry.code}
              onOutlierToggle={() => handleOutlierToggle(entry.code)}
              onRequestDelete={() => setConfirmDelete(entry.code)}
              onConfirmDelete={() => handleDelete(entry.code)}
              onCancelDelete={() => setConfirmDelete(null)}
              onCopy={() => copyCode(entry.code)}
              onEdit={entry.decoded ? () => handleEditAssessment(entry.decoded) : null}
              onShare={dcode ? () => setShareState({ url: buildShareUrl(dcode, entry.code), title: 'Share Assessment' }) : null}
              onDownloadPDF={demographics && entry.scores ? () => handleDownloadPDF(entry) : null}
            />
          ))}
        </div>
      )}

      {/* Practice Sessions - gray border, visually distinct from S-codes (TR-05) */}
      {practiceSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Practice Sessions ({practiceSessions.length})
          </h3>
          <div className="space-y-3">
            {[...practiceSessions].reverse().map((session) => (
              <PracticeSessionCard
                key={session.id}
                session={session}
                onRemove={() => {
                  removePracticeSession(session.id)
                  setPracticeSessions(getPracticeSessions())
                }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Practice sessions are not assessment codes and do not appear in reports.
            They contribute scaled estimates to the Trajectory projection.
          </p>
        </div>
      )}
    </div>
  )
}

// Practice session card - gray border to distinguish from S-code assessment cards
function PracticeSessionCard({ session, onRemove }) {
  const [confirmRemove, setConfirmRemove] = useState(false)
  const dateStr = new Date(String(session.date).split('T')[0] + 'T12:00:00').toLocaleDateString()

  const renderContent = () => {
    if (session.type === 'pi_workout') {
      const label = PI_EXERCISE_LABELS[session.piExercise] || session.piExercise
      const rawDisplay = session.scaled
        ? (session.piExercise.includes('run') || session.piExercise === 'plank_half')
          ? formatSecondsMMSS(session.piValue)
          : `${session.piValue} reps`
        : '-'
      return (
        <div>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{label}:</span> {rawDisplay}
          </p>
          {/* TR-03: labeled "Estimated" */}
          {session.scaled && (
            <p className="text-xs text-indigo-700 mt-0.5">
              Estimated: {session.scaled.displayText}
            </p>
          )}
        </div>
      )
    }

    if (session.type === 'fractional_test') {
      const pct = Math.round(session.fraction * 100)
      return (
        <div>
          {/* TR-04: labeled with fraction used */}
          <p className="text-sm font-medium text-gray-700">{pct}% Fractional Test</p>
          <div className="mt-1 space-y-0.5">
            {session.components?.cardio && (
              <p className="text-xs text-gray-600">
                Cardio: {session.components.cardio.value} {'->'}{' '}
                <span className="text-indigo-700">{session.components.cardio.scaled?.displayText}</span>
              </p>
            )}
            {session.components?.strength && (
              <p className="text-xs text-gray-600">
                Strength: {session.components.strength.value} reps {'->'}{' '}
                <span className="text-indigo-700">{session.components.strength.scaled?.displayText}</span>
              </p>
            )}
            {session.components?.core && (
              <p className="text-xs text-gray-600">
                Core: {session.components.core.value} {'->'}{' '}
                <span className="text-indigo-700">{session.components.core.scaled?.displayText}</span>
              </p>
            )}
          </div>
        </div>
      )
    }

    return <p className="text-sm text-gray-600">Practice session</p>
  }

  return (
    <div className="bg-white rounded-lg border-2 border-gray-300 border-dashed p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-gray-700">{dateStr}</p>
            <span className="inline-block px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-500 font-medium">
              Practice
            </span>
          </div>
          {renderContent()}
        </div>
        <div>
          {confirmRemove ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onRemove(); setConfirmRemove(false) }}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded"
              >
                Remove
              </button>
              <button
                onClick={() => setConfirmRemove(false)}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRemove(true)}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Main composite trend chart
function CompositeChart({ data }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-8 text-center">
        No scored assessments to chart. Add profile info and scored assessments.
      </p>
    )
  }

  return (
    <div className="h-48 w-full mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            formatter={(value) => [`${value.toFixed(1)}`, 'Composite']}
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
          />
          <ReferenceLine
            y={75}
            stroke="#ef4444"
            strokeDasharray="4 3"
            label={{ value: '75 (Pass)', position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }}
          />
          <Line
            type="monotone"
            dataKey="composite"
            stroke="#6366f1"
            strokeWidth={2}
            dot={<CompositeDot />}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Per-component sparklines grid
function SparklineGrid({ data }) {
  const components = [
    { key: COMPONENTS.CARDIO, label: COMPONENT_LABELS[COMPONENTS.CARDIO], color: COMPONENT_COLORS[COMPONENTS.CARDIO] },
    { key: COMPONENTS.STRENGTH, label: COMPONENT_LABELS[COMPONENTS.STRENGTH], color: COMPONENT_COLORS[COMPONENTS.STRENGTH] },
    { key: COMPONENTS.CORE, label: COMPONENT_LABELS[COMPONENTS.CORE], color: COMPONENT_COLORS[COMPONENTS.CORE] },
    { key: COMPONENTS.BODY_COMP, label: COMPONENT_LABELS[COMPONENTS.BODY_COMP], color: COMPONENT_COLORS[COMPONENTS.BODY_COMP] },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
      {components.map(({ key, label, color }) => {
        const hasData = data.some(d => d[key] != null)
        return (
          <div key={key} className="text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
            {hasData ? (
              <div className="h-14 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                    <Line
                      type="monotone"
                      dataKey={key}
                      stroke={color}
                      strokeWidth={1.5}
                      dot={false}
                      connectNulls={false}
                    />
                    <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="2 2" strokeWidth={0.8} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-14 flex items-center justify-center">
                <p className="text-xs text-gray-300">No data</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AssessmentCard({
  entry,
  isOutlier,
  hasSameDate,
  hasSignificantDrop,
  isConfirmingDelete,
  onOutlierToggle,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  onCopy,
  onEdit,
  onShare,
  onDownloadPDF,
}) {
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

  const iso = decoded.date instanceof Date ? decoded.date.toISOString().split('T')[0] : String(decoded.date).split('T')[0]
  const dateStr = new Date(iso + 'T12:00:00').toLocaleDateString()
  const isDiag = decoded.isDiagnostic
  const composite = scores?.composite
  const hasComposite = composite && composite.composite != null

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
      isOutlier
        ? 'border-amber-400 opacity-70'
        : hasComposite
          ? (composite.pass ? 'border-green-500' : 'border-red-500')
          : 'border-gray-300'
    }`}>
      {/* Header row - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`${dateStr} assessment details`}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
              <p className="font-medium text-gray-900">{dateStr}</p>
              {/* EC-14: Diagnostic period badge */}
              {isDiag && (
                <span className="inline-block px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                  Diagnostic Period
                </span>
              )}
              {/* EC-20: Same-date warning */}
              {hasSameDate && (
                <span className="inline-block px-1.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded">
                  SAME DATE
                </span>
              )}
              {/* PG-06: Outlier badge */}
              {isOutlier && (
                <span className="inline-block px-1.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded">
                  OUTLIER
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {hasComposite && !isOutlier && (
              <div className="text-right">
                <p className={`text-lg font-bold ${composite.pass ? 'text-green-600' : 'text-red-600'}`}>
                  {composite.composite.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">
                  {composite.pass ? 'PASS' : 'FAIL'}
                </p>
              </div>
            )}
            {hasComposite && isOutlier && (
              <p className="text-sm text-gray-400 line-through">{composite.composite.toFixed(1)}</p>
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

          {/* Trend annotation - significant drop from previous */}
          {hasSignificantDrop && !isOutlier && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
              Score dropped significantly from the prior check-in. If this was an off day or test
              condition issue, consider flagging it as an outlier to keep your trend accurate.
            </div>
          )}

          {/* Assessment code display */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <p className="font-mono text-xs text-gray-500 flex-1 break-all">{code}</p>
            <button
              onClick={(e) => { e.stopPropagation(); onCopy() }}
              aria-label="Copy assessment code to clipboard"
              className="px-2 py-2 min-h-[44px] text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Copy
            </button>
            {onShare && (
              <button
                onClick={(e) => { e.stopPropagation(); onShare() }}
                aria-label="Share assessment via QR code or link"
                className="px-2 py-2 min-h-[44px] text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Share
              </button>
            )}
            {onDownloadPDF && (
              <button
                onClick={(e) => { e.stopPropagation(); onDownloadPDF() }}
                aria-label="Download this assessment as a PDF"
                className="px-2 py-2 min-h-[44px] text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                PDF
              </button>
            )}
          </div>

          {/* Actions: edit, outlier toggle, delete */}
          <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit() }}
                  className="text-xs px-3 py-2 min-h-[44px] rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Edit
                </button>
              )}
              {/* PG-06: Outlier flag toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); onOutlierToggle() }}
                aria-pressed={isOutlier}
                className={`text-xs px-3 py-2 min-h-[44px] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  isOutlier
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isOutlier ? 'Unflag outlier' : 'Flag as outlier'}
              </button>
            </div>

            {/* Delete */}
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2">
                <p className="text-xs text-red-600">Remove this assessment?</p>
                <button
                  onClick={(e) => { e.stopPropagation(); onConfirmDelete() }}
                  className="px-3 py-2 min-h-[44px] text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Remove
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onCancelDelete() }}
                  className="px-3 py-2 min-h-[44px] text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onRequestDelete() }}
                className="text-xs text-red-500 hover:text-red-700 transition-colors py-2 min-h-[44px] px-1 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
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
