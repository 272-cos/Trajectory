/**
 * Global App Context for PFA Tracker
 * Manages D-code, S-codes, current tab, onboarding state, and toast notifications
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
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
} from '../utils/storage/localStorage.js'
import { decodeDCode } from '../utils/codec/dcode.js'
import { decodeSCode } from '../utils/codec/scode.js'

const AppContext = createContext(null)

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
  const [darkMode, setDarkModeState] = useState(false)

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

    const urlDCode = params.get('d')
    if (urlDCode) {
      try {
        const decoded = decodeDCode(urlDCode)
        dCodeSchemaVersion = decoded.schemaVersion
        setDCode(urlDCode)
        setDemographics(decoded)
        saveDCode(urlDCode)
      } catch (err) {
        // EC-28: error per bad param, still load valid params
        hydrationErrors.push(`Invalid D-code in URL: ${err.message}`)
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
      } catch (err) {
        // EC-28: error per bad param, still load valid params
        hydrationErrors.push(`Invalid S-code in URL: ${err.message}`)
      }
    }
    if (scodesChanged) {
      setSCodes(currentSCodes)
    }

    // EC-29: warn on mismatched schema versions across d/s params
    if (dCodeSchemaVersion != null && sCodeSchemaVersions.length > 0) {
      const mismatchedVersions = sCodeSchemaVersions.filter(v => v !== dCodeSchemaVersion)
      if (mismatchedVersions.length > 0) {
        hydrationErrors.push('D-code and S-code schema versions differ. Codes loaded independently but may be from different app versions.')
      }
    }

    const urlTab = params.get('tab')
    if (urlTab) {
      const tabMap = { profile: 'profile', check: 'selfcheck', project: 'project', plan: 'plan', history: 'history', report: 'report', tools: 'tools' }
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

    // Load dark mode preference
    const storedDark = getDarkMode()
    setDarkModeState(storedDark)

    // Load personal goal
    const storedGoal = getPersonalGoal()
    setPersonalGoalState(storedGoal)

    // Show onboarding if first visit
    if (!isOnboarded()) {
      setShowOnboarding(true)
    }
  }, [])

  // Save D-code to localStorage when it changes
  const updateDCode = (newDCode, decodedData = null) => {
    setDCode(newDCode)
    setDemographics(decodedData)
    if (newDCode) {
      saveDCode(newDCode)
    }
  }

  // Add S-code to list
  const addSCode = (scode) => {
    if (scode && !scodes.includes(scode)) {
      const updated = [...scodes, scode]
      setSCodes(updated)
      addSCodeToStorage(scode)
    }
  }

  // Remove S-code from list
  const removeSCode = (scode) => {
    const updated = scodes.filter(s => s !== scode)
    setSCodes(updated)
    removeSCodeFromStorage(scode)
  }

  // Update target PFA date
  const updateTargetPfaDate = (date) => {
    setTargetPfaDate(date)
    if (date) {
      saveTargetDate(date)
    }
  }

  // Complete onboarding
  const completeOnboarding = () => {
    setShowOnboarding(false)
    setOnboarded()
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkModeState(next)
    saveDarkMode(next)
  }

  // Update personal goal
  const updatePersonalGoal = (goal) => {
    const clamped = Math.max(75.0, Math.min(100.0, goal))
    setPersonalGoalState(clamped)
    savePersonalGoal(clamped)
  }

  const value = {
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
  }

  return (
    <AppContext.Provider value={value}>
      {children}
      {/* Self-check unsaved data warning modal */}
      {pendingTabNavigation !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setActiveTab(pendingTabNavigation)
            setPendingTabNavigation(null)
            setSuppressSelfCheckWarning(true)
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Results not saved</h3>
            <p className="text-sm text-gray-600 mb-5">
              Your self-check results have not been saved. Save your assessment before leaving.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const success = triggerSelfCheckGenerate()
                  if (success) {
                    setActiveTab(pendingTabNavigation)
                    setPendingTabNavigation(null)
                  } else {
                    setPendingTabNavigation(null)
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                Save Assessment
              </button>
              <button
                onClick={() => {
                  setActiveTab(pendingTabNavigation)
                  setPendingTabNavigation(null)
                  setSuppressSelfCheckWarning(true)
                }}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 transition-colors"
              >
                Leave without saving
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast container - renders above all content */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
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
                className="text-current opacity-60 hover:opacity-100 font-bold"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
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
