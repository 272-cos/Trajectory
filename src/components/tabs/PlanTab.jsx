/**
 * Plan Tab - Training Plan Calendar (Task 10.2)
 *
 * Displays a personalized, periodized training calendar from today to the
 * target PFA date. Blocked until D-code + target PFA date are set.
 *
 * Features:
 * - Week-by-week calendar grid with phase context
 * - PI Workout days, Fractional Test days, Mock Test, Taper period, Test Day
 * - Tappable events that expand to show prescriptions
 * - Practice session completion checkmarks
 * - Phase 0 (deconditioned path) detection
 * - Regenerate button when target PFA date changes
 */

import { useState, useMemo, useCallback } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { decodeSCode } from '../../utils/codec/scode.js'
import { calculateCompositeScore, calculateComponentScore } from '../../utils/scoring/scoringEngine.js'
import { COMPONENTS, calculateAge, getAgeBracket } from '../../utils/scoring/constants.js'
import { getPracticeSessions } from '../../utils/storage/localStorage.js'
import {
  generateCalendar,
  PHASES,
  PHASE_LABELS,
  PHASE_DESCRIPTIONS,
  EVENT_TYPES,
  FITNESS_LEVELS,
  getFitnessLevel,
  daysBetween,
} from '../../utils/training/trainingCalendar.js'
import { isMockTestWindow, isInTaperPeriod } from '../../utils/training/practiceSession.js'

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

