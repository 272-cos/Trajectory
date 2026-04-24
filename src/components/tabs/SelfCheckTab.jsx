/**
 * Self-Check Tab - Personal assessment entry with live scoring
 */

import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { encodeSCode, decodeSCode } from '../../utils/codec/scode.js'
import { EXERCISES, COMPONENTS, GENDER, AGE_BRACKETS, VALIDATION } from '../../utils/scoring/constants.js'
import { calculateAge, getAgeBracket, isDiagnosticPeriod, getWalkTimeLimit } from '../../utils/scoring/constants.js'
import { calculateComponentScore, calculateCompositeScore, calculateWHtR, parseTime, formatTime, isTimeIncomplete, hamrTimeToShuttles } from '../../utils/scoring/scoringEngine.js'
import { getMinimumToPass } from '../../utils/scoring/reverseScoring.js'
import ExerciseComparison from './ExerciseComparison.jsx'
import { saveDraft, loadDraft, clearDraft, savePracticeSession, getSelectedBase, saveSelectedBase } from '../../utils/storage/localStorage.js'
import { UPPER_BODY, CORE, CARDIO } from '../../utils/training/exercisePreferences.js'
import { getTrainingResources } from '../../utils/training/resources.js'
import { BASE_REGISTRY } from '../../utils/codec/bitpack.js'
import { generatePDFAndDownload } from '../../utils/pdf/generateFormPDF.js'
import ShareModal from '../shared/ShareModal.jsx'
import HintBanner from '../shared/HintBanner.jsx'
import {
  PI_EXERCISES, PI_EXERCISE_LABELS, PI_IS_TIME,
  scalePIWorkout, scaleFractionalTest,
  isMockTestWindow, isInTaperPeriod, hasMockTestBeenRecorded,
} from '../../utils/training/practiceSession.js'

const BASE_URL = import.meta.env.BASE_URL

/**
 * Auto-format time input: inserts colon as user types digits.
 * "1630" -> "16:30", "230" -> "2:30", "16" -> "16"
 * If the value already contains a colon, only clean up around it.
 */
/**
 * Split mm:ss time input into two numeric fields.
 * Stores value as "mm:ss" string for compatibility with parseTime().
 */
function TimeInput({ value, onChange, placeholderMin, placeholderSec, disabled, id }) {
  const parts = (value || '').split(':')
  const mins = parts[0] || ''
  const secs = parts[1] || ''
  const secRef = useRef(null)

  const handleMinChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
    onChange(v + ':' + secs)
    if (v.length === 2) secRef.current?.focus()
  }

  const handleSecChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 2)
    if (v.length === 2) {
      const n = parseInt(v, 10)
      if (n > 59) v = '59'
    }
    onChange(mins + ':' + v)
  }

  return (
    <div className="flex items-center gap-1">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={mins}
        onChange={handleMinChange}
        placeholder={placeholderMin || 'mm'}
        disabled={disabled}
        className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center"
        aria-label="Minutes"
      />
      <span className="text-gray-500 font-bold text-lg">:</span>
      <input
        ref={secRef}
        type="text"
        inputMode="numeric"
        value={secs}
        onChange={handleSecChange}
        placeholder={placeholderSec || 'ss'}
        disabled={disabled}
        className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center"
        aria-label="Seconds"
      />
    </div>
  )
}

/** Keep formatTimeInput for backward compat with draft restore and non-TimeInput paths */
function formatTimeInput(rawValue) {
  if (rawValue.includes(':')) {
    const parts = rawValue.split(':')
    const mins = parts[0].replace(/\D/g, '')
    const secs = parts.slice(1).join('').replace(/\D/g, '').slice(0, 2)
    return mins + ':' + secs
  }
  const digits = rawValue.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return digits.slice(0, digits.length - 2) + ':' + digits.slice(-2)
}

