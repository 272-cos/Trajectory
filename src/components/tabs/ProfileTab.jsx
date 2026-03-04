/**
 * Profile Tab - D-code generation and demographics
 */

import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { encodeDCode, decodeDCode } from '../../utils/codec/dcode.js'
import { GENDER, calculateAge } from '../../utils/scoring/constants.js'

export default function ProfileTab() {
  const { dcode, demographics, updateDCode, targetPfaDate, updateTargetPfaDate } = useApp()

  const [dob, setDob] = useState('')
  const [gender, setGender] = useState(GENDER.MALE)
  const [targetDate, setTargetDate] = useState('')
  const [pasteCode, setPasteCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dobError, setDobError] = useState('')
  const [targetDateError, setTargetDateError] = useState('')

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
    if (age < 17) {
      setDobError('Age must be at least 17 for USAF service.')
    } else if (age > 65) {
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

    if (target <= today) {
      setTargetDateError('Target PFA date must be in the future.')
      return false
    }

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
    if (age < 17 || age > 65) {
      setError('Date of birth must produce age 17-65 for USAF service range.')
      return
    }

    try {
      const code = encodeDCode({ dob, gender })
      const decoded = decodeDCode(code)
      updateDCode(code, decoded)
      setSuccess('D-Code generated successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  const handlePasteCode = () => {
    setError('')
    setSuccess('')

    if (!pasteCode.trim()) {
      setError('Please enter a D-code')
      return
    }

    try {
      const decoded = decodeDCode(pasteCode.trim())
      updateDCode(pasteCode.trim(), decoded)
      setDob(decoded.dob.toISOString().split('T')[0])
      setGender(decoded.gender)
      setPasteCode('')
      setSuccess('D-Code loaded successfully!')
    } catch (err) {
      setError('Invalid D-code: ' + err.message)
    }
  }

  const copyToClipboard = async () => {
    if (!dcode) return

    try {
      await navigator.clipboard.writeText(dcode)
      setSuccess('D-Code copied to clipboard!')
      setTimeout(() => setSuccess(''), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile</h2>

        <div className="space-y-6">
          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={handleDobChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${dobError ? 'border-red-400' : 'border-gray-300'}`}
            />
            {dobError && (
              <p className="text-xs text-red-600 mt-1">{dobError}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value={GENDER.MALE}
                  checked={gender === GENDER.MALE}
                  onChange={(e) => setGender(e.target.value)}
                  className="mr-2"
                />
                Male
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value={GENDER.FEMALE}
                  checked={gender === GENDER.FEMALE}
                  onChange={(e) => setGender(e.target.value)}
                  className="mr-2"
                />
                Female
              </label>
            </div>
          </div>

          {/* Target PFA Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target PFA Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={handleTargetDateChange}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${targetDateError ? 'border-red-400' : 'border-gray-300'}`}
            />
            {targetDateError ? (
              <p className="text-xs text-red-600 mt-1">{targetDateError}</p>
            ) : (
              <p className="text-xs text-gray-600 mt-1">
                Set your upcoming official PFA date to see your trajectory
              </p>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateDCode}
            disabled={!dob}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Generate D-Code
          </button>

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Display D-Code */}
          {dcode && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Your D-Code:</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-lg text-blue-900 flex-1">{dcode}</p>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Save this code! You'll need it to load your profile on other devices.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Paste D-Code Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Load Existing D-Code</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste D-Code
            </label>
            <input
              type="text"
              value={pasteCode}
              onChange={(e) => setPasteCode(e.target.value)}
              placeholder="D1-abc123..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>

          <button
            onClick={handlePasteCode}
            disabled={!pasteCode.trim()}
            className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Load D-Code
          </button>
        </div>
      </div>
    </div>
  )
}
