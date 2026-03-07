import { AppProvider, useApp } from './context/AppContext.jsx'
import Header from './components/layout/Header.jsx'
import TabNavigation from './components/layout/TabNavigation.jsx'
import OnboardingModal from './components/layout/OnboardingModal.jsx'
import OfflineBanner from './components/layout/OfflineBanner.jsx'
import InstallPrompt from './components/layout/InstallPrompt.jsx'
import ProfileTab from './components/tabs/ProfileTab.jsx'
import SelfCheckTab from './components/tabs/SelfCheckTab.jsx'
import ProjectTab from './components/tabs/ProjectTab.jsx'
import HistoryTab from './components/tabs/HistoryTab.jsx'
import ReportTab from './components/tabs/ReportTab.jsx'

function AppContent() {
  const { activeTab, showOnboarding } = useApp()

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />
      case 'selfcheck':
        return <SelfCheckTab />
      case 'project':
        return <ProjectTab />
      case 'history':
        return <HistoryTab />
      case 'report':
        return <ReportTab />
      default:
        return <ProfileTab />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <OfflineBanner />
      <Header />
      <TabNavigation />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {renderTabContent()}
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