export default function SelfCheckTab() {
  const { demographics, addSCode, removeSCode, dcode, setSelfCheckDirty, registerSelfCheckGenerator, targetPfaDate, scodes, setActiveTab, pfaPreferences } = useApp()

  // IV-01: Assessment date - picker with max = today (local date, not UTC)
  const _now = new Date()
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`
  const [assessmentDate, setAssessmentDate] = useState(today)

  // Cardio - default from preferences (walk pref handled via exempt + walkSelected)
  const [cardioExercise, setCardioExercise] = useState(
    pfaPreferences?.cardio === CARDIO.HAMR ? EXERCISES.HAMR : EXERCISES.RUN_2MILE,
  )
  const [cardioValue, setCardioValue] = useState('')
  const [cardioExempt, setCardioExempt] = useState(false)

  // Strength - default from preferences
  const [strengthExercise, setStrengthExercise] = useState(
    pfaPreferences?.upperBody === UPPER_BODY.HRPU ? EXERCISES.HRPU : EXERCISES.PUSHUPS,
  )
  const [strengthValue, setStrengthValue] = useState('')
  const [strengthExempt, setStrengthExempt] = useState(false)

  // Core - default from preferences
  const [coreExercise, setCoreExercise] = useState(
    pfaPreferences?.core === CORE.CLRC  ? EXERCISES.CLRC
    : pfaPreferences?.core === CORE.PLANK ? EXERCISES.PLANK
    : EXERCISES.SITUPS,
  )
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

  // Altitude base selection (persisted)
  const [selectedBase, setSelectedBase] = useState(() => getSelectedBase())

  // UI state
  const [scode, setSCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scores, setScores] = useState(null)
  const [draftRestored, setDraftRestored] = useState(false)
  const [draftSavedVisible, setDraftSavedVisible] = useState(false)
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(null) // For undo
  const [showShareModal, setShowShareModal] = useState(false)

  // Practice Mode state
  const [practiceMode, setPracticeMode] = useState(false)

  // ── Draft restore on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const draft = loadDraft()
    if (!draft) return
    // Whitelist-only restore: ignore any keys not in the expected draft shape to
    // prevent prototype-pollution or unexpected state injection from crafted storage.
    const DRAFT_KEYS = new Set([
      'assessmentDate', 'cardioExercise', 'cardioValue', 'cardioExempt',
      'walkSelected', 'walkTime', 'strengthExercise', 'strengthValue', 'strengthExempt',
      'coreExercise', 'coreValue', 'coreExempt', 'bodyCompExempt', 'heightInches',
      'waistInches', '_ts',
    ])
    const safe = Object.fromEntries(
      Object.entries(draft).filter(([k]) => DRAFT_KEYS.has(k))
    )
    if (safe.assessmentDate) setAssessmentDate(safe.assessmentDate)
    if (safe.cardioExercise) setCardioExercise(safe.cardioExercise)
    if (safe.cardioValue) setCardioValue(safe.cardioValue)
    if (safe.cardioExempt !== undefined) setCardioExempt(safe.cardioExempt)
    if (safe.walkSelected !== undefined) setWalkSelected(safe.walkSelected)
    if (safe.walkTime) setWalkTime(safe.walkTime)
    if (safe.strengthExercise) setStrengthExercise(safe.strengthExercise)
    if (safe.strengthValue) setStrengthValue(safe.strengthValue)
    if (safe.strengthExempt !== undefined) setStrengthExempt(safe.strengthExempt)
    if (safe.coreExercise) setCoreExercise(safe.coreExercise)
    if (safe.coreValue) setCoreValue(safe.coreValue)
    if (safe.coreExempt !== undefined) setCoreExempt(safe.coreExempt)
    if (safe.bodyCompExempt !== undefined) setBodyCompExempt(safe.bodyCompExempt)
    if (safe.heightInches) setHeightInches(safe.heightInches)
    if (safe.waistInches) setWaistInches(safe.waistInches)
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

  // Default bracket for exploration mode (25-29 Male - middle of the road)
  const DEFAULT_GENDER = GENDER.MALE
  const DEFAULT_AGE_BRACKET = AGE_BRACKETS.AGE_25_29

  // Calculate scores whenever inputs change
  useEffect(() => {
    if (!assessmentDate) {
      setScores(null)
      return
    }

    try {
      const gender = hasDemographics ? demographics.gender : DEFAULT_GENDER
      const ageBracket = hasDemographics
        ? getAgeBracket(calculateAge(demographics.dob, assessmentDate))
        : DEFAULT_AGE_BRACKET

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
        if (value && value > 0 && !(cardioExercise === EXERCISES.RUN_2MILE && value > VALIDATION.RUN_MAX_SECONDS)) {
          const cardioScore = calculateComponentScore(
            { type: COMPONENTS.CARDIO, exercise: cardioExercise, value, exempt: false },
            gender,
            ageBracket
          )
          components.push({ ...cardioScore, type: COMPONENTS.CARDIO, exercise: cardioExercise, value })
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
          components.push({ ...walkScore, type: COMPONENTS.CARDIO, exercise: EXERCISES.WALK_2KM, value })
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
          components.push({ ...strengthScore, type: COMPONENTS.STRENGTH, exercise: strengthExercise, value })
        }
      } else if (strengthExempt) {
        components.push({ type: COMPONENTS.STRENGTH, exempt: true, tested: false, pass: true })
      }

      // Core
      if (!coreExempt && coreValue) {
        const value = coreExercise === EXERCISES.PLANK ? parseTime(coreValue) : parseInt(coreValue, 10)
        // IV-09: Plank max 10:00 (600s)
        if ((value || value === 0) && !(coreExercise === EXERCISES.PLANK && value > VALIDATION.PLANK_MAX_SECONDS)) {
          const coreScore = calculateComponentScore(
            { type: COMPONENTS.CORE, exercise: coreExercise, value, exempt: false },
            gender,
            ageBracket
          )
          components.push({ ...coreScore, type: COMPONENTS.CORE, exercise: coreExercise, value })
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
      setScores({ components, composite, ageBracket, gender })
    } catch (err) {
      console.error('Error calculating scores:', err)
      setScores(null)
    }
  }, [hasDemographics, demographics, assessmentDate, cardioExercise, cardioValue, cardioExempt, walkSelected, walkTime, walkPass, strengthExercise, strengthValue, strengthExempt, coreExercise, coreValue, coreExempt, heightInches, waistInches, bodyCompExempt])

  // IV-05: Height must be 48-84 inches (enforce positive finite number, validate range)
  const handleHeightChange = (e) => {
    const val = e.target.value
    if (val) {
      const h = parseFloat(val)
      // Block non-numeric, non-finite, or negative input
      if (isNaN(h) || !isFinite(h) || h < 0) return
      setHeightInches(val)
      if (h < VALIDATION.HEIGHT_MIN_INCHES || h > VALIDATION.HEIGHT_MAX_INCHES) {
        setHeightError('Height must be between 48 and 84 inches.')
      } else {
        setHeightError('')
      }
    } else {
      setHeightInches(val)
      setHeightError('')
    }
  }

  // IV-06: Waist must be 20.0-55.0 inches (enforce positive finite number, validate range)
  const handleWaistChange = (e) => {
    const val = e.target.value
    if (val) {
      const w = parseFloat(val)
      // Block non-numeric, non-finite, or negative input
      if (isNaN(w) || !isFinite(w) || w < 0) return
      setWaistInches(val)
      if (w < VALIDATION.WAIST_MIN_INCHES || w > VALIDATION.WAIST_MAX_INCHES) {
        setWaistError('Waist must be between 20.0 and 55.0 inches.')
      } else {
        setWaistError('')
      }
    } else {
      setWaistInches(val)
      setWaistError('')
    }
  }

  const handleGenerateSCode = () => {
    setError('')
    setSuccess('')

    if (!hasDemographics) {
      setError('Profile needed to save. Set your DOB and gender in the Profile tab - takes 10 seconds.')
      return false
    }

    if (!assessmentDate) {
      setError('Please select an assessment date.')
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
        if (h < VALIDATION.HEIGHT_MIN_INCHES || h > VALIDATION.HEIGHT_MAX_INCHES) {
          setError('Height must be between 48 and 84 inches.')
          return false
        }
      }
      // IV-06: Waist range
      if (!bodyCompExempt && waistInches) {
        const w = parseFloat(waistInches)
        if (w < VALIDATION.WAIST_MIN_INCHES || w > VALIDATION.WAIST_MAX_INCHES) {
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
        if (runTime != null && runTime > VALIDATION.RUN_MAX_SECONDS) {
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
        if (wt != null && wt > VALIDATION.RUN_MAX_SECONDS) {
          setError('Maximum walk time is 2:00:00.')
          return false
        }
      }
      // IV-09: Plank max 10:00
      if (!coreExempt && coreExercise === EXERCISES.PLANK && coreValue) {
        const plankTime = parseTime(coreValue)
        if (plankTime != null && plankTime > VALIDATION.PLANK_MAX_SECONDS) {
          setError('Maximum plank entry is 10 minutes.')
          return false
        }
      }
      // Strength reps: must be 1-300 (reject 0, negative, and absurd values)
      if (!strengthExempt && strengthValue) {
        const reps = parseInt(strengthValue, 10)
        if (isNaN(reps) || reps < VALIDATION.REPS_MIN || reps > VALIDATION.REPS_MAX) {
          setError('Strength reps must be between 1 and 300.')
          return false
        }
      }
      // Core reps: must be 1-300 (when not plank)
      if (!coreExempt && coreValue && coreExercise !== EXERCISES.PLANK) {
        const reps = parseInt(coreValue, 10)
        if (isNaN(reps) || reps < VALIDATION.REPS_MIN || reps > VALIDATION.REPS_MAX) {
          setError('Core reps must be between 1 and 300.')
          return false
        }
      }
      // HAMR shuttles: must be 1-232 after conversion
      if (!cardioExempt && cardioExercise === EXERCISES.HAMR && cardioValue) {
        const val = cardioValue.includes(':') ? hamrTimeToShuttles(cardioValue) : parseInt(cardioValue, 10)
        if (isNaN(val) || val < VALIDATION.HAMR_MIN_SHUTTLES || val > VALIDATION.HAMR_MAX_SHUTTLES) {
          setError('HAMR shuttles must be between 1 and 232.')
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
          baseId: selectedBase,
          rpe: 3,
          sleepQuality: 2,
          nutrition: 2,
          injured: false,
          environmentFlags: selectedBase > 0 ? 0b010000 : 0, // ALTITUDE_NOTABLE when base selected
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
      // First-save celebration with backup hint
      const isFirstSave = scodes.length === 0
      if (isFirstSave) {
        setSuccess('First assessment saved! Your data lives on this device only - back up anytime from the Tools tab.')
      } else {
        setSuccess('Assessment saved!')
      }
      return true
    } catch {
      setError('Could not generate assessment code. Check your inputs and try again.')
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

  // Build a decoded-shape assessment object from the current form state for
  // PDF generation. Mirrors the structure produced by decodeSCode() so the
  // shared generator in utils/pdf/generateFormPDF.js works without changes.
  const buildDecodedForPDF = () => {
    let cardio = null
    if (!cardioExempt && cardioValue) {
      let cardioVal
      if (cardioExercise === EXERCISES.RUN_2MILE) cardioVal = parseTime(cardioValue)
      else if (cardioExercise === EXERCISES.HAMR) cardioVal = cardioValue.includes(':') ? hamrTimeToShuttles(cardioValue) : parseInt(cardioValue, 10)
      cardio = { exercise: cardioExercise, value: cardioVal, exempt: false }
    } else if (cardioExempt && walkSelected && walkTime) {
      cardio = { exercise: EXERCISES.WALK_2KM, value: parseTime(walkTime), exempt: false, walkPass }
    } else if (cardioExempt) {
      cardio = { exercise: cardioExercise, value: null, exempt: true }
    }

    const strength = !strengthExempt && strengthValue
      ? { exercise: strengthExercise, value: parseInt(strengthValue, 10), exempt: false }
      : strengthExempt
        ? { exercise: strengthExercise, value: null, exempt: true }
        : null

    const core = !coreExempt && coreValue
      ? { exercise: coreExercise, value: coreExercise === EXERCISES.PLANK ? parseTime(coreValue) : parseInt(coreValue, 10), exempt: false }
      : coreExempt
        ? { exercise: coreExercise, value: null, exempt: true }
        : null

    const bodyComp = !bodyCompExempt && heightInches && waistInches
      ? { heightInches: parseFloat(heightInches), waistInches: parseFloat(waistInches), exempt: false }
      : bodyCompExempt
        ? { heightInches: null, waistInches: null, exempt: true }
        : null

    return { date: assessmentDate, cardio, strength, core, bodyComp, isDiagnostic }
  }

  // Determine whether Save PDF is available and, if not, why.
  // Requires a profile (for age bracket + gender) and at least one scored
  // component so the generator has something to render.
  const pdfDisabledReason = (() => {
    if (!hasDemographics) return 'Set up your profile (DOB and gender) to generate a PDF.'
    if (!scores || !scores.components || scores.components.length === 0) {
      return 'Enter at least one component result to generate a PDF.'
    }
    return null
  })()

  const handleDownloadPDF = async () => {
    if (pdfDisabledReason) return
    try {
      const decoded = buildDecodedForPDF()
      await generatePDFAndDownload(demographics, decoded, scores, decoded.date)
    } catch (err) {
      console.error('PDF generation failed:', err)
      setError('Could not generate PDF. Check your inputs and try again.')
    }
  }

  // Clear all form fields
  const handleClearForm = () => {
    setAssessmentDate(today)
    setCardioExercise(pfaPreferences?.cardio === CARDIO.HAMR ? EXERCISES.HAMR : EXERCISES.RUN_2MILE)
    setCardioValue('')
    setCardioExempt(false)
    setWalkSelected(false)
    setWalkTime('')
    setWalkPass(true)
    setStrengthExercise(pfaPreferences?.upperBody === UPPER_BODY.HRPU ? EXERCISES.HRPU : EXERCISES.PUSHUPS)
    setStrengthValue('')
    setStrengthExempt(false)
    setCoreExercise(
      pfaPreferences?.core === CORE.CLRC  ? EXERCISES.CLRC
      : pfaPreferences?.core === CORE.PLANK ? EXERCISES.PLANK
      : EXERCISES.SITUPS,
    )
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

  const isDiagnostic = isDiagnosticPeriod(assessmentDate)

  // Mock test / taper window detection (TR-01, TR-02, TR-09, TR-10)
  const todayISO = today
  const mockTestWindow = isMockTestWindow(targetPfaDate, todayISO)
  const taperPeriod = isInTaperPeriod(targetPfaDate, todayISO)
  const mockTestRecorded = hasMockTestBeenRecorded(scodes, decodeSCode, targetPfaDate)

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
      <HintBanner
        storageKey="pfa_hint_selfcheck"
        title="A few things before you start"
        bullets={[
          'Body composition needs both your waist and height measurements - enter both and your score appears automatically.',
          'When you are done, tap Save Assessment to lock in your result. The auto-save only holds your draft.',
          'Composite score appears only when all four components have data.',
        ]}
      />
      {/* TR-09: Mock test window banner - informational only */}
      {mockTestWindow && !mockTestRecorded && (
        <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-lg">
          <p className="text-sm font-bold text-amber-900 mb-1">You are in the Mock Test Window</p>
          <p className="text-sm text-amber-800">
            Your PFA is approximately 2 weeks away. Consider running your full mock test now - one time only.
            After the mock test, reduce training volume by 50% and let your body supercompensate.
          </p>
        </div>
      )}

      {/* TR-02: Post-mock-test taper prompt */}
      {mockTestRecorded && taperPeriod && (
        <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
          <p className="text-sm font-bold text-green-900 mb-1">Mock Test Recorded - Time to Taper</p>
          <p className="text-sm text-green-800">
            You proved you can do this. Reduce training volume by 50% until test day.
            Avoid hard efforts - let supercompensation work. Short, easy sessions only.
          </p>
        </div>
      )}

      {/* TR-10: Taper period reminder (even without mock test) */}
      {taperPeriod && !mockTestRecorded && !mockTestWindow && (
        <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-bold">Taper period:</span> Your PFA is within 2 weeks. Reduce training volume by 50% and avoid hard efforts until test day.
          </p>
        </div>
      )}

      {/* Exploration mode hint - profile not yet set */}
      {!hasDemographics && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-blue-600 text-lg flex-shrink-0" aria-hidden="true">i</span>
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              Scores shown use a default bracket (25-29 Male).{' '}
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="underline font-medium text-blue-700 hover:text-blue-900"
              >
                Set up your profile
              </button>
              {' '}for personalized scoring.
            </p>
          </div>
        </div>
      )}

      {/* Practice Mode toggle */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-800">Practice Check</p>
          <p className="text-xs text-gray-500">Log a training workout or partial test run without saving an official assessment</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={practiceMode}
          aria-label="Toggle practice check mode"
          onClick={() => setPracticeMode(m => !m)}
          className={`relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            practiceMode ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              practiceMode ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Practice mode: replace normal form */}
      {practiceMode && (
        <PracticeCheckForm
          demographics={demographics}
          assessmentDate={assessmentDate}
          onDateChange={setAssessmentDate}
          today={today}
        />
      )}

      {practiceMode ? null : (
      <>
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
                  {scores.composite.pass ? 'PASS' : 'FAIL'}
                </span>
                {/* Approximate score indicator when using default bracket */}
                {!hasDemographics && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                    Approximate
                  </span>
                )}
                {/* UX-10: Diagnostic period badge */}
                {isDiagnostic && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                    Diagnostic Period
                  </span>
                )}
              </div>
              {!scores.composite.pass && (
                <>
                  <ul className="text-xs text-red-700 mt-1 space-y-0.5">
                    {!scores.composite.compositePass && (
                      <li>{(75.0 - scores.composite.composite).toFixed(1)} points below passing (75.0)</li>
                    )}
                    {scores.composite.failedComponents.map((fc, i) => (
                      <li key={i}>{fc.type.charAt(0).toUpperCase() + fc.type.slice(1)} below chart minimum - 0 pts scored (DAFMAN §3.7.4)</li>
                    ))}
                    {scores.composite.walkComponents?.some(w => w.pass === false) && (
                      <li>2km Walk not passed - overall PFA failure</li>
                    )}
                  </ul>
                  <p className="text-xs text-gray-600 mt-2">
                    Check the Training Focus section on the Trajectory tab for your fastest path to passing.
                  </p>
                </>
              )}
              {scores.composite.pass && (
                <p className="text-xs text-gray-600 mt-2">
                  Passing. See the Trajectory tab for your margin and where to gain more points.
                </p>
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

      {/* Exercise Comparison - visible whenever at least one component is scored */}
      {scores && scores.components && scores.components.some(c => c.tested && !c.exempt && !c.walkOnly) && (
        <ExerciseComparison
          scores={scores}
          gender={scores.gender}
          ageBracket={scores.ageBracket}
        />
      )}

      {/* Assessment Date + Exercise Components */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Personal Assessment</h2>

        {/* IV-01: Self-check date picker - max = today */}
        <div className="mb-6">
          <label htmlFor="assessment-date" className="block text-sm font-medium text-gray-700 mb-2">Most Recent Assessment Date</label>
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
              <span id="diag-badge" className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Diagnostic period (Mar - Aug 2026) - does not count
              </span>
            )}
          </div>
        </div>

        {/* Exercise Components - 2-col on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-6">
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
              <label htmlFor="sc-cardio-value" className="block text-sm font-medium text-gray-700 mb-2">
                {cardioExercise === EXERCISES.RUN_2MILE ? 'Time' : 'Shuttles'}
              </label>
              {cardioExercise === EXERCISES.RUN_2MILE ? (
                <TimeInput
                  id="sc-cardio-value"
                  value={cardioValue}
                  onChange={setCardioValue}
                  placeholderMin="13"
                  placeholderSec="30"
                />
              ) : (
                <input
                  id="sc-cardio-value"
                  type="text"
                  inputMode="numeric"
                  value={cardioValue}
                  onChange={(e) => setCardioValue(e.target.value)}
                  placeholder="94"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              )}
              {cardioExercise === EXERCISES.RUN_2MILE && cardioValue && !isTimeIncomplete(cardioValue) && (
                <p className={`text-xs mt-1 ${parseTime(cardioValue) != null && parseTime(cardioValue) > 0 && parseTime(cardioValue) <= VALIDATION.RUN_MAX_SECONDS ? 'text-gray-500' : 'text-red-500'}`}>
                  {parseTime(cardioValue) != null
                    ? (() => {
                        const t = parseTime(cardioValue)
                        if (t === 0) return 'Enter a valid time between 0:01 and 2:00:00.'
                        if (t > VALIDATION.RUN_MAX_SECONDS) return 'Maximum run time is 2:00:00.'
                        return formatTime(t)
                      })()
                    : 'Invalid format - use MM:SS or total seconds'}
                </p>
              )}
              {cardioExercise === EXERCISES.HAMR && cardioValue && cardioValue.includes(':') && !isTimeIncomplete(cardioValue) && (
                <p className={`text-xs mt-1 ${hamrTimeToShuttles(cardioValue) != null ? 'text-gray-500' : 'text-red-500'}`}>
                  {hamrTimeToShuttles(cardioValue) != null
                    ? `Converted: ${hamrTimeToShuttles(cardioValue)} shuttles`
                    : 'Invalid time format'}
                </p>
              )}
            </div>
          )}

          {/* Minimum-to-pass hint for cardio when below minimum */}
          {!cardioExempt && (
            <MinimumToPassHint
              score={scores?.components.find(c => c.type === COMPONENTS.CARDIO)}
              exercise={cardioExercise}
              ageBracket={scores?.ageBracket}
              gender={scores?.gender}
              currentValue={
                cardioExercise === EXERCISES.RUN_2MILE
                  ? parseTime(cardioValue)
                  : (cardioValue.includes(':') ? hamrTimeToShuttles(cardioValue) : parseInt(cardioValue, 10))
              }
            />
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
          <TrainingResources component={COMPONENTS.CARDIO} exercise={cardioExempt ? null : cardioExercise} />
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
            <label htmlFor="sc-strength-value" className="block text-sm font-medium text-gray-700 mb-2">Reps</label>
            <input
              id="sc-strength-value"
              type="text"
              inputMode="numeric"
              value={strengthValue}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '')
                const n = parseInt(v, 10)
                if (v === '' || (n >= 0 && n <= VALIDATION.REPS_MAX)) setStrengthValue(v)
              }}
              disabled={strengthExempt}
              placeholder="42"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            />
            {strengthValue && parseInt(strengthValue, 10) > 200 && (
              <p className="text-xs text-amber-600 mt-1">Unusually high count - double check your entry</p>
            )}
          </div>
          {/* Minimum-to-pass hint for strength when below minimum */}
          {!strengthExempt && (
            <MinimumToPassHint
              score={scores?.components.find(c => c.type === COMPONENTS.STRENGTH)}
              exercise={strengthExercise}
              ageBracket={scores?.ageBracket}
              gender={scores?.gender}
              currentValue={parseInt(strengthValue, 10)}
            />
          )}
          <TrainingResources component={COMPONENTS.STRENGTH} exercise={strengthExempt ? null : strengthExercise} />
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
                { value: EXERCISES.CLRC, label: 'Reverse Crunches (2 min)' },
                { value: EXERCISES.PLANK, label: 'Forearm Plank' },
              ]}
              value={coreExercise}
              onChange={setCoreExercise}
              disabled={coreExempt}
            />
          </div>
          <div>
            <label htmlFor="sc-core-value" className="block text-sm font-medium text-gray-700 mb-2">
              {coreExercise === EXERCISES.PLANK ? 'Time' : 'Reps'}
            </label>
            {coreExercise === EXERCISES.PLANK ? (
              <TimeInput
                id="sc-core-value"
                value={coreValue}
                onChange={setCoreValue}
                placeholderMin="2"
                placeholderSec="30"
                disabled={coreExempt}
              />
            ) : (
              <input
                id="sc-core-value"
                type="text"
                inputMode="numeric"
                value={coreValue}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '')
                  const n = parseInt(v, 10)
                  if (v === '' || (n >= 0 && n <= VALIDATION.REPS_MAX)) setCoreValue(v)
                }}
                disabled={coreExempt}
                placeholder="42"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              />
            )}
            {coreExercise === EXERCISES.PLANK && coreValue && !coreExempt && !isTimeIncomplete(coreValue) && (
              <p className={`text-xs mt-1 ${parseTime(coreValue) != null ? 'text-gray-500' : 'text-red-500'}`}>
                {parseTime(coreValue) != null
                  ? (() => {
                      const t = parseTime(coreValue)
                      if (t > VALIDATION.PLANK_MAX_SECONDS) return 'Maximum plank entry is 10 minutes'
                      return formatTime(t)
                    })()
                  : 'Invalid format - use MM:SS or total seconds'}
              </p>
            )}
          </div>
          {/* Minimum-to-pass hint for core when below minimum */}
          {!coreExempt && (
            <MinimumToPassHint
              score={scores?.components.find(c => c.type === COMPONENTS.CORE)}
              exercise={coreExercise}
              ageBracket={scores?.ageBracket}
              gender={scores?.gender}
              currentValue={coreExercise === EXERCISES.PLANK ? parseTime(coreValue) : parseInt(coreValue, 10)}
            />
          )}
          <TrainingResources component={COMPONENTS.CORE} exercise={coreExempt ? null : coreExercise} />
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
              <label htmlFor="sc-height" className="block text-sm font-medium text-gray-700 mb-2">Height (inches)</label>
              <input
                id="sc-height"
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
              <label htmlFor="sc-waist" className="block text-sm font-medium text-gray-700 mb-2">Waist (inches)</label>
              <input
                id="sc-waist"
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
          {/* Body comp hint: shown when WHtR earns 0 pts (BC has no pass/fail minimum per §3.7.1) */}
          {!bodyCompExempt && heightInches && waistInches && !heightError && !waistError &&
           scores?.components.find(c => c.type === COMPONENTS.BODY_COMP)?.points === 0 && (
            <p className="text-xs text-red-600 mt-2">
              You need: {(0.59 * parseFloat(heightInches)).toFixed(1)} in waist
            </p>
          )}
          <TrainingResources component={COMPONENTS.BODY_COMP} />
        </ComponentSection>
        </div>{/* close exercise components grid */}

        {/* Altitude base selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            High-Altitude Base (optional)
          </label>
          <select
            value={selectedBase}
            onChange={(e) => {
              const val = Number(e.target.value)
              setSelectedBase(val)
              saveSelectedBase(val)
            }}
            className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select high-altitude base"
          >
            <option value={0}>None - not at a high-altitude base</option>
            {BASE_REGISTRY.filter(Boolean).map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.state}) - {b.elevationFt.toLocaleString()} ft
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            CO, WY, and NM bases above 5,000 ft. Recorded in your assessment code for context.
          </p>
        </div>

        {/* IV-10: All-exempt warning */}
        {allExempt && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-sm mb-4">
            All components exempt. No composite score possible.
          </div>
        )}

      </div>

      {/* Action bar - sticky on mobile */}
      <div className="bg-white rounded-lg shadow-md p-6 sticky bottom-0 z-10 sm:static sm:shadow-md shadow-lg">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleGenerateSCode}
            className="flex-1 min-w-[160px] bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Assessment
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={!!pdfDisabledReason}
            aria-label={pdfDisabledReason || 'Save assessment as PDF'}
            title={pdfDisabledReason || 'Save assessment as PDF'}
            className="min-h-[44px] bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save PDF
          </button>
          <button
            onClick={handleClearForm}
            className="px-4 py-3 min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Clear
          </button>
        </div>
        {!hasDemographics && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Saving requires a profile.{' '}
            <button type="button" onClick={() => setActiveTab('profile')} className="underline text-blue-600 hover:text-blue-800">
              Set up profile
            </button>
            {' '}- takes 10 seconds.
          </p>
        )}

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
        {scode && showShareModal && (
          <ShareModal
            url={(() => {
              const origin = window.location.origin
              const base = BASE_URL.replace(/\/$/, '')
              const params = new URLSearchParams()
              if (dcode) params.set('d', dcode)
              params.set('s', scode)
              return `${origin}${base}/?${params.toString()}`
            })()}
            title="Share Assessment"
            onClose={() => setShowShareModal(false)}
          />
        )}

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
                onClick={() => setShowShareModal(true)}
                aria-label="Share assessment via QR code or link"
                className="px-3 py-2 min-h-[44px] bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Share / QR
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Assessment saved! Check the <strong>Trajectory tab</strong> for personalized improvement tips.
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
      </>
      )}
    </div>
  )
}

