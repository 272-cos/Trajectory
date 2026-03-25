/**
 * Achievement Badges display component
 */

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { BADGES, TIER, evaluateAchievements } from '../../utils/achievements/achievements.js'

const TIER_ORDER = [TIER.GOLD, TIER.SILVER, TIER.BRONZE]

const TIER_STYLES = {
  [TIER.GOLD]: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700', icon: 'text-yellow-500', label: 'Advanced' },
  [TIER.SILVER]: { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-700', icon: 'text-gray-400', label: 'Steady' },
  [TIER.BRONZE]: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700', icon: 'text-orange-400', label: 'Starter' },
}

// Simple inline SVG icons per badge
const BADGE_ICONS = {
  first_check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  consistent: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  dedicated: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  veteran: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  passing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  strong: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  elite: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  improving: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  streak_3: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  well_rounded: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      <path d="M2 12h20" />
    </svg>
  ),
  max_component: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  speed_demon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  iron_core: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5z" />
      <path d="M16 8L2 22M17.5 15H9" />
    </svg>
  ),
  push_power: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M18.364 5.636a9 9 0 11-12.728 0M12 3v9" />
    </svg>
  ),
}

function BadgeCard({ badge, earned, onClick }) {
  const style = TIER_STYLES[badge.tier]
  return (
    <button
      type="button"
      onClick={() => onClick(badge)}
      aria-label={`${badge.name}${earned ? '' : ' (locked)'}`}
      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 min-h-[44px] transition-all ${
        earned
          ? `${style.bg} ${style.border} ${style.icon}`
          : 'bg-gray-100 border-gray-200 text-gray-300 opacity-50'
      }`}
    >
      {BADGE_ICONS[badge.id] || BADGE_ICONS.first_check}
    </button>
  )
}

export default function AchievementBadges() {
  const { scodes, demographics } = useApp()
  const [selectedBadge, setSelectedBadge] = useState(null)

  const earnedIds = useMemo(() => {
    if (!scodes || scodes.length === 0) return []
    return evaluateAchievements(scodes, demographics)
  }, [scodes, demographics])

  const earnedSet = useMemo(() => new Set(earnedIds), [earnedIds])

  if (!scodes || scodes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Milestones</h3>
        <p className="text-sm text-gray-500">Your milestones will appear here as you log assessments. Every check-in builds the picture.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Milestones</h3>
        <span className="text-xs text-gray-500">{earnedIds.length} / {BADGES.length}</span>
      </div>

      {/* Badge tooltip */}
      {selectedBadge && (
        <div className={`mb-3 p-3 rounded-lg border ${TIER_STYLES[selectedBadge.tier].bg} ${TIER_STYLES[selectedBadge.tier].border}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-bold ${TIER_STYLES[selectedBadge.tier].text}`}>{selectedBadge.name}</p>
              <p className="text-xs text-gray-600">{selectedBadge.description}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${TIER_STYLES[selectedBadge.tier].text}`}>
              {TIER_STYLES[selectedBadge.tier].label}
            </span>
          </div>
        </div>
      )}

      {/* Badge grid by tier */}
      {TIER_ORDER.map(tier => {
        const tierBadges = BADGES.filter(b => b.tier === tier)
        return (
          <div key={tier} className="mb-3 last:mb-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              {TIER_STYLES[tier].label}
            </p>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
              {tierBadges.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={earnedSet.has(badge.id)}
                  onClick={setSelectedBadge}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
