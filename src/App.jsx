import { lazy, Suspense, useState, Component } from 'react'
import { AppProvider, useApp } from './context/AppContext.jsx'
import Header from './components/layout/Header.jsx'
import TabNavigation from './components/layout/TabNavigation.jsx'
import OnboardingModal from './components/layout/OnboardingModal.jsx'
import OfflineBanner from './components/layout/OfflineBanner.jsx'
import InstallPrompt from './components/layout/InstallPrompt.jsx'
import ChartUpdateBanner from './components/layout/ChartUpdateBanner.jsx'
import ErrorBoundary from './components/shared/ErrorBoundary.jsx'
import PfaCountdown from './components/shared/PfaCountdown.jsx'

const ProfileTab = lazy(() => import('./components/tabs/ProfileTab.jsx'))
const SelfCheckTab = lazy(() => import('./components/tabs/SelfCheckTab.jsx'))
const ProjectTab = lazy(() => import('./components/tabs/ProjectTab.jsx'))
const PlanTab = lazy(() => import('./components/tabs/PlanTab.jsx'))
const HistoryTab = lazy(() => import('./components/tabs/HistoryTab.jsx'))
const ReportTab = lazy(() => import('./components/tabs/ReportTab.jsx'))
const ToolsTab = lazy(() => import('./components/tabs/ToolsTab.jsx'))

class TabErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Tab error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl shadow-md p-6 text-center space-y-3">
          <p className="text-gray-900 font-semibold">This section hit an error</p>
          <p className="text-gray-500 text-sm">Your other tabs and saved data are fine.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors min-h-[44px]"
          >
            Try Again
          </button>
          <p className="text-xs text-gray-400">UNOFFICIAL ESTIMATE - Not for official use</p>
        </div>
      )
    }
    return this.props.children
  }
}

function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-10 bg-gray-100 rounded w-full" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-3" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}

/** Sub-view toggle pill used within Trajectory and History tabs */
function SubViewToggle({ options, active, onChange }) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-5" role="group" aria-label="View selector">
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          aria-pressed={active === opt.id}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all min-h-[36px] ${
            active === opt.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/** Trajectory tab with Projection/Calendar sub-views */
function TrajectoryContainer() {
  const [subView, setSubView] = useState('projection')
  return (
    <>
      <SubViewToggle
        options={[
          { id: 'projection', label: 'Projection' },
          { id: 'calendar', label: 'Training Calendar' },
        ]}
        active={subView}
        onChange={setSubView}
      />
      {subView === 'projection' ? <ProjectTab /> : <PlanTab />}
    </>
  )
}

/** History tab with Timeline/Report sub-views */
function HistoryContainer() {
  const [subView, setSubView] = useState('timeline')
  return (
    <>
      <SubViewToggle
        options={[
          { id: 'timeline', label: 'Timeline' },
          { id: 'report', label: 'Supervisor Report' },
        ]}
        active={subView}
        onChange={setSubView}
      />
      {subView === 'timeline' ? <HistoryTab /> : <ReportTab />}
    </>
  )
}

function AppContent() {
  const { activeTab, showOnboarding, darkMode } = useApp()

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />
      case 'selfcheck':
        return <SelfCheckTab />
      case 'project':
        return <TrajectoryContainer />
      case 'history':
        return <HistoryContainer />
      case 'tools':
        return <ToolsTab />
      default:
        return <ProfileTab />
    }
  }

  return (
    <div className={`min-h-screen flex flex-col${darkMode ? ' dark bg-[#0a1628]' : ' bg-gray-100'}`}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium">
        Skip to main content
      </a>
      <h1 className="sr-only">Trajectory - USAF PFA Readiness Tracker</h1>
      <OfflineBanner />
      <Header />
      <ChartUpdateBanner />
      <TabNavigation />
      <PfaCountdown />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-6 max-w-4xl lg:max-w-6xl">
        <div role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`}>
          <Suspense fallback={<TabSkeleton />}>
            <TabErrorBoundary key={activeTab}>
              {renderTabContent()}
            </TabErrorBoundary>
          </Suspense>
        </div>
      </main>

      {showOnboarding && <OnboardingModal />}
      <InstallPrompt />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App
