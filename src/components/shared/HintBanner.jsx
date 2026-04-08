/**
 * HintBanner - First-visit contextual hint, dismissible, localStorage-backed.
 * Appears once per feature area and stays dismissed permanently.
 */

import { useState } from 'react'

export default function HintBanner({ storageKey, title, bullets }) {
  const [visible, setVisible] = useState(() => {
    try { return localStorage.getItem(storageKey) !== 'dismissed' } catch { return true }
  })

  if (!visible) return null

  const handleDismiss = () => {
    try { localStorage.setItem(storageKey, 'dismissed') } catch { /* quota or private mode */ }
    setVisible(false)
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{title}</p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss hint"
          className="flex-shrink-0 text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 text-xl leading-none transition-colors"
        >
          &times;
        </button>
      </div>
      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 mt-1.5" aria-hidden="true" />
            {b}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handleDismiss}
        className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium transition-colors"
      >
        Got it
      </button>
    </div>
  )
}
