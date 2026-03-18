/**
 * Plan Tab - Training Plan Calendar (Task 10.2)
 *
 * Month-view calendar grid. Tap a day to see the prescription; tap
 * "Mark Complete" to log adherence. Navigation arrows step through months.
 */

import { useState, useMemo, useCallback } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { decodeSCode } from '../../utils/codec/scode.js'
import { calculateCompositeScore, calculateComponentScore } from '../../utils/scoring/scoringEngine.js'
import { COMPONENTS, calculateAge, getAgeBracket } from '../../utils/scoring/constants.js'
import {
  getPracticeSessions,
  getCompletedDays,
  toggleCompletedDay,
  getPreferredDays,
  savePreferredDays,
} from '../../utils/storage/localStorage.js'
import {
  generateCalendar,
  PHASES,
  PHASE_LABELS,
  PHASE_DESCRIPTIONS,
  EVENT_TYPES,
  FITNESS_LEVELS,
  getFitnessLevel,
  daysBetween,
  hasConsecutiveDays,
} from '../../utils/training/trainingCalendar.js'
import { isMockTestWindow, isInTaperPeriod } from '../../utils/training/practiceSession.js'

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

const DOW_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// Dot colors for event types shown on day cells
const EVENT_DOT = {
  [EVENT_TYPES.TEST_DAY]:        'bg-red-500',
  [EVENT_TYPES.MOCK_TEST]:       'bg-orange-500',
  [EVENT_TYPES.FRACTIONAL_TEST]: 'bg-purple-500',
  [EVENT_TYPES.PI_WORKOUT]:      'bg-blue-500',
  [EVENT_TYPES.TAPER]:           'bg-amber-400',
  [EVENT_TYPES.TRAINING]:        'bg-green-500',
}

// Full-bleed bg tints for special day cells
const CELL_TINT = {
  [EVENT_TYPES.TEST_DAY]:  'bg-red-100',
  [EVENT_TYPES.MOCK_TEST]: 'bg-orange-100',
  [EVENT_TYPES.TAPER]:     'bg-amber-50',
}

// Detail-panel colors keyed by type
const DETAIL_COLORS = {
  [EVENT_TYPES.TEST_DAY]:        { border: 'border-red-400',    bg: 'bg-red-50',     text: 'text-red-800',    icon: '🎯' },
  [EVENT_TYPES.MOCK_TEST]:       { border: 'border-orange-400', bg: 'bg-orange-50',  text: 'text-orange-800', icon: '📋' },
  [EVENT_TYPES.FRACTIONAL_TEST]: { border: 'border-purple-400', bg: 'bg-purple-50',  text: 'text-purple-800', icon: '📊' },
  [EVENT_TYPES.PI_WORKOUT]:      { border: 'border-blue-400',   bg: 'bg-blue-50',    text: 'text-blue-800',   icon: '📈' },
  [EVENT_TYPES.TAPER]:           { border: 'border-amber-400',  bg: 'bg-amber-50',   text: 'text-amber-800',  icon: '🏖' },
  [EVENT_TYPES.TRAINING]:        { border: 'border-green-400',  bg: 'bg-green-50',   text: 'text-green-800',  icon: '💪' },
}

const PHASE_BANNER_COLORS = {
  [PHASES.PHASE_0]: 'bg-gray-100 border-gray-300 text-gray-700',
  [PHASES.PHASE_1]: 'bg-green-100 border-green-300 text-green-800',
  [PHASES.PHASE_2]: 'bg-blue-100 border-blue-300 text-blue-800',
  [PHASES.PHASE_3]: 'bg-orange-100 border-orange-300 text-orange-800',
  [PHASES.PHASE_4]: 'bg-red-100 border-red-300 text-red-800',
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toISO(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return { year: y, month: m, day: d }
}

function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

// 0=Sun dow of first day of month
function firstDowOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay()
}

function prevMonth(year, month) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
}

function nextMonth(year, month) {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
}

function formatDisplayDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// ── Day Cell ──────────────────────────────────────────────────────────────────

function DayCell({ dateISO, events, isCompleted, isSelected, isToday, inPlanRange, onSelect }) {
  if (!dateISO) {
    return <div className="aspect-square" />
  }

  const { day } = parseISO(dateISO)
  const isPast = dateISO < TODAY

  // Dominant event type for cell tinting (priority order)
  const dominantType = events.find(e => e.type === EVENT_TYPES.TEST_DAY)?.type
    || events.find(e => e.type === EVENT_TYPES.MOCK_TEST)?.type
    || events.find(e => e.type === EVENT_TYPES.TAPER)?.type
    || null

  const tint = dominantType ? CELL_TINT[dominantType] || '' : ''
  const nonTaperEvents = events.filter(e => e.type !== EVENT_TYPES.TAPER)

  return (
    <button
      onClick={() => inPlanRange && onSelect(dateISO)}
      className={[
        'relative flex flex-col items-center justify-start pt-1 pb-1 rounded-lg transition-all min-h-[52px]',
        tint,
        isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : '',
        isToday ? 'font-bold' : '',
        inPlanRange ? 'cursor-pointer active:scale-95' : 'cursor-default opacity-40',
      ].join(' ')}
      aria-label={`${dateISO}${events.length ? `, ${events.length} event(s)` : ''}${isCompleted ? ', completed' : ''}`}
      tabIndex={inPlanRange ? 0 : -1}
    >
      {/* Day number */}
      <span className={[
        'text-xs leading-none mb-0.5',
        isToday ? 'text-blue-600' : isPast && inPlanRange ? 'text-gray-400' : 'text-gray-700',
      ].join(' ')}>
        {day}
      </span>

      {/* Today indicator */}
      {isToday && (
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
      )}

      {/* Completed overlay */}
      {isCompleted && inPlanRange && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="text-green-500 text-lg font-bold leading-none opacity-80">✓</span>
        </span>
      )}

      {/* Event dots (up to 3) */}
      {!isCompleted && nonTaperEvents.length > 0 && (
        <div className="flex gap-0.5 flex-wrap justify-center">
          {nonTaperEvents.slice(0, 3).map((ev, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${EVENT_DOT[ev.type] || 'bg-gray-400'}`}
            />
          ))}
        </div>
      )}

      {/* Taper stripe */}
      {events.some(e => e.type === EVENT_TYPES.TAPER) && nonTaperEvents.length === 0 && (
        <span className="text-amber-400 text-xs leading-none">~</span>
      )}
    </button>
  )
}

// ── Day Detail Panel ──────────────────────────────────────────────────────────

function DayDetail({ dateISO, events, isCompleted, onToggleComplete, onNavigate }) {
  const [expanded, setExpanded] = useState(null)

  const primaryEvent = events[0]
  if (!primaryEvent) return null

  const colors = DETAIL_COLORS[primaryEvent.type] || DETAIL_COLORS[EVENT_TYPES.TRAINING]
  const canComplete = events.some(e =>
    e.type === EVENT_TYPES.TRAINING ||
    e.type === EVENT_TYPES.PI_WORKOUT ||
    e.type === EVENT_TYPES.FRACTIONAL_TEST ||
    e.type === EVENT_TYPES.MOCK_TEST,
  )
  const isPast = dateISO <= TODAY

  return (
    <div className={`rounded-xl border-2 ${colors.border} overflow-hidden`}>
      {/* Header */}
      <div className={`${colors.bg} px-4 py-3 flex items-center justify-between`}>
        <div>
          <div className={`text-sm font-bold ${colors.text}`}>
            {colors.icon} {formatDisplayDate(dateISO)}
          </div>
          <div className={`text-xs ${colors.text} opacity-75 mt-0.5`}>
            {events.length} scheduled event{events.length !== 1 ? 's' : ''}
          </div>
        </div>
        {canComplete && (
          <button
            onClick={onToggleComplete}
            className={[
              'flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all',
              isCompleted
                ? 'bg-green-500 border-green-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:border-green-400 hover:text-green-700',
            ].join(' ')}
          >
            <span>{isCompleted ? '✓' : '○'}</span>
            {isCompleted ? 'Done' : isPast ? 'Mark done' : 'Mark done'}
          </button>
        )}
      </div>

      {/* Events list */}
      <div className="divide-y divide-gray-100">
        {events.map((event, idx) => {
          const ec = DETAIL_COLORS[event.type] || DETAIL_COLORS[EVENT_TYPES.TRAINING]
          const isOpen = expanded === idx

          return (
            <div key={idx}>
              <button
                onClick={() => setExpanded(isOpen ? null : idx)}
                className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden>{ec.icon}</span>
                  <span className="text-sm font-medium text-gray-800">{event.label}</span>
                </div>
                <span className={`text-gray-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {isOpen && (
                <div className={`px-4 pb-4 space-y-2 ${ec.bg}`}>
                  {event.description && (
                    <p className={`text-sm ${ec.text}`}>{event.description}</p>
                  )}
                  {event.target && (
                    <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                        Target
                      </div>
                      <div className="text-sm font-medium text-gray-800">{event.target}</div>
                    </div>
                  )}
                  {event.notes && (
                    <p className="text-xs text-gray-600 italic">{event.notes}</p>
                  )}
                  {event.type === EVENT_TYPES.PI_WORKOUT && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
                      Record in{' '}
                      <button onClick={() => onNavigate('selfcheck')} className="font-bold underline hover:opacity-70 transition-opacity">
                        Self-Check tab
                      </button>{' '}
                      under <strong>Practice Mode - Quick Benchmark</strong>. Your predicted score updates the{' '}
                      <button onClick={() => onNavigate('project')} className="font-bold underline hover:opacity-70 transition-opacity">
                        Trajectory tab
                      </button>{' '}
                      automatically.
                    </div>
                  )}
                  {event.type === EVENT_TYPES.FRACTIONAL_TEST && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-xs text-purple-700">
                      Record in{' '}
                      <button onClick={() => onNavigate('selfcheck')} className="font-bold underline hover:opacity-70 transition-opacity">
                        Self-Check tab
                      </button>{' '}
                      under <strong>Practice Mode - Partial Test</strong>
                      ({Math.round(event.fraction * 100)}%). Predicted full-test scores calculated automatically.
                    </div>
                  )}
                  {event.type === EVENT_TYPES.MOCK_TEST && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-700 font-medium">
                      TR-01: Do this exactly once. After today, shift to taper - cut volume 50%,
                      maintain intensity, rest more.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Month Grid ────────────────────────────────────────────────────────────────

function MonthGrid({ year, month, eventsByDate, completedDays, selectedDate, planStart, planEnd, onSelectDate }) {
  const totalDays = daysInMonth(year, month)
  const startDow = firstDowOfMonth(year, month)

  // Build cell array: nulls for leading empty cells, then day ISOs
  const cells = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => toISO(year, month, i + 1)),
  ]

  // Pad trailing cells to complete final row
  while (cells.length % 7 !== 0) cells.push(null)

  const rows = []
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7))
  }

  return (
    <div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DOW_HEADERS.map(h => (
          <div key={h} className="text-center text-xs font-medium text-gray-400 py-1">
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-7 gap-0.5 mb-0.5">
          {row.map((dateISO, ci) => {
            if (!dateISO) return <div key={ci} className="min-h-[52px]" />

            const events = eventsByDate[dateISO] || []
            const inRange = dateISO >= planStart && dateISO <= planEnd
            return (
              <DayCell
                key={dateISO}
                dateISO={dateISO}
                events={events}
                isCompleted={completedDays.has(dateISO)}
                isSelected={dateISO === selectedDate}
                isToday={dateISO === TODAY}
                inPlanRange={inRange}
                onSelect={onSelectDate}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Main PlanTab ──────────────────────────────────────────────────────────────

export default function PlanTab() {
  const { dcode, demographics, targetPfaDate, scodes, setActiveTab } = useApp()

  const todayParts = parseISO(TODAY)
  const [viewYear,  setViewYear]  = useState(todayParts.year)
  const [viewMonth, setViewMonth] = useState(todayParts.month)
  const [selectedDate, setSelectedDate] = useState(null)
  const [completedDays, setCompletedDays] = useState(() => getCompletedDays())
  const [calendarKey, setCalendarKey] = useState(0)
  const [preferredDays, setPreferredDays] = useState(() => getPreferredDays())
  const [pendingDays, setPendingDays] = useState(() => getPreferredDays())

  const handlePrevMonth = () => {
    const p = prevMonth(viewYear, viewMonth)
    setViewYear(p.year)
    setViewMonth(p.month)
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    const n = nextMonth(viewYear, viewMonth)
    setViewYear(n.year)
    setViewMonth(n.month)
    setSelectedDate(null)
  }

  const handleSelectDate = useCallback((dateISO) => {
    setSelectedDate(prev => prev === dateISO ? null : dateISO)
  }, [])

  const handleToggleComplete = useCallback((dateISO) => {
    toggleCompletedDay(dateISO)
    setCompletedDays(getCompletedDays())
  }, [])

  const handleRegenerate = () => {
    setSelectedDate(null)
    setCalendarKey(k => k + 1)
  }

  const handleToggleDay = useCallback((dow) => {
    setPendingDays(prev =>
      prev.includes(dow)
        ? prev.filter(d => d !== dow)
        : [...prev, dow].sort((a, b) => a - b),
    )
  }, [])

  const handleConfirmDays = useCallback(() => {
    if (pendingDays.length !== 3) return
    savePreferredDays(pendingDays)
    setPreferredDays(pendingDays)
    setSelectedDate(null)
    setCalendarKey(k => k + 1)
  }, [pendingDays])

  // ── Compute current scores from most recent S-code ─────────────────────────
  const currentScores = useMemo(() => {
    if (!scodes?.length || !demographics) return null
    let best = null
    let bestDate = null

    for (const code of scodes) {
      try {
        const decoded = decodeSCode(code)
        const d = decoded.date instanceof Date ? decoded.date : new Date(decoded.date)
        if (!bestDate || d > bestDate) { bestDate = d; best = decoded }
      } catch { /* skip */ }
    }
    if (!best) return null

    const age = calculateAge(demographics.dob, new Date())
    const ageBracket = getAgeBracket(age)
    const { gender } = demographics
    const compScores = {}

    for (const comp of (best.components || [])) {
      if (comp.exempt || !comp.tested) continue
      const result = calculateComponentScore(comp, gender, ageBracket)
      compScores[comp.type] = result?.percentage ?? null
    }

    let composite = null
    const allComps = [COMPONENTS.CARDIO, COMPONENTS.STRENGTH, COMPONENTS.CORE, COMPONENTS.BODY_COMP]
    if (allComps.every(c => compScores[c] != null || (best.components || []).some(x => x.type === c && x.exempt))) {
      try {
        const result = calculateCompositeScore(best.components || [], gender, ageBracket)
        composite = result?.composite ?? null
      } catch { /* ignore */ }
    }

    return {
      composite,
      cardio:   compScores[COMPONENTS.CARDIO]   ?? null,
      strength: compScores[COMPONENTS.STRENGTH] ?? null,
      core:     compScores[COMPONENTS.CORE]      ?? null,
      bodyComp: compScores[COMPONENTS.BODY_COMP] ?? null,
    }
  }, [scodes, demographics])

  // ── Practice session map (for completion state from recorded sessions) ──────
  const practiceSessionMap = useMemo(() => {
    const sessions = getPracticeSessions()
    const map = {}
    for (const s of sessions) {
      if (s.date) map[s.date] = s
    }
    return map
  }, [calendarKey])

  // ── Generate the calendar ─────────────────────────────────────────────────
  const calendar = useMemo(() => {
    if (!targetPfaDate || preferredDays.length !== 3) return null
    return generateCalendar(
      demographics,
      targetPfaDate,
      currentScores,
      TODAY,
      { practiceSessionMap, preferredDays },
    )
  }, [demographics, targetPfaDate, currentScores, practiceSessionMap, preferredDays, calendarKey])

  // ── Status banners ─────────────────────────────────────────────────────────
  const inMockWindow = targetPfaDate ? isMockTestWindow(targetPfaDate, TODAY) : false
  const inTaper      = targetPfaDate ? isInTaperPeriod(targetPfaDate, TODAY) : false
  const daysToTest   = targetPfaDate ? daysBetween(TODAY, targetPfaDate) : null

  // ── Guard: missing prerequisites ──────────────────────────────────────────
  if (!dcode) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Training Plan</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <strong>Profile required.</strong> Set up your D-code in the{' '}
          <button onClick={() => setActiveTab('profile')} className="font-bold underline hover:opacity-70 transition-opacity">
            Profile tab
          </button>. Your age bracket is needed to generate a personalized training plan.
        </div>
      </div>
    )
  }

  if (!targetPfaDate) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Training Plan</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <strong>Target PFA date required.</strong> Set your target date in the{' '}
          <button onClick={() => setActiveTab('profile')} className="font-bold underline hover:opacity-70 transition-opacity">
            Profile tab
          </button>.
        </div>
      </div>
    )
  }

  if (!calendar) {
    // preferredDays not yet chosen - show picker only
    return (
      <div className="bg-white rounded-xl shadow-md p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Training Plan</h2>
        <p className="text-sm text-gray-500 mb-4">
          Choose your three training days to generate a personalized calendar.
        </p>
        {(() => {
          const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
          const DOW_FULL   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
          const n          = pendingDays.length
          const over       = n > 3
          const exact      = n === 3
          const consecutive = hasConsecutiveDays(pendingDays)

          const pipColor = (i) => {
            if (i >= Math.min(n, 3)) return 'bg-gray-200'
            return over ? 'bg-amber-400' : 'bg-blue-500'
          }

          const hint =
            n === 0 ? 'Pick the three days that fit your week best'  :
            n === 1 ? 'Two more to go'                               :
            n === 2 ? 'One more and you are set'                     :
            over    ? 'Rest is part of the plan - drop it to three'  :
            null

          return (
            <div>
              <div className="flex gap-1.5 mb-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${pipColor(i)}`} />
                ))}
              </div>
              <div className={`text-xs mb-2.5 min-h-[1rem] transition-colors leading-snug ${over ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                {hint}
              </div>
              <div className="flex gap-1">
                {DOW_LABELS.map((label, dow) => {
                  const active = pendingDays.includes(dow)
                  return (
                    <button
                      key={dow}
                      onClick={() => handleToggleDay(dow)}
                      className={[
                        'flex-1 py-1.5 rounded text-xs font-semibold transition-colors border',
                        active
                          ? over
                            ? 'bg-amber-400 border-amber-500 text-white'
                            : 'bg-blue-600 border-blue-700 text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600',
                      ].join(' ')}
                      aria-pressed={active}
                      aria-label={`${active ? 'Remove' : 'Add'} ${DOW_FULL[dow]}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              {consecutive && !over && (
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
                  Back-to-back days increase injury risk - spacing workouts aids recovery.
                </div>
              )}
              <button
                onClick={handleConfirmDays}
                disabled={!exact}
                className={[
                  'mt-2.5 w-full py-2 rounded-lg text-xs font-semibold border transition-all',
                  exact
                    ? 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed',
                ].join(' ')}
              >
                Generate my training calendar
              </button>
            </div>
          )
        })()}
      </div>
    )
  }

  const phaseBannerColor = PHASE_BANNER_COLORS[calendar.startingPhase] || PHASE_BANNER_COLORS[PHASES.PHASE_1]

  // Bounds check: is the current view month within plan range?
  const planStart   = TODAY
  const planEnd     = targetPfaDate
  const viewMonthISO = toISO(viewYear, viewMonth, 1)
  const viewEndISO   = toISO(viewYear, viewMonth, daysInMonth(viewYear, viewMonth))
  const canGoPrev = viewMonthISO > planStart.slice(0, 7) + '-01'
  const canGoNext = viewEndISO < planEnd

  // Selected day events
  const selectedEvents = selectedDate ? (calendar.eventsByDate[selectedDate] || []) : []

  // Progress counter
  const totalPlanDays = Object.values(calendar.eventsByDate)
    .flat()
    .filter(e => e.type === EVENT_TYPES.TRAINING || e.type === EVENT_TYPES.PI_WORKOUT || e.type === EVENT_TYPES.FRACTIONAL_TEST || e.type === EVENT_TYPES.MOCK_TEST)
    .map(e => e.date)
  const uniquePlanDays = [...new Set(totalPlanDays)]
  const completedCount = uniquePlanDays.filter(d => completedDays.has(d)).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">Training Plan</h2>
          <button
            onClick={handleRegenerate}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 hover:border-blue-400 rounded-lg px-3 py-1.5 transition-colors"
          >
            Regenerate
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">{daysToTest ?? '-'}</div>
            <div className="text-xs text-gray-500">days out</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-xs text-gray-500">of {uniquePlanDays.length} done</div>
          </div>
          <div className="text-center">
            <div className={`text-xs font-bold px-2 py-1 rounded border ${phaseBannerColor}`}>
              {PHASE_LABELS[calendar.startingPhase]}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">phase</div>
          </div>
        </div>

        {/* Progress bar */}
        {uniquePlanDays.length > 0 && (
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.round((completedCount / uniquePlanDays.length) * 100)}%` }}
            />
          </div>
        )}

        {/* Phase context */}
        <div className={`mt-3 rounded-lg border p-2.5 text-xs ${phaseBannerColor}`}>
          {calendar.isPhase0 && <span className="font-semibold">Pre-Progression: </span>}
          {PHASE_DESCRIPTIONS[calendar.startingPhase]}
        </div>

        {/* Preferred training days picker */}
        {(() => {
          const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
          const DOW_FULL   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
          const n          = pendingDays.length
          const over       = n > 3
          const exact      = n === 3
          const consecutive = hasConsecutiveDays(pendingDays)
          const changed    = pendingDays.join(',') !== preferredDays.join(',')

          // Three-segment progress bar: one pip per slot
          const pipColor = (i) => {
            if (i >= Math.min(n, 3)) return 'bg-gray-200'
            return over ? 'bg-amber-400' : 'bg-blue-500'
          }

          // Hint text below bar
          const hint =
            n === 0 ? 'Pick the three days that fit your week best'  :
            n === 1 ? 'Two more to go'                               :
            n === 2 ? 'One more and you are set'                     :
            over    ? 'Rest is part of the plan - drop it to three'  :
            null

          return (
            <div className="mt-3 pt-3 border-t border-gray-100">
              {/* Three-pip progress bar */}
              <div className="flex gap-1.5 mb-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${pipColor(i)}`}
                  />
                ))}
              </div>

              {/* Status copy */}
              <div className={`text-xs mb-2.5 min-h-[1rem] transition-colors leading-snug ${over ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                {hint}
              </div>

              {/* Day buttons */}
              <div className="flex gap-1">
                {DOW_LABELS.map((label, dow) => {
                  const active = pendingDays.includes(dow)
                  return (
                    <button
                      key={dow}
                      onClick={() => handleToggleDay(dow)}
                      className={[
                        'flex-1 py-1.5 rounded text-xs font-semibold transition-colors border',
                        active
                          ? over
                            ? 'bg-amber-400 border-amber-500 text-white'
                            : 'bg-blue-600 border-blue-700 text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600',
                      ].join(' ')}
                      aria-pressed={active}
                      aria-label={`${active ? 'Remove' : 'Add'} ${DOW_FULL[dow]}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Consecutive-day warning (only when not already showing over-limit warning) */}
              {consecutive && !over && (
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
                  Back-to-back days increase injury risk - spacing workouts aids recovery.
                </div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleConfirmDays}
                disabled={!exact || !changed}
                className={[
                  'mt-2.5 w-full py-2 rounded-lg text-xs font-semibold border transition-all',
                  exact && changed
                    ? 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed',
                ].join(' ')}
              >
                {exact && changed ? 'Confirm training days' : 'Confirm training days'}
              </button>
            </div>
          )
        })()}

        {/* Fitness level summary */}
        {currentScores && (
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {[
              { label: 'Cardio',  score: currentScores.cardio },
              { label: 'Str',     score: currentScores.strength },
              { label: 'Core',    score: currentScores.core },
              { label: 'Body',    score: currentScores.bodyComp },
            ].map(({ label, score }) => {
              const level = getFitnessLevel(score)
              const color = level === FITNESS_LEVELS.HIGH ? 'text-green-600 bg-green-50' :
                            level === FITNESS_LEVELS.MED  ? 'text-amber-600 bg-amber-50' :
                            'text-red-600 bg-red-50'
              return (
                <div key={label} className={`text-center rounded p-1.5 ${color}`}>
                  <div className="text-xs font-semibold">{score != null ? `${Math.round(score)}%` : '-'}</div>
                  <div className="text-xs opacity-70">{label}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Status banners */}
      {inTaper && !inMockWindow && (
        <div className="bg-amber-100 border border-amber-400 rounded-xl px-4 py-3 text-sm text-amber-800">
          <strong>Taper Active</strong> - Volume -50%, intensity maintained. Rest and recover. TR-10.
        </div>
      )}
      {inMockWindow && (
        <div className="bg-orange-100 border border-orange-400 rounded-xl px-4 py-3 text-sm text-orange-800">
          <strong>Mock Test Window</strong> - {daysToTest} days out. One full mock test now, then taper. TR-09.
        </div>
      )}

      {/* Calendar card */}
      <div className="bg-white rounded-xl shadow-md p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handlePrevMonth}
            disabled={!canGoPrev}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous month"
          >
            &#8249;
          </button>
          <span className="text-sm font-semibold text-gray-800">
            {monthLabel(viewYear, viewMonth)}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={!canGoNext}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next month"
          >
            &#8250;
          </button>
        </div>

        <MonthGrid
          year={viewYear}
          month={viewMonth}
          eventsByDate={calendar.eventsByDate}
          completedDays={completedDays}
          selectedDate={selectedDate}
          planStart={planStart}
          planEnd={planEnd}
          onSelectDate={handleSelectDate}
        />

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-x-3 gap-y-1">
          {[
            { dot: 'bg-green-500',  label: 'Training' },
            { dot: 'bg-blue-500',   label: 'Quick Benchmark' },
            { dot: 'bg-purple-500', label: 'Partial Test' },
            { dot: 'bg-orange-500', label: 'Mock' },
            { dot: 'bg-amber-400',  label: 'Taper' },
            { dot: 'bg-red-500',    label: 'Test Day' },
          ].map(({ dot, label }) => (
            <div key={label} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <span className="text-green-500 text-sm font-bold leading-none">✓</span>
            <span className="text-xs text-gray-500">Complete</span>
          </div>
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <DayDetail
          key={selectedDate}
          dateISO={selectedDate}
          events={selectedEvents}
          isCompleted={completedDays.has(selectedDate)}
          onToggleComplete={() => handleToggleComplete(selectedDate)}
          onNavigate={setActiveTab}
        />
      )}

      {selectedDate && selectedEvents.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 text-center text-sm text-gray-500">
          Rest day - no scheduled training on this date.
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500">
        UNOFFICIAL ESTIMATE. For self-assessment only. Not a substitute for official AF fitness
        guidance. All predictions approximate. TR-06.
      </div>

      <div className="h-4" />
    </div>
  )
}
