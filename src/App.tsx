// src/App.tsx
import { useEffect } from 'react'
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
import { useAppShell } from './hooks/useAppShell'
import { useTheme } from './hooks/useTheme'
import { ThemeSwitcher } from './components/atoms/ThemeSwitcher'
import { LanguageSwitcher } from './components/atoms/LanguageSwitcher'
import type { AppTab } from './components/templates/Layout/AppHeader'
import './App.css'

function App() {
  const shell = useAppShell()
  useTheme()

  const { words, loadWords } = useWordStore()
  const { clearDashboard } = useStatsStore()
  const { isAuthenticated, user, logout } = useAuth()

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
    shell.closeImportExport()
  }

  // 切换 Tab 时若离开单词本，自动关闭导入导出面板
  const handleTabChange = (tab: AppTab) => {
    shell.setTab(tab)
    if (tab !== 'word') shell.closeImportExport()
  }

  return (
    <>
      <Layout
        headerProps={{
          activeTab: shell.activeTab,
          onTabChange: handleTabChange,
          showImportExport: shell.showImportExport,
          onToggleImportExport: shell.toggleImportExport,
          user: user ? { username: user.username } : null,
          onShowLogin: shell.openLogin,
          onLogout: logout,
          headerActions: (
            <>
              <LanguageSwitcher />
              <ThemeSwitcher />
            </>
          ),
        }}
        wordCount={words.length}
      >
        <AuthModal
          isLoginOpen={shell.showLogin}
          isRegisterOpen={shell.showRegister}
          onCloseLogin={shell.closeLogin}
          onCloseRegister={shell.closeRegister}
          onSwitchToRegister={shell.switchToRegister}
          onSwitchToLogin={shell.switchToLogin}
        />

        {/* 导入导出面板只在单词本 Tab 可见 */}
        {shell.showImportExport && shell.activeTab === 'word' && (
          <ImportExportPanel onImportComplete={handleImportComplete} />
        )}

        {shell.activeTab === 'home' && (
          <div key="home" className="tab-panel"><DashboardPage /></div>
        )}
        {shell.activeTab === 'word' && (
          <div key="word" className="tab-panel"><WordBookPage /></div>
        )}
        {shell.activeTab === 'learn' && (
          <div key="learn" className="tab-panel"><LearnPage /></div>
        )}
      </Layout>

      <ToastContainer />
      <ConfirmDialog />
    </>
  )
}

export default App