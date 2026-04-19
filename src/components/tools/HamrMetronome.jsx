/**
 * HAMR Practice Metronome
 * Task 8.3 - HAMR Practice Metronome
 *
 * Generates HAMR beep audio via Web Audio API (no audio files required).
 * Follows official Leger 20m shuttle run protocol timing.
 *
 * Features:
 * - Accurate beep cadence per official HAMR timing table
 * - Single beep per shuttle, 3-2-1-GO countdown on level change (matches session start)
 * - Visual: current level, shuttle within level, total shuttles, elapsed time
 * - Level selector: start from any level (1-21)
 * - Pause/resume with drift-compensated scheduling
 * - Auto-score: shuttle count -> points for user's bracket
 * - Screen wake lock during active session
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { lookupScore } from '../../utils/scoring/scoringEngine.js'
import { EXERCISES, calculateAge, getAgeBracket } from '../../utils/scoring/constants.js'
import {
  getLevelForShuttle,
  firstShuttleOfLevel,
  formatElapsed,
  HAMR_LEVELS,
  MAX_LEVEL,
} from '../../utils/hamr/hamrMetronome.js'

const SESSION_KEY = 'pfa_practice_hamr'

// ── Shuttle beep audio parameters ────────────────────────────────────────────
const BEEP_FREQ = 1320    // Hz - high-pitched short beep
const BEEP_DURATION = 0.07 // seconds per beep tone

// ── Countdown audio parameters ───────────────────────────────────────────────
// Synth tones only - no human voice, no audio files.
// Pattern: simple 3-2-1-GO four-signal cadence, unambiguous and easy to follow
const CD_FREQ = 440           // Hz - 440Hz triangle tone for 3, 2, 1 signals
const CD_TONE_DURATION = 0.4  // seconds per countdown tone
const CD_TONE_INTERVAL = 1.0  // seconds between signal starts (one every second)
const SWEEP_START = 660       // Hz - "go" sweep start frequency
const SWEEP_END = 1320        // Hz - "go" sweep end frequency
const SWEEP_DURATION = 0.6    // seconds for ascending sweep
const POST_SWEEP_PAUSE = 0.1  // seconds of silence after sweep before first shuttle

// Total countdown duration:
// Signal "3": at t=0.0 (0.4s duration)
// Signal "2": at t=1.0 (0.4s duration)
// Signal "1": at t=2.0 (0.4s duration)
// Sweep "GO": at t=3.0 (0.6s duration) -> ends at 3.6
// + POST_SWEEP_PAUSE -> shuttle timer starts at 3.7s
const COUNTDOWN_TOTAL_S = 3.0 + SWEEP_DURATION + POST_SWEEP_PAUSE // ~3.7s

/**
 * Schedule a single beep tone into the AudioContext.
 * @param {AudioContext} ctx - Web Audio context
 * @param {number} when - AudioContext time to start beep (seconds)
 */
function scheduleBeepTone(ctx, when) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.value = BEEP_FREQ
  gain.gain.setValueAtTime(0.6, when)
  gain.gain.exponentialRampToValueAtTime(0.001, when + BEEP_DURATION)
  osc.start(when)
  osc.stop(when + BEEP_DURATION + 0.01)
}

/**
 * Schedule a countdown tone (longer, lower, different waveform than shuttle beeps).
 * Returns the gain node so it can be silenced on skip.
 */
function scheduleCountdownTone(ctx, when, freq, duration, waveType = 'triangle') {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = waveType
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.7, when)
  gain.gain.exponentialRampToValueAtTime(0.001, when + duration)
  osc.start(when)
  osc.stop(when + duration + 0.02)
  return gain
}

/**
 * Schedule the ascending frequency sweep ("go" signal).
 * Returns the gain node so it can be silenced on skip.
 */
function scheduleSweepTone(ctx, when) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(SWEEP_START, when)
  osc.frequency.exponentialRampToValueAtTime(SWEEP_END, when + SWEEP_DURATION)
  gain.gain.setValueAtTime(0.7, when)
  gain.gain.exponentialRampToValueAtTime(0.001, when + SWEEP_DURATION)
  osc.start(when)
  osc.stop(when + SWEEP_DURATION + 0.02)
  return gain
}

/**
 * Schedule the full countdown sequence into the AudioContext.
 * Returns an array of gain nodes (for silencing on skip).
 *
 * Timeline (seconds from `t0`):
 *   0.0              - 440Hz triangle tone, 0.4s ("3")
 *   1.0              - 440Hz triangle tone, 0.4s ("2")
 *   2.0              - 440Hz triangle tone, 0.4s ("1")
 *   3.0              - ascending 660->1320Hz sweep, 0.6s ("GO")
 *   3.7              - first shuttle interval begins
 */
