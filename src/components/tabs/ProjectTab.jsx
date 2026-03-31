/**
 * Project Tab - PFA readiness projection to target PFA date.
 * Task 4.2: Model selector, per-component gap bars, composite projection,
 * amber warning (PG-08), days remaining + required weekly improvement (PG-07).
 */

import { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from 'recharts'
import { useApp } from '../../context/AppContext.jsx'
import { decodeSCode } from '../../utils/codec/scode.js'
import { generateProjection, AMBER_MARGIN } from '../../utils/projection/projectionEngine.js'
import { COMPONENT_WEIGHTS, COMPONENT_MINIMUMS, EXERCISES, PASSING_COMPOSITE, COMPONENTS } from '../../utils/scoring/constants.js'
import { isDiagnosticPeriod, calculateAge, getAgeBracket } from '../../utils/scoring/constants.js'
import { calculateWHtR, calculateComponentScore, calculateCompositeScore } from '../../utils/scoring/scoringEngine.js'
import { strategyEngine, EXERCISE_NAMES, IMPROVEMENT_UNIT_LABELS, COMPONENT_EXERCISES } from '../../utils/scoring/strategyEngine.js'
import { getRecommendations, generateWeeklyPlan } from '../../utils/recommendations/recommendationEngine.js'
import { getExercisePrefs, saveExercisePrefs, getPracticeSessions, getShowMilestones, setShowMilestones } from '../../utils/storage/localStorage.js'
import { generateCalendar, EVENT_TYPES } from '../../utils/training/trainingCalendar.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a date string for chart labels (noon UTC avoids timezone day shift) */
function formatDateLabel(date, opts = { month: 'short', day: 'numeric' }) {
  const iso = date instanceof Date ? date.toISOString().split('T')[0] : String(date).split('T')[0]
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', opts)
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const COMP_LABELS = {
  cardio:   'Cardio',
  strength: 'Strength',
  core:     'Core',
  bodyComp: 'Body Comp (WHtR)',
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
    [EXERCISES.HRPU]:      'Hand-Release Push-ups',
    [EXERCISES.SITUPS]:    'Sit-ups',
    [EXERCISES.CLRC]:      'Reverse Crunches',
    [EXERCISES.PLANK]:     'Forearm Plank',
    [EXERCISES.WHTR]:      'Waist-to-Height Ratio',
  }
  return names[exercise] || exercise
}

// ─── Projection Trajectory Chart ──────────────────────────────────────────────

function ProjectionChart({ historicalScores, projectedComposite, targetDate, practicePredictions, milestones, showMilestones, onToggleMilestones }) {
  if (historicalScores.length === 0) return null

  // Build chart data: historical points + projected endpoint
  const chartData = historicalScores.map(h => ({
    date: formatDateLabel(h.date),
    rawDate: h.date,
    actual: h.composite,
    projected: null,
    practice: null,
  }))

  // Add projection line: last actual point to projected target
  if (projectedComposite != null && targetDate) {
    const lastActual = historicalScores[historicalScores.length - 1]
    // Bridge point: last historical value as start of projection
    if (chartData.length > 0) {
      chartData[chartData.length - 1].projected = lastActual.composite
    }
    // Projected target point
    chartData.push({
      date: formatDateLabel(targetDate),
      rawDate: targetDate,
      actual: null,
      projected: projectedComposite,
      practice: null,
    })
  }

  // Merge scaled practice data points (dotted overlay)
  const hasPracticeData = practicePredictions && practicePredictions.length > 0
  if (hasPracticeData) {
    practicePredictions.forEach(p => {
      if (p.date && p.predictedComposite != null) {
        const dateLabel = formatDateLabel(p.date)
        // Find existing chart entry for this date or insert a new one
        const existing = chartData.find(d => d.rawDate === p.date)
        if (existing) {
          existing.practice = p.predictedComposite
        } else {
          chartData.push({
            date: dateLabel,
            rawDate: p.date,
            actual: null,
            projected: null,
            practice: p.predictedComposite,
          })
        }
      }
    })
    // Re-sort by date
    chartData.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))
  }

  // Build milestone reference data when overlay is active
  const hasMilestones = showMilestones && milestones
  const taperStartLabel = hasMilestones && milestones.taperStart
    ? formatDateLabel(milestones.taperStart)
    : null
  const targetLabel = targetDate
    ? formatDateLabel(targetDate)
    : null

  // Ensure milestone dates are represented in chart data so reference lines align
  if (hasMilestones) {
    const ensureDate = (dateISO) => {
      if (!dateISO) return
      if (chartData.find(d => d.rawDate === dateISO)) return
      chartData.push({
        date: formatDateLabel(dateISO),
        rawDate: dateISO,
        actual: null,
        projected: null,
        practice: null,
      })
    }

    // Add mock test and fractional test dates to chart data
    if (milestones.mockTestDate) ensureDate(milestones.mockTestDate)
    milestones.fractionalTests?.forEach(ft => ensureDate(ft.date))

    // Re-sort
    chartData.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Score Trajectory</h3>
        {milestones && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <span className="text-xs text-gray-500">Milestones</span>
            <input
              type="checkbox"
              checked={showMilestones}
              onChange={(e) => onToggleMilestones(e.target.checked)}
              className="w-3.5 h-3.5 accent-blue-600 rounded"
            />
          </label>
        )}
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
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
              formatter={(value, name) => [
                value != null ? value.toFixed(1) : '-',
                name === 'actual' ? 'Actual' : name === 'projected' ? 'Projected' : 'Practice (scaled)',
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
            />

            {/* Taper period shaded region */}
            {hasMilestones && taperStartLabel && targetLabel && (
              <ReferenceArea
                x1={taperStartLabel}
                x2={targetLabel}
                fill="#fbbf24"
                fillOpacity={0.12}
                strokeOpacity={0}
              />
            )}

            <ReferenceLine
              y={75}
              stroke="#ef4444"
              strokeDasharray="4 3"
              label={{ value: '75 (Pass)', position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }}
            />

            {/* Mock test vertical reference line */}
            {hasMilestones && milestones.mockTestDate && (
              <ReferenceLine
                x={formatDateLabel(milestones.mockTestDate)}
                stroke="#f97316"
                strokeDasharray="6 2"
                strokeWidth={1.5}
                label={{ value: 'Mock', position: 'insideTopLeft', fontSize: 9, fill: '#f97316' }}
              />
            )}

            {/* Fractional test vertical reference lines */}
            {hasMilestones && milestones.fractionalTests?.map(ft => (
              <ReferenceLine
                key={ft.date}
                x={formatDateLabel(ft.date)}
                stroke="#8b5cf6"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{ value: ft.label, position: 'insideTopLeft', fontSize: 9, fill: '#8b5cf6' }}
              />
            ))}

            {/* Actual scores - solid line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4, fill: '#6366f1', stroke: 'white', strokeWidth: 1.5 }}
              connectNulls={false}
            />
            {/* Projected line - dashed */}
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ r: 5, fill: '#f59e0b', stroke: 'white', strokeWidth: 2 }}
              connectNulls={false}
            />
            {/* Practice scaled data - dotted, translucent */}
            {hasPracticeData && (
              <Line
                type="monotone"
                dataKey="practice"
                stroke="#6b7280"
                strokeWidth={1.5}
                strokeDasharray="2 3"
                dot={{ r: 3, fill: '#9ca3af', stroke: 'white', strokeWidth: 1 }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-3 justify-center mt-2 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-indigo-500" />
          Actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-amber-500 border-dashed" style={{ borderTop: '2px dashed #f59e0b', height: 0 }} />
          Projected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-red-400" style={{ borderTop: '2px dashed #ef4444', height: 0 }} />
          Pass (75)
        </span>
        {hasPracticeData && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-gray-400" style={{ borderTop: '2px dotted #9ca3af', height: 0 }} />
            Practice
          </span>
        )}
        {hasMilestones && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 bg-orange-500" style={{ borderTop: '2px dashed #f97316', height: 0 }} />
              Mock
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 bg-purple-500" style={{ borderTop: '2px dashed #8b5cf6', height: 0 }} />
              Test
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-2.5 bg-amber-300 rounded-sm opacity-40" />
              Taper
            </span>
          </>
        )}
      </div>
    </div>
  )
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

