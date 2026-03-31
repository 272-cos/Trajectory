/**
 * Global App Context for PFA Tracker
 * Manages D-code, S-codes, current tab, onboarding state, and toast notifications
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  getDCode,
  saveDCode,
  getSCodes,
  addSCode as addSCodeToStorage,
  removeSCode as removeSCodeFromStorage,
  getTargetDate,
  saveTargetDate,
  isOnboarded,
  setOnboarded,
  getDarkMode,
  saveDarkMode,
  getPersonalGoal,
  savePersonalGoal,
  onStorageError,
} from '../utils/storage/localStorage.js'
import { decodeDCode } from '../utils/codec/dcode.js'
import { decodeSCode } from '../utils/codec/scode.js'

const AppContext = createContext(null)

/** Focus-trapped modal for unsaved self-check warning */
function UnsavedWarningModal({ onSave, onLeave, onCancel }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    dialogRef.current?.focus()
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="presentation"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-warning-title"
        tabIndex={-1}
        className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4 w-full focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="unsaved-warning-title" className="text-lg font-bold text-gray-900 mb-2">Results not saved</h3>
        <p className="text-sm text-gray-600 mb-5">
          Your self-check results have not been saved. Save your assessment before leaving.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Save Assessment
          </button>
          <button
            onClick={onLeave}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 transition-colors"
          >
            Leave without saving
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppProvider({ children }) {
  // D-code (demographics): DOB + gender
  const [dcode, setDCode] = useState(null)
  const [demographics, setDemographics] = useState(null) // Decoded D-code data

  // S-codes (self-checks): Array of assessment codes
  const [scodes, setSCodes] = useState([])

  // Target PFA date
  const [targetPfaDate, setTargetPfaDate] = useState(null)

  // Current active tab
  const [activeTab, setActiveTab] = useState('profile')

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Dark mode
  const [darkMode, setDarkModeState] = useState(true)

  // Personal score goal (default 75.0)
  const [personalGoal, setPersonalGoalState] = useState(75.0)

  // Toast notifications (EC-28: surface URL hydration errors to user)
  const [toasts, setToasts] = useState([])

  // Self-check unsaved data warning
  const [selfCheckDirty, setSelfCheckDirty] = useState(false)
  const [pendingTabNavigation, setPendingTabNavigation] = useState(null)
  const [suppressSelfCheckWarning, setSuppressSelfCheckWarning] = useState(false)
  const selfCheckGeneratorRef = useRef(null)

  const registerSelfCheckGenerator = useCallback((fn) => {
    selfCheckGeneratorRef.current = fn
  }, [])

  const triggerSelfCheckGenerate = useCallback(() => {
    if (selfCheckGeneratorRef.current) {
      return selfCheckGeneratorRef.current()
    }
    return false
  }, [])

  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Load data from localStorage on mount, then hydrate from URL params
  useEffect(() => {
    // Wire up storage error notifications to toast system
    onStorageError((msg) => {
      setToasts(prev => [...prev, { id: Date.now() + Math.random(), message: msg, type: 'error' }])
    })

    // 1. Load from localStorage
    const storedDCode = getDCode()
    if (storedDCode) {
      setDCode(storedDCode)
      try {
        const decoded = decodeDCode(storedDCode)
        setDemographics(decoded)
      } catch (err) {
        console.error('Error decoding stored D-code:', err)
      }
    }

    let currentSCodes = getSCodes()
    setSCodes(currentSCodes)

    const storedTargetDate = getTargetDate()
    if (storedTargetDate) {
      setTargetPfaDate(storedTargetDate)
    }

    // 2. URL hydration - overrides/merges with localStorage
    const params = new URLSearchParams(window.location.search)
    const hydrationErrors = []
    let dCodeSchemaVersion = null
    const sCodeSchemaVersions = []

    // Reject unreasonably large query strings to prevent DoS-style abuse
    if (window.location.search.length > 8192) {
      console.warn('URL query string too large; skipping hydration.')
      return
    }

    const urlDCode = params.get('d')
    if (urlDCode) {
      try {
        const decoded = decodeDCode(urlDCode)
        dCodeSchemaVersion = decoded.schemaVersion
        setDCode(urlDCode)
        setDemographics(decoded)
        saveDCode(urlDCode)
      } catch {
        // EC-28: error per bad param, still load valid params
        hydrationErrors.push('Invalid Profile Code in URL. Check for typos or regenerate from the Profile tab.')
      }
    }

    const urlSCodes = params.getAll('s')
    let scodesChanged = false
    for (const code of urlSCodes) {
      try {
        const decoded = decodeSCode(code)
        sCodeSchemaVersions.push(decoded.schemaVersion)
        if (!currentSCodes.includes(code)) {
          addSCodeToStorage(code)
          currentSCodes = [...currentSCodes, code]
          scodesChanged = true
        }
      } catch {
        // EC-28: error per bad param, still load valid params
        hydrationErrors.push('An Assessment Code in the URL was invalid and could not be loaded.')
      }
    }
    if (scodesChanged) {
      setSCodes(currentSCodes)
    }

    // EC-29: warn on mismatched schema versions across d/s params
    if (dCodeSchemaVersion != null && sCodeSchemaVersions.length > 0) {
      const mismatchedVersions = sCodeSchemaVersions.filter(v => v !== dCodeSchemaVersion)
      if (mismatchedVersions.length > 0) {
        hydrationErrors.push('Profile Code and Assessment Code schema versions differ. Codes loaded independently but may be from different app versions.')
      }
    }

    const urlTab = params.get('tab')
    if (urlTab) {
      const tabMap = { profile: 'profile', check: 'selfcheck', project: 'project', plan: 'project', history: 'history', report: 'history', tools: 'tools' }
      if (tabMap[urlTab]) setActiveTab(tabMap[urlTab])
    }

    // Clean URL params without reload
    if (params.toString()) {
      window.history.replaceState({}, '', window.location.pathname)
    }

    // Surface hydration errors as toasts (EC-28, EC-29)
    for (const errMsg of hydrationErrors) {
      // Use setTimeout to allow state init before adding toasts
      setTimeout(() => {
        setToasts(prev => [...prev, {
          id: Date.now() + Math.random(),
          message: errMsg,
          type: 'error',
        }])
      }, 100)
    }

    // Auto-dismiss hydration error toasts after 8 seconds
    if (hydrationErrors.length > 0) {
      setTimeout(() => {
        setToasts([])
      }, 8000)
    }

    // Load dark mode: saved preference wins; otherwise default dark, then
    // try system preference (light scheme flips to light). If matchMedia
    // is unavailable or throws, stay dark - user can toggle manually.
    const hasStoredPref = localStorage.getItem('pfa_dark_mode') !== null
    if (hasStoredPref) {
      setDarkModeState(getDarkMode())
    } else {
      let useDark = true
      try {
        if (window.matchMedia?.('(prefers-color-scheme: light)')?.matches) {
          useDark = false
        }
      } catch { /* matchMedia unavailable - keep dark */ }
      setDarkModeState(useDark)
    }

    // Load personal goal
    const storedGoal = getPersonalGoal()
    setPersonalGoalState(storedGoal)

    // Show onboarding if first visit
    if (!isOnboarded()) {
      setShowOnboarding(true)
    }
  }, [])

  // Warn on browser tab close if Self-Check has unsaved data
  const selfCheckDirtyRef = useRef(false)
  useEffect(() => { selfCheckDirtyRef.current = selfCheckDirty }, [selfCheckDirty])
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (selfCheckDirtyRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Save D-code to localStorage when it changes
  const updateDCode = useCallback((newDCode, decodedData = null) => {
    setDCode(newDCode)
    setDemographics(decodedData)
    if (newDCode) {
      saveDCode(newDCode)
    }
  }, [])

  // Add S-code to list (functional updater avoids stale closure on scodes)
  const addSCode = useCallback((scode) => {
    if (!scode) return
    setSCodes(prev => {
      if (prev.includes(scode)) return prev
      addSCodeToStorage(scode)
      return [...prev, scode]
    })
  }, [])

  // Remove S-code from list
  const removeSCode = useCallback((scode) => {
    setSCodes(prev => prev.filter(s => s !== scode))
    removeSCodeFromStorage(scode)
  }, [])

  // Update target PFA date
  const updateTargetPfaDate = useCallback((date) => {
    setTargetPfaDate(date)
    if (date) {
      saveTargetDate(date)
    }
  }, [])

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    setShowOnboarding(false)
    setOnboarded()
  }, [])

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setDarkModeState(prev => {
      const next = !prev
      saveDarkMode(next)
      return next
    })
  }, [])

  // Update personal goal
  const updatePersonalGoal = useCallback((goal) => {
    const clamped = Math.max(75.0, Math.min(100.0, goal))
    setPersonalGoalState(clamped)
    savePersonalGoal(clamped)
  }, [])

  const value = useMemo(() => ({
    // D-code
    dcode,
    demographics,
    updateDCode,

    // S-codes
    scodes,
    addSCode,
    removeSCode,

    // Target PFA date
    targetPfaDate,
    updateTargetPfaDate,

    // Navigation
    activeTab,
    setActiveTab,

    // Onboarding
    showOnboarding,
    completeOnboarding,

    // Toast notifications
    toasts,
    addToast,
    dismissToast,

    // Dark mode
    darkMode,
    toggleDarkMode,

    // Personal score goal
    personalGoal,
    updatePersonalGoal,

    // Self-check unsaved data warning
    selfCheckDirty,
    setSelfCheckDirty,
    pendingTabNavigation,
    setPendingTabNavigation,
    suppressSelfCheckWarning,
    setSuppressSelfCheckWarning,
    registerSelfCheckGenerator,
    triggerSelfCheckGenerate,
  }), [
    dcode, demographics, updateDCode,
    scodes, addSCode, removeSCode,
    targetPfaDate, updateTargetPfaDate,
    activeTab,
    showOnboarding, completeOnboarding,
    toasts, addToast, dismissToast,
    darkMode, toggleDarkMode,
    personalGoal, updatePersonalGoal,
    selfCheckDirty, pendingTabNavigation, suppressSelfCheckWarning,
    registerSelfCheckGenerator, triggerSelfCheckGenerate,
  ])

  return (
    <AppContext.Provider value={value}>
      {children}
      {/* Self-check unsaved data warning modal */}
      {pendingTabNavigation !== null && (
        <UnsavedWarningModal
          onSave={() => {
            const success = triggerSelfCheckGenerate()
            if (success) {
              setActiveTab(pendingTabNavigation)
              setPendingTabNavigation(null)
            } else {
              setPendingTabNavigation(null)
            }
          }}
          onLeave={() => {
            setActiveTab(pendingTabNavigation)
            setPendingTabNavigation(null)
            setSuppressSelfCheckWarning(true)
          }}
          onCancel={() => setPendingTabNavigation(null)}
        />
      )}
      {/* Toast container - always present for aria-live registration */}
      <div role="status" aria-live="polite" className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-3 rounded-lg shadow-lg text-sm flex items-start gap-2 ${
              toast.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : toast.type === 'warning'
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                  : 'bg-green-50 border border-green-200 text-green-800'
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-current opacity-60 hover:opacity-100 font-bold"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
