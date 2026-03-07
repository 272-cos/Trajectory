/**
 * Self-Check Tab - Personal assessment entry with live scoring
 */

import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { encodeSCode } from '../../utils/codec/scode.js'
import { EXERCISES, COMPONENTS } from '../../utils/scoring/constants.js'
import { calculateAge, getAgeBracket, isDiagnosticPeriod, getWalkTimeLimit } from '../../utils/scoring/constants.js'
import { calculateComponentScore, calculateCompositeScore, calculateWHtR, parseTime, formatTime, isTimeIncomplete, hamrTimeToShuttles } from '../../utils/scoring/scoringEngine.js'
import { EXERCISE_NAMES } from '../../utils/scoring/strategyEngine.js'
import { getExercisePrefs, saveExercisePrefs, saveDraft, loadDraft, clearDraft } from '../../utils/storage/localStorage.js'

/**
 * Auto-format time input: inserts colon as user types digits.
 * "1630" -> "16:30", "230" -> "2:30", "16" -> "16"
 * If the value already contains a colon, only clean up around it.
 */
function formatTimeInput(rawValue) {
  if (rawValue.includes(':')) {
    const parts = rawValue.split(':')
    const mins = parts[0].replace(/\D/g, '')
    const secs = parts.slice(1).join('').replace(/\D/g, '').slice(0, 2)
    return mins + ':' + secs
  }
  const digits = rawValue.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 3) return digits
  return digits.slice(0, digits.length - 2) + ':' + digits.slice(-2)
}

