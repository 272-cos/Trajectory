/**
 * ROIBreakdownPanel - transparent per-component ROI math.
 *
 * Replaces the "Personalized Weekly Training Plan" block (which duplicated
 * PlanTab content) with a walkthrough of the numbers behind the ranking:
 *   A) Per-component: current pts, projected pts, delta, per-unit ROI label.
 *   B) Composite formula: sum(component pts) substituted with live values.
 *   C) ROI ranking derivation: points-per-week marginal cost curve explaining
 *      why a given exercise ranks above another.
 *
 * All math is read from strategyEngine + projectionEngine output; this file
 * is display-only and computes nothing new.
 */

import { useState } from 'react'
import {
  EXERCISE_NAMES,
  IMPROVEMENT_UNIT_LABELS,
} from '../../utils/scoring/strategyEngine.js'
import { COMPONENT_WEIGHTS, COMPONENTS } from '../../utils/scoring/constants.js'

const COMPONENT_LABELS = {
  [COMPONENTS.CARDIO]:    'Cardio',
  [COMPONENTS.STRENGTH]:  'Strength',
  [COMPONENTS.CORE]:      'Core',
  [COMPONENTS.BODY_COMP]: 'Body Comp',
}

const COMPONENT_ORDER = [
  COMPONENTS.CARDIO,
  COMPONENTS.STRENGTH,
  COMPONENTS.CORE,
  COMPONENTS.BODY_COMP,
]

function Section({ title, children }) {
  return (
    <div className="border-t border-gray-100 pt-3 first:border-0 first:pt-0">
      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{title}</h4>
      {children}
    </div>
  )
}

