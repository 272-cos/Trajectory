/**
 * Header with persistent unofficial banner
 */

const BASE = import.meta.env.BASE_URL

export default function Header() {
  return (
    <header
      className="w-full"
      style={{
        backgroundImage: `url(${BASE}Traj_BG.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 50%',
      }}
    >
      <div className="container mx-auto max-w-4xl px-4 py-3 flex flex-col items-center" style={{ backdropFilter: 'brightness(0.85)' }}>
        <h1 className="text-2xl font-bold tracking-widest text-white drop-shadow-lg uppercase">
          Trajectory
        </h1>
        <p className="text-xs text-blue-200 tracking-wide mt-0.5">
          USAF PFA Readiness Tracker - UNOFFICIAL ESTIMATE
        </p>
      </div>
    </header>
  )
}
