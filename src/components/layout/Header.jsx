/**
 * Header with persistent unofficial banner and dark mode toggle
 */

import { useApp } from '../../context/AppContext.jsx'

const BASE = import.meta.env.BASE_URL

function TrajectoryWordmark() {
  return (
    <svg
      viewBox="0 0 360 52"
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 sm:h-10 md:h-12 w-auto"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wordGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f0ff" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#90c8ff" />
        </linearGradient>
        <filter id="wordGlow" x="-10%" y="-40%" width="120%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <text
        x="0"
        y="40"
        fontFamily="'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
        fontSize="44"
        fontWeight="700"
        letterSpacing="3"
        fill="url(#wordGrad)"
        filter="url(#wordGlow)"
      >
        TRAJECTORY
      </text>
      {/* Accent line beneath the text */}
      <line
        x1="0" y1="48" x2="120" y2="48"
        stroke="#2090ff" strokeWidth="2" strokeLinecap="round" opacity="0.7"
      />
      <line
        x1="124" y1="48" x2="160" y2="48"
        stroke="#2090ff" strokeWidth="2" strokeLinecap="round" opacity="0.35"
      />
    </svg>
  )
}

export default function Header() {
  const { darkMode, toggleDarkMode } = useApp()

  return (
    <header
      className="w-full overflow-hidden"
      style={{
        backgroundImage: `url(${BASE}Traj_BG.svg)`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center 45%',
      }}
    >
      <div className="container mx-auto max-w-4xl lg:max-w-6xl px-4 py-5 flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-3 sm:gap-4">
            <img
              src={`${BASE}icons/icon-512.png`}
              alt="Trajectory logo"
              width="512"
              height="512"
              fetchpriority="high"
              className="h-12 sm:h-14 md:h-16 w-auto block drop-shadow-[0_0_12px_rgba(32,144,255,0.7)]"
            />
            <TrajectoryWordmark />
          </div>
          {/* Subtitle pushed down below the wave lines */}
          <p className="text-xs sm:text-sm font-bold text-amber-400 tracking-wide mt-10 sm:mt-14">
            USAF PFA Readiness Tracker - UNOFFICIAL ESTIMATE
          </p>
        </div>
        <button
          type="button"
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={darkMode ? 'Light mode' : 'Dark mode'}
          className="mt-1 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors text-lg leading-none"
        >
          {darkMode ? '☀' : '☽'}
        </button>
      </div>
    </header>
  )
}