const EVENT_COLORS = {
  [EVENT_TYPES.TEST_DAY]:        { bg: 'bg-red-100 border-red-400',   text: 'text-red-800',   icon: '🎯', badge: 'bg-red-500 text-white' },
  [EVENT_TYPES.MOCK_TEST]:       { bg: 'bg-orange-100 border-orange-400', text: 'text-orange-800', icon: '📋', badge: 'bg-orange-500 text-white' },
  [EVENT_TYPES.FRACTIONAL_TEST]: { bg: 'bg-purple-100 border-purple-400', text: 'text-purple-800', icon: '📊', badge: 'bg-purple-500 text-white' },
  [EVENT_TYPES.PI_WORKOUT]:      { bg: 'bg-blue-100 border-blue-400',  text: 'text-blue-800',  icon: '📈', badge: 'bg-blue-500 text-white' },
  [EVENT_TYPES.TAPER]:           { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-800', icon: '🏖', badge: 'bg-amber-400 text-white' },
  [EVENT_TYPES.TRAINING]:        { bg: 'bg-green-50 border-green-300', text: 'text-green-800', icon: '💪', badge: 'bg-green-500 text-white' },
  [EVENT_TYPES.REST]:            { bg: 'bg-gray-50 border-gray-200',   text: 'text-gray-500',  icon: '😴', badge: 'bg-gray-400 text-white' },
}

const PHASE_COLORS = {
  [PHASES.PHASE_0]: 'text-gray-700 bg-gray-100 border-gray-300',
  [PHASES.PHASE_1]: 'text-green-700 bg-green-50 border-green-300',
  [PHASES.PHASE_2]: 'text-blue-700 bg-blue-50 border-blue-300',
  [PHASES.PHASE_3]: 'text-orange-700 bg-orange-50 border-orange-300',
  [PHASES.PHASE_4]: 'text-red-700 bg-red-50 border-red-300',
}

const PHASE_BANNER_COLORS = {
  [PHASES.PHASE_0]: 'bg-gray-100 border-gray-300 text-gray-700',
  [PHASES.PHASE_1]: 'bg-green-100 border-green-300 text-green-800',
  [PHASES.PHASE_2]: 'bg-blue-100 border-blue-300 text-blue-800',
  [PHASES.PHASE_3]: 'bg-orange-100 border-orange-300 text-orange-800',
  [PHASES.PHASE_4]: 'bg-red-100 border-red-300 text-red-800',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDisplayDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatShortDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isPast(isoDate) {
  return isoDate < TODAY
}

// ── Event Card ─────────────────────────────────────────────────────────────────

function EventCard({ event, isExpanded, onToggle }) {
  const colors = EVENT_COLORS[event.type] || EVENT_COLORS[EVENT_TYPES.TRAINING]
  const past = isPast(event.date)

  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all ${colors.bg} ${past ? 'opacity-60' : ''}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      aria-expanded={isExpanded}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0" aria-hidden="true">{colors.icon}</span>
          <div className="min-w-0">
            <div className={`text-sm font-semibold leading-tight ${colors.text}`}>
              {event.label}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {formatDisplayDate(event.date)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {event.completed && (
            <span className="text-green-600 text-sm font-bold" title="Completed">✓</span>
          )}
          {event.type !== EVENT_TYPES.TAPER && event.type !== EVENT_TYPES.REST && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors.badge}`}>
              {event.type === EVENT_TYPES.TEST_DAY ? 'TEST' :
               event.type === EVENT_TYPES.MOCK_TEST ? 'MOCK' :
               event.type === EVENT_TYPES.FRACTIONAL_TEST ? `${Math.round(event.fraction * 100)}%` :
               event.type === EVENT_TYPES.PI_WORKOUT ? 'PI' :
               event.type === EVENT_TYPES.TRAINING ? 'TRAIN' : ''}
            </span>
          )}
          <span className={`text-gray-400 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2">
          {event.description && (
            <p className={`text-sm ${colors.text}`}>{event.description}</p>
          )}
          {event.target && (
            <div className="bg-white bg-opacity-60 rounded p-2">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Target</div>
              <div className="text-sm font-medium text-gray-800">{event.target}</div>
            </div>
          )}
          {event.notes && (
            <p className="text-xs text-gray-600 italic">{event.notes}</p>
          )}
          {event.type === EVENT_TYPES.FRACTIONAL_TEST && (
            <div className="bg-white bg-opacity-60 rounded p-2 text-xs text-gray-600">
              Go to the Self-Check tab and enable Practice Mode, then select Fractional Test
              ({Math.round(event.fraction * 100)}%) to record your results. Your predicted full-test
              scores will be calculated automatically.
            </div>
          )}
          {event.type === EVENT_TYPES.PI_WORKOUT && (
            <div className="bg-white bg-opacity-60 rounded p-2 text-xs text-gray-600">
              Go to the Self-Check tab and enable Practice Mode, then select PI Workout to record
              your result. Your predicted full-test score will update the Trajectory tab.
            </div>
          )}
          {event.type === EVENT_TYPES.MOCK_TEST && (
            <div className="bg-white bg-opacity-60 rounded p-2 text-xs text-orange-700 font-medium">
              TR-01: Do this mock test exactly once. After today, shift to taper mode. Reduce
              training volume by 50% and avoid hard efforts until test day.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Week Row ──────────────────────────────────────────────────────────────────

function WeekRow({ week, eventsByDate, expandedEvents, onToggleEvent }) {
  const phaseColor = PHASE_COLORS[week.phase] || PHASE_COLORS[PHASES.PHASE_1]
  const isCurrentWeek = week.weekStart <= TODAY && TODAY <= week.weekEnd

  // Gather all events for this week's days
  const weekDates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(week.weekStart + 'T12:00:00')
    d.setDate(d.getDate() + i)
    weekDates.push(d.toISOString().split('T')[0])
  }

  const weekEvents = weekDates.flatMap(d => eventsByDate[d] || [])
  const hasEvents = weekEvents.length > 0

  if (!hasEvents && !isCurrentWeek) {
    // Still show the week row but compact for rest weeks
    return (
      <div className={`rounded-lg border p-3 ${isCurrentWeek ? 'ring-2 ring-blue-400' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCurrentWeek && (
              <span className="text-xs font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">NOW</span>
            )}
            <span className="text-sm text-gray-500">
              Week {week.weekNumber} ({formatShortDate(week.weekStart)} - {formatShortDate(week.weekEnd)})
            </span>
          </div>
          <span className="text-xs text-gray-400">{week.weeksToTarget}w out - Rest week</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${isCurrentWeek ? 'border-blue-400 shadow-md' : 'border-gray-200'}`}>
      {/* Week header */}
      <div className={`flex items-center justify-between px-4 py-2 ${isCurrentWeek ? 'bg-blue-50' : 'bg-gray-50'} border-b border-gray-200`}>
        <div className="flex items-center gap-2">
          {isCurrentWeek && (
            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">THIS WEEK</span>
          )}
          <span className="text-sm font-semibold text-gray-700">
            Week {week.weekNumber}
          </span>
          <span className="text-xs text-gray-500">
            {formatShortDate(week.weekStart)} - {formatShortDate(week.weekEnd)}
          </span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded border ${phaseColor}`}>
          {PHASE_LABELS[week.phase]}
        </span>
      </div>

      {/* Week events */}
      <div className="p-3 space-y-2">
        {weekEvents.map((event, idx) => {
          const key = `${event.date}-${event.type}-${idx}`
          return (
            <EventCard
              key={key}
              event={event}
              isExpanded={expandedEvents.has(key)}
              onToggle={() => onToggleEvent(key)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Main PlanTab ──────────────────────────────────────────────────────────────

export default function PlanTab() {
  const { dcode, demographics, targetPfaDate, scodes } = useApp()
  const [expandedEvents, setExpandedEvents] = useState(new Set())
  const [calendarKey, setCalendarKey] = useState(0) // increment to regenerate

  const handleToggleEvent = useCallback((key) => {
    setExpandedEvents(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const handleRegenerate = () => {
    setExpandedEvents(new Set())
    setCalendarKey(k => k + 1)
  }

  // ── Compute current scores from most recent S-code ─────────────────────────
  const currentScores = useMemo(() => {
    if (!scodes?.length || !demographics) return null
    let best = null
    let bestDate = null

    for (const code of scodes) {
      try {
        const decoded = decodeSCode(code)
        const d = decoded.date instanceof Date ? decoded.date : new Date(decoded.date)
        if (!bestDate || d > bestDate) {
          bestDate = d
          best = decoded
        }
      } catch {
        // skip invalid
      }
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

    // Attempt composite
    let composite = null
    const allComps = [COMPONENTS.CARDIO, COMPONENTS.STRENGTH, COMPONENTS.CORE, COMPONENTS.BODY_COMP]
    if (allComps.every(c => compScores[c] != null || (best.components || []).some(x => x.type === c && x.exempt))) {
      try {
        const result = calculateCompositeScore(best.components || [], gender, ageBracket)
        composite = result?.composite ?? null
      } catch {
        // ignore
      }
    }

    return {
      composite,
      cardio:   compScores[COMPONENTS.CARDIO]    ?? null,
      strength: compScores[COMPONENTS.STRENGTH]  ?? null,
      core:     compScores[COMPONENTS.CORE]       ?? null,
      bodyComp: compScores[COMPONENTS.BODY_COMP]  ?? null,
    }
  }, [scodes, demographics])

  // ── Build practice session map (date -> session) ───────────────────────────
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
    if (!targetPfaDate) return null
    return generateCalendar(
      demographics,
      targetPfaDate,
      currentScores,
      TODAY,
      { practiceSessionMap },
    )
  }, [demographics, targetPfaDate, currentScores, practiceSessionMap, calendarKey])

  // ── Status banners ─────────────────────────────────────────────────────────
  const inMockWindow = targetPfaDate ? isMockTestWindow(targetPfaDate, TODAY) : false
  const inTaper      = targetPfaDate ? isInTaperPeriod(targetPfaDate, TODAY) : false
  const daysToTest   = targetPfaDate ? daysBetween(TODAY, targetPfaDate) : null

  // ── Guard: missing prerequisites ──────────────────────────────────────────
  if (!dcode) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Training Plan</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <strong>Profile required.</strong> Set up your profile (D-code) in the Profile tab first.
            Your age bracket is needed to generate a personalized training plan.
          </div>
        </div>
      </div>
    )
  }

  if (!targetPfaDate) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Training Plan</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <strong>Target PFA date required.</strong> Set your target PFA date in the Profile tab.
            The calendar will generate a personalized plan based on weeks remaining.
          </div>
        </div>
      </div>
    )
  }

  if (!calendar) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Training Plan</h2>
          <p className="text-gray-500 text-sm">Generating your personalized calendar...</p>
        </div>
      </div>
    )
  }

  const phaseLabel      = PHASE_LABELS[calendar.startingPhase]
  const phaseDesc       = PHASE_DESCRIPTIONS[calendar.startingPhase]
  const phaseBannerColor = PHASE_BANNER_COLORS[calendar.startingPhase] || PHASE_BANNER_COLORS[PHASES.PHASE_1]

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">Training Plan</h2>
          <button
            onClick={handleRegenerate}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-300 hover:border-blue-500 rounded-lg px-3 py-1.5 transition-colors"
            title="Regenerate calendar based on current data"
          >
            Regenerate
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">{daysToTest ?? '-'}</div>
            <div className="text-xs text-gray-500">days to test</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">{calendar.totalWeeks}</div>
            <div className="text-xs text-gray-500">weeks total</div>
          </div>
          <div className="text-center">
            <div className={`text-sm font-bold px-2 py-1 rounded ${phaseBannerColor}`}>
              {phaseLabel}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">current phase</div>
          </div>
        </div>

        {/* Phase description */}
        <div className={`rounded-lg border p-3 text-sm ${phaseBannerColor}`}>
          {calendar.isPhase0 && (
            <p className="font-semibold mb-1">Pre-Progression Path Active</p>
          )}
          <p>{phaseDesc}</p>
        </div>

        {/* Fitness level summary */}
        {currentScores && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { label: 'Cardio',    score: currentScores.cardio },
              { label: 'Strength',  score: currentScores.strength },
              { label: 'Core',      score: currentScores.core },
              { label: 'Body Comp', score: currentScores.bodyComp },
            ].map(({ label, score }) => {
              const level = getFitnessLevel(score)
              const color = level === FITNESS_LEVELS.HIGH ? 'text-green-600' :
                            level === FITNESS_LEVELS.MED  ? 'text-amber-600' :
                            'text-red-600'
              return (
                <div key={label} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1.5">
                  <span className="text-xs text-gray-600">{label}</span>
                  <span className={`text-xs font-semibold ${color}`}>
                    {score != null ? `${Math.round(score)}%` : 'No data'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {!currentScores && (
          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            No self-check data found. Calendar uses Phase 0 defaults. Complete a Self-Check to
            receive personalized training targets.
          </div>
        )}
      </div>

      {/* Status banners */}
      {inTaper && !inMockWindow && (
        <div className="bg-amber-100 border border-amber-400 rounded-xl p-4 text-sm text-amber-800">
          <strong>Taper Period Active.</strong> Reduce training volume by 50%. Maintain intensity but
          cut frequency. Focus on sleep, hydration, and recovery. TR-10.
        </div>
      )}

      {inMockWindow && (
        <div className="bg-orange-100 border border-orange-400 rounded-xl p-4 text-sm text-orange-800">
          <strong>Mock Test Window ({daysToTest} days out).</strong> Consider running your full mock
          test now - one time only. After your mock test, shift to taper mode. TR-09: This is
          informational only.
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Event Types</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { type: EVENT_TYPES.TRAINING,        label: 'Training Day' },
            { type: EVENT_TYPES.PI_WORKOUT,      label: 'PI Workout' },
            { type: EVENT_TYPES.FRACTIONAL_TEST, label: 'Fractional Test' },
            { type: EVENT_TYPES.MOCK_TEST,       label: 'Mock Test' },
            { type: EVENT_TYPES.TAPER,           label: 'Taper Period' },
            { type: EVENT_TYPES.TEST_DAY,        label: 'Test Day' },
          ].map(({ type, label }) => {
            const colors = EVENT_COLORS[type]
            return (
              <div key={type} className="flex items-center gap-1.5">
                <span className="text-base" aria-hidden="true">{colors.icon}</span>
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500">
        UNOFFICIAL ESTIMATE. This training plan is for self-assessment purposes only. Not a
        substitute for official AF fitness guidance. All predictions are approximate. TR-06.
      </div>

      {/* Calendar weeks */}
      <div className="space-y-3">
        {calendar.weeks.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center text-gray-500 text-sm">
            Your target PFA date is too close to generate a training calendar.
            Complete your mock test and follow taper guidance above.
          </div>
        )}

        {calendar.weeks.map((week) => (
          <WeekRow
            key={`week-${week.weekNumber}`}
            week={week}
            eventsByDate={calendar.eventsByDate}
            expandedEvents={expandedEvents}
            onToggleEvent={handleToggleEvent}
          />
        ))}

        {/* Test Day card */}
        {calendar.targetDate && (
          <div className="rounded-xl border-2 border-red-400 overflow-hidden">
            <div className="bg-red-50 px-4 py-2 border-b border-red-200">
              <span className="text-sm font-bold text-red-800">Test Day - {formatDisplayDate(calendar.targetDate)}</span>
            </div>
            <div className="p-3">
              {(calendar.eventsByDate[calendar.targetDate] || []).map((event, idx) => {
                const key = `${event.date}-${event.type}-${idx}`
                return (
                  <EventCard
                    key={key}
                    event={event}
                    isExpanded={expandedEvents.has(key)}
                    onToggle={() => handleToggleEvent(key)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom spacer */}
      <div className="h-4" />
    </div>
  )
}
