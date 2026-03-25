/**
 * PFA Countdown - persistent countdown to target PFA date
 */

import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'

function daysBetween(dateA, dateB) {
  const a = new Date(dateA + 'T00:00:00')
  const b = new Date(dateB + 'T00:00:00')
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

function getLocalToday() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

export default function PfaCountdown() {
  const { targetPfaDate, setActiveTab } = useApp()

  const info = useMemo(() => {
    if (!targetPfaDate) return null
    const today = getLocalToday()
    const days = daysBetween(today, targetPfaDate)
    const weeks = Math.floor(Math.abs(days) / 7)
    const remainDays = Math.abs(days) % 7
    return { days, weeks, remainDays }
  }, [targetPfaDate])

  if (!targetPfaDate) {
    return (
      <div className="container mx-auto max-w-4xl lg:max-w-6xl px-4">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className="w-full py-2 text-xs text-blue-600 hover:text-blue-800 text-center"
        >
          Set your PFA date to see countdown
        </button>
      </div>
    )
  }

  if (!info) return null

  const { days, weeks, remainDays } = info
  const isPast = days < 0
  const isClose = days >= 0 && days < 30
  const isMedium = days >= 30 && days < 60

  let colorClasses, label
  if (isPast) {
    colorClasses = 'bg-gray-100 text-gray-600 border-gray-300'
    label = 'PFA date passed - update in Profile'
  } else if (isClose) {
    colorClasses = 'bg-red-50 text-red-800 border-red-300'
    label = days === 0 ? 'PFA is today' : `${days} day${days !== 1 ? 's' : ''} until PFA`
  } else if (isMedium) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-300'
    label = `${weeks}w ${remainDays}d until PFA`
  } else {
    colorClasses = 'bg-green-50 text-green-800 border-green-300'
    label = `${weeks}w ${remainDays}d until PFA`
  }

  // Progress ring: fills as date approaches (180 days = empty, 0 = full)
  const maxDays = 180
  const progress = isPast ? 1 : Math.min(Math.max((maxDays - days) / maxDays, 0), 1)
  const circumference = 2 * Math.PI * 10
  const dashOffset = circumference * (1 - progress)
  const ringColor = isPast ? '#9ca3af' : isClose ? '#ef4444' : isMedium ? '#f59e0b' : '#22c55e'

  return (
    <div className="container mx-auto max-w-4xl lg:max-w-6xl px-4">
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${colorClasses}`}>
        <svg width="28" height="28" viewBox="0 0 24 24" className="flex-shrink-0">
          <circle cx="12" cy="12" r="10" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
          <circle
            cx="12" cy="12" r="10" fill="none"
            stroke={ringColor} strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 12 12)"
          />
        </svg>
        <span className="font-medium">{label}</span>
      </div>
    </div>
  )
}
