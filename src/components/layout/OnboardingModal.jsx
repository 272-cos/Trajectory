/**
 * Onboarding Modal - Guided walkthrough for first-time and returning users
 * 6-step flow: Welcome -> How It Works -> Profile -> Self-Check -> Forecast & Plan -> Tools & Data
 *
 * Preserved behaviors:
 * - Skip walkthrough link on intermediate slides (not first, not last)
 * - "I already have codes" escape hatch on slide 1
 * - Clickable progress dots (active=larger+blue, completed=lighter blue, future=gray)
 * - Keyboard navigation: Escape=skip, ArrowRight=next, ArrowLeft=back
 * - Modal focuses on mount and on slide change
 * - Disclaimer box on first slide only
 * - Privacy note on last slide
 * - Navigates to Profile tab on finish
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

const IconPerson = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

const IconCheck = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconChart = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
)

const IconWrench = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
  </svg>
)

// -- Slide 2: How It Works flow diagram ---------------------------------------

function HowItWorksContent() {
  const steps = [
    {
      num: '1',
      label: 'Build your profile',
      desc: 'Date of birth + gender sets your scoring bracket (30 seconds)',
    },
    {
      num: '2',
      label: 'Score yourself',
      desc: 'Log exercises and see your score live - saves as a portable code',
    },
    {
      num: '3',
      label: 'See where you are headed',
      desc: 'Forecast, training plan, history, and reports all build from your check-ins',
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

// -- Slides definition --------------------------------------------------------

const SLIDES = [
  {
    id: 'welcome',
    title: 'Welcome to Trajectory',
    body: 'Score your PFA readiness against 2026 DAFMAN 36-2905 standards, see where you are headed, and walk into test day prepared - not guessing. Everything stays on your device - no account, no login, no data sent anywhere.',
    detail: null,
    icon: IconBolt,
    showDisclaimer: true,
    expandTitle: null,
    expandBullets: null,
  },
  {
    id: 'how-it-works',
    title: 'How Trajectory Works',
    body: null,
    detail: null,
    icon: IconArrow,
    FlowContent: HowItWorksContent,
    expandTitle: 'About your codes',
    expandBullets: [
      'D-code (D1- prefix, ~9 chars): stores your date of birth and gender only - nothing else.',
      'S-code (S3- prefix, ~22 chars): stores one assessment. Codes travel via URL or QR scan with no account needed.',
      'Full history backup: use Backup & Restore in the Tools tab to export everything as a JSON file.',
    ],
  },
  {
    id: 'profile',
    title: 'Set Up Your Profile',
    body: 'Enter your date of birth and biological sex on the Profile tab. These set your age bracket, which determines the point thresholds for every scoring component.',
    detail: 'Set your target PFA date to unlock the Trajectory forecast and auto-generate your training plan.',
    icon: IconPerson,
    expandTitle: 'Also on Profile tab',
    expandBullets: [
      'Copy your D-code and save it somewhere safe - it is your only way to restore your profile if you clear your browser.',
      'Scroll to the bottom of the Profile tab to see your achievement badges, earned by logging assessments consistently.',
      'If you have existing codes from another device, paste your D-code in the Profile tab to restore your profile.',
    ],
  },
  {
    id: 'selfcheck',
    title: 'Score Yourself',
    body: 'Go to the Self-Check tab and enter your performance for each component: cardio, strength, core, and body composition. Scores update live as you type, and your entries are auto-saved as a draft while you work.',
    detail: 'Your composite score appears only when all four components have data. Tap Save Assessment to lock in your results - after saving, your assessment appears in History and feeds the Trajectory forecast.',
    icon: IconCheck,
    expandTitle: 'Tips for Self-Check',
    expandBullets: [
      'Set your exercise preferences once on the Trajectory tab and Self-Check will automatically select those exercises for you.',
      'Body composition uses waist-to-height ratio (WHtR) - enter both your waist and height measurements in inches.',
      'Exempt components are excluded from the composite calculation entirely - they do not lower your score.',
      'The 2km walk option only appears when cardio is marked exempt - it is pass/fail only and does not add to your composite.',
    ],
  },
  {
    id: 'trajectory',
    title: 'Your Forecast and Plan',
    body: 'The Trajectory tab forecasts your estimated score at your target PFA date - confidence grows as you add more check-ins (1 assessment = low, 2 = medium, 3+ = high confidence). The Plan tab generates a training calendar that adapts to your timeline.',
    detail: 'Check the History tab to view trends, and flag any anomalous results as outliers to keep your forecast accurate. The Report tab generates a print-ready supervisor summary.',
    icon: IconChart,
    expandTitle: 'More about your forecast',
    expandBullets: [
      'The training plan uses four phases - Base Building, Foundation Build, Intensity Peak, and Final Prep - automatically sized to your timeline.',
      'After each training day, rate how hard it felt (1-5). The plan uses these ratings to detect overtraining or undertraining and adjusts guidance.',
      'Tap any assessment in History to flag it as an outlier - it stays in your record but is excluded from your forecast.',
      'The strategy panel on the Trajectory tab shows which exercise gives you the most points per week of training effort - focus there first.',
    ],
  },
  {
    id: 'tools',
    title: 'Tools and Data',
    body: 'The Tools tab has a "What Score Do I Need?" calculator - dial in a target composite and see exactly what performance is required for your age and gender. Tap the share icon on any saved assessment to get a QR code for device transfer.',
    detail: 'Your data lives only in this browser - export a backup from the Tools tab and save it somewhere safe.',
    icon: IconWrench,
    expandTitle: 'What else is in Tools',
    expandBullets: [
      'HAMR Metronome: uses official Leger protocol timing to practice shuttle runs at the correct cadence.',
      'Stopwatch: lap timer with automatic score lookup for your age and gender bracket after your session.',
      'Run Pacer: audio-guided lap pacing to help you hit your target 2-mile pace.',
      'Backup & Restore: download your full data as a JSON file. Importing replaces current data - it does not merge.',
    ],
  },
]

// -- Main component -----------------------------------------------------------

export default function OnboardingModal() {
  const { completeOnboarding, setActiveTab } = useApp()
  const modalRef = useRef(null)
  const [step, setStep] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  const slide = SLIDES[step]
  const isFirst = step === 0
  const isLast = step === SLIDES.length - 1
  const expandContentId = `onboarding-expand-${slide.id}`

  // Reset expanded state when slide changes
  useEffect(() => {
    setIsExpanded(false)
  }, [step])

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

          {/* Detail hint - always visible */}
          {slide.detail && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3 px-2 mt-2">
              {slide.detail}
            </p>
          )}

          {/* Disclaimer - first slide only */}
          {slide.showDisclaimer && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg p-3 mb-2 mt-2">
              <p className="text-xs text-amber-800 dark:text-amber-200 text-center">
                <strong>Unofficial</strong> personal assessment tool. Provides <strong>estimates only</strong>, not official PFA scores.
              </p>
            </div>
          )}

          {/* Expandable "Learn more" section */}
          {slide.expandTitle && slide.expandBullets && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                aria-expanded={isExpanded}
                aria-controls={expandContentId}
                className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <svg
                  className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                {slide.expandTitle}
              </button>
              <div
                id={expandContentId}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-64' : 'max-h-0'}`}
              >
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 mt-1 space-y-2 px-1">
                  {slide.expandBullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" aria-hidden="true" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">{bullet}</p>
                    </div>
                  ))}
                </div>
              </div>
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
                Get Started
              </button>
              <button
                onClick={handleHaveCodes}
                className="w-full border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                I already have codes - skip to Profile
              </button>
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
                Data stays private - no account, no server, no problem.
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
