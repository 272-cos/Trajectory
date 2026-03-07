/**
 * Install Prompt - PWA "Add to Home Screen" prompt on supported browsers
 */

import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  if (!deferredPrompt || dismissed) return null

  return (
    <div
      role="dialog"
      aria-labelledby="install-prompt-title"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-40"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p id="install-prompt-title" className="text-sm font-medium text-gray-900">Install Trajectory</p>
          <p className="text-xs text-gray-500 mt-0.5">Add to your home screen for offline access</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss install prompt"
          className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          &times;
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-sm text-gray-600 hover:text-gray-800 py-2.5 px-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
