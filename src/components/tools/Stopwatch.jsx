/**
 * Stopwatch component with lap/split timer and auto-score integration
 * Task 8.2 - Stopwatch + Lap Timer
 *
 * Features:
 * - Start/Stop/Reset with 0.1s precision display
 * - Lap/split capture with running lap counter
 * - Auto-score lookup for 2-mile run using user's bracket
 * - sessionStorage persistence of last timed result
 * - Screen wake lock to prevent display sleep during timing
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { lookupScore } from '../../utils/scoring/scoringEngine.js'
import { EXERCISES, calculateAge, getAgeBracket } from '../../utils/scoring/constants.js'

const SESSION_KEY = 'pfa_practice_run'

/** Format ms to mm:ss.t display */
function formatStopwatch(ms) {
  const totalTenths = Math.floor(ms / 100)
  const tenths = totalTenths % 10
  const totalSecs = Math.floor(totalTenths / 10)
  const secs = totalSecs % 60
  const mins = Math.floor(totalSecs / 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`
}

/** Format ms to mm:ss.t for lap display (shorter) */
function formatLapTime(ms) {
  return formatStopwatch(ms)
}

/** Format ms to integer seconds (for score lookup) */
function msToSeconds(ms) {
  return Math.floor(ms / 1000)
}

export default function Stopwatch() {
  const { demographics } = useApp()

  // Timer state
  const [status, setStatus] = useState('idle') // 'idle' | 'running' | 'paused'
  const [displayMs, setDisplayMs] = useState(0)
  const [laps, setLaps] = useState([]) // [{lapNum, lapTimeMs, splitMs}]

  // Refs for timing internals (avoid stale closures in interval)
  const baseElapsedRef = useRef(0)    // ms accumulated before current running period
  const lapBaseRef = useRef(0)        // ms accumulated at start of current lap
  const startTsRef = useRef(null)     // performance.now() when last started
  const intervalRef = useRef(null)
  const wakeLockRef = useRef(null)

  // Current elapsed including in-progress interval
  const getElapsed = useCallback(() => {
    if (startTsRef.current === null) return baseElapsedRef.current
    return baseElapsedRef.current + (performance.now() - startTsRef.current)
  }, [])

  // Wake lock helpers
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        // Wake lock unavailable - non-critical, continue silently
      }
    }
  }, [])

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {})
      wakeLockRef.current = null
    }
  }, [])

  // Re-acquire wake lock when tab becomes visible again (system may have released it)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'running') {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [status, requestWakeLock])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      releaseWakeLock()
    }
  }, [releaseWakeLock])

  const handleStart = useCallback(() => {
    startTsRef.current = performance.now()
    setStatus('running')
    requestWakeLock()
    intervalRef.current = setInterval(() => {
      setDisplayMs(getElapsed())
    }, 100)
  }, [getElapsed, requestWakeLock])

  const handleStop = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    const elapsed = getElapsed()
    baseElapsedRef.current = elapsed
    startTsRef.current = null
    setDisplayMs(elapsed)
    setStatus('paused')
    releaseWakeLock()
    // Persist last result to sessionStorage
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ elapsedMs: elapsed, timestamp: Date.now() }))
  }, [getElapsed, releaseWakeLock])

  const handleLap = useCallback(() => {
    const elapsed = getElapsed()
    const lapTimeMs = elapsed - lapBaseRef.current
    setLaps(prev => [
      { lapNum: prev.length + 1, lapTimeMs, splitMs: elapsed },
      ...prev,
    ])
    lapBaseRef.current = elapsed
  }, [getElapsed])

  const handleReset = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    baseElapsedRef.current = 0
    lapBaseRef.current = 0
    startTsRef.current = null
    setDisplayMs(0)
    setLaps([])
    setStatus('idle')
    releaseWakeLock()
  }, [releaseWakeLock])

  // Derive auto-score for 2-mile run
  const autoScore = (() => {
    if (!demographics || displayMs === 0 || status === 'running') return null
    const totalSeconds = msToSeconds(displayMs)
    if (totalSeconds === 0) return null
    const age = calculateAge(new Date(demographics.dob))
    const ageBracket = getAgeBracket(age)
    const result = lookupScore(EXERCISES.RUN_2MILE, totalSeconds, demographics.gender, ageBracket)
    if (!result) return null
    return { points: result.points, maxPoints: result.maxPoints }
  })()

  const isIdle = status === 'idle'
  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const currentLapMs = displayMs - lapBaseRef.current

  return (
    <div className="mt-4">
      {/* Main timer display */}
      <div className="text-center mb-6">
        <div
          className="font-mono text-6xl font-bold tracking-tight text-gray-900 tabular-nums"
          aria-live="off"
          aria-label={`Elapsed time ${formatStopwatch(displayMs)}`}
        >
          {formatStopwatch(displayMs)}
        </div>
        {(isRunning || isPaused) && laps.length > 0 && (
          <div className="text-sm text-gray-500 mt-1 font-mono">
            Lap {laps.length + 1}: {formatLapTime(currentLapMs)}
          </div>
        )}
      </div>

      {/* Control buttons */}
      <div className="flex gap-3 justify-center mb-6">
        {isIdle && (
          <button
            onClick={handleStart}
            className="flex-1 max-w-xs bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Start stopwatch"
          >
            Start
          </button>
        )}

        {isRunning && (
          <>
            <button
              onClick={handleLap}
              className="flex-1 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-800 font-semibold py-4 px-6 rounded-xl text-lg transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Record lap"
            >
              Lap
            </button>
            <button
              onClick={handleStop}
              className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Stop stopwatch"
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
              aria-label="Reset stopwatch"
            >
              Reset
            </button>
            <button
              onClick={handleStart}
              className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Resume stopwatch"
            >
              Resume
            </button>
          </>
        )}
      </div>

      {/* Auto-score callout */}
      {autoScore && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5 text-center">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">2-Mile Run Score:</span>{' '}
            {autoScore.points}/{autoScore.maxPoints} pts for your bracket
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            Time {formatStopwatch(displayMs)} - go to Self-Check to record this result
          </p>
        </div>
      )}

      {!autoScore && isPaused && !demographics && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-5 text-center">
          <p className="text-sm text-gray-600">
            Set up your Profile to see your 2-mile run score for this time.
          </p>
        </div>
      )}

      {/* Lap table */}
      {laps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Laps</h3>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-left">
                  <th className="py-2 px-3 font-medium">Lap</th>
                  <th className="py-2 px-3 font-medium text-right">Lap Time</th>
                  <th className="py-2 px-3 font-medium text-right">Split</th>
                </tr>
              </thead>
              <tbody>
                {laps.map((lap) => (
                  <tr key={lap.lapNum} className="border-t border-gray-100">
                    <td className="py-2 px-3 text-gray-900 font-medium">{lap.lapNum}</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-900 tabular-nums">
                      {formatLapTime(lap.lapTimeMs)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-500 tabular-nums">
                      {formatLapTime(lap.splitMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
