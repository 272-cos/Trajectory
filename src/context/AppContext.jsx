/**
 * Global App Context for PFA Tracker
 * Manages D-code, S-codes, current tab, and onboarding state
 */

import { createContext, useContext, useState, useEffect } from 'react'
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

    const urlDCode = params.get('d')
    if (urlDCode) {
      try {
        const decoded = decodeDCode(urlDCode)
        setDCode(urlDCode)
        setDemographics(decoded)
        saveDCode(urlDCode)
      } catch (err) {
        console.warn('Invalid D-code in URL:', err.message)
      }
    }

    const urlSCodes = params.getAll('s')
    let scodesChanged = false
    for (const code of urlSCodes) {
      try {
        decodeSCode(code) // validates CRC + structure
        if (!currentSCodes.includes(code)) {
          addSCodeToStorage(code)
          currentSCodes = [...currentSCodes, code]
          scodesChanged = true
        }
      } catch (err) {
        console.warn('Invalid S-code in URL:', err.message)
      }
    }
    if (scodesChanged) {
      setSCodes(currentSCodes)
    }

    const urlTab = params.get('tab')
    if (urlTab) {
      const tabMap = { profile: 'profile', check: 'selfcheck', project: 'project', history: 'history', report: 'report' }
      if (tabMap[urlTab]) setActiveTab(tabMap[urlTab])
    }

    // Clean URL params without reload
    if (params.toString()) {
      window.history.replaceState({}, '', window.location.pathname)
    }

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
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