export default function SelfCheckTab() {
  const { demographics, addSCode, removeSCode, dcode, setSelfCheckDirty, registerSelfCheckGenerator } = useApp()

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

  // Exercise preferences (locked choices persisted to localStorage)
  const [exercisePrefs, setExercisePrefs] = useState(() => getExercisePrefs())

  // UI state
  const [scode, setSCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scores, setScores] = useState(null)
  const [draftRestored, setDraftRestored] = useState(false)
  const [draftSavedVisible, setDraftSavedVisible] = useState(false)
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(null) // For undo

  // ── Draft restore on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const draft = loadDraft()
    if (!draft) return
    if (draft.assessmentDate) setAssessmentDate(draft.assessmentDate)
    if (draft.cardioExercise) setCardioExercise(draft.cardioExercise)
    if (draft.cardioValue) setCardioValue(draft.cardioValue)
    if (draft.cardioExempt !== undefined) setCardioExempt(draft.cardioExempt)
    if (draft.walkSelected !== undefined) setWalkSelected(draft.walkSelected)
    if (draft.walkTime) setWalkTime(draft.walkTime)
    if (draft.strengthExercise) setStrengthExercise(draft.strengthExercise)
    if (draft.strengthValue) setStrengthValue(draft.strengthValue)
    if (draft.strengthExempt !== undefined) setStrengthExempt(draft.strengthExempt)
    if (draft.coreExercise) setCoreExercise(draft.coreExercise)
    if (draft.coreValue) setCoreValue(draft.coreValue)
    if (draft.coreExempt !== undefined) setCoreExempt(draft.coreExempt)
    if (draft.bodyCompExempt !== undefined) setBodyCompExempt(draft.bodyCompExempt)
    if (draft.heightInches) setHeightInches(draft.heightInches)
    if (draft.waistInches) setWaistInches(draft.waistInches)
    setDraftRestored(true)
    setTimeout(() => setDraftRestored(false), 3000)
  }, [])

  // ── Draft autosave (debounced 500ms) ───────────────────────────────────────
  const draftTimerRef = useRef(null)
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    const hasAnyData = !!(cardioValue || strengthValue || coreValue || heightInches || waistInches || walkTime ||
                          cardioExempt || strengthExempt || coreExempt || bodyCompExempt)
    if (!hasAnyData) return
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      saveDraft({
        assessmentDate, cardioExercise, cardioValue, cardioExempt,
        walkSelected, walkTime,
        strengthExercise, strengthValue, strengthExempt,
        coreExercise, coreValue, coreExempt,
        bodyCompExempt, heightInches, waistInches,
      })
      setDraftSavedVisible(true)
      setTimeout(() => setDraftSavedVisible(false), 2000)
    }, 500)
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current) }
  }, [assessmentDate, cardioExercise, cardioValue, cardioExempt, walkSelected, walkTime,
      strengthExercise, strengthValue, strengthExempt,
      coreExercise, coreValue, coreExempt, bodyCompExempt, heightInches, waistInches])

  // Track whether inputs have unsaved data
  useEffect(() => {
    const hasData = !!(cardioValue || strengthValue || coreValue || heightInches || waistInches || walkTime)
    setSelfCheckDirty(hasData)
  }, [cardioValue, strengthValue, coreValue, heightInches, waistInches, walkTime, setSelfCheckDirty])

  // Register generate function so warning modal can trigger it; clear dirty on unmount
  const generateRef = useRef(null)
  useEffect(() => {
    registerSelfCheckGenerator(() => generateRef.current?.())
    return () => {
      registerSelfCheckGenerator(null)
      setSelfCheckDirty(false)
    }
  }, [registerSelfCheckGenerator, setSelfCheckDirty])

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
  }, [hasDemographics, demographics, assessmentDate, cardioExercise, cardioValue, cardioExempt, walkSelected, walkTime, walkPass, strengthExercise, strengthValue, strengthExempt, coreExercise, coreValue, coreExempt, heightInches, waistInches, bodyCompExempt])

  // IV-05: Height must be 48-84 inches (enforce positive, validate range)
  const handleHeightChange = (e) => {
    const val = e.target.value
    if (val && parseFloat(val) < 0) return // block negative
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

  // IV-06: Waist must be 20.0-55.0 inches (enforce positive, validate range)
  const handleWaistChange = (e) => {
    const val = e.target.value
    if (val && parseFloat(val) < 0) return // block negative
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

  // Toggle lock for an exercise preference
  const handleToggleLock = (component, exercise) => {
    const updated = { ...exercisePrefs }
    if (updated[component] === exercise) {
      delete updated[component] // Unlock
    } else {
      updated[component] = exercise // Lock current choice
    }
    setExercisePrefs(updated)
    saveExercisePrefs(updated)
  }

  const handleGenerateSCode = () => {
    setError('')
    setSuccess('')

    if (!hasDemographics) {
      setError('Please create your profile first (Profile tab)')
      return false
    }

    try {
      // IV-04: Age must be 17-65 at the self-check date (not just at profile creation)
      const ageAtCheck = calculateAge(demographics.dob, assessmentDate)
      if (ageAtCheck < 17 || ageAtCheck > 65) {
        setError('Age must be 17-65 at the self-check date for USAF service range.')
        return false
      }

      // IV-05: Height range
      if (!bodyCompExempt && heightInches) {
        const h = parseFloat(heightInches)
        if (h < 48 || h > 84) {
          setError('Height must be between 48 and 84 inches.')
          return false
        }
      }
      // IV-06: Waist range
      if (!bodyCompExempt && waistInches) {
        const w = parseFloat(waistInches)
        if (w < 20 || w > 55) {
          setError('Waist must be between 20.0 and 55.0 inches.')
          return false
        }
      }
      // IV-07: Run time > 0:00 and max 2:00:00
      if (!cardioExempt && cardioExercise === EXERCISES.RUN_2MILE && cardioValue) {
        const runTime = parseTime(cardioValue)
        if (runTime != null && runTime === 0) {
          setError('Enter a valid time between 0:01 and 2:00:00.')
          return false
        }
        if (runTime != null && runTime > 7200) {
          setError('Maximum run time is 2:00:00.')
          return false
        }
      }
      // IV-07: Walk time > 0:00 and max 2:00:00
      if (cardioExempt && walkSelected && walkTime) {
        const wt = parseTime(walkTime)
        if (wt != null && wt === 0) {
          setError('Enter a valid walk time greater than 0:00.')
          return false
        }
        if (wt != null && wt > 7200) {
          setError('Maximum walk time is 2:00:00.')
          return false
        }
      }
      // IV-09: Plank max 10:00
      if (!coreExempt && coreExercise === EXERCISES.PLANK && coreValue) {
        const plankTime = parseTime(coreValue)
        if (plankTime != null && plankTime > 600) {
          setError('Maximum plank entry is 10 minutes.')
          return false
        }
      }
      // IV-10: At least one component non-exempt
      if (cardioExempt && strengthExempt && coreExempt && bodyCompExempt) {
        setError('All components exempt. No composite score possible.')
        return false
      }
      // IV-13: Height and waist both required for WHtR
      if (!bodyCompExempt && ((heightInches && !waistInches) || (!heightInches && waistInches))) {
        setError('Enter both height and waist for body composition scoring.')
        return false
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
        feedback: {
          baseId: 0,
          rpe: 3,
          sleepQuality: 2,
          nutrition: 2,
          injured: false,
          environmentFlags: 0,
          confidence: 3,
        },
      }

      const code = encodeSCode(assessment)
      setSCode(code)
      addSCode(code)
      // Save snapshot for undo (form stays populated; draft cleared)
      setLastSavedSnapshot({
        assessmentDate, cardioExercise, cardioValue, cardioExempt,
        walkSelected, walkTime,
        strengthExercise, strengthValue, strengthExempt,
        coreExercise, coreValue, coreExempt,
        bodyCompExempt, heightInches, waistInches,
        savedCode: code,
      })
      clearDraft()
      setSelfCheckDirty(false)
      setSuccess('Assessment code generated successfully!')
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  // Keep ref current so warning modal can call the latest version
  generateRef.current = handleGenerateSCode

  const copyToClipboard = async () => {
    if (!scode) return
    try {
      await navigator.clipboard.writeText(scode)
      setSuccess('Assessment code copied to clipboard!')
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

  // Clear all form fields
  const handleClearForm = () => {
    setAssessmentDate(today)
    setCardioExercise(exercisePrefs[COMPONENTS.CARDIO] || EXERCISES.RUN_2MILE)
    setCardioValue('')
    setCardioExempt(false)
    setWalkSelected(false)
    setWalkTime('')
    setWalkPass(true)
    setStrengthExercise(exercisePrefs[COMPONENTS.STRENGTH] || EXERCISES.PUSHUPS)
    setStrengthValue('')
    setStrengthExempt(false)
    setCoreExercise(exercisePrefs[COMPONENTS.CORE] || EXERCISES.SITUPS)
    setCoreValue('')
    setCoreExempt(false)
    setHeightInches('')
    setWaistInches('')
    setBodyCompExempt(false)
    setHeightError('')
    setWaistError('')
    setSCode('')
    setError('')
    setSuccess('')
    setLastSavedSnapshot(null)
    clearDraft()
    setSelfCheckDirty(false)
  }

  // Start another test (clear values but keep exercise preferences and exemptions)
  const handleAddAnother = () => {
    setCardioValue('')
    setWalkTime('')
    setStrengthValue('')
    setCoreValue('')
    setHeightInches('')
    setWaistInches('')
    setHeightError('')
    setWaistError('')
    setSCode('')
    setError('')
    setSuccess('')
    setLastSavedSnapshot(null)
    clearDraft()
    setSelfCheckDirty(false)
    setAssessmentDate(today)
  }

  // Undo last save: remove code from history and keep form as-is
  const handleUndoSave = () => {
    if (!lastSavedSnapshot?.savedCode) return
    removeSCode(lastSavedSnapshot.savedCode)
    setSCode('')
    setSuccess('')
    setLastSavedSnapshot(null)
    setSelfCheckDirty(true)
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
      {/* Draft restored notification */}
      {draftRestored && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs text-center">
          Draft restored from previous session
        </div>
      )}

      {/* Draft autosave indicator */}
      <div className={`flex items-center justify-between transition-opacity duration-500 ${draftSavedVisible ? 'opacity-100' : 'opacity-0'}`} aria-live="polite">
        <span className="text-xs text-gray-400 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Draft saved
        </span>
      </div>

      {/* Progress indicator - components completed */}
      <ProgressBar
        cardioExempt={cardioExempt} cardioValue={cardioValue} walkSelected={walkSelected} walkTime={walkTime}
        strengthExempt={strengthExempt} strengthValue={strengthValue}
        coreExempt={coreExempt} coreValue={coreValue}
        bodyCompExempt={bodyCompExempt} heightInches={heightInches} waistInches={waistInches}
      />

      {/* UX-01: Live Score Banner - updates on every input change */}
      {scores && scores.composite && scores.composite.composite !== null && (
        <div className={`rounded-lg p-4 ${scores.composite.pass ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold">
                  {scores.composite.composite.toFixed(1)} / 100
                </h3>
                {/* UX-02: Pass/fail badge */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${scores.composite.pass ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                  {scores.composite.pass ? 'PASSING' : 'FAILING'}
                </span>
                {/* UX-10: Diagnostic period badge */}
                {isDiagnostic && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                    DIAGNOSTIC PERIOD
                  </span>
                )}
              </div>
              {!scores.composite.pass && (
                <ul className="text-xs text-red-700 mt-1 space-y-0.5">
                  {!scores.composite.compositePass && (
                    <li>Composite {scores.composite.composite.toFixed(1)} below 75.0 minimum</li>
                  )}
                  {scores.composite.failedComponents.map((fc, i) => (
                    <li key={i}>{fc.type.charAt(0).toUpperCase() + fc.type.slice(1)} below {fc.minimum}% minimum ({fc.percentage.toFixed(1)}%)</li>
                  ))}
                  {scores.composite.walkComponents?.some(w => w.pass === false) && (
                    <li>2km Walk not passed - overall PFA failure</li>
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

      {/* Assessment Date + Exercise Components */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Personal Assessment</h2>

        {/* IV-01: Self-check date picker - max = today */}
        <div className="mb-6">
          <label htmlFor="assessment-date" className="block text-sm font-medium text-gray-700 mb-2">Assessment Date</label>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              id="assessment-date"
              type="date"
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
              max={today}
              aria-describedby={isDiagnosticPeriod(assessmentDate) ? 'diag-badge' : undefined}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {/* UX-10: Diagnostic period badge inline with date */}
            {isDiagnostic && (
              <span id="diag-badge" className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                DIAGNOSTIC PERIOD - non-scored
              </span>
            )}
          </div>
        </div>

        {/* Cardio Component */}
        <ComponentSection
          title="Cardio (50 pts)"
          exempt={cardioExempt}
          onExemptChange={setCardioExempt}
          score={scores?.components.find(c => c.type === COMPONENTS.CARDIO)}
        >
          {/* UX-03: Segmented control for exercise type */}
          {!cardioExempt && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Exercise</label>
              <SegmentedControl
                options={[
                  { value: EXERCISES.RUN_2MILE, label: '2-Mile Run' },
                  { value: EXERCISES.HAMR, label: 'HAMR Shuttle' },
                ]}
                value={cardioExercise}
                onChange={setCardioExercise}
              />
            </div>
          )}

          {/* Non-exempt: show exercise input */}
          {!cardioExempt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {cardioExercise === EXERCISES.RUN_2MILE ? 'Time (mm:ss)' : 'Shuttles'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cardioValue}
                onChange={(e) => setCardioValue(
                  cardioExercise === EXERCISES.RUN_2MILE ? formatTimeInput(e.target.value) : e.target.value
                )}
                placeholder={cardioExercise === EXERCISES.RUN_2MILE ? '13:30' : '94'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {cardioExercise === EXERCISES.RUN_2MILE && cardioValue && !isTimeIncomplete(cardioValue) && (
                <p className="text-xs mt-1" style={{ color: parseTime(cardioValue) != null && parseTime(cardioValue) > 0 && parseTime(cardioValue) <= 7200 ? '#6b7280' : '#ef4444' }}>
                  {parseTime(cardioValue) != null
                    ? (() => {
                        const t = parseTime(cardioValue)
                        if (t === 0) return 'Enter a valid time between 0:01 and 2:00:00.'
                        if (t > 7200) return 'Maximum run time is 2:00:00.'
                        return formatTime(t)
                      })()
                    : 'Invalid format - use MM:SS or total seconds'}
                </p>
              )}
              {cardioExercise === EXERCISES.HAMR && cardioValue && cardioValue.includes(':') && !isTimeIncomplete(cardioValue) && (
                <p className="text-xs mt-1" style={{ color: hamrTimeToShuttles(cardioValue) != null ? '#6b7280' : '#ef4444' }}>
                  {hamrTimeToShuttles(cardioValue) != null
                    ? `Converted: ${hamrTimeToShuttles(cardioValue)} shuttles`
                    : 'Invalid time format'}
                </p>
              )}
            </div>
          )}

          {/* Exempt: sub-options */}
          {cardioExempt && (
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
          )}
        </ComponentSection>

        {/* Strength Component */}
        <ComponentSection
          title="Strength (15 pts)"
          exempt={strengthExempt}
          onExemptChange={setStrengthExempt}
          score={scores?.components.find(c => c.type === COMPONENTS.STRENGTH)}
        >
          {/* UX-03: Segmented control for exercise type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Exercise</label>
            <SegmentedControl
              options={[
                { value: EXERCISES.PUSHUPS, label: 'Push-ups (1 min)' },
                { value: EXERCISES.HRPU, label: 'Hand-Release (2 min)' },
              ]}
              value={strengthExercise}
              onChange={setStrengthExercise}
              disabled={strengthExempt}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reps</label>
            <input
              type="text"
              inputMode="numeric"
              value={strengthValue}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '')
                const n = parseInt(v, 10)
                if (v === '' || (n >= 0 && n <= 300)) setStrengthValue(v)
              }}
              disabled={strengthExempt}
              placeholder="42"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            />
            {strengthValue && parseInt(strengthValue, 10) > 200 && (
              <p className="text-xs text-amber-600 mt-1">Unusually high count - double check your entry</p>
            )}
          </div>
        </ComponentSection>

        {/* Core Component */}
        <ComponentSection
          title="Core (15 pts)"
          exempt={coreExempt}
          onExemptChange={setCoreExempt}
          score={scores?.components.find(c => c.type === COMPONENTS.CORE)}
        >
          {/* UX-03: Segmented control for exercise type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Exercise</label>
            <SegmentedControl
              options={[
                { value: EXERCISES.SITUPS, label: 'Sit-ups (1 min)' },
                { value: EXERCISES.CLRC, label: 'Rev. Crunches (2 min)' },
                { value: EXERCISES.PLANK, label: 'Forearm Plank' },
              ]}
              value={coreExercise}
              onChange={setCoreExercise}
              disabled={coreExempt}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {coreExercise === EXERCISES.PLANK ? 'Time (mm:ss)' : 'Reps'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={coreValue}
              onChange={(e) => {
                if (coreExercise === EXERCISES.PLANK) {
                  setCoreValue(formatTimeInput(e.target.value))
                } else {
                  const v = e.target.value.replace(/\D/g, '')
                  const n = parseInt(v, 10)
                  if (v === '' || (n >= 0 && n <= 300)) setCoreValue(v)
                }
              }}
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
                  : 'Invalid format - use MM:SS or total seconds'}
              </p>
            )}
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
                type="text"
                inputMode="decimal"
                value={heightInches}
                onChange={handleHeightChange}
                disabled={bodyCompExempt}
                placeholder="70"
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
                type="text"
                inputMode="decimal"
                value={waistInches}
                onChange={handleWaistChange}
                disabled={bodyCompExempt}
                placeholder="32.5"
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

        {/* Exercise lock controls */}
        {!allExempt && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2 font-medium">Lock exercise preferences (persists across sessions)</p>
            <div className="flex flex-wrap gap-3">
              {!cardioExempt && (
                <LockButton
                  component={COMPONENTS.CARDIO}
                  exercise={cardioExercise}
                  label={EXERCISE_NAMES[cardioExercise] || cardioExercise}
                  locked={exercisePrefs[COMPONENTS.CARDIO] === cardioExercise}
                  onToggle={handleToggleLock}
                />
              )}
              {!strengthExempt && (
                <LockButton
                  component={COMPONENTS.STRENGTH}
                  exercise={strengthExercise}
                  label={EXERCISE_NAMES[strengthExercise] || strengthExercise}
                  locked={exercisePrefs[COMPONENTS.STRENGTH] === strengthExercise}
                  onToggle={handleToggleLock}
                />
              )}
              {!coreExempt && (
                <LockButton
                  component={COMPONENTS.CORE}
                  exercise={coreExercise}
                  label={EXERCISE_NAMES[coreExercise] || coreExercise}
                  locked={exercisePrefs[COMPONENTS.CORE] === coreExercise}
                  onToggle={handleToggleLock}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action bar - sticky on mobile */}
      <div className="bg-white rounded-lg shadow-md p-6 sticky bottom-0 z-10 sm:static sm:shadow-md shadow-lg">
        <div className="flex gap-2">
          <button
            onClick={handleGenerateSCode}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Assessment
          </button>
          <button
            onClick={handleClearForm}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Clear
          </button>
        </div>

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

        {/* Display assessment code with undo + add another */}
        {scode && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Your Assessment Code:</p>
            <p className="text-xs text-gray-500 mb-2">This compact code stores your exercise results. Share it to transfer data between devices.</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm text-blue-900 flex-1 break-all">{scode}</p>
              <button
                onClick={copyToClipboard}
                aria-label="Copy assessment code to clipboard"
                className="px-3 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Copy
              </button>
              <button
                onClick={shareCode}
                aria-label="Share assessment code link"
                className="px-3 py-2 min-h-[44px] bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Share
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Assessment saved! Check the Trajectory tab for personalized improvement tips.
            </p>
            <div className="flex gap-2 mt-3 pt-3 border-t border-blue-200">
              {lastSavedSnapshot && (
                <button
                  onClick={handleUndoSave}
                  className="px-3 py-2 min-h-[44px] text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors"
                >
                  Undo Save
                </button>
              )}
              <button
                onClick={handleAddAnother}
                className="flex-1 px-3 py-2 min-h-[44px] text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium rounded-lg transition-colors"
              >
                Add Another Assessment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Walk section - radio selection (not participating vs 2km walk) with auto pass/fail
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
  const handleWalkTimeChange = (val) => {
    const formatted = formatTimeInput(val)
    setWalkTime(formatted)
    if (walkTimeLimit && formatted && !isTimeIncomplete(formatted)) {
      const seconds = parseTime(formatted)
      if (seconds != null) {
        setWalkPass(seconds <= walkTimeLimit)
      }
    }
  }

  // Determine pass/fail display state
  const walkSeconds = walkTime && !isTimeIncomplete(walkTime) ? parseTime(walkTime) : null
  const hasResult = walkSeconds != null && walkTimeLimit

  return (
    <div className="mt-2 space-y-3">
      <div className="flex flex-col gap-2">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="cardio-exempt-mode"
            checked={!walkSelected}
            onChange={() => { setWalkSelected(false); setWalkTime('') }}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Not participating</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="cardio-exempt-mode"
            checked={walkSelected}
            onChange={() => setWalkSelected(true)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">2km Walk (profile alternate)</span>
        </label>
      </div>
      {walkSelected && (
        <div className="ml-6">
          {walkTimeLimit && (
            <p className="text-xs text-blue-600 mb-3">
              Time limit: {walkTimeLimitStr} (pass/fail - no points scored)
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Walk Time (mm:ss)</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={walkTime}
                onChange={(e) => handleWalkTimeChange(e.target.value)}
                placeholder={walkTimeLimitStr || '16:30'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              {hasResult && (
                <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold ${
                  walkPass ? 'bg-green-100 text-green-800 border border-green-300'
                           : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {walkPass ? 'PASS' : 'FAIL'}
                </span>
              )}
            </div>
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
            {!walkPass && hasResult && (
              <p className="text-xs text-red-600 mt-1">
                Walk failure results in overall PFA failure
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Lock button for exercise preference persistence
function LockButton({ component, exercise, label, locked, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(component, exercise)}
      aria-pressed={locked}
      aria-label={locked ? `Unlock ${label} preference` : `Lock ${label} as preferred exercise`}
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium min-h-[36px]',
        'border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        locked
          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
      ].join(' ')}
    >
      {locked ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      )}
      {label}
    </button>
  )
}


// UX-03: Segmented control - replaces dropdowns for exercise selection
function SegmentedControl({ options, value, onChange, disabled = false, groupLabel }) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      className={`flex rounded-lg border overflow-hidden ${disabled ? 'border-gray-200' : 'border-gray-300'}`}
    >
      {options.map((opt, i) => {
        const isSelected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => !disabled && onChange(opt.value)}
            className={[
              'flex-1 py-2.5 px-2 text-sm font-medium transition-colors min-h-[44px]',
              'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500',
              i < options.length - 1 ? (disabled ? 'border-r border-gray-200' : 'border-r border-gray-300') : '',
              isSelected
                ? (disabled ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white')
                : (disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'),
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// UX-04: Toggle switch for exemption - keyboard accessible button[role=switch]
function ToggleSwitch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// Component Section with score display
function ComponentSection({ title, exempt, onExemptChange, score, children, hideExemptToggle = false }) {
  // Derive short component name for ARIA label (e.g. "Cardio" from "Cardio (50 pts)")
  const componentName = title.split(' (')[0]

  return (
    <div className="mb-6 pb-6 border-b border-gray-200">
      <div className="flex items-start justify-between mb-4 gap-2">
        <h3 className="text-lg font-bold text-gray-900 pt-0.5">{title}</h3>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* UX-02: Component pass/fail badges alongside points */}
          {score && score.tested && (
            <div className="text-right" aria-label={`${componentName}: ${score.points.toFixed(1)} of ${score.maxPoints} points, ${score.pass ? 'pass' : 'fail'}`}>
              <p className={`text-base font-bold ${score.pass ? 'text-green-600' : 'text-red-600'}`} aria-hidden="true">
                {score.points.toFixed(1)} / {score.maxPoints}
              </p>
              <div className="flex justify-end items-center gap-1 mt-0.5" aria-hidden="true">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${score.pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {score.pass ? 'PASS' : 'FAIL'}
                </span>
                <span className="text-xs text-gray-500">{score.percentage.toFixed(1)}%</span>
              </div>
            </div>
          )}
          {/* UX-04: Toggle switch for exemption (hidden for cardio - integrated into segmented control) */}
          {!hideExemptToggle && (
            <div className="flex items-center gap-1.5">
              <span className={`text-xs ${exempt ? 'text-gray-700 font-bold' : 'text-gray-500'}`} aria-hidden="true">Exempt</span>
              <ToggleSwitch
                checked={exempt}
                onChange={onExemptChange}
                ariaLabel={`${componentName} exemption`}
              />
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

// Progress indicator showing X of 4 components completed
function ProgressBar({ cardioExempt, cardioValue, walkSelected, walkTime,
  strengthExempt, strengthValue, coreExempt, coreValue,
  bodyCompExempt, heightInches, waistInches }) {

  const components = [
    { name: 'Cardio', done: cardioExempt || !!(cardioValue || (walkSelected && walkTime)) },
    { name: 'Strength', done: strengthExempt || !!strengthValue },
    { name: 'Core', done: coreExempt || !!coreValue },
    { name: 'Body Comp', done: bodyCompExempt || !!(heightInches && waistInches) },
  ]
  const completed = components.filter(c => c.done).length

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 sticky top-0 z-20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">{completed} of 4 components completed</span>
        <span className="text-xs text-gray-400">{Math.round(completed / 4 * 100)}%</span>
      </div>
      <div className="flex gap-1.5">
        {components.map(c => (
          <div key={c.name} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-2 rounded-full transition-colors duration-300 ${c.done ? 'bg-blue-500' : 'bg-gray-200'}`} />
            <span className={`text-[10px] leading-tight ${c.done ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
