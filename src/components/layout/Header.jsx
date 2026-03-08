/**
 * Header with persistent unofficial banner
 */

const BASE = import.meta.env.BASE_URL

export default function Header() {
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
      <div className="container mx-auto max-w-4xl px-4 py-6 flex flex-col items-start">
        <img
          src={`${BASE}icons/logo-header.png`}
          alt="Trajectory"
          className="h-20 drop-shadow-lg"
        />
        <p className="text-xs font-bold text-amber-400 tracking-wide mt-1">
          USAF PFA Readiness Tracker - UNOFFICIAL ESTIMATE
        </p>
      </div>
    </header>
  )
}
