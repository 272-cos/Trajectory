/**
 * Header with persistent unofficial banner and dark mode toggle
 */

import { useApp } from '../../context/AppContext.jsx'

const BASE = import.meta.env.BASE_URL

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
        <div className="flex flex-col items-start">
          <img
            src={`${BASE}logo-transparent.png`}
            alt="Trajectory"
            width="192"
            height="128"
            fetchpriority="high"
            className="h-24 sm:h-28 md:h-32 w-auto block drop-shadow-[0_0_12px_rgba(32,144,255,0.7)]"
          />
          <p className="text-xs sm:text-sm font-bold text-sky-300 tracking-wide mt-2">
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
