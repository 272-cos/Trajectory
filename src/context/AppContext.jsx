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

  // Load data from localStorage on mount
  useEffect(() => {
    const storedDCode = getDCode()
    if (storedDCode) {
      setDCode(storedDCode)
      // Decode D-code to populate demographics
      try {
        const decoded = decodeDCode(storedDCode)
        setDemographics(decoded)
      } catch (err) {
        console.error('Error decoding stored D-code:', err)
      }
    }

    const storedSCodes = getSCodes()
    setSCodes(storedSCodes)

    const storedTargetDate = getTargetDate()
    if (storedTargetDate) {
      setTargetPfaDate(storedTargetDate)
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
