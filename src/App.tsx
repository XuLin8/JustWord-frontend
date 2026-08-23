// src/App.tsx
import { useState, useEffect } from 'react'
import { useWordStore } from './store/wordStore'
import { useStatsStore } from './store/statsStore'
import { useAuth } from './context/AuthContext'
import { Layout } from './components/templates/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { WordBookPage } from './pages/WordBookPage'
import { LearnPage } from './pages/LearnPage'
import { AuthModal } from './components/organisms/AuthModal'
import { ImportExportPanel } from './components/organisms/ImportExportPanel'
import { ToastContainer } from './components/organisms/ToastContainer'
import { ConfirmDialog } from './components/organisms/ConfirmDialog'
import { setupAuthListener } from './api'
import type { AppTab } from './components/templates/Layout/AppHeader'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const [showImportExport, setShowImportExport] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const { loadWords } = useWordStore()
  const { clearDashboard } = useStatsStore()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const cleanup = setupAuthListener()
    return cleanup
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadWords()
    } else {
      clearDashboard()
    }
  }, [isAuthenticated, loadWords, clearDashboard])

  const handleImportComplete = () => {
    loadWords()
  }

  return (
    <>
      <Layout
        headerProps={{
          activeTab,
          onTabChange: setActiveTab,
          showImportExport,
          onToggleImportExport: () => setShowImportExport(!showImportExport),
          onShowLogin: () => setShowLogin(true),
          onShowRegister: () => setShowRegister(true),
        }}
      >
        <AuthModal
          isLoginOpen={showLogin}
          isRegisterOpen={showRegister}
          onCloseLogin={() => setShowLogin(false)}
          onCloseRegister={() => setShowRegister(false)}
          onSwitchToRegister={() => {
            setShowLogin(false)
            setShowRegister(true)
          }}
          onSwitchToLogin={() => {
            setShowRegister(false)
            setShowLogin(true)
          }}
        />

        {/* 导入导出面板只在单词本 Tab 可见 */}
        {showImportExport && activeTab === 'word' && (
          <ImportExportPanel onImportComplete={handleImportComplete} />
        )}

        {activeTab === 'home' && <DashboardPage />}
        {activeTab === 'word' && <WordBookPage />}
        {activeTab === 'learn' && <LearnPage />}
      </Layout>

      <ToastContainer />
      <ConfirmDialog />
    </>
  )
}

export default App