// ── Practice Check Form ──────────────────────────────────────────────────────

/**
 * PracticeCheckForm - renders when practice mode is ON.
 * Supports PI Workout (30-sec benchmarks) and Fractional Tests (50% / 75%).
 * TR-05: saves to pfa_practice_sessions, never to S-codes.
 */
function PracticeCheckForm({ assessmentDate, today }) {
  const [practiceType, setPracticeType] = useState('pi_workout')
  const [practiceDate, setPracticeDate] = useState(assessmentDate)

  // PI Workout state
  const [piExercise, setPiExercise] = useState(PI_EXERCISES.PUSHUPS_30S)
  const [piValue, setPiValue] = useState('')
  const [piScaled, setPiScaled] = useState(null)

  // Fractional Test state
  const [fraction, setFraction] = useState(0.5)
  const [fracCardioValue, setFracCardioValue] = useState('')
  const [fracStrengthValue, setFracStrengthValue] = useState('')
  const [fracCoreValue, setFracCoreValue] = useState('')
  const [fracCardioExercise, setFracCardioExercise] = useState(EXERCISES.RUN_2MILE)
  const [fracStrengthExercise, setFracStrengthExercise] = useState(EXERCISES.PUSHUPS)
  const [fracCoreExercise, setFracCoreExercise] = useState(EXERCISES.SITUPS)

  // Save state
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')

  // Compute PI scale on input change
  useEffect(() => {
    if (!piValue) { setPiScaled(null); return }
    const raw = PI_IS_TIME[piExercise] ? parseTime(piValue) : parseInt(piValue, 10)
    if (!raw && raw !== 0) { setPiScaled(null); return }
    setPiScaled(scalePIWorkout(piExercise, raw))
  }, [piExercise, piValue])

  // Compute fractional test scaled predictions
  const fracScaled = {
    cardio: fracCardioValue ? (() => {
      const raw = fracCardioExercise === EXERCISES.RUN_2MILE ? parseTime(fracCardioValue) : parseInt(fracCardioValue, 10)
      return raw ? scaleFractionalTest(fracCardioExercise, fraction, raw) : null
    })() : null,
    strength: fracStrengthValue ? (() => {
      const raw = parseInt(fracStrengthValue, 10)
      return raw ? scaleFractionalTest(fracStrengthExercise, fraction, raw) : null
    })() : null,
    core: fracCoreValue ? (() => {
      const raw = fracCoreExercise === EXERCISES.PLANK ? parseTime(fracCoreValue) : parseInt(fracCoreValue, 10)
      return raw ? scaleFractionalTest(fracCoreExercise, fraction, raw) : null
    })() : null,
  }

  const pct = Math.round(fraction * 100)

  const handleSavePI = () => {
    setSaveError('')
    if (!piValue) { setSaveError('Enter your result first.'); return }
    const raw = PI_IS_TIME[piExercise] ? parseTime(piValue) : parseInt(piValue, 10)
    if (!raw && raw !== 0) { setSaveError('Invalid value.'); return }
    const scaled = scalePIWorkout(piExercise, raw)
    if (!scaled) { setSaveError('Could not scale this exercise type.'); return }

    const session = {
      id: Date.now(),
      savedAt: new Date().toISOString(),
      date: practiceDate,
      type: 'pi_workout',
      piExercise,
      piValue: raw,
      scaled,
    }
    savePracticeSession(session)
    setPiValue('')
    setPiScaled(null)
    setSaveSuccess('Practice session saved.')
    setTimeout(() => setSaveSuccess(''), 3000)
  }

  const handleSaveFractional = () => {
    setSaveError('')
    const hasAny = fracCardioValue || fracStrengthValue || fracCoreValue
    if (!hasAny) { setSaveError('Enter at least one component result.'); return }

    const components = {}
    if (fracCardioValue) {
      const raw = fracCardioExercise === EXERCISES.RUN_2MILE ? parseTime(fracCardioValue) : parseInt(fracCardioValue, 10)
      if (raw) components.cardio = { exercise: fracCardioExercise, value: raw, scaled: fracScaled.cardio }
    }
    if (fracStrengthValue) {
      const raw = parseInt(fracStrengthValue, 10)
      if (raw || raw === 0) components.strength = { exercise: fracStrengthExercise, value: raw, scaled: fracScaled.strength }
    }
    if (fracCoreValue) {
      const raw = fracCoreExercise === EXERCISES.PLANK ? parseTime(fracCoreValue) : parseInt(fracCoreValue, 10)
      if (raw || raw === 0) components.core = { exercise: fracCoreExercise, value: raw, scaled: fracScaled.core }
    }

    const session = {
      id: Date.now(),
      savedAt: new Date().toISOString(),
      date: practiceDate,
      type: 'fractional_test',
      fraction,
      components,
    }
    savePracticeSession(session)
    setFracCardioValue('')
    setFracStrengthValue('')
    setFracCoreValue('')
    setSaveSuccess('Partial test saved.')
    setTimeout(() => setSaveSuccess(''), 3000)
  }

  return (
    <div className="space-y-4">
      {/* Date + type selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Practice Check</h2>

        <div className="mb-4">
          <label htmlFor="practice-date" className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            id="practice-date"
            type="date"
            value={practiceDate}
            onChange={e => setPracticeDate(e.target.value)}
            max={today}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Practice Type</label>
          <SegmentedControl
            options={[
              { value: 'pi_workout', label: 'Quick Benchmark' },
              { value: 'fractional_test', label: 'Partial Test' },
            ]}
            value={practiceType}
            onChange={setPracticeType}
          />
          <p className="text-xs text-gray-500 mt-2">
            {practiceType === 'pi_workout'
              ? 'Quick Benchmarks: short timed efforts (30-sec counts, 1-mile run) that estimate your full-test result. Easier than a full test.'
              : 'Partial Tests: perform at 50% or 75% of the standard to check your progress. Not scored officially.'}
          </p>
        </div>

        {/* PI Workout form */}
        {practiceType === 'pi_workout' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exercise</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PI_EXERCISE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setPiExercise(key); setPiValue(''); setPiScaled(null) }}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors text-left ${
                      piExercise === key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {PI_IS_TIME[piExercise] ? 'Time' : 'Reps'}
              </label>
              {PI_IS_TIME[piExercise] ? (
                <TimeInput
                  value={piValue}
                  onChange={setPiValue}
                  placeholderMin="8"
                  placeholderSec="30"
                />
              ) : (
                <input
                  type="text"
                  inputMode="numeric"
                  value={piValue}
                  onChange={e => setPiValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="21"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              )}
            </div>

            {/* TR-03: scaled prediction with confidence note */}
            {piScaled && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm font-medium text-indigo-900">{piScaled.displayText}</p>
                <p className="text-xs text-indigo-600 mt-1">Estimated - {piScaled.confidenceNote}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSavePI}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Save Practice Session
            </button>
          </div>
        )}

        {/* Fractional Test form */}
        {practiceType === 'fractional_test' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fraction of Standard</label>
              <SegmentedControl
                options={[
                  { value: 0.5, label: '50% - Midpoint Check' },
                  { value: 0.75, label: '75% - Final Approach' },
                ]}
                value={fraction}
                onChange={v => setFraction(Number(v))}
              />
              <p className="text-xs text-gray-500 mt-1">
                {pct}% test: {pct === 50 ? 'half the reps, half the distance' : '75% of the reps and distance'}
              </p>
            </div>

            {/* Cardio */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                Cardio - {pct === 50 ? '1-mile' : '1.5-mile'} run (or enter HAMR shuttles)
              </p>
              <div className="flex gap-2 mb-2">
                {[EXERCISES.RUN_2MILE, EXERCISES.HAMR].map(ex => (
                  <button key={ex} type="button"
                    onClick={() => { setFracCardioExercise(ex); setFracCardioValue('') }}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors ${fracCardioExercise === ex ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
                  >
                    {ex === EXERCISES.RUN_2MILE ? 'Run' : 'HAMR'}
                  </button>
                ))}
              </div>
              {fracCardioExercise === EXERCISES.RUN_2MILE ? (
                <TimeInput value={fracCardioValue} onChange={setFracCardioValue} placeholderMin="8" placeholderSec="30" />
              ) : (
                <input type="text" inputMode="numeric" value={fracCardioValue}
                  onChange={e => setFracCardioValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="47" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              )}
              {/* TR-04: labeled with fraction */}
              {fracScaled.cardio && (
                <p className="text-xs text-indigo-700 mt-1">{fracScaled.cardio.displayText} - {fracScaled.cardio.confidenceNote}</p>
              )}
            </div>

            {/* Strength */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                Strength - {pct}% target reps
              </p>
              <div className="flex gap-2 mb-2">
                {[EXERCISES.PUSHUPS, EXERCISES.HRPU].map(ex => (
                  <button key={ex} type="button"
                    onClick={() => { setFracStrengthExercise(ex); setFracStrengthValue('') }}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors ${fracStrengthExercise === ex ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
                  >
                    {ex === EXERCISES.PUSHUPS ? 'Push-ups' : 'Hand-Release Push-ups'}
                  </button>
                ))}
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={fracStrengthValue}
                onChange={e => setFracStrengthValue(e.target.value.replace(/\D/g, ''))}
                placeholder="21"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {fracScaled.strength && (
                <p className="text-xs text-indigo-700 mt-1">{fracScaled.strength.displayText} - {fracScaled.strength.confidenceNote}</p>
              )}
            </div>

            {/* Core */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                Core - {pct}% target reps / hold
              </p>
              <div className="flex gap-2 mb-2">
                {[EXERCISES.SITUPS, EXERCISES.CLRC, EXERCISES.PLANK].map(ex => (
                  <button key={ex} type="button"
                    onClick={() => { setFracCoreExercise(ex); setFracCoreValue('') }}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors ${fracCoreExercise === ex ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
                  >
                    {ex === EXERCISES.SITUPS ? 'Sit-ups' : ex === EXERCISES.CLRC ? 'CLRC' : 'Plank'}
                  </button>
                ))}
              </div>
              {fracCoreExercise === EXERCISES.PLANK ? (
                <TimeInput value={fracCoreValue} onChange={setFracCoreValue} placeholderMin="1" placeholderSec="15" />
              ) : (
                <input type="text" inputMode="numeric" value={fracCoreValue}
                  onChange={e => setFracCoreValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="21" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              )}
              {fracScaled.core && (
                <p className="text-xs text-indigo-700 mt-1">{fracScaled.core.displayText} - {fracScaled.core.confidenceNote}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveFractional}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Save {pct}% Partial Test
            </button>
          </div>
        )}

        {/* Success / error feedback */}
        {saveSuccess && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            {saveSuccess} Practice sessions appear in History with a gray border and feed the Trajectory projection.
          </div>
        )}
        {saveError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {saveError}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Practice sessions are stored only on your device and never saved as official assessments.
          They appear in History below your official results and feed into the Trajectory projection.
        </p>
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
            <label htmlFor="sc-walk-time" className="block text-sm font-medium text-gray-700 mb-2">Walk Time</label>
            <div className="flex items-center gap-3">
              <TimeInput
                id="sc-walk-time"
                value={walkTime}
                onChange={handleWalkTimeChange}
                placeholderMin="16"
                placeholderSec="30"
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
              <p className={`text-xs mt-1 ${parseTime(walkTime) != null ? 'text-gray-500' : 'text-red-500'}`}>
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
                {score.pass && <span className="text-xs text-gray-500">{score.percentage.toFixed(1)}%</span>}
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

function formatNeededDelta(exercise, currentValue, floorThreshold) {
  if (currentValue == null || isNaN(currentValue)) return null
  if (exercise === EXERCISES.RUN_2MILE) {
    const delta = currentValue - floorThreshold
    if (delta <= 0) return null
    const m = Math.floor(delta / 60)
    const s = String(delta % 60).padStart(2, '0')
    return `-${m}:${s}`
  }
  if (exercise === EXERCISES.PLANK) {
    const delta = floorThreshold - currentValue
    if (delta <= 0) return null
    const m = Math.floor(delta / 60)
    const s = String(delta % 60).padStart(2, '0')
    return `+${m}:${s}`
  }
  if (exercise === EXERCISES.HAMR) {
    const delta = Math.ceil(floorThreshold - currentValue)
    if (delta <= 0) return null
    return `+${delta} shuttles`
  }
  const delta = Math.ceil(floorThreshold - currentValue)
  if (delta <= 0) return null
  return `+${delta} reps`
}

/**
 * Inline hint shown below an exercise input when the component score is below minimum.
 */
function MinimumToPassHint({ score, exercise, ageBracket, gender, currentValue }) {
  if (!score?.belowMinimum || !ageBracket || !gender) return null
  const minInfo = getMinimumToPass(exercise, ageBracket, gender)
  if (!minInfo) return null
  const delta = formatNeededDelta(exercise, currentValue, minInfo.threshold)
  if (!delta) return null
  return (
    <p className="text-xs text-red-600 mt-2">
      You need: {delta}
    </p>
  )
}

// Collapsible training resources section shown per component in Self-Check results
function TrainingResources({ component, exercise }) {
  const [open, setOpen] = useState(false)
  const resources = getTrainingResources(component, exercise)

  if (!resources || resources.length === 0) return null

  return (
    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
          Training Resources
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <ul className="divide-y divide-gray-100 bg-white" role="list">
          {resources.map((r, i) => (
            <li key={i} className="px-4 py-3">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {r.title}
              </a>
              <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium mr-1 ${
                  r.source === 'official' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {r.source === 'official' ? 'Official' : 'Vetted'}
                </span>
                Verified {r.lastVerified}
              </p>
            </li>
          ))}
        </ul>
      )}
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
    { name: 'Body Comp (WHtR)', done: bodyCompExempt || !!(heightInches && waistInches) },
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