function scheduleCountdown(ctx) {
  const t0 = ctx.currentTime + 0.05 // small lookahead
  const gains = []

  // Signal "3" - at t=0.0
  gains.push(scheduleCountdownTone(ctx, t0, CD_FREQ, CD_TONE_DURATION))

  // Signal "2" - at t=1.0
  gains.push(scheduleCountdownTone(ctx, t0 + CD_TONE_INTERVAL, CD_FREQ, CD_TONE_DURATION))

  // Signal "1" - at t=2.0
  gains.push(scheduleCountdownTone(ctx, t0 + CD_TONE_INTERVAL * 2, CD_FREQ, CD_TONE_DURATION))

  // Signal "GO" - ascending sweep at t=3.0
  const sweepStart = t0 + CD_TONE_INTERVAL * 3
  gains.push(scheduleSweepTone(ctx, sweepStart))

  // Haptic feedback: three short pulses (for 3-2-1) + one long pulse (for GO)
  if (navigator.vibrate) navigator.vibrate([100, 100, 100, 100, 100, 100, 400])

  return gains
}

/**
 * Schedule audio beep(s) into the AudioContext.
 * Single beep for a normal shuttle; on a level change, replay the same
 * 3-2-1-GO countdown pattern used at the start of the session so start
 * and level-up are audibly identical.
 * @param {AudioContext} ctx - Web Audio context
 * @param {boolean} isLevelChange - Whether to play the level-up countdown
 */
function scheduleAudioBeep(ctx, isLevelChange) {
  if (!ctx || ctx.state === 'closed') return
  const when = ctx.currentTime + 0.01 // tiny lookahead to avoid glitches
  if (isLevelChange) {
    // Same cadence as the session-start countdown: three 440Hz tones at
    // 1s intervals, then an ascending 660->1320Hz sweep on "GO".
    scheduleCountdownTone(ctx, when, CD_FREQ, CD_TONE_DURATION)
    scheduleCountdownTone(ctx, when + CD_TONE_INTERVAL, CD_FREQ, CD_TONE_DURATION)
    scheduleCountdownTone(ctx, when + CD_TONE_INTERVAL * 2, CD_FREQ, CD_TONE_DURATION)
    scheduleSweepTone(ctx, when + CD_TONE_INTERVAL * 3)
    // Haptic mirrors the countdown: three short pulses + one long
    if (navigator.vibrate) navigator.vibrate([100, 100, 100, 100, 100, 100, 400])
  } else {
    scheduleBeepTone(ctx, when)
    // Brief haptic pulse per shuttle
    if (navigator.vibrate) navigator.vibrate(15)
  }
}

