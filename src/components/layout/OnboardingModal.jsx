/**
 * Onboarding Modal - Guided slideshow walkthrough for first-time users
 * Multi-step flow: Welcome -> Profile -> Self-Check -> Project -> History -> Tools -> Ready
 */

import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'

function TrainingResourcesDemo() {
  const [open, setOpen] = useState(false)
  return (
    <div className="my-3 text-left">
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2 text-center">Hidden gem: Training Resources</p>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white text-left">
        <div className="px-3 py-2 flex items-center justify-between bg-gray-50 border-b border-gray-100">
          <div>
            <span className="text-xs font-semibold text-gray-800">Cardio</span>
            <span className="ml-2 text-xs text-gray-500">14:30 2-Mile Run</span>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">82 pts - PASS</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
        >
          <div className="flex items-center gap-1 text-blue-700">
            <svg className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-xs font-semibold">Training Resources</span>
            {!open && <span className="ml-auto text-xs text-blue-400 italic">tap to expand</span>}
          </div>
        </button>
        {open && (
          <div className="px-3 pb-2 pt-1.5 bg-blue-50 border-t border-blue-100">
            <div className="pl-4 space-y-0.5">
              <div className="text-xs text-blue-700">- Aerobic Base Building Guide <span className="text-blue-400">(official)</span></div>
              <div className="text-xs text-blue-700">- 2-Mile Run Interval Plans</div>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-center text-gray-400 mt-1.5">Each component has its own curated set - easy to miss, worth opening.</p>
    </div>
  )
}

function TrainingFocusDemo() {
  const [open, setOpen] = useState(false)
  return (
    <div className="my-3 text-left">
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2 text-center">Hidden gem: Training Focus</p>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="px-3 py-2 flex items-center justify-between bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-800">Core</span>
          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">71 pts - FAIL</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full px-3 py-2 bg-orange-50 hover:bg-orange-100 transition-colors text-left border-t border-orange-100"
        >
          <div className="flex items-center gap-1 text-orange-700">
            <svg className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-xs font-semibold">Training Focus</span>
            <span className="ml-1 text-xs bg-orange-200 text-orange-800 px-1 py-0.5 rounded font-bold">TOP ROI</span>
            <span className="ml-auto text-xs text-orange-600 font-medium">0.9 pts/wk</span>
          </div>
        </button>
        {open && (
          <div className="px-3 pb-2 pt-1.5 bg-orange-50 border-t border-orange-100">
            <div className="pl-4 text-xs text-orange-700 space-y-0.5">
              <div>- Add 2x weekly plank progressions</div>
              <div>- Focus on hollow-body core activation</div>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-center text-gray-400 mt-1.5">Under each component card - shows your highest-ROI moves by points per week.</p>
    </div>
  )
}

function WeeklyPlanDemo() {
  const [open, setOpen] = useState(false)
  return (
    <div className="my-3 text-left">
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full px-3 py-2.5 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors text-left"
        >
          <span className="text-xs font-semibold text-gray-700">Personalized Weekly Training Plan</span>
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <>
            <div className="px-3 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded font-semibold bg-red-100 text-red-800">URGENT</span>
              <span className="text-xs text-gray-600">8 weeks to target PFA date</span>
            </div>
            <div className="px-3 py-2.5 border-l-4 border-red-400 ml-3 my-2">
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <span className="text-xs font-bold text-gray-400">#1</span>
                <span className="text-xs font-semibold text-gray-800">Core</span>
                <span className="text-xs px-1 py-0.5 rounded bg-red-100 text-red-700 font-medium">FAILING - 4.0% below min</span>
                <span className="ml-auto text-xs text-gray-500 font-medium">3x / week</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex gap-2 text-xs text-gray-600"><span className="text-gray-400 font-medium shrink-0">Day 1</span><span>3x60s plank + 3x20 hollow rocks</span></div>
                <div className="flex gap-2 text-xs text-gray-600"><span className="text-gray-400 font-medium shrink-0">Day 2</span><span>4x45s plank + timed test-pace set</span></div>
              </div>
            </div>
          </>
        )}
      </div>
      <p className="text-xs text-center text-gray-400 mt-1.5">Scroll below the component cards in the Trajectory tab to find it.</p>
    </div>
  )
}

const SLIDES = [
  {
    id: 'welcome',
    title: 'Welcome to Trajectory',
    body: 'Score your PFA performance against 2026 standards, see where you\'re headed, and walk into test day prepared - not guessing.',
    detail: 'Everything runs in your browser. No login, no tracking, no cloud.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    title: 'Step 1: Build Your Profile',
    body: 'Enter your date of birth, gender, and target PFA date. Trajectory generates a compact profile code that carries your demographics - paste it on any device to pick up where you left off.',
    detail: 'Your profile code encodes only DOB and gender. No name, no SSN, nothing that identifies you.',
    tab: 'profile',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    id: 'selfcheck',
    title: 'Step 2: Record a Self-Check',
    body: 'Log results for any combination of components - run or HAMR, push-ups or hand-release, sit-ups or plank. Scores update live as you type.',
    Content: TrainingResourcesDemo,
    detail: 'Save to generate an assessment code: a 22-character snapshot of the session you can share or archive.',
    tab: 'selfcheck',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'project',
    title: 'Step 3: See Your Trajectory',
    body: 'The Project tab turns your history into a forecast. Gap bars show how far each component sits from passing, ranked by the points each improvement is worth.',
    Content: TrainingFocusDemo,
    detail: 'Add a target PFA date to unlock point-per-week improvement targets for every component.',
    tab: 'project',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    id: 'weekly-plan',
    title: 'Your Personalized Weekly Plan',
    body: 'Below the component projections, the Trajectory tab generates a full week-by-week training schedule - each component prioritized by urgency, with specific daily workouts.',
    Content: WeeklyPlanDemo,
    detail: null,
    tab: 'project',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
    ),
  },
  {
    id: 'history',
    title: 'Step 4: Track the Trend',
    body: 'History keeps every assessment code you save and renders them as a timeline - composite trend line, per-component sparklines, and raw values side by side. Import codes from other devices to build a complete picture, or export the full set to back it up.',
    detail: 'The Report tab converts any selection of self-checks into a formatted supervisor summary, ready to print or copy as plain text.',
    tab: 'history',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    id: 'tools',
    title: 'Step 5: Practice with Confidence',
    body: 'The Tools tab has a precision stopwatch - including lap splits and automatic score lookup for your age bracket - so a training run gives you an instant "what would that score?" answer. The HAMR Metronome lets you dial in shuttle cadence before you set foot on a court.',
    detail: 'Not sure which exercise option suits you? The Self-Check tab includes an exercise comparison that shows equivalent performance across alternatives.',
    tab: 'tools',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    id: 'ready',
    title: 'Ready to Go',
    body: 'Start on the Profile tab, enter your demographics, and set a target date. Everything else follows from there.',
    detail: null,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function OnboardingModal() {
  const { completeOnboarding, setActiveTab } = useApp()
  const modalRef = useRef(null)
  const [step, setStep] = useState(0)

  const slide = SLIDES[step]
  const isFirst = step === 0
  const isLast = step === SLIDES.length - 1

  const handleNext = () => {
    if (isLast) {
      completeOnboarding()
      setActiveTab('profile')
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (!isFirst) setStep(step - 1)
  }

  const handleSkip = () => {
    completeOnboarding()
    setActiveTab('profile')
  }

  const handleHaveCodes = () => {
    completeOnboarding()
    setActiveTab('profile')
  }

  useEffect(() => {
    modalRef.current?.focus()
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleSkip()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handleBack()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [step])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="presentation">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        tabIndex={-1}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 focus:outline-none"
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                i === step ? 'bg-blue-600 scale-125' : i < step ? 'bg-blue-300' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          {slide.icon}
        </div>

        {/* Title */}
        <h2 id="onboarding-title" className="text-xl font-bold text-gray-900 mb-2 text-center">
          {slide.title}
        </h2>

        {/* Body */}
        <p className="text-gray-600 mb-3 text-center text-sm">
          {slide.body}
        </p>

        {/* Illustrated interactive demo block */}
        {slide.Content && <slide.Content />}

        {/* Detail hint */}
        {slide.detail && (
          <p className="text-xs text-gray-500 text-center mb-4 px-2">
            {slide.detail}
          </p>
        )}

        {/* Disclaimer - only on welcome slide */}
        {isFirst && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-900 text-center">
              <strong>Unofficial</strong> personal assessment tool. Provides <strong>estimates only</strong>, not official PFA scores.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 mt-4">
          {isFirst ? (
            <>
              <button
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={handleHaveCodes}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                I already have codes - skip to Profile
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {isLast ? 'Start Using Trajectory' : 'Next'}
              </button>
            </div>
          )}
        </div>

        {/* Skip link - on intermediate slides */}
        {!isFirst && !isLast && (
          <button
            onClick={handleSkip}
            className="w-full text-xs text-gray-400 hover:text-gray-600 mt-3 py-1 transition-colors"
          >
            Skip walkthrough
          </button>
        )}

        {/* Privacy note on last slide */}
        {isLast && (
          <p className="text-xs text-gray-500 mt-4 text-center">
            Data stays private - no account, no server, no problem.
          </p>
        )}
      </div>
    </div>
  )
}
