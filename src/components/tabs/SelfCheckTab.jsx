/**
 * Self-Check Tab - Personal assessment entry with live scoring
 */

import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { encodeSCode } from '../../utils/codec/scode.js'
import { EXERCISES, COMPONENTS } from '../../utils/scoring/constants.js'
import { calculateAge, getAgeBracket, isDiagnosticPeriod, getWalkTimeLimit } from '../../utils/scoring/constants.js'
import { calculateComponentScore, calculateCompositeScore, calculateWHtR, parseTime, formatTime, isTimeIncomplete, hamrTimeToShuttles } from '../../utils/scoring/scoringEngine.js'

export default function SelfCheckTab() {
  const { demographics, addSCode, dcode } = useApp()

  // IV-01: Assessment date - picker with max = today
  const today = new Date().toISOString().split('T')[0]
  const [assessmentDate, setAssessmentDate] = useState(today)

  // Cardio
  const [cardioExercise, setCardioExercise] = useState(EXERCISES.RUN_2MILE)
  const [cardioValue, setCardioValue] = useState('')
  const [cardioExempt, setCardioExempt] = useState(false)

  // Strength
  const [strengthExercise, setStrengthExercise] = useState(EXERCISES.PUSHUPS)
  const [strengthValue, setStrengthValue] = useState('')
  const [strengthExempt, setStrengthExempt] = useState(false)

  // Core
  const [coreExercise, setCoreExercise] = useState(EXERCISES.SITUPS)
  const [coreValue, setCoreValue] = useState('')
  const [coreExempt, setCoreExempt] = useState(false)

  // Walk (when cardio exempt - IV-11)
  const [walkSelected, setWalkSelected] = useState(false)
  const [walkTime, setWalkTime] = useState('')
  const [walkPass, setWalkPass] = useState(true)

  // Body Composition
  const [heightInches, setHeightInches] = useState('')
  const [waistInches, setWaistInches] = useState('')
  const [bodyCompExempt, setBodyCompExempt] = useState(false)
  const [heightError, setHeightError] = useState('')
  const [waistError, setWaistError] = useState('')

  // UI state
  const [scode, setSCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scores, setScores] = useState(null)

  // Reset walk when cardio exempt toggled off
  useEffect(() => {
    if (!cardioExempt) {
      setWalkSelected(false)
      setWalkTime('')
    }
  }, [cardioExempt])

  // Check if we have demographics
  const hasDemographics = demographics && demographics.dob && demographics.gender

  // Calculate scores whenever inputs change
  useEffect(() => {
    if (!hasDemographics) {
      setScores(null)
      return
    }

    try {
      const age = calculateAge(demographics.dob, assessmentDate)
      const ageBracket = getAgeBracket(age)
      const gender = demographics.gender

      const components = []

      // Cardio
      if (!cardioExempt && cardioValue) {
        let value
        if (cardioExercise === EXERCISES.RUN_2MILE) {
          value = parseTime(cardioValue)
        } else if (cardioExercise === EXERCISES.HAMR) {
          // IV-12: colon in HAMR input triggers time-to-shuttle conversion
          value = cardioValue.includes(':') ? hamrTimeToShuttles(cardioValue) : parseInt(cardioValue, 10)
        }
        // IV-07: Run time > 0 and max 2:00:00 (7200s)
        if (value && value > 0 && !(cardioExercise === EXERCISES.RUN_2MILE && value > 7200)) {
          const cardioScore = calculateComponentScore(
            { type: COMPONENTS.CARDIO, exercise: cardioExercise, value, exempt: false },
            gender,
            ageBracket
          )
          components.push({ ...cardioScore, type: COMPONENTS.CARDIO, exercise: cardioExercise })
        }
      } else if (cardioExempt && walkSelected && walkTime) {
        // IV-11: 2km walk for profiled members
        const value = parseTime(walkTime)
        if (value) {
          const walkScore = calculateComponentScore(
            { type: COMPONENTS.CARDIO, exercise: EXERCISES.WALK_2KM, value, exempt: false, walkPass },
            gender,
            ageBracket
          )
          components.push({ ...walkScore, type: COMPONENTS.CARDIO, exercise: EXERCISES.WALK_2KM })
        }
      } else if (cardioExempt) {
        components.push({ type: COMPONENTS.CARDIO, exempt: true, tested: false, pass: true })
      }

      // Strength
      if (!strengthExempt && strengthValue) {
        const value = parseInt(strengthValue, 10)
        if (value || value === 0) {
          const strengthScore = calculateComponentScore(
            { type: COMPONENTS.STRENGTH, exercise: strengthExercise, value, exempt: false },
            gender,
            ageBracket
          )
          components.push({ ...strengthScore, type: COMPONENTS.STRENGTH, exercise: strengthExercise })
        }
      } else if (strengthExempt) {
        components.push({ type: COMPONENTS.STRENGTH, exempt: true, tested: false, pass: true })
      }

      // Core
      if (!coreExempt && coreValue) {
        const value = coreExercise === EXERCISES.PLANK ? parseTime(coreValue) : parseInt(coreValue, 10)
        // IV-09: Plank max 10:00 (600s)
        if ((value || value === 0) && !(coreExercise === EXERCISES.PLANK && value > 600)) {
          const coreScore = calculateComponentScore(
            { type: COMPONENTS.CORE, exercise: coreExercise, value, exempt: false },
            gender,
            ageBracket
          )
          components.push({ ...coreScore, type: COMPONENTS.CORE, exercise: coreExercise })
        }
      } else if (coreExempt) {
        components.push({ type: COMPONENTS.CORE, exempt: true, tested: false, pass: true })
      }

      // Body Composition
      if (!bodyCompExempt && heightInches && waistInches) {
        const height = parseFloat(heightInches)
        const waist = parseFloat(waistInches)
        if (height && waist) {
          const whtr = calculateWHtR(waist, height)
          const bodyCompScore = calculateComponentScore(
            { type: COMPONENTS.BODY_COMP, exercise: EXERCISES.WHTR, value: whtr, exempt: false },
            gender,
            ageBracket
          )
          components.push({ ...bodyCompScore, type: COMPONENTS.BODY_COMP, exercise: EXERCISES.WHTR, whtr })
        }
      } else if (bodyCompExempt) {
        components.push({ type: COMPONENTS.BODY_COMP, exempt: true, tested: false, pass: true })
      }

      const composite = calculateCompositeScore(components)
      setScores({ components, composite })
    } catch (err) {
      console.error('Error calculating scores:', err)
      setScores(null)
    }
  }, [hasDemographics, demographics, cardioExercise, cardioValue, cardioExempt, walkSelected, walkTime, walkPass, strengthExercise, strengthValue, strengthExempt, coreExercise, coreValue, coreExempt, heightInches, waistInches, bodyCompExempt])

  // IV-05: Height must be 48-84 inches
  const handleHeightChange = (e) => {
    const val = e.target.value
    setHeightInches(val)
    if (val) {
      const h = parseFloat(val)
      if (h < 48 || h > 84) {
        setHeightError('Height must be between 48 and 84 inches.')
      } else {
        setHeightError('')
      }
    } else {
      setHeightError('')
    }
  }

  // IV-06: Waist must be 20.0-55.0 inches
  const handleWaistChange = (e) => {
    const val = e.target.value
    setWaistInches(val)
    if (val) {
      const w = parseFloat(val)
      if (w < 20 || w > 55) {
        setWaistError('Waist must be between 20.0 and 55.0 inches.')
      } else {
        setWaistError('')
      }
    } else {
      setWaistError('')
    }
  }

  const handleGenerateSCode = () => {
    setError('')
    setSuccess('')

    if (!hasDemographics) {
      setError('Please create your profile first (Profile tab)')
      return
    }

    try {
      // IV-05: Height range
      if (!bodyCompExempt && heightInches) {
        const h = parseFloat(heightInches)
        if (h < 48 || h > 84) {
          setError('Height must be between 48 and 84 inches.')
          return
        }
      }
      // IV-06: Waist range
      if (!bodyCompExempt && waistInches) {
        const w = parseFloat(waistInches)
        if (w < 20 || w > 55) {
          setError('Waist must be between 20.0 and 55.0 inches.')
          return
        }
      }
      // IV-07: Run time > 0:00 and max 2:00:00
      if (!cardioExempt && cardioExercise === EXERCISES.RUN_2MILE && cardioValue) {
        const runTime = parseTime(cardioValue)
        if (runTime != null && runTime === 0) {
          setError('Enter a valid time between 0:01 and 2:00:00.')
          return
        }
        if (runTime != null && runTime > 7200) {
          setError('Maximum run time is 2:00:00.')
          return
        }
      }
      // IV-07: Walk time > 0:00 and max 2:00:00
      if (cardioExempt && walkSelected && walkTime) {
        const wt = parseTime(walkTime)
        if (wt != null && wt === 0) {
          setError('Enter a valid walk time greater than 0:00.')
          return
        }
        if (wt != null && wt > 7200) {
          setError('Maximum walk time is 2:00:00.')
          return
        }
      }
      // IV-09: Plank max 10:00
      if (!coreExempt && coreExercise === EXERCISES.PLANK && coreValue) {
        const plankTime = parseTime(coreValue)
        if (plankTime != null && plankTime > 600) {
          setError('Maximum plank entry is 10 minutes.')
          return
        }
      }
      // IV-10: At least one component non-exempt
      if (cardioExempt && strengthExempt && coreExempt && bodyCompExempt) {
        setError('All components exempt. No composite score possible.')
        return
      }
      // IV-13: Height and waist both required for WHtR
      if (!bodyCompExempt && ((heightInches && !waistInches) || (!heightInches && waistInches))) {
        setError('Enter both height and waist for body composition scoring.')
        return
      }

      // Build cardio data
      let cardioData = null
      if (!cardioExempt && cardioValue) {
        let cardioVal
        if (cardioExercise === EXERCISES.RUN_2MILE) {
          cardioVal = parseTime(cardioValue)
        } else if (cardioExercise === EXERCISES.HAMR) {
          cardioVal = cardioValue.includes(':') ? hamrTimeToShuttles(cardioValue) : parseInt(cardioValue, 10)
        }
        cardioData = { exercise: cardioExercise, value: cardioVal, exempt: false }
      } else if (cardioExempt && walkSelected && walkTime) {
        cardioData = { exercise: EXERCISES.WALK_2KM, value: parseTime(walkTime), exempt: false, walkPass }
      } else if (cardioExempt) {
        cardioData = { exercise: cardioExercise, value: null, exempt: true }
      }

      const assessment = {
        date: assessmentDate,
        cardio: cardioData,
        strength: !strengthExempt && strengthValue ? {
          exercise: strengthExercise,
          value: parseInt(strengthValue, 10),
          exempt: false
        } : strengthExempt ? { exercise: strengthExercise, value: null, exempt: true } : null,
        core: !coreExempt && coreValue ? {
          exercise: coreExercise,
          value: coreExercise === EXERCISES.PLANK ? parseTime(coreValue) : parseInt(coreValue, 10),
          exempt: false
        } : coreExempt ? { exercise: coreExercise, value: null, exempt: true } : null,
        bodyComp: !bodyCompExempt && heightInches && waistInches ? {
          heightInches: parseFloat(heightInches),
          waistInches: parseFloat(waistInches),
          exempt: false
        } : bodyCompExempt ? { heightInches: null, waistInches: null, exempt: true } : null,
      }

      const code = encodeSCode(assessment)
      setSCode(code)
      addSCode(code)
      setSuccess('S-Code generated successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  const copyToClipboard = async () => {
    if (!scode) return
    try {
      await navigator.clipboard.writeText(scode)
      setSuccess('S-Code copied to clipboard!')
      setTimeout(() => setSuccess(''), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  // UX-08: Web Share API with clipboard fallback
  const shareCode = async () => {
    if (!scode) return
    const shareUrl = `${window.location.origin}${window.location.pathname}?s=${encodeURIComponent(scode)}${dcode ? `&d=${encodeURIComponent(dcode)}` : ''}`
    if (navigator.canShare?.({ text: shareUrl })) {
      try {
        await navigator.share({ title: 'PFA Self-Check', text: shareUrl })
        setSuccess('Shared!')
        setTimeout(() => setSuccess(''), 2000)
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Fallback to clipboard with correct "Copied!" message
          try {
            await navigator.clipboard.writeText(shareUrl)
            setSuccess('Link copied to clipboard!')
            setTimeout(() => setSuccess(''), 2000)
          } catch {
            setError('Failed to share or copy')
          }
        }
      }
    } else {
      // No Web Share API - copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        setSuccess('Link copied to clipboard!')
        setTimeout(() => setSuccess(''), 2000)
      } catch {
        setError('Failed to copy to clipboard')
      }
    }
  }

  if (!hasDemographics) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-2">Profile Required</h3>
        <p className="text-yellow-800 mb-4">
          Please create your profile first (DOB + gender) in the Profile tab before recording assessments.
        </p>
      </div>
    )
  }

  const isDiagnostic = isDiagnosticPeriod(assessmentDate)

  // IV-10: Warn when all components are exempt
  const allExempt = cardioExempt && strengthExempt && coreExempt && bodyCompExempt

  // IV-13: Both height and waist needed for WHtR
  const missingBodyCompPair = !bodyCompExempt && ((heightInches && !waistInches) || (!heightInches && waistInches))

  // Helper function to convert inches to feet and inches
  const inchesToFeetInches = (inches) => {
    if (!inches || isNaN(inches)) return ''
    const totalInches = parseFloat(inches)
    const feet = Math.floor(totalInches / 12)
    const remainingInches = Math.round(totalInches % 12)
    return `${feet}' ${remainingInches}"`
  }

  return (
    <div className="space-y-6">
      {/* Live Score Banner */}
      {scores && scores.composite && scores.composite.composite !== null && (
        <div className={`rounded-lg p-4 ${scores.composite.pass ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {scores.composite.composite.toFixed(1)} / 100
              </h3>
              <p className={`text-sm font-medium ${scores.composite.pass ? 'text-green-800' : 'text-red-800'}`}>
                {scores.composite.pass ? '✓ PASSING' : '✗ FAILING'}
                {isDiagnostic && ' (Diagnostic Period)'}
              </p>
              {!scores.composite.pass && (
                <ul className="text-xs text-red-700 mt-1 space-y-0.5">
                  {!scores.composite.compositePass && (
                    <li>Composite {scores.composite.composite.toFixed(1)} below 75.0 minimum</li>
                  )}
                  {scores.composite.failedComponents.map((fc, i) => (
                    <li key={i}>{fc.type.charAt(0).toUpperCase() + fc.type.slice(1)} below {fc.minimum}% minimum ({fc.percentage.toFixed(1)}%)</li>
                  ))}
                  {scores.composite.walkComponents?.some(w => w.pass === false) && (
                    <li>2km Walk not passed</li>
                  )}
                </ul>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {scores.composite.totalEarned.toFixed(1)} / {scores.composite.totalPossible} pts
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Date */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Personal Assessment</h2>

        {/* IV-01: Self-check date picker - max = today */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Date</label>
          <input
            type="date"
            value={assessmentDate}
            onChange={(e) => setAssessmentDate(e.target.value)}
            max={today}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isDiagnostic && (
            <p className="text-xs text-blue-600 mt-1">
              Diagnostic Period (non-scored)
            </p>
          )}
        </div>

        {/* Cardio Component */}
        <ComponentSection
          title="Cardio (50 pts)"
          exempt={cardioExempt}
          onExemptChange={setCardioExempt}
          score={scores?.components.find(c => c.type === COMPONENTS.CARDIO)}
          exemptContent={
            <WalkSection
              walkSelected={walkSelected}
              setWalkSelected={setWalkSelected}
              walkTime={walkTime}
              setWalkTime={setWalkTime}
              walkPass={walkPass}
              setWalkPass={setWalkPass}
              demographics={demographics}
              assessmentDate={assessmentDate}
            />
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exercise</label>
              <select
                value={cardioExercise}
                onChange={(e) => setCardioExercise(e.target.value)}
                disabled={cardioExempt}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              >
                <option value={EXERCISES.RUN_2MILE}>2-Mile Run</option>
                <option value={EXERCISES.HAMR}>HAMR Shuttle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {cardioExercise === EXERCISES.RUN_2MILE ? 'Time (mm:ss)' : 'Shuttles'}
              </label>
              <input
                type="text"
                value={cardioValue}
                onChange={(e) => setCardioValue(e.target.value)}
                disabled={cardioExempt}
                placeholder={cardioExercise === EXERCISES.RUN_2MILE ? '13:30' : '94'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              />
              {cardioExercise === EXERCISES.RUN_2MILE && cardioValue && !cardioExempt && !isTimeIncomplete(cardioValue) && (
                <p className="text-xs mt-1" style={{ color: parseTime(cardioValue) != null && parseTime(cardioValue) > 0 && parseTime(cardioValue) <= 7200 ? '#6b7280' : '#ef4444' }}>
                  {parseTime(cardioValue) != null
                    ? (() => {
                        const t = parseTime(cardioValue)
                        if (t === 0) return 'Enter a valid time between 0:01 and 2:00:00.'
                        if (t > 7200) return 'Maximum run time is 2:00:00.'
                        return formatTime(t)
                      })()
                    : 'Invalid format - use MM:SS or whole minutes'}
                </p>
              )}
              {cardioExercise === EXERCISES.HAMR && cardioValue && cardioValue.includes(':') && !cardioExempt && !isTimeIncomplete(cardioValue) && (
                <p className="text-xs mt-1" style={{ color: hamrTimeToShuttles(cardioValue) != null ? '#6b7280' : '#ef4444' }}>
                  {hamrTimeToShuttles(cardioValue) != null
                    ? `Converted: ${hamrTimeToShuttles(cardioValue)} shuttles`
                    : 'Invalid time format'}
                </p>
              )}
            </div>
          </div>
        </ComponentSection>

        {/* Strength Component */}
        <ComponentSection
          title="Strength (15 pts)"
          exempt={strengthExempt}
          onExemptChange={setStrengthExempt}
          score={scores?.components.find(c => c.type === COMPONENTS.STRENGTH)}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exercise</label>
              <select
                value={strengthExercise}
                onChange={(e) => setStrengthExercise(e.target.value)}
                disabled={strengthExempt}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              >
                <option value={EXERCISES.PUSHUPS}>Push-ups (1 min)</option>
                <option value={EXERCISES.HRPU}>Hand-Release Push-ups (2 min)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reps</label>
              <input
                type="number"
                value={strengthValue}
                onChange={(e) => setStrengthValue(e.target.value)}
                disabled={strengthExempt}
                placeholder="42"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              />
            </div>
          </div>
        </ComponentSection>

        {/* Core Component */}
        <ComponentSection
          title="Core (15 pts)"
          exempt={coreExempt}
          onExemptChange={setCoreExempt}
          score={scores?.components.find(c => c.type === COMPONENTS.CORE)}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exercise</label>
              <select
                value={coreExercise}
                onChange={(e) => setCoreExercise(e.target.value)}
                disabled={coreExempt}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              >
                <option value={EXERCISES.SITUPS}>Sit-ups (1 min)</option>
                <option value={EXERCISES.CLRC}>Reverse Crunches (2 min)</option>
                <option value={EXERCISES.PLANK}>Forearm Plank (max time)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {coreExercise === EXERCISES.PLANK ? 'Time (mm:ss)' : 'Reps'}
              </label>
              <input
                type="text"
                value={coreValue}
                onChange={(e) => setCoreValue(e.target.value)}
                disabled={coreExempt}
                placeholder={coreExercise === EXERCISES.PLANK ? '2:30' : '42'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              />
              {coreExercise === EXERCISES.PLANK && coreValue && !coreExempt && !isTimeIncomplete(coreValue) && (
                <p className="text-xs mt-1" style={{ color: parseTime(coreValue) != null ? '#6b7280' : '#ef4444' }}>
                  {parseTime(coreValue) != null
                    ? (() => {
                        const t = parseTime(coreValue)
                        if (t > 600) return 'Maximum plank entry is 10 minutes'
                        return formatTime(t)
                      })()
                    : 'Invalid format - use MM:SS or whole minutes'}
                </p>
              )}
            </div>
          </div>
        </ComponentSection>

        {/* Body Composition */}
        <ComponentSection
          title="Body Composition (20 pts)"
          exempt={bodyCompExempt}
          onExemptChange={setBodyCompExempt}
          score={scores?.components.find(c => c.type === COMPONENTS.BODY_COMP)}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Height (inches)</label>
              <input
                type="number"
                value={heightInches}
                onChange={handleHeightChange}
                disabled={bodyCompExempt}
                placeholder="70"
                min="48"
                max="84"
                step="0.1"
                className={`w-full px-4 py-2 border rounded-lg disabled:bg-gray-100 ${heightError ? 'border-red-400' : 'border-gray-300'}`}
              />
              {heightError && !bodyCompExempt && (
                <p className="text-xs text-red-600 mt-1">{heightError}</p>
              )}
              {heightInches && !bodyCompExempt && !heightError && (
                <p className="text-xs text-gray-500 mt-1">
                  {inchesToFeetInches(heightInches)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Waist (inches)</label>
              <input
                type="number"
                value={waistInches}
                onChange={handleWaistChange}
                disabled={bodyCompExempt}
                placeholder="32.5"
                min="20"
                max="55"
                step="0.1"
                className={`w-full px-4 py-2 border rounded-lg disabled:bg-gray-100 ${waistError ? 'border-red-400' : 'border-gray-300'}`}
              />
              {waistError && !bodyCompExempt && (
                <p className="text-xs text-red-600 mt-1">{waistError}</p>
              )}
            </div>
          </div>
          {missingBodyCompPair && (
            <p className="text-xs text-amber-700 mt-2">Enter both height and waist for body composition scoring.</p>
          )}
          {!bodyCompExempt && heightInches && waistInches && !heightError && !waistError && (
            <p className="text-sm text-gray-600 mt-2">
              WHtR: {calculateWHtR(parseFloat(waistInches), parseFloat(heightInches))?.toFixed(2)}
            </p>
          )}
        </ComponentSection>

        {/* IV-10: All-exempt warning */}
        {allExempt && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-sm mb-4">
            All components exempt. No composite score possible.
          </div>
        )}

        {/* Generate S-Code Button */}
        <button
          onClick={handleGenerateSCode}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Generate S-Code
        </button>

        {/* Success/Error Messages */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm mt-4">
            {success}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm mt-4">
            {error}
          </div>
        )}

        {/* Display S-Code */}
        {scode && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Your S-Code:</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm text-blue-900 flex-1 break-all">{scode}</p>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors whitespace-nowrap"
              >
                Copy
              </button>
              <button
                onClick={shareCode}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors whitespace-nowrap"
              >
                Share
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Save this code and check the Trajectory tab for personalized improvement tips!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Walk section with time limits and auto pass/fail
function WalkSection({ walkSelected, setWalkSelected, walkTime, setWalkTime, walkPass, setWalkPass, demographics, assessmentDate }) {
  // Compute walk time limit for this user's bracket
  let walkTimeLimit = null
  let walkTimeLimitStr = ''
  if (demographics?.dob && demographics?.gender) {
    const age = calculateAge(demographics.dob, assessmentDate)
    const ageBracket = getAgeBracket(age)
    walkTimeLimit = getWalkTimeLimit(demographics.gender, ageBracket)
    if (walkTimeLimit) {
      walkTimeLimitStr = formatTime(walkTimeLimit)
    }
  }

  // Auto-determine pass/fail when time is entered and we have a limit
  const handleWalkTimeChange = (e) => {
    const newTime = e.target.value
    setWalkTime(newTime)
    if (walkTimeLimit && newTime && !isTimeIncomplete(newTime)) {
      const seconds = parseTime(newTime)
      if (seconds != null) {
        setWalkPass(seconds <= walkTimeLimit)
      }
    }
  }

  return (
    <div className="mt-2">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={walkSelected}
          onChange={(e) => setWalkSelected(e.target.checked)}
          className="mr-2"
        />
        <span className="text-sm font-semibold text-gray-900">2km Walk</span>
      </label>
      {walkSelected && (
        <div className="mt-3">
          {walkTimeLimit && (
            <p className="text-xs text-blue-600 mb-3">
              Time limit: {walkTimeLimitStr} (pass/fail - no points scored)
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Walk Time (mm:ss)</label>
              <input
                type="text"
                value={walkTime}
                onChange={handleWalkTimeChange}
                placeholder={walkTimeLimitStr || '16:30'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {walkTime && !isTimeIncomplete(walkTime) && (
                <p className="text-xs mt-1" style={{ color: parseTime(walkTime) != null ? '#6b7280' : '#ef4444' }}>
                  {parseTime(walkTime) != null
                    ? (() => {
                        const t = parseTime(walkTime)
                        if (walkTimeLimit && t > walkTimeLimit) {
                          return `${formatTime(t)} - exceeds ${walkTimeLimitStr} limit`
                        }
                        return formatTime(t)
                      })()
                    : 'Invalid format - use MM:SS'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
              <select
                value={walkPass ? 'pass' : 'fail'}
                onChange={(e) => setWalkPass(e.target.value === 'pass')}
                className={`w-full px-4 py-2 border rounded-lg ${
                  walkPass ? 'border-gray-300' : 'border-red-400 bg-red-50'
                }`}
              >
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
              {!walkPass && (
                <p className="text-xs text-red-600 mt-1">
                  Walk failure results in overall PFA failure
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Component Section with score display
function ComponentSection({ title, exempt, onExemptChange, score, children, exemptContent }) {
  return (
    <div className="mb-6 pb-6 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <div className="flex items-center gap-4">
          {score && score.tested && (
            <div className="text-right">
              <p className={`text-lg font-bold ${score.pass ? 'text-green-600' : 'text-red-600'}`}>
                {score.points.toFixed(1)} / {score.maxPoints} pts
              </p>
              <p className="text-xs text-gray-600">
                {score.percentage.toFixed(1)}% {score.pass ? '✓' : '✗'}
              </p>
            </div>
          )}
          {score && score.exempt && (
            <p className="text-sm text-gray-600">EXEMPT</p>
          )}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={exempt}
              onChange={(e) => onExemptChange(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Exempt</span>
          </label>
        </div>
      </div>
      {!exempt && children}
      {exempt && exemptContent}
    </div>
  )
}

