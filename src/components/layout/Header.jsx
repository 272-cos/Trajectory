/**
 * Header with persistent unofficial banner
 */

export default function Header() {
  return (
    <header className="bg-blue-900 text-white">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <h1 className="text-2xl font-bold">Trajectory</h1>
        <p className="text-xs text-gray-300">USAF PFA Readiness Tracking</p>
        <p className="text-sm font-bold text-yellow-300 mt-1 tracking-wide">
          ⚠️ UNOFFICIAL PERSONAL ASSESSMENT TOOL - Not affiliated with USAF or DoD
        </p>
      </div>
    </header>
  )
}
