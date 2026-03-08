/**
 * Header with persistent unofficial banner
 */

const BASE = import.meta.env.BASE_URL

export default function Header() {
  return (
    <header className="bg-[#050d1a]">
      <div className="container mx-auto max-w-4xl">
        <img
          src={`${BASE}Wide_Traj.png`}
          alt="Trajectory - USAF PFA Readiness Tracker - UNOFFICIAL, Not affiliated with USAF/DoD"
          className="w-full h-auto"
        />
      </div>
    </header>
  )
}
