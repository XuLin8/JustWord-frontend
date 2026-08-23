// src/App.tsx
import { useState, useEffect } from 'react'
import { useWordStore } from './store/wordStore'
import { useAuth } from './context/AuthContext'
import { Layout } from './components/templates/Layout'
import { WordBookPage } from './pages/WordBookPage'
import { LearnPage } from './pages/LearnPage'
import { AuthModal } from './components/organisms/AuthModal'
import { ImportExportPanel } from './components/organisms/ImportExportPanel'
import { ToastContainer } from './components/organisms/ToastContainer'
import { ConfirmDialog } from './components/organisms/ConfirmDialog'
import { setupAuthListener } from './api'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'word' | 'learn'>('word')
  const [showImportExport, setShowImportExport] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const { loadWords } = useWordStore()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const cleanup = setupAuthListener()
    return cleanup
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadWords()
    }
  }, [isAuthenticated, loadWords])

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

        {/* 导入导出面板由 App 控制 */}
        {showImportExport && activeTab === 'word' && (
          <ImportExportPanel onImportComplete={handleImportComplete} />
        )}

        {activeTab === 'word' ? <WordBookPage /> : <LearnPage />}
      </Layout>

      <ToastContainer />
      <ConfirmDialog />
    </>
  )
}

export default App