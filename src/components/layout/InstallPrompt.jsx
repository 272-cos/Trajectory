/**
 * Install Prompt - PWA "Add to Home Screen" prompt
 * - Android/Chrome: Uses beforeinstallprompt event for native install flow
 * - iOS Safari: Detects platform and shows manual instructions (Share > Add to Home Screen)
 * - Already installed (standalone): Hidden
 */

import { useState, useEffect } from 'react'

/** Detect iOS Safari (not Chrome-on-iOS, not already in standalone mode) */
function isIOSSafari() {
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)
  return isIOS && isSafari
}

/** Check if app is already running as installed PWA */
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Skip if already installed as PWA
    if (isStandalone()) return

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // iOS Safari: show guide after short delay (no native event fires)
    if (isIOSSafari()) {
      const timer = setTimeout(() => setShowIOSGuide(true), 2000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }

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

  if (dismissed) return null

  // Android/Chrome native install prompt
  if (deferredPrompt) {
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

  // iOS Safari manual install guide
  if (showIOSGuide) {
    return (
      <div
        role="dialog"
        aria-labelledby="ios-install-title"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-40"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p id="ios-install-title" className="text-sm font-medium text-gray-900">Add to Home Screen</p>
            <p className="text-xs text-gray-500 mt-0.5">Install Trajectory for offline access</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss install guide"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            &times;
          </button>
        </div>
        <ol className="mt-3 space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">1</span>
            <span>Tap the <strong>Share</strong> button <span className="inline-block text-blue-500" aria-label="share icon">(box with arrow)</span> in Safari</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">2</span>
            <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">3</span>
            <span>Tap <strong>Add</strong> to confirm</span>
          </li>
        </ol>
        <button
          onClick={() => setDismissed(true)}
          className="mt-3 w-full text-xs text-gray-500 hover:text-gray-700 py-2 transition-colors"
        >
          Got it
        </button>
      </div>
    )
  }

  return null
}
