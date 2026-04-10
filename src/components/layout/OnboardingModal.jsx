/**
 * Onboarding Modal - Guided walkthrough for first-time and returning users
 * 4-slide flow: Welcome -> How It Works -> First Two Steps -> Your Data
 *
 * First-launch behaviors:
 * - "Get Started" primary CTA on slide 1
 * - "I already have codes - skip to Profile" ghost button on slide 1
 * - Skip / Escape navigates to Profile tab
 * - "Go to Profile" on last slide navigates to Profile tab
 *
 * Returning-user behaviors (reopened via '?' or Tools tab):
 * - "Review" primary CTA on slide 1
 * - No "I already have codes" button (user is already set up)
 * - Skip / Escape closes modal without navigating away from current tab
 * - "Go to Profile" on last slide still navigates to Profile tab
 */

import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'

// -- Icons --------------------------------------------------------------------

const IconBolt = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
)

const IconArrow = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
)

const IconSteps = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconShield = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)

const IconFork = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-12m0 0l-6-6m6 6l6-6" />
  </svg>
)

// -- Slide 2: How It Works flow diagram ---------------------------------------

function HowItWorksContent() {
  const steps = [
    {
      num: '1',
      label: 'Build your profile',
      desc: 'Date of birth and gender set your scoring bracket. Your target PFA date activates the forecast and training plan.',
    },
    {
      num: '2',
      label: 'Score yourself',
      desc: 'Enter your performance in the Self-Check tab. Scores update live. Save when done - your result stores as a short, portable code.',
    },
    {
      num: '3',
      label: 'See where you are headed',
      desc: 'Projection shows where your scores are headed and gets more accurate with each check-in. Training Plan lays out a 16-week program - Base through Final Prep - so you know exactly what to do between now and test day.',
    },
  ]

  return (
    <div className="mt-3 space-y-0.5">
      {steps.map((step, i) => (
        <div key={step.num}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mt-0.5">
              {step.num}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{step.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{step.desc}</div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="ml-[13px] w-0.5 h-3 bg-blue-200 dark:bg-blue-800 my-0.5" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  )
}

// -- Slide 4: Two Ways to Move Forward (Forecast vs Training Plan) -------------

function TwoToolsContent() {
  return (
    <div className="mt-3 space-y-3">
      {/* Projection path */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
        <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Projection</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Predicts your composite score at your target test date and ranks which exercise gives the most points per week of effort.
        </div>
        <div className="bg-white dark:bg-gray-800 rounded px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 font-mono space-y-0.5 mb-2">
          <div>Projected score: ~82 on test day</div>
          <div>Best focus: Sit-ups - +4 pts in ~2 wk</div>
        </div>
        <div className="text-xs font-medium text-blue-700 dark:text-blue-400">Already training? Start here.</div>
      </div>

      {/* Training Plan path */}
      <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
        <div className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">Training Plan</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Builds a 16-week workout calendar around your current scores. Tap any day for your prescription - the plan adapts as you log sessions.
        </div>
        <div className="bg-white dark:bg-gray-800 rounded px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 font-mono space-y-0.5 mb-2">
          <div>Push-ups: 3 sets, stop 3-4 reps before failure (90s rest)</div>
          <div>Run: 20 min at conversational pace</div>
        </div>
        <div className="text-xs font-medium text-green-700 dark:text-green-400">Need daily structure? Start here.</div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Both are sub-tabs inside the Trajectory tab.</p>
    </div>
  )
}

// -- Slides definition --------------------------------------------------------

const SLIDES = [
  {
    id: 'welcome',
    title: 'Welcome to Trajectory',
    body: 'Score your PFA readiness against 2026 DAFMAN 36-2905 standards, see where you are headed, and walk into test day prepared. Everything stays on your device - no account, no login, no data sent anywhere.',
    detail: null,
    icon: IconBolt,
    showDisclaimer: true,
  },
  {
    id: 'how-it-works',
    title: 'How Trajectory Works',
    body: null,
    detail: null,
    icon: IconArrow,
    FlowContent: HowItWorksContent,
  },
  {
    id: 'first-steps',
    title: 'Your First Two Steps',
    body: 'On the Profile tab, enter your date of birth and gender. Then go to Self-Check and enter your performance for each component - your score appears live as you type.',
    detail: 'Save your profile code from the Profile tab - it is the fastest way to restore your setup on another device.',
    icon: IconSteps,
  },
  {
    id: 'two-tools',
    title: 'Two Ways to Move Forward',
    body: null,
    detail: null,
    icon: IconFork,
    TwoToolsContent: TwoToolsContent,
  },
  {
    id: 'your-data',
    title: 'Your Data Stays Here',
    body: 'All scores and settings live only in this browser. The Report tab generates a print-ready summary you can share with your supervisor. Export a backup from the Tools tab at any time.',
    detail: null,
    icon: IconShield,
  },
]

// -- Main component -----------------------------------------------------------

export default function OnboardingModal() {
  const { completeOnboarding, setActiveTab, tutorialIsReopen } = useApp()
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

  // Skip: on first launch navigate to Profile; on reopen just close
  const handleSkip = () => {
    completeOnboarding()
    if (!tutorialIsReopen) setActiveTab('profile')
  }

  const handleHaveCodes = () => {
    completeOnboarding()
    setActiveTab('profile')
  }

  // Focus modal on mount and on each slide change; keyboard navigation
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
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 focus:outline-none max-h-[90vh] overflow-y-auto"
      >
        {/* Progress dots */}
        <div className="flex justify-center mb-6">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1} of ${SLIDES.length}`}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <span className={`block w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                i === step
                  ? 'bg-blue-600 scale-125'
                  : i < step
                    ? 'bg-blue-300 dark:bg-blue-700'
                    : 'bg-gray-300 dark:bg-gray-600'
              }`} />
            </button>
          ))}
        </div>

        {/* Slide content - aria-live so screen readers announce slide changes */}
        <div aria-live="polite">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {slide.icon}
          </div>

          {/* Title */}
          <h2 id="onboarding-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
            {slide.title}
          </h2>

          {/* Body text */}
          {slide.body && (
            <p className="text-gray-600 dark:text-gray-400 mb-3 text-center text-sm">
              {slide.body}
            </p>
          )}

          {/* Slide 2: How It Works flow diagram */}
          {slide.FlowContent && <slide.FlowContent />}

          {/* Slide 4: Two Ways to Move Forward */}
          {slide.TwoToolsContent && <slide.TwoToolsContent />}

          {/* Detail hint - always visible */}
          {slide.detail && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3 px-2 mt-2">
              {slide.detail}
            </p>
          )}

          {/* Disclaimer - first slide only */}
          {slide.showDisclaimer && (
            <div className="bg-amber-50 dark:bg-gray-800 border border-amber-300 dark:border-gray-600 rounded-lg p-3 mb-2 mt-3">
              <p className="text-xs text-amber-800 dark:text-gray-300 text-center">
                <strong>Unofficial</strong> personal assessment tool. Provides <strong>estimates only</strong>, not official PFA scores.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 mt-5">
          {isFirst ? (
            <>
              <button
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {tutorialIsReopen ? 'Review' : 'Get Started'}
              </button>
              {!tutorialIsReopen && (
                <button
                  onClick={handleHaveCodes}
                  className="w-full border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
                >
                  I already have codes - skip to Profile
                </button>
              )}
            </>
          ) : isLast ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-1">
                Start with the Profile tab - enter your date of birth, then run your first Self-Check.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Go to Profile
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                No account. No server. No problem.
              </p>
            </>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Skip link - intermediate slides only (not first, not last) */}
        {!isFirst && !isLast && (
          <button
            onClick={handleSkip}
            className="w-full text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mt-3 py-3 transition-colors"
          >
            Skip walkthrough
          </button>
        )}
      </div>
    </div>
  )
}
