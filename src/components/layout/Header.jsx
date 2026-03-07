/**
 * Header with persistent unofficial banner
 * Compact on mobile, expanded on desktop
 */

export default function Header() {
  return (
    <header className="bg-blue-900 text-white">
      <div className="container mx-auto px-4 py-2 sm:py-4 max-w-4xl">
        <div className="flex items-center justify-between sm:block">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Trajectory</h1>
            <p className="text-xs text-gray-300 hidden sm:block">USAF PFA Readiness Tracking</p>
          </div>
          <p className="text-xs sm:text-sm font-bold text-yellow-300 sm:mt-1 tracking-wide">
            UNOFFICIAL - Not affiliated with USAF/DoD
          </p>
        </div>
      </div>
    </header>
  )
}
