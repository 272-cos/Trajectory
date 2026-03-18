import { lazy, Suspense } from 'react'
import { AppProvider, useApp } from './context/AppContext.jsx'
import Header from './components/layout/Header.jsx'
import TabNavigation from './components/layout/TabNavigation.jsx'
import OnboardingModal from './components/layout/OnboardingModal.jsx'
import OfflineBanner from './components/layout/OfflineBanner.jsx'
import InstallPrompt from './components/layout/InstallPrompt.jsx'
import ChartUpdateBanner from './components/layout/ChartUpdateBanner.jsx'

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
    <div className={`min-h-screen bg-gray-100 flex flex-col${darkMode ? ' dark' : ''}`}>
      <OfflineBanner />
      <Header />
      <ChartUpdateBanner />
      <TabNavigation />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <Suspense fallback={<TabSkeleton />}>
          {renderTabContent()}
        </Suspense>
      </main>

      {showOnboarding && <OnboardingModal />}
      <InstallPrompt />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
