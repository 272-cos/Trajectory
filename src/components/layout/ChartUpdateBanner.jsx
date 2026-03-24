/**
 * Chart Update Banner (EC-24)
 * Reminds users that provisional scoring charts may have been updated.
 * Dismissible per session and per chart version - the banner reappears
 * whenever CHART_VERSION in constants.js is bumped.
 */

import { useState } from 'react'
import { CHART_VERSION } from '../../utils/scoring/constants.js'

const SESSION_KEY = `pfa_chart_banner_dismissed_${CHART_VERSION}`

export default function ChartUpdateBanner() {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  )

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-blue-50 border-b border-blue-200 px-4 py-2"
    >
      <div className="container mx-auto max-w-4xl lg:max-w-6xl flex items-center justify-between gap-3">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">Charts:</span> Using {CHART_VERSION} scoring tables.{' '}
          <a
            href="https://afpc.af.mil"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            Check afpc.af.mil for updates.
          </a>
        </p>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss chart version notice"
          className="text-blue-600 hover:text-blue-800 text-lg leading-none p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