// ─── Weekly Training Plan ──────────────────────────────────────────────────────

const URGENCY_STYLES = {
  urgent:    { card: 'border-red-300 bg-red-50',   badge: 'bg-red-100 text-red-800' },
  standard:  { card: 'border-blue-300 bg-blue-50', badge: 'bg-blue-100 text-blue-800' },
  long_term: { card: 'border-green-300 bg-green-50', badge: 'bg-green-100 text-green-800' },
}

// Tier badge color for a session exercise label
function TierBadge({ tier, isFailing }) {
  if (isFailing || tier === 'failing') {
    return <span className="text-xs px-1 py-0.5 rounded bg-red-100 text-red-700 font-medium ml-1">FOCUS</span>
  }
  if (tier === 'marginal') {
    return <span className="text-xs px-1 py-0.5 rounded bg-amber-100 text-amber-700 font-medium ml-1">BUILD</span>
  }
  return <span className="text-xs px-1 py-0.5 rounded bg-green-100 text-green-700 font-medium ml-1">MAINTAIN</span>
}

// Day type styles
const DAY_TYPE_STYLES = {
  cardio:   { border: 'border-blue-400',  header: 'text-blue-700',  bg: 'bg-blue-50' },
  sc:       { border: 'border-violet-400', header: 'text-violet-700', bg: 'bg-violet-50' },
  recovery: { border: 'border-green-400', header: 'text-green-700', bg: 'bg-green-50' },
  rest:     { border: 'border-gray-200',  header: 'text-gray-400',  bg: 'bg-gray-50' },
}

