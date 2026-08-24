// src/App.tsx
import { lazy, Suspense, useEffect } from 'react'
import { useWordStore } from './store/wordStore'
import { useStatsStore } from './store/statsStore'
import { useSyncStore } from './store/syncStore'
import { useAuth } from './context/AuthContext'
import { Layout } from './components/templates/Layout'
import { LoginGate } from './pages/LoginGate'
import { AuthModal } from './components/organisms/AuthModal'
import { ImportExportPanel } from './components/organisms/ImportExportPanel'
import { ToastContainer } from './components/organisms/ToastContainer'
import { ConfirmDialog } from './components/organisms/ConfirmDialog'
import { Spinner } from './components/atoms/Spinner'
import { PWAUpdateToast } from './components/organisms/PWAUpdateToast'
import { PWAInstallPrompt } from './components/organisms/PWAInstallPrompt'
import { CatBoard } from './components/organisms/CatBoard'
import { useCatStore } from './store/catStore'
import { setupAuthListener } from './api'
import { useAppShell } from './hooks/useAppShell'
import { useTheme } from './hooks/useTheme'
import { ThemeSwitcher } from './components/atoms/ThemeSwitcher'
import { LanguageSwitcher } from './components/atoms/LanguageSwitcher'
import type { AppTab } from './components/templates/Layout/AppHeader'
import './App.css'

// M4-D 性能代码分割：四个 Tab 页面按需懒加载，降低首屏 JS 体积
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const WordBookPage = lazy(() =>
  import('./pages/WordBookPage').then((m) => ({ default: m.WordBookPage }))
)
const LearningHomePage = lazy(() =>
  import('./pages/LearningHomePage').then((m) => ({ default: m.LearningHomePage }))
)
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
)

function App() {
  const shell = useAppShell()
  useTheme()

  const { words, loadWords } = useWordStore()
  const { clearDashboard } = useStatsStore()
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const { init: initSync, reset: resetSync, syncNow } = useSyncStore()
  const loadCat = useCatStore((s) => s.load)

  useEffect(() => {
    void loadCat() // 云养猫：全局加载猫咪状态（时间衰减 + 持久化）
  }, [loadCat])

  useEffect(() => {
    const cleanup = setupAuthListener()
    return cleanup
  }, [])

  // 登录后：恢复同步游标 → 加载词库 → 触发云端同步；登出/未登录：清空本地仪表盘与同步状态
  useEffect(() => {
    if (!isAuthenticated) {
      clearDashboard()
      resetSync()
      return
    }
    let cancelled = false
    ;(async () => {
      await initSync()
      if (cancelled) return
      await loadWords()
      if (cancelled) return
      await syncNow()
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, loadWords, clearDashboard, initSync, resetSync, syncNow])

  const handleImportComplete = () => {
    loadWords()
    shell.closeImportExport()
  }

  // 切换 Tab 时若离开单词本，自动关闭导入导出面板
  const handleTabChange = (tab: AppTab) => {
    shell.setTab(tab)
    if (tab !== 'word') shell.closeImportExport()
  }

  const headerActions = (
    <>
      <LanguageSwitcher />
      <ThemeSwitcher />
    </>
  )

  const authModal = (
    <AuthModal
      isLoginOpen={shell.showLogin}
      isRegisterOpen={shell.showRegister}
      onCloseLogin={shell.closeLogin}
      onCloseRegister={shell.closeRegister}
      onSwitchToRegister={shell.switchToRegister}
      onSwitchToLogin={shell.switchToLogin}
    />
  )

  // 登录门禁（M1）：加载中显示占位，未登录显示全屏引导页
  if (isLoading) {
    return (
      <div className="app-loading">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginGate
          onShowLogin={shell.openLogin}
          onShowRegister={shell.openRegister}
          headerActions={headerActions}
        />
        {authModal}
        <ToastContainer />
        <ConfirmDialog />
        <CatBoard />
        <PWAInstallPrompt />
      </>
    )
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
          headerActions,
        }}
        wordCount={words.length}
      >
        {authModal}

        {/* 导入导出面板只在单词本 Tab 可见 */}
        {shell.showImportExport && shell.activeTab === 'word' && (
          <ImportExportPanel onImportComplete={handleImportComplete} />
        )}

        <Suspense
          fallback={
            <div className="tab-panel tab-panel-loading">
              <Spinner size="lg" />
            </div>
          }
        >
          {shell.activeTab === 'home' && (
            <div key="home" className="tab-panel">
              <LearningHomePage onGoWordbook={() => shell.setTab('word')} />
            </div>
          )}
          {shell.activeTab === 'word' && (
            <div key="word" className="tab-panel"><WordBookPage /></div>
          )}
          {shell.activeTab === 'stats' && (
            <div key="stats" className="tab-panel"><DashboardPage /></div>
          )}
          {shell.activeTab === 'profile' && (
            <div key="profile" className="tab-panel"><ProfilePage /></div>
          )}
        </Suspense>
      </Layout>

      <ToastContainer />
      <ConfirmDialog />
      <CatBoard />
      <PWAUpdateToast />
      <PWAInstallPrompt />
    </>
  )
}

export default App