function PerComponentTable({ rankedItems, projection }) {
  if (!rankedItems || rankedItems.length === 0) {
    return <p className="text-xs text-gray-500">No component data yet. Log a self-check to see the breakdown.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200">
            <th className="py-1 pr-2 font-medium">Component</th>
            <th className="py-1 px-2 font-medium text-right">Current</th>
            <th className="py-1 px-2 font-medium text-right">Projected</th>
            <th className="py-1 px-2 font-medium text-right">Delta</th>
            <th className="py-1 pl-2 font-medium">Per-unit gain</th>
          </tr>
        </thead>
        <tbody>
          {rankedItems.map(item => {
            const proj = projection?.components?.[item.component] ?? null
            const projected = proj?.projected_points ?? null
            const delta = projected != null
              ? Math.round((projected - item.currentPts) * 10) / 10
              : null
            const unitLabel = IMPROVEMENT_UNIT_LABELS[item.exercise] ?? 'per unit'
            const perUnit = item.alreadyMaxed
              ? 'maxed'
              : item.unitsNeeded > 0
                ? `${unitLabel} = +${(item.ptsGain / item.unitsNeeded).toFixed(1)} pts`
                : `${unitLabel} = +${item.ptsGain.toFixed(1)} pts`

            return (
              <tr key={item.component} className="border-b border-gray-50 last:border-0">
                <td className="py-1.5 pr-2">
                  <div className="font-medium text-gray-700">{COMPONENT_LABELS[item.component]}</div>
                  <div className="text-gray-400 text-[10px]">{EXERCISE_NAMES[item.exercise]}</div>
                </td>
                <td className="py-1.5 px-2 text-right text-gray-700 font-mono">
                  {item.currentPts.toFixed(1)}/{item.componentMaxPts}
                </td>
                <td className="py-1.5 px-2 text-right text-gray-700 font-mono">
                  {projected != null ? `${projected.toFixed(1)}/${item.componentMaxPts}` : '-'}
                </td>
                <td className={`py-1.5 px-2 text-right font-mono ${delta != null && delta > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                  {delta != null ? (delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)) : '-'}
                </td>
                <td className="py-1.5 pl-2 text-gray-600">{perUnit}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-[11px] text-gray-400 mt-2 italic">
        Current and Projected are measured against each component's max. Projected is the point value predicted at your target PFA date.
      </p>
    </div>
  )
}

function CompositeFormula({ rankedItems, currentComposite, projectedComposite, targetComposite }) {
  if (!rankedItems || rankedItems.length === 0) return null

  const parts = COMPONENT_ORDER
    .map(comp => rankedItems.find(r => r.component === comp))
    .filter(Boolean)

  const missing = COMPONENT_ORDER.filter(comp => !rankedItems.find(r => r.component === comp))
  const substituted = parts
    .map(p => `${p.currentPts.toFixed(1)}`)
    .join(' + ')

  const maxSubstituted = parts
    .map(p => `${COMPONENT_WEIGHTS[p.component]}`)
    .join(' + ')

  const earned = parts.reduce((sum, p) => sum + p.currentPts, 0)
  const possible = parts.reduce((sum, p) => sum + COMPONENT_WEIGHTS[p.component], 0)
  const computed = possible > 0 ? Math.round((earned / possible) * 1000) / 10 : null

  return (
    <div className="space-y-2">
      <div className="bg-gray-50 rounded p-2 font-mono text-[11px] text-gray-700 leading-relaxed">
        <div>composite = (sum of earned component pts) / (sum of possible) * 100</div>
        <div className="mt-1">= ({substituted}) / ({maxSubstituted}) * 100</div>
        <div className="mt-1">
          = <span className="font-semibold">{earned.toFixed(1)}</span> / <span>{possible}</span> * 100
          {computed != null && (
            <> = <span className="font-semibold text-blue-700">{computed.toFixed(1)}</span></>
          )}
        </div>
      </div>
      {missing.length > 0 && (
        <p className="text-[11px] text-amber-700">
          Not all 4 components recorded yet ({missing.map(c => COMPONENT_LABELS[c]).join(', ')} missing). Composite shown uses only tested components; a full composite requires all four.
        </p>
      )}
      {currentComposite != null && computed != null && Math.abs(currentComposite - computed) > 0.2 && (
        <p className="text-[11px] text-gray-500">
          Live composite from scoring engine: <span className="font-semibold">{currentComposite.toFixed(1)}</span> (may differ slightly due to weighting for exempt components).
        </p>
      )}
      {projectedComposite != null && (
        <p className="text-[11px] text-gray-600">
          Projected at target date: <span className="font-semibold">{projectedComposite.toFixed(1)}</span>
          {targetComposite != null && (
            <> - your goal is <span className="font-semibold">{targetComposite.toFixed(1)}</span>.</>
          )}
        </p>
      )}
    </div>
  )
}

function RankingDerivation({ rankedItems }) {
  if (!rankedItems || rankedItems.length === 0) return null

  const improvable = rankedItems.filter(r => r.status === 'improvable')
  const maxed = rankedItems.filter(r => r.status !== 'improvable')

  if (improvable.length === 0) {
    return (
      <p className="text-xs text-gray-500">
        Every tested component is effectively maxed. No ROI ranking needed.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600 leading-relaxed">
        Ranking is <span className="font-semibold">points gained per training week</span> to reach each exercise's next scoring threshold. Higher ROI means the same hour of training buys more points here than elsewhere.
      </p>
      <ol className="space-y-1.5">
        {improvable.map((item, idx) => {
          const isTop = idx === 0
          const reason = item.belowMinimum
            ? 'below component minimum - must improve to pass'
            : isTop
              ? 'highest points per training week at your current level'
              : `below #${idx} by ${((improvable[idx - 1].roi - item.roi)).toFixed(2)} pts/wk`

          return (
            <li
              key={item.component}
              className={`text-xs rounded border p-2 ${isTop ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="font-semibold text-gray-700">
                  #{idx + 1} {EXERCISE_NAMES[item.exercise]}
                </span>
                <span className="font-mono text-gray-600">
                  +{item.ptsGain.toFixed(1)} pts / ~{item.effortWeeks.toFixed(1)}wk = <span className="font-semibold text-blue-700">{item.roi.toFixed(2)} pts/wk</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">{reason}</p>
              {item.belowMinimum && (
                <p className="text-[11px] text-red-700 mt-0.5">
                  Currently below the passing minimum - prioritize this regardless of ROI.
                </p>
              )}
            </li>
          )
        })}
      </ol>
      {maxed.length > 0 && (
        <p className="text-[11px] text-gray-400 italic">
          Not ranked: {maxed.map(m => EXERCISE_NAMES[m.exercise]).join(', ')} (already at or near max).
        </p>
      )}
    </div>
  )
}

export default function ROIBreakdownPanel({
  rankedItems,
  projection,
  currentComposite,
  projectedComposite,
  targetComposite,
}) {
  const [expanded, setExpanded] = useState(true)

  if (!rankedItems || rankedItems.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={expanded}
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-700">ROI Breakdown</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">How the ranking math works, with your numbers substituted.</p>
        </div>
        <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-4">
          <Section title="A. Per-component points">
            <PerComponentTable rankedItems={rankedItems} projection={projection} />
          </Section>

          <Section title="B. Composite formula">
            <CompositeFormula
              rankedItems={rankedItems}
              currentComposite={currentComposite}
              projectedComposite={projectedComposite}
              targetComposite={targetComposite}
            />
          </Section>

          <Section title="C. ROI ranking">
            <RankingDerivation rankedItems={rankedItems} />
          </Section>
        </div>
      )}
    </div>
  )
}
