/**
 * Header with persistent unofficial banner
 * Compact on mobile, expanded on desktop
 */

const BASE = import.meta.env.BASE_URL

export default function Header() {
  return (
    <header className="bg-blue-900 text-white">
      <div className="container mx-auto px-4 py-3 sm:py-4 max-w-4xl">
        <div className="flex flex-col items-center gap-1">
          <img
            src={`${BASE}icons/logo-header.png`}
            alt="Trajectory"
            className="h-16 sm:h-24 w-auto"
          />
          <p className="text-xs sm:text-sm font-bold text-yellow-300 tracking-wide">
            UNOFFICIAL - Not affiliated with USAF/DoD
          </p>
        </div>
      </div>
    </header>
  )
}
