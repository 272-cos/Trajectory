import { lazy, Suspense } from 'react'
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

function AppContent() {
  const { activeTab, showOnboarding, darkMode } = useApp()

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />
      case 'selfcheck':
        return <SelfCheckTab />
      case 'project':
        return <ProjectTab />
      case 'plan':
        return <PlanTab />
      case 'history':
        return <HistoryTab />
      case 'report':
        return <ReportTab />
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
            {renderTabContent()}
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
