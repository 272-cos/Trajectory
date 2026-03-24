/**
 * Tab Navigation Component with swipe gesture support
 */

import { useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'selfcheck', label: 'Self-Check' },
  { id: 'project', label: 'Trajectory' },
  { id: 'plan', label: 'Plan' },
  { id: 'history', label: 'History' },
  { id: 'report', label: 'Report' },
  { id: 'tools', label: 'Tools' },
]

export default function TabNavigation() {
  const { activeTab, setActiveTab, selfCheckDirty, suppressSelfCheckWarning, setPendingTabNavigation } = useApp()
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const handleTabClick = (tabId) => {
    if (tabId === activeTab) return
    if (activeTab === 'selfcheck' && selfCheckDirty && !suppressSelfCheckWarning) {
      setPendingTabNavigation(tabId)
    } else {
      setActiveTab(tabId)
    }
  }

  const navigateTab = (direction) => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab)
    const nextIndex = currentIndex + direction
    if (nextIndex >= 0 && nextIndex < TABS.length) {
      handleTabClick(TABS[nextIndex].id)
    }
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null

    // Only swipe if horizontal movement is dominant and > 50px
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      navigateTab(deltaX < 0 ? 1 : -1)
    }
  }

  return (
    <nav
      className="bg-white shadow-sm border-b border-gray-200"
      aria-label="Application tabs"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="container mx-auto px-4 max-w-4xl lg:max-w-6xl">
        <div className="flex overflow-x-auto" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              onClick={() => handleTabClick(tab.id)}
              className={`
                px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors min-h-[44px]
                focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
                ${
                  activeTab === tab.id
                    ? 'text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
