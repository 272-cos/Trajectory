/**
 * Profile Tab - D-code generation and demographics
 */

import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { encodeDCode, decodeDCode } from '../../utils/codec/dcode.js'
import { decodeSCode } from '../../utils/codec/scode.js'
import { GENDER, VALIDATION, calculateAge } from '../../utils/scoring/constants.js'
import AchievementBadges from '../shared/AchievementBadges.jsx'

export default function ProfileTab() {
  const { dcode, demographics, updateDCode, targetPfaDate, updateTargetPfaDate, scodes } = useApp()

  const [dob, setDob] = useState('')
  const [gender, setGender] = useState(GENDER.MALE)
  const [targetDate, setTargetDate] = useState('')
  const [pasteCode, setPasteCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dobError, setDobError] = useState('')
  const [targetDateError, setTargetDateError] = useState('')
  const [highlightTargetDate, setHighlightTargetDate] = useState(false)

  // Load demographics and target date if available
  useEffect(() => {
    if (demographics) {
      setDob(demographics.dob.toISOString().split('T')[0])
      setGender(demographics.gender)
    }
  }, [demographics])

  useEffect(() => {
    if (targetPfaDate) {
      setTargetDate(targetPfaDate)
    }
  }, [targetPfaDate])

  // IV-04: Validate DOB produces age 17-65
  const validateDob = (dobValue) => {
    if (!dobValue) {
      setDobError('')
      return
    }
    const age = calculateAge(dobValue)
    if (age < VALIDATION.AGE_MIN) {
      setDobError('Age must be at least 17 for USAF service.')
    } else if (age > VALIDATION.AGE_MAX) {
      setDobError('Age exceeds maximum USAF service range (65).')
    } else {
      setDobError('')
    }
  }

  const handleDobChange = (e) => {
    const newDob = e.target.value
    setDob(newDob)
    validateDob(newDob)
  }

  // IV-02/IV-03: Validate target PFA date
  const validateTargetDate = (dateValue) => {
    if (!dateValue) {
      setTargetDateError('')
      return true
    }
    const target = new Date(dateValue)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // IV-02: must be after most recent self-check date
    let mostRecentSCodeISO = null
    if (scodes && scodes.length > 0) {
      for (const code of scodes) {
        try {
          const decoded = decodeSCode(code)
          const iso = decoded.date instanceof Date ? decoded.date.toISOString().split('T')[0] : String(decoded.date).split('T')[0]
          if (!mostRecentSCodeISO || iso > mostRecentSCodeISO) mostRecentSCodeISO = iso
        } catch { /* skip invalid */ }
      }
    }

    const todayISO = today.toISOString().split('T')[0]
    const targetISO = target.toISOString().split('T')[0]
    const lowerBoundISO = mostRecentSCodeISO && mostRecentSCodeISO > todayISO ? mostRecentSCodeISO : todayISO

    if (targetISO <= lowerBoundISO) {
      if (mostRecentSCodeISO && mostRecentSCodeISO >= todayISO) {
        const dateStr = new Date(mostRecentSCodeISO + 'T12:00:00').toLocaleDateString()
        setTargetDateError(`Target date must be after your last self-check (${dateStr}).`)
      } else {
        setTargetDateError('Target PFA date must be in the future.')
      }
      return false
    }

    // IV-03: max 365 days out
    const maxDate = new Date(today)
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    if (target > maxDate) {
      setTargetDateError('Target dates beyond 1 year produce unreliable projections.')
      return false
    }

    setTargetDateError('')
    return true
  }

  const handleTargetDateChange = (e) => {
    const newDate = e.target.value
    setTargetDate(newDate)
    if (validateTargetDate(newDate)) {
      updateTargetPfaDate(newDate)
    }
  }

  const handleGenerateDCode = () => {
    setError('')
    setSuccess('')

    if (!dob) {
      setError('Date of birth is required.')
      return
    }

    // IV-04: Validate age range
    const age = calculateAge(dob)
    if (age < VALIDATION.AGE_MIN || age > VALIDATION.AGE_MAX) {
      setError('Date of birth must produce age 17-65 for USAF service range.')
      return
    }

    try {
      const code = encodeDCode({ dob, gender })
      const decoded = decodeDCode(code)
      updateDCode(code, decoded)
      setSuccess(targetDate
        ? 'Profile saved!'
        : 'Profile saved! Set your Target PFA Date when you know it to unlock trajectory projections.'
      )
    } catch {
      setError('Could not generate profile code. Check your date of birth and try again.')
    }
  }

  const handlePasteCode = () => {
    setError('')
    setSuccess('')

    // UX-09: strip whitespace and newlines before decode
    const trimmed = pasteCode.trim().replace(/\s+/g, '')

    if (!trimmed) {
      setError('Please enter a profile code')
      return
    }

    // CS-08 reverse: S-code in D-code field
    if (trimmed.startsWith('S')) {
      setError(<>This is an assessment code. Paste it in the <strong>History tab</strong> instead.</>)
      return
    }

    try {
      const decoded = decodeDCode(trimmed)
      updateDCode(trimmed, decoded)
      setDob(decoded.dob.toISOString().split('T')[0])
      setGender(decoded.gender)
      setPasteCode('')
      if (!targetPfaDate) {
        setSuccess("Profile loaded! Don't forget to set your Target PFA Date.")
        setHighlightTargetDate(true)
        setTimeout(() => document.getElementById('target-date')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
      } else {
        setSuccess('Profile code loaded successfully!')
      }
    } catch {
      setError('Invalid profile code. Check for typos and try again.')
    }
  }

  const copyToClipboard = async () => {
    if (!dcode) return

    try {
      await navigator.clipboard.writeText(dcode)
      setSuccess('Profile code copied to clipboard!')
      setTimeout(() => setSuccess(''), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile</h2>

        <div className="space-y-6">
          {/* Date of Birth */}
          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              id="dob"
              type="date"
              value={dob}
              onChange={handleDobChange}
              aria-invalid={!!dobError}
              aria-describedby={dobError ? 'dob-error' : undefined}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${dobError ? 'border-red-400' : 'border-gray-300'}`}
            />
            {dobError && (
              <p id="dob-error" role="alert" className="text-xs text-red-600 mt-1">{dobError}</p>
            )}
          </div>

          {/* Gender - segmented control matching Self-Check exercise selectors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden" role="group" aria-label="Gender">
              <button
                type="button"
                onClick={() => setGender(GENDER.MALE)}
                aria-pressed={gender === GENDER.MALE}
                className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors min-h-[44px] border-r border-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                  gender === GENDER.MALE
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setGender(GENDER.FEMALE)}
                aria-pressed={gender === GENDER.FEMALE}
                className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                  gender === GENDER.FEMALE
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Female
              </button>
            </div>
          </div>

          {/* Target PFA Date */}
          <div>
            <label htmlFor="target-date" className="block text-sm font-medium text-gray-700 mb-2">
              Target PFA Date
            </label>
            <input
              id="target-date"
              type="date"
              value={targetDate}
              onChange={(e) => { setHighlightTargetDate(false); handleTargetDateChange(e) }}
              min={new Date().toISOString().split('T')[0]}
              aria-invalid={!!targetDateError}
              aria-describedby={targetDateError ? 'target-date-error' : 'target-date-hint'}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                targetDateError
                  ? 'border-red-400'
                  : highlightTargetDate
                  ? 'border-amber-500 ring-2 ring-amber-300 ring-offset-1 animate-pulse'
                  : 'border-gray-300'
              }`}
            />
            {targetDateError ? (
              <p id="target-date-error" role="alert" className="text-xs text-red-600 mt-1">{targetDateError}</p>
            ) : (
              <p id="target-date-hint" className="text-xs text-gray-600 mt-1">
                Set your upcoming official PFA date to see your trajectory
              </p>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateDCode}
            disabled={!dob}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Save Profile
          </button>

          {/* Success Message */}
          {success && (
            <div role="status" className={`p-3 border rounded-lg text-sm ${highlightTargetDate ? 'bg-gray-100 border-gray-400 text-amber-900' : 'bg-green-50 border-green-200 text-green-800'}`}>
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Display D-Code */}
          {dcode && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Your Profile Code</p>
              <p className="text-xs text-gray-500 mb-2">A short code that stores your DOB and gender. Share it to sync your profile across devices.</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-lg text-blue-900 flex-1">{dcode}</p>
                <button
                  onClick={copyToClipboard}
                  aria-label="Copy profile code to clipboard"
                  className="px-3 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Save this code to load your profile on other devices.
              </p>
            </div>
          )}
          {/* Load Existing Profile */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Load Existing Profile</h3>
            <div className="space-y-3">
              <input
                id="paste-dcode"
                type="text"
                value={pasteCode}
                onChange={(e) => setPasteCode(e.target.value)}
                placeholder="Paste your profile code here"
                aria-label="Paste your existing profile code here"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
              <button
                onClick={handlePasteCode}
                disabled={!pasteCode.trim()}
                className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Load Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reference link */}
      <div className="text-center">
        <p className="text-xs text-gray-400">
          Scoring based on{' '}
          <a
            href="https://www.e-publishing.af.mil/Product-Index/#/?view=pubs&orgID=10141&catID=1&series=65&modID=449&tabID=131"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            DAFMAN 36-2905
          </a>
          {' '}(Change 1, 22 Jan 2026)
        </p>
      </div>

      {/* Achievement Badges */}
      <AchievementBadges />
    </div>
  )
}
