/**
 * Header with persistent unofficial banner
 */

const BASE = import.meta.env.BASE_URL

export default function Header() {
  return (
    <header className="bg-[#050d1a]">
      <div className="container mx-auto max-w-4xl relative">
        <img
          src={`${BASE}BG_Traj.png`}
          alt=""
          aria-hidden="true"
          className="w-full h-auto"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={`${BASE}icons/logo.jpg`}
            alt="Trajectory - USAF PFA Readiness Tracker - UNOFFICIAL, Not affiliated with USAF/DoD"
            className="w-4/5 h-auto mix-blend-multiply"
          />
        </div>
      </div>
    </header>
  )
}
