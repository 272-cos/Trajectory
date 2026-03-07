/**
 * Tab Navigation Component
 */

import { useApp } from '../../context/AppContext.jsx'

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'selfcheck', label: 'Self-Check' },
  { id: 'project', label: 'Trajectory' },
  { id: 'history', label: 'History' },
  { id: 'report', label: 'Report' },
]

export default function TabNavigation() {
  const { activeTab, setActiveTab, selfCheckDirty, suppressSelfCheckWarning, setPendingTabNavigation } = useApp()

  const handleTabClick = (tabId) => {
    if (tabId === activeTab) return
    if (activeTab === 'selfcheck' && selfCheckDirty && !suppressSelfCheckWarning) {
      setPendingTabNavigation(tabId)
    } else {
      setActiveTab(tabId)
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200" aria-label="Application tabs">
      <div className="container mx-auto px-4 max-w-4xl">
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