export default function HamrMetronome() {
  const { demographics } = useApp()

  // UI state
  const [status, setStatus] = useState('idle') // 'idle' | 'countdown' | 'running' | 'paused' | 'done'
  const [startLevel, setStartLevel] = useState(1)
  const [totalShuttles, setTotalShuttles] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [audioError, setAudioError] = useState(false)

  // Derived: level info for current shuttle count
  const levelInfo = totalShuttles > 0 ? getLevelForShuttle(totalShuttles) : null

  // Timing refs - avoid stale closures
  const audioCtxRef = useRef(null)
  const tickTimeoutRef = useRef(null)
  const displayIntervalRef = useRef(null)
  const wakeLockRef = useRef(null)
  const countdownTimeoutRef = useRef(null) // setTimeout ID for countdown -> running transition
  const countdownGainsRef = useRef([])     // gain nodes from countdown (silenced on skip)

  // Scheduler state refs
  const nextShuttleRef = useRef(1)       // next shuttle number to complete (1-indexed total)
  const nextBeepAtRef = useRef(0)        // absolute performance.now() when next beep fires
  const sessionStartRef = useRef(null)   // performance.now() at session start (pause-adjusted)
  const pauseStartRef = useRef(null)     // performance.now() when paused
  const totalPausedMsRef = useRef(0)     // cumulative ms spent paused

  // Wake lock helpers
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        // Non-critical, continue silently
      }
    }
  }, [])

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {})
      wakeLockRef.current = null
    }
  }, [])

  // Re-acquire wake lock on visibility change
  useEffect(() => {
    const onVisChange = () => {
      if (document.visibilityState === 'visible' && (status === 'running' || status === 'countdown')) {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', onVisChange)
    return () => document.removeEventListener('visibilitychange', onVisChange)
  }, [status, requestWakeLock])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(tickTimeoutRef.current)
      clearTimeout(countdownTimeoutRef.current)
      if (displayIntervalRef.current) clearInterval(displayIntervalRef.current)
      releaseWakeLock()
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
        audioCtxRef.current = null
      }
    }
  }, [releaseWakeLock])

  // Display update interval (runs while active)
  const startDisplayInterval = useCallback(() => {
    if (displayIntervalRef.current) clearInterval(displayIntervalRef.current)
    displayIntervalRef.current = setInterval(() => {
      const elapsed = performance.now() - sessionStartRef.current - totalPausedMsRef.current
      setElapsedMs(Math.max(0, elapsed))
    }, 200)
  }, [])

  const stopDisplayInterval = useCallback(() => {
    if (displayIntervalRef.current) {
      clearInterval(displayIntervalRef.current)
      displayIntervalRef.current = null
    }
  }, [])

  // Core scheduler: schedule next beep
  const scheduleTick = useCallback(() => {
    const shuttleNum = nextShuttleRef.current
    const info = getLevelForShuttle(shuttleNum)
    if (!info) {
      // All levels complete
      setStatus('done')
      stopDisplayInterval()
      releaseWakeLock()
      return
    }

    const delay = Math.max(0, nextBeepAtRef.current - performance.now())
    tickTimeoutRef.current = setTimeout(() => {
      // Determine if the shuttle AFTER this one is a level change
      const nextInfo = getLevelForShuttle(shuttleNum + 1)
      const isLevelChange = info.isLastInLevel && nextInfo !== null

      // Play audio
      if (audioCtxRef.current) {
        scheduleAudioBeep(audioCtxRef.current, isLevelChange)
      }

      // Update display
      setTotalShuttles(shuttleNum)

      // Advance to next shuttle
      const nextNum = shuttleNum + 1
      nextShuttleRef.current = nextNum

      const nextInfo2 = getLevelForShuttle(nextNum)
      if (!nextInfo2) {
        // Just completed final shuttle
        setStatus('done')
        stopDisplayInterval()
        releaseWakeLock()
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          totalShuttles: shuttleNum,
          timestamp: Date.now(),
        }))
        return
      }

      // Advance next beep target by this shuttle's interval
      // (nextInfo2.intervalMs is the time to run the NEXT shuttle)
      nextBeepAtRef.current += nextInfo2.intervalMs
      scheduleTick()
    }, delay)
  }, [stopDisplayInterval, releaseWakeLock])

  // Begin the shuttle timer (called after countdown completes or is skipped)
  const startShuttleTimer = useCallback(() => {
    const firstShuttle = firstShuttleOfLevel(startLevel)
    const firstInfo = getLevelForShuttle(firstShuttle)
    if (!firstInfo) return

    // Initialize scheduler state
    nextShuttleRef.current = firstShuttle
    sessionStartRef.current = performance.now()
    totalPausedMsRef.current = 0
    pauseStartRef.current = null

    // First beep fires after one shuttle interval
    nextBeepAtRef.current = performance.now() + firstInfo.intervalMs

    setTotalShuttles(0)
    setElapsedMs(0)
    setStatus('running')
    startDisplayInterval()
    scheduleTick()
  }, [startLevel, startDisplayInterval, scheduleTick])

  const handleStart = useCallback(async () => {
    // Initialize AudioContext on user gesture (required by browsers)
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext()
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume()
      }
      setAudioError(false)
    } catch {
      setAudioError(true)
      // Continue without audio - visual metronome still works
    }

    const firstShuttle = firstShuttleOfLevel(startLevel)
    const firstInfo = getLevelForShuttle(firstShuttle)
    if (!firstInfo) return

    requestWakeLock()

    // Play countdown sequence, then start shuttle timer
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      setStatus('countdown')
      countdownGainsRef.current = scheduleCountdown(audioCtxRef.current)

      // After countdown completes, start the shuttle timer
      countdownTimeoutRef.current = setTimeout(() => {
        countdownGainsRef.current = []
        countdownTimeoutRef.current = null
        startShuttleTimer()
      }, COUNTDOWN_TOTAL_S * 1000)
    } else {
      // No audio available - skip countdown, start directly
      startShuttleTimer()
    }
  }, [startLevel, requestWakeLock, startShuttleTimer])

  // Skip countdown and start shuttles immediately
  const handleSkipCountdown = useCallback(() => {
    // Clear countdown timeout
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current)
      countdownTimeoutRef.current = null
    }

    // Silence any remaining countdown tones by disconnecting gain nodes
    for (const gain of countdownGainsRef.current) {
      try { gain.disconnect() } catch { /* already disconnected */ }
    }
    countdownGainsRef.current = []

    // Start shuttle timer immediately
    startShuttleTimer()
  }, [startShuttleTimer])

  const handlePause = useCallback(() => {
    clearTimeout(tickTimeoutRef.current)
    tickTimeoutRef.current = null
    pauseStartRef.current = performance.now()
    setStatus('paused')
    stopDisplayInterval()
    releaseWakeLock()
  }, [stopDisplayInterval, releaseWakeLock])

  const handleResume = useCallback(async () => {
    // Re-resume AudioContext if needed
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      try {
        await audioCtxRef.current.resume()
      } catch {
        // Non-critical
      }
    }

    // Shift the next beep target forward by pause duration
    const pauseDuration = performance.now() - pauseStartRef.current
    totalPausedMsRef.current += pauseDuration
    nextBeepAtRef.current += pauseDuration
    pauseStartRef.current = null

    setStatus('running')
    requestWakeLock()
    startDisplayInterval()
    scheduleTick()
  }, [requestWakeLock, startDisplayInterval, scheduleTick])

  // Silence any active countdown tones
  const cancelCountdown = useCallback(() => {
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current)
      countdownTimeoutRef.current = null
    }
    for (const gain of countdownGainsRef.current) {
      try { gain.disconnect() } catch { /* already disconnected */ }
    }
    countdownGainsRef.current = []
  }, [])

  const handleStop = useCallback(() => {
    cancelCountdown()
    clearTimeout(tickTimeoutRef.current)
    tickTimeoutRef.current = null
    stopDisplayInterval()
    releaseWakeLock()
    // Persist final shuttle count
    if (totalShuttles > 0) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        totalShuttles,
        timestamp: Date.now(),
      }))
    }
    setStatus('idle')
    setTotalShuttles(0)
    setElapsedMs(0)
  }, [totalShuttles, cancelCountdown, stopDisplayInterval, releaseWakeLock])

  const handleReset = useCallback(() => {
    cancelCountdown()
    clearTimeout(tickTimeoutRef.current)
    tickTimeoutRef.current = null
    stopDisplayInterval()
    releaseWakeLock()
    setStatus('idle')
    setTotalShuttles(0)
    setElapsedMs(0)
  }, [cancelCountdown, stopDisplayInterval, releaseWakeLock])

  // Auto-score: compute points for completed shuttle count
  const autoScore = (() => {
    if (!demographics || totalShuttles === 0) return null
    const age = calculateAge(new Date(demographics.dob))
    const ageBracket = getAgeBracket(age)
    const result = lookupScore(EXERCISES.HAMR, totalShuttles, demographics.gender, ageBracket)
    if (!result) return null
    return { points: result.points, maxPoints: result.maxPoints, shuttles: totalShuttles }
  })()

  const isIdle = status === 'idle'
  const isCountdown = status === 'countdown'
  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const isDone = status === 'done'
  const showScore = (isPaused || isDone) && autoScore
  const showScorePrompt = (isPaused || isDone) && !autoScore && totalShuttles > 0

  return (
    <div className="mt-4">
      <p className="text-sm text-gray-500 mb-4 -mt-2">
        Leger 20m shuttle run - audio beeps guide your pace
      </p>

      {audioError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
          Audio unavailable - check browser permissions. Visual metronome still works.
        </div>
      )}

      {/* Level selector (idle only) */}
      {isIdle && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="hamr-start-level">
            Start level
          </label>
          <select
            id="hamr-start-level"
            value={startLevel}
            onChange={e => setStartLevel(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Choose starting level for HAMR metronome"
          >
            {HAMR_LEVELS.map(({ level, speedKmh }) => (
              <option key={level} value={level}>
                Level {level} - {speedKmh} km/h
                {level === 1 ? ' (start here for full test)' : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Experienced runners can warm up by starting at a higher level.
          </p>
        </div>
      )}

      {/* Countdown display */}
      {isCountdown && (
        <div className="mb-6 flex flex-col items-center justify-center py-8">
          <div className="text-lg font-semibold text-gray-700 mb-2">Get ready...</div>
          <div className="text-sm text-gray-500">Listen for the countdown tones</div>
          <div className="mt-4 text-xs text-gray-400">Listen: 3 - 2 - 1 - GO</div>
        </div>
      )}

      {/* Main status display */}
      {(isRunning || isPaused || isDone) && (
        <div className="mb-6 space-y-4">
          {/* Level and shuttle info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div
                className="text-5xl font-bold text-blue-900 tabular-nums"
                aria-live="polite"
                aria-label={`Current level ${levelInfo?.level ?? '-'}`}
              >
                {levelInfo?.level ?? '-'}
              </div>
              <div className="text-xs text-blue-600 mt-1 font-medium uppercase tracking-wide">Level</div>
              {levelInfo && (
                <div className="text-sm text-blue-700 mt-0.5">{levelInfo.speedKmh} km/h</div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div
                className="text-5xl font-bold text-gray-900 tabular-nums"
                aria-live="polite"
                aria-label={`Total shuttles ${totalShuttles}`}
              >
                {totalShuttles}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">Shuttles</div>
              {levelInfo && (
                <div className="text-sm text-gray-500 mt-0.5">
                  {levelInfo.shuttleWithinLevel}/{levelInfo.shuttlesInLevel} in level
                </div>
              )}
            </div>
          </div>

          {/* Elapsed time */}
          <div className="text-center">
            <div
              className="font-mono text-2xl font-semibold text-gray-700 tabular-nums"
              aria-label={`Elapsed time ${formatElapsed(elapsedMs)}`}
            >
              {formatElapsed(elapsedMs)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">elapsed</div>
          </div>

          {/* Level progress bar */}
          {levelInfo && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Level {levelInfo.level} progress</span>
                <span>{levelInfo.shuttleWithinLevel} / {levelInfo.shuttlesInLevel}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(levelInfo.shuttleWithinLevel / levelInfo.shuttlesInLevel) * 100}%` }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={levelInfo.shuttlesInLevel}
                  aria-valuenow={levelInfo.shuttleWithinLevel}
                />
              </div>
            </div>
          )}

          {isDone && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-sm font-semibold text-green-800">All levels complete!</p>
              <p className="text-xs text-green-700 mt-0.5">
                {totalShuttles} total shuttles - Level {MAX_LEVEL} finished
              </p>
            </div>
          )}
        </div>
      )}

      {/* Control buttons */}
      <div className="flex gap-3 justify-center mb-5">
        {isIdle && (
          <button
            onClick={handleStart}
            className="flex-1 max-w-xs bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label={`Start HAMR metronome from level ${startLevel}`}
          >
            Start
          </button>
        )}

        {isCountdown && (
          <>
            <button
              onClick={handleSkipCountdown}
              className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Skip countdown and start immediately"
            >
              Skip
            </button>
            <button
              onClick={handleStop}
              className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Cancel HAMR test"
            >
              Cancel
            </button>
          </>
        )}

        {isRunning && (
          <>
            <button
              onClick={handlePause}
              className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              aria-label="Pause HAMR metronome"
            >
              Pause
            </button>
            <button
              onClick={handleStop}
              className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Stop HAMR metronome and reset"
            >
              Stop
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-xl text-lg transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              aria-label="Reset HAMR metronome"
            >
              Reset
            </button>
            <button
              onClick={handleResume}
              className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Resume HAMR metronome"
            >
              Resume
            </button>
          </>
        )}

        {isDone && (
          <button
            onClick={handleReset}
            className="flex-1 max-w-xs bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-xl text-lg transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            aria-label="Reset HAMR metronome"
          >
            Reset
          </button>
        )}
      </div>

      {/* Auto-score callout */}
      {showScore && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">HAMR Score:</span>{' '}
            {autoScore.points}/{autoScore.maxPoints} pts for your bracket
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            {autoScore.shuttles} shuttles - go to Self-Check to record this result
          </p>
        </div>
      )}

      {showScorePrompt && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600">
            {totalShuttles} shuttles completed. Set up your Profile to see your HAMR score.
          </p>
        </div>
      )}

      {/* Protocol reference */}
      {(isIdle && !isCountdown) && (
        <div className="mt-4 bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">How to use</p>
          <ul className="text-xs text-gray-500 space-y-0.5">
            <li>- One beep = reach the line (20m shuttle)</li>
            <li>- 3-2-1-GO countdown = new level, speed increases on GO</li>
            <li>- Stay with the beeps; stop when you can no longer reach the line in time</li>
            <li>- Levels 1-21, speed 8.5-18.5 km/h</li>
          </ul>
        </div>
      )}
    </div>
  )
}