function WeeklyTrainingPlan({ plan }) {
  const [expanded, setExpanded] = useState(true)
  if (!plan) return null

  const { card: cardStyle, badge: badgeStyle } = URGENCY_STYLES[plan.urgency] ?? URGENCY_STYLES.standard
  const hasFailingItems = plan.planItems.some(p => p.isFailing)
  const schedule = plan.schedule ?? []
  const bodyCompHabits = plan.bodyCompHabits ?? []

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={expanded}
      >
        <h3 className="text-sm font-semibold text-gray-700">Personalized Weekly Training Plan</h3>
        <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Urgency header */}
          <div className={`rounded-lg border p-3 flex items-center gap-3 ${cardStyle}`}>
            <div>
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${badgeStyle}`}>
                {plan.urgencyLabel.toUpperCase()}
              </span>
              <p className="text-sm text-gray-700 mt-1">
                {plan.weeksToTarget} week{plan.weeksToTarget !== 1 ? 's' : ''} to target PFA date
              </p>
            </div>
            {hasFailingItems && (
              <p className="text-xs text-gray-600 ml-auto text-right max-w-[160px]">
                FOCUS sessions target your weakest areas - prioritize these above all else.
              </p>
            )}
          </div>

          {/* 7-day calendar */}
          {schedule.length > 0 && (
            <div className="space-y-2">
              {schedule.map((dayEntry) => {
                const styles = DAY_TYPE_STYLES[dayEntry.type] ?? DAY_TYPE_STYLES.rest
                const isRest = dayEntry.type === 'rest'

                return (
                  <div key={dayEntry.day} className={`rounded-md border-l-4 ${styles.border} pl-3 pr-2 py-2 ${isRest ? 'opacity-50' : ''}`}>
                    {/* Day header row */}
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`text-xs font-bold w-20 shrink-0 ${styles.header}`}>
                        {dayEntry.day}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">
                        {dayEntry.label}
                      </span>
                      {dayEntry.duration && (
                        <span className="text-xs text-gray-400 ml-auto shrink-0">{dayEntry.duration}</span>
                      )}
                    </div>

                    {/* Session exercises */}
                    {dayEntry.sessions.length > 0 && (
                      <ul className="mt-1.5 space-y-1.5 ml-0">
                        {dayEntry.sessions.map((s, si) => (
                          <li key={si} className="text-xs text-gray-600">
                            {s.exerciseLabel && (
                              <span className="font-semibold text-gray-700">
                                {s.exerciseLabel}
                                <TierBadge tier={s.tier} />
                                {': '}
                              </span>
                            )}
                            {s.workout}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Daily habits (body comp) - shown separately since it is not a session */}
          {bodyCompHabits.length > 0 && (
            <div className="border-l-4 border-orange-300 pl-3 pr-2 py-2 rounded-md">
              <p className="text-xs font-semibold text-orange-700 mb-1.5">Daily Habits - Body Composition</p>
              <ul className="space-y-1">
                {bodyCompHabits.map((habit, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                    <span className="text-orange-400 shrink-0">-</span>
                    <span>{habit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer note */}
          <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-2">
            Sessions are 30-45 min and fit a standard work week. Strength and core are always paired on the same day to keep total weekly sessions manageable.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Tab ──────────────────────────────────────────────────────────────────

export default function ProjectTab() {
  const { scodes, demographics, targetPfaDate, updateTargetPfaDate, personalGoal, updatePersonalGoal, setActiveTab } = useApp()
  const [targetDateInput, setTargetDateInput] = useState('')
  const [targetDateError, setTargetDateError] = useState('')
  const [showMilestones, setShowMilestonesState] = useState(() => getShowMilestones())
  const [exercisePrefs, setExercisePrefs] = useState(() => getExercisePrefs())

  const handleToggleMilestones = (checked) => {
    setShowMilestonesState(checked)
    setShowMilestones(checked)
  }

  const handlePrefChange = (component, exercise) => {
    const updated = { ...exercisePrefs }
    if (updated[component] === exercise) {
      delete updated[component]
    } else {
      updated[component] = exercise
    }
    setExercisePrefs(updated)
    saveExercisePrefs(updated)
  }

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
        return [{ ...dec, date: String(dec.date).split('T')[0] }]
      } catch {
        return []
      }
    }).sort((a, b) => (a.date > b.date ? 1 : -1))
  }, [scodes])

  // Run projection engine (always auto-selects best model for data count)
  const projection = useMemo(() => {
    if (!decodedScodes.length || !demographics || !targetPfaDate) return null
    try {
      return generateProjection(decodedScodes, demographics, targetPfaDate)
    } catch {
      return null
    }
  }, [decodedScodes, demographics, targetPfaDate])

  // Compute historical composite scores for the trajectory chart
  const historicalScores = useMemo(() => {
    if (!demographics || decodedScodes.length === 0) return []
    return decodedScodes.map(sc => {
      try {
        const age = calculateAge(demographics.dob, sc.date)
        const ageBracket = getAgeBracket(age)
        const gender = demographics.gender
        const components = []

        if (sc.cardio && !sc.cardio.exempt && sc.cardio.value != null && sc.cardio.exercise !== EXERCISES.WALK_2KM) {
          const result = calculateComponentScore(
            { type: COMPONENTS.CARDIO, exercise: sc.cardio.exercise, value: sc.cardio.value, exempt: false },
            gender, ageBracket
          )
          components.push({ ...result, type: COMPONENTS.CARDIO })
        } else if (sc.cardio?.exempt) {
          components.push({ type: COMPONENTS.CARDIO, exempt: true, tested: false, pass: true })
        }

        if (sc.strength && !sc.strength.exempt && sc.strength.value != null) {
          const result = calculateComponentScore(
            { type: COMPONENTS.STRENGTH, exercise: sc.strength.exercise, value: sc.strength.value, exempt: false },
            gender, ageBracket
          )
          components.push({ ...result, type: COMPONENTS.STRENGTH })
        } else if (sc.strength?.exempt) {
          components.push({ type: COMPONENTS.STRENGTH, exempt: true, tested: false, pass: true })
        }

        if (sc.core && !sc.core.exempt && sc.core.value != null) {
          const result = calculateComponentScore(
            { type: COMPONENTS.CORE, exercise: sc.core.exercise, value: sc.core.value, exempt: false },
            gender, ageBracket
          )
          components.push({ ...result, type: COMPONENTS.CORE })
        } else if (sc.core?.exempt) {
          components.push({ type: COMPONENTS.CORE, exempt: true, tested: false, pass: true })
        }

        if (sc.bodyComp && !sc.bodyComp.exempt && sc.bodyComp.heightInches && sc.bodyComp.waistInches) {
          const whtr = calculateWHtR(sc.bodyComp.waistInches, sc.bodyComp.heightInches)
          const result = calculateComponentScore(
            { type: COMPONENTS.BODY_COMP, exercise: EXERCISES.WHTR, value: whtr, exempt: false },
            gender, ageBracket
          )
          components.push({ ...result, type: COMPONENTS.BODY_COMP })
        } else if (sc.bodyComp?.exempt) {
          components.push({ type: COMPONENTS.BODY_COMP, exempt: true, tested: false, pass: true })
        }

        const comp = calculateCompositeScore(components)
        if (comp && comp.composite != null) {
          return { date: sc.date, composite: comp.composite }
        }
        return null
      } catch {
        return null
      }
    }).filter(Boolean)
  }, [demographics, decodedScodes])

  // Practice session scaled predictions for the dotted overlay (TR-05: not S-codes)
  const practicePredictions = useMemo(() => {
    if (!demographics) return []
    const sessions = getPracticeSessions()
    return sessions.flatMap(session => {
      try {
        if (session.type === 'pi_workout' && session.scaled?.predictedFullValue != null) {
          // PI workout: single exercise prediction, score it against the bracket
          const age = calculateAge(demographics.dob, session.date)
          const ageBracket = getAgeBracket(age)
          const gender = demographics.gender
          const fullEx = session.scaled.fullExercise
          const val = session.scaled.predictedFullValue
          if (!fullEx || val == null) return []
          const compType = [EXERCISES.PUSHUPS, EXERCISES.HRPU].includes(fullEx) ? COMPONENTS.STRENGTH
            : [EXERCISES.SITUPS, EXERCISES.CLRC, EXERCISES.PLANK].includes(fullEx) ? COMPONENTS.CORE
              : fullEx === EXERCISES.RUN_2MILE ? COMPONENTS.CARDIO
                : fullEx === EXERCISES.HAMR ? COMPONENTS.CARDIO
                  : null
          if (!compType) return []
          const result = calculateComponentScore(
            { type: compType, exercise: fullEx, value: val, exempt: false },
            gender, ageBracket
          )
          if (!result?.tested) return []
          // Partial prediction: show as single component points value only (no composite without all 4)
          return [{ date: session.date, predictedComposite: null, componentPct: result.percentage, componentType: compType }]
        }

        if (session.type === 'fractional_test' && session.components) {
          const age = calculateAge(demographics.dob, session.date)
          const ageBracket = getAgeBracket(age)
          const gender = demographics.gender
          const comps = []

          if (session.components.cardio?.scaled?.predictedFullValue != null) {
            const r = calculateComponentScore(
              { type: COMPONENTS.CARDIO, exercise: session.components.cardio.exercise, value: session.components.cardio.scaled.predictedFullValue, exempt: false },
              gender, ageBracket
            )
            if (r?.tested) comps.push({ ...r, type: COMPONENTS.CARDIO })
          }
          if (session.components.strength?.scaled?.predictedFullValue != null) {
            const r = calculateComponentScore(
              { type: COMPONENTS.STRENGTH, exercise: session.components.strength.exercise, value: session.components.strength.scaled.predictedFullValue, exempt: false },
              gender, ageBracket
            )
            if (r?.tested) comps.push({ ...r, type: COMPONENTS.STRENGTH })
          }
          if (session.components.core?.scaled?.predictedFullValue != null) {
            const r = calculateComponentScore(
              { type: COMPONENTS.CORE, exercise: session.components.core.exercise, value: session.components.core.scaled.predictedFullValue, exempt: false },
              gender, ageBracket
            )
            if (r?.tested) comps.push({ ...r, type: COMPONENTS.CORE })
          }

          if (comps.length < 2) return []
          const comp = calculateCompositeScore(comps)
          if (!comp || comp.composite == null) return []
          return [{ date: session.date, predictedComposite: comp.composite }]
        }
        return []
      } catch {
        return []
      }
    }).filter(p => p.predictedComposite != null)
  }, [demographics])

  // Current component percentages from most recent S-code (for gap bar "current" marker)
  const currentPcts = useMemo(() => {
    if (!demographics || decodedScodes.length === 0) return {}
    const latest = decodedScodes[decodedScodes.length - 1]
    const age = calculateAge(demographics.dob, latest.date)
    const ageBracket = getAgeBracket(age)
    const gender = demographics.gender
    const pcts = {}

    try {
      if (latest.cardio && !latest.cardio.exempt && latest.cardio.value != null && latest.cardio.exercise !== EXERCISES.WALK_2KM) {
        const r = calculateComponentScore({ type: COMPONENTS.CARDIO, exercise: latest.cardio.exercise, value: latest.cardio.value, exempt: false }, gender, ageBracket)
        if (r.tested) pcts.cardio = r.percentage
      }
      if (latest.strength && !latest.strength.exempt && latest.strength.value != null) {
        const r = calculateComponentScore({ type: COMPONENTS.STRENGTH, exercise: latest.strength.exercise, value: latest.strength.value, exempt: false }, gender, ageBracket)
        if (r.tested) pcts.strength = r.percentage
      }
      if (latest.core && !latest.core.exempt && latest.core.value != null) {
        const r = calculateComponentScore({ type: COMPONENTS.CORE, exercise: latest.core.exercise, value: latest.core.value, exempt: false }, gender, ageBracket)
        if (r.tested) pcts.core = r.percentage
      }
      if (latest.bodyComp && !latest.bodyComp.exempt && latest.bodyComp.heightInches && latest.bodyComp.waistInches) {
        const whtr = calculateWHtR(latest.bodyComp.waistInches, latest.bodyComp.heightInches)
        const r = calculateComponentScore({ type: COMPONENTS.BODY_COMP, exercise: EXERCISES.WHTR, value: whtr, exempt: false }, gender, ageBracket)
        if (r.tested) pcts.bodyComp = r.percentage
      }
    } catch { /* ignore */ }

    return pcts
  }, [demographics, decodedScodes])

  // Strategy engine analysis from most recent S-code
  const strategyData = useMemo(() => {
    if (!demographics || decodedScodes.length === 0) return null
    const latest = decodedScodes[decodedScodes.length - 1]
    const refDate = targetPfaDate || new Date().toISOString().split('T')[0]
    const age = calculateAge(demographics.dob, refDate)
    const ageBracket = getAgeBracket(age)
    const prefs = exercisePrefs

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
  }, [demographics, decodedScodes, targetPfaDate, exercisePrefs])

  // Weekly training plan input: current component data from most recent S-code
  const weeklyPlan = useMemo(() => {
    if (!decodedScodes.length || !targetPfaDate) return null
    const latest = decodedScodes[decodedScodes.length - 1]
    const data = {}

    if (latest.cardio) {
      if (!latest.cardio.exempt && latest.cardio.exercise !== EXERCISES.WALK_2KM) {
        data.cardio = {
          percentage: currentPcts.cardio ?? null,
          exercise: latest.cardio.exercise,
          exempt: false,
        }
      } else if (latest.cardio.exercise === EXERCISES.WALK_2KM && !latest.cardio.exempt) {
        data.cardio = { percentage: 0, exercise: EXERCISES.WALK_2KM, exempt: false }
      }
      // skip exempt
    }
    if (latest.strength && !latest.strength.exempt) {
      data.strength = {
        percentage: currentPcts.strength ?? null,
        exercise: latest.strength.exercise,
        exempt: false,
      }
    }
    if (latest.core && !latest.core.exempt) {
      data.core = {
        percentage: currentPcts.core ?? null,
        exercise: latest.core.exercise,
        exempt: false,
      }
    }
    if (latest.bodyComp && !latest.bodyComp.exempt && currentPcts.bodyComp != null) {
      data.bodyComp = {
        percentage: currentPcts.bodyComp,
        exercise: EXERCISES.WHTR,
        exempt: false,
      }
    }

    if (Object.keys(data).length === 0) return null
    try {
      return generateWeeklyPlan(data, targetPfaDate)
    } catch {
      return null
    }
  }, [decodedScodes, currentPcts, targetPfaDate])

  // Milestone data for chart overlay (Task 10.3)
  const milestones = useMemo(() => {
    if (!demographics || !targetPfaDate) return null

    const _n = new Date()
    const todayISO = `${_n.getFullYear()}-${String(_n.getMonth() + 1).padStart(2, '0')}-${String(_n.getDate()).padStart(2, '0')}`

    // Build minimal current scores for calendar generation
    const calScores = { composite: null, cardio: null, strength: null, core: null, bodyComp: null }
    if (decodedScodes.length > 0) {
      // Use currentPcts to approximate component scores (percentage scale)
      if (currentPcts.cardio != null) calScores.cardio = currentPcts.cardio
      if (currentPcts.strength != null) calScores.strength = currentPcts.strength
      if (currentPcts.core != null) calScores.core = currentPcts.core
      if (currentPcts.bodyComp != null) calScores.bodyComp = currentPcts.bodyComp
      // Approximate composite
      const vals = [currentPcts.cardio, currentPcts.strength, currentPcts.core, currentPcts.bodyComp].filter(v => v != null)
      if (vals.length > 0) calScores.composite = vals.reduce((a, b) => a + b, 0) / vals.length
    }

    try {
      const cal = generateCalendar(demographics, targetPfaDate, calScores, todayISO)
      if (!cal) return null

      // Extract fractional test dates from event map
      const fractionalTests = []
      const eventsByDate = cal.eventsByDate || {}
      for (const [date, events] of Object.entries(eventsByDate)) {
        for (const evt of events) {
          if (evt.type === EVENT_TYPES.FRACTIONAL_TEST) {
            fractionalTests.push({
              date,
              label: evt.fraction === 0.5 ? '50%' : '75%',
              fraction: evt.fraction,
            })
          }
        }
      }

      return {
        mockTestDate: cal.mockTestDate,
        taperStart: cal.taperStart,
        fractionalTests,
      }
    } catch {
      return null
    }
  }, [demographics, targetPfaDate, decodedScodes, currentPcts])

  // Days to target from today
  const _now = new Date()
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`
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

  // Soft nudge instead of hard gate - show what the tab does, guide toward setup
  if (!demographics || !scodes || scodes.length === 0) {
    const needsProfile = !demographics
    const needsScodes = !scodes || scodes.length === 0
    return (
      <div
        role="tabpanel"
        id="project-panel"
        aria-labelledby="project-tab"
        className="space-y-4"
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Readiness Projection</h3>
          <p className="text-sm text-gray-600 mb-4">
            This tab projects your trajectory to your target PFA date using your self-check history.
            It shows per-component gap bars, weekly improvement targets, and a composite projection chart.
          </p>
          <div className="space-y-2">
            {needsProfile && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-blue-500 font-bold text-sm flex-shrink-0">1</span>
                <p className="text-sm text-blue-800 flex-1">
                  <button type="button" onClick={() => setActiveTab('profile')} className="underline font-medium text-blue-700 hover:text-blue-900">
                    Set up your profile
                  </button>
                  {' '}- DOB and gender (10 seconds)
                </p>
              </div>
            )}
            {needsScodes && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-blue-500 font-bold text-sm flex-shrink-0">{needsProfile ? '2' : '1'}</span>
                <p className="text-sm text-blue-800 flex-1">
                  <button type="button" onClick={() => setActiveTab('selfcheck')} className="underline font-medium text-blue-700 hover:text-blue-900">
                    Complete a self-check
                  </button>
                  {' '}- enter your exercise results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const composite = projection?.composite ?? null

  return (
    <div className="space-y-4">

      {/* ── Target + Goal row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <p className={`text-xs font-medium mt-1 ${
            daysToTarget > 90 ? 'text-green-600' :
            daysToTarget > 30 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {daysToTarget} days remaining
            {daysToTarget <= 30 && ' - act now'}
            {daysToTarget > 30 && daysToTarget <= 90 && ' - steady progression needed'}
            {daysToTarget > 90 && ' - build your foundation now'}
          </p>
        )}
      </div>

      {/* ── Personal goal setting ─────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Personal Score Goal
          <span className="ml-2 text-xs font-normal text-gray-500">
            (minimum is 75.0 to pass)
          </span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="75"
            max="100"
            step="0.5"
            value={personalGoal}
            onChange={e => updatePersonalGoal(parseFloat(e.target.value))}
            className="flex-1 accent-blue-600"
          />
          <span className="text-xl font-bold text-blue-600 w-14 text-right tabular-nums">
            {personalGoal.toFixed(1)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {personalGoal <= 75.5
            ? 'Targeting the minimum passing score.'
            : personalGoal >= 90
              ? 'Excellent - aiming for outstanding performance.'
              : `Aiming ${(personalGoal - 75).toFixed(1)} points above the passing threshold.`
          }
        </p>
      </div>
      </div>{/* close target + goal grid */}

      {/* ── Training exercise preferences ────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">
          Training Exercise Preferences
          <span className="ml-2 text-xs font-normal text-gray-500">
            (used to tailor projection and weekly plan)
          </span>
        </p>
        <div className="space-y-3">
          {[
            { component: COMPONENTS.CARDIO, label: 'Cardio' },
            { component: COMPONENTS.STRENGTH, label: 'Strength' },
            { component: COMPONENTS.CORE, label: 'Core' },
          ].map(({ component, label }) => (
            <div key={component}>
              <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
              <div className="flex flex-wrap gap-2">
                {COMPONENT_EXERCISES[component].map(exercise => {
                  const selected = exercisePrefs[component] === exercise
                  return (
                    <button
                      key={exercise}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => handlePrefChange(component, exercise)}
                      className={[
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                        selected
                          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {EXERCISE_NAMES[exercise] || exercise}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Select the exercises you train for. Unselected means no preference - the engine picks the best option from your last check-in.
        </p>
      </div>

      {/* ── No target date placeholder ────────────────────────────────────── */}
      {!targetPfaDate && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
          Set a target PFA date above to see your readiness projection.
        </div>
      )}

      {targetPfaDate && (
        <>
          {/* ── Diagnostic period warning ──────────────────────────────────── */}
          {isDiagnosticPeriod(targetPfaDate) && (
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 text-sm text-blue-800">
              <strong>Diagnostic Period</strong> - target date is within the Mar-Jun 2026 diagnostic
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
                ? composite.projected >= personalGoal
                  ? 'bg-green-50 border-2 border-green-500'
                  : 'bg-blue-50 border-2 border-blue-400'
                : 'bg-red-50 border-2 border-red-400'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Projected Composite</p>
                  <p className="text-3xl font-bold text-gray-900">{composite.projected.toFixed(1)}</p>
                  <p className={`text-sm font-semibold ${
                    !composite.pass
                      ? 'text-red-700'
                      : composite.projected >= personalGoal
                        ? 'text-green-700'
                        : 'text-blue-700'
                  }`}>
                    {!composite.pass
                      ? 'ON TRACK TO FAIL'
                      : composite.projected >= personalGoal
                        ? `ON TRACK TO MEET GOAL (${personalGoal.toFixed(1)})`
                        : `PASSES BUT BELOW GOAL (${personalGoal.toFixed(1)})`
                    }
                  </p>
                  {composite.pass && personalGoal > 75.0 && composite.projected < personalGoal && (
                    <p className="text-xs text-blue-600 mt-0.5">
                      Need +{(personalGoal - composite.projected).toFixed(1)} more points to reach your goal.
                    </p>
                  )}
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

          {/* ── Trajectory Chart ───────────────────────────────────────── */}
          {historicalScores.length > 0 && (
            <ProjectionChart
              historicalScores={historicalScores}
              projectedComposite={composite?.projected ?? null}
              targetDate={targetPfaDate}
              practicePredictions={practicePredictions}
              milestones={milestones}
              showMilestones={showMilestones}
              onToggleMilestones={handleToggleMilestones}
            />
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

          {/* ── Weekly Training Plan ──────────────────────────────────────── */}
          {weeklyPlan && (
            <WeeklyTrainingPlan plan={weeklyPlan} />
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
