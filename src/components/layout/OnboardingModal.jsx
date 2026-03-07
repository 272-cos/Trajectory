/**
 * Onboarding Modal - Guided slideshow walkthrough for first-time users
 * Multi-step flow: Welcome -> Profile -> Self-Check -> History -> Ready
 */

import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'

const SLIDES = [
  {
    id: 'welcome',
    title: 'Welcome to Trajectory',
    body: 'Track your fitness performance against 2026 PFA standards, project future readiness, and generate supervisor reports.',
    detail: 'All data stays on your device. No login, no tracking, no cloud.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    title: 'Step 1: Set Up Your Profile',
    body: 'Enter your date of birth, gender, and target PFA date. This generates a short profile code you can reuse across devices.',
    detail: 'Your profile code starts with "D" - save it to restore your profile anywhere.',
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
    body: 'Enter your exercise results - run time, push-ups, sit-ups, and body measurements. Scores update live as you type.',
    detail: 'When done, tap "Save Assessment" to create a shareable assessment code (starts with "S").',
    tab: 'selfcheck',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'trajectory',
    title: 'Step 3: Track Your Trajectory',
    body: 'The Trajectory tab shows your projected readiness and personalized training recommendations based on your results.',
    detail: 'The History tab stores all your past assessments with trend charts.',
    tab: 'project',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    id: 'ready',
    title: 'You\'re All Set',
    body: 'Start by setting up your profile, then record your first self-check. Your data never leaves your browser.',
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
            Your data stays private. No login required.
          </p>
        )}
      </div>
    </div>
  )
}
