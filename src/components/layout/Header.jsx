/**
 * Header with persistent unofficial banner
 */

const BASE = import.meta.env.BASE_URL

export default function Header() {
  return (
    <header
      className="w-full overflow-hidden relative"
      style={{
        backgroundImage: `url(${BASE}Traj_BG.svg)`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center 45%',
      }}
    >
      {/* Left edge fade */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, right: 'auto', width: '12%',
        background: 'linear-gradient(to right, #000c20 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 1,
      }}/>
      {/* Right edge fade */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, left: 'auto', width: '12%',
        background: 'linear-gradient(to left, #000c20 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 1,
      }}/>
      <div className="container mx-auto max-w-4xl px-4 py-6 flex flex-col items-center relative" style={{ backdropFilter: 'brightness(0.85)', zIndex: 2 }}>
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
