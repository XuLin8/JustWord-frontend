// src/App.tsx
import { useEffect } from 'react'
import { useWordStore } from './store/wordStore'
import { useStatsStore } from './store/statsStore'
import { useSyncStore } from './store/syncStore'
import { useAuth } from './context/AuthContext'
import { Layout } from './components/templates/Layout'
import { LoginGate } from './pages/LoginGate'
import { AuthModal } from './components/organisms/AuthModal'
import { ToastContainer } from './components/organisms/ToastContainer'
import { ConfirmDialog } from './components/organisms/ConfirmDialog'
import { Spinner } from './components/atoms/Spinner'
import { PWAUpdateToast } from './components/organisms/PWAUpdateToast'
import { PWAInstallPrompt } from './components/organisms/PWAInstallPrompt'
import { CatBoard } from './components/organisms/CatBoard'
import { AdminConsole } from './components/organisms/AdminConsole'
import { CheckinCalendar } from './components/organisms/CheckinCalendar'
import { useCatStore } from './store/catStore'
import { useFeatureStore } from './store/featureStore'
import { useAccessStore } from './store/accessStore'
import { setupAuthListener } from './api'
import { useAppShell } from './hooks/useAppShell'
import { useTheme } from './hooks/useTheme'
import { ThemeSwitcher } from './components/atoms/ThemeSwitcher'
import { LanguageSwitcher } from './components/atoms/LanguageSwitcher'
import { DashboardPage } from './pages/DashboardPage'
import { WordBookPage } from './pages/WordBookPage'
import { LearningHomePage } from './pages/LearningHomePage'
import type { AppTab } from './components/templates/Layout/AppHeader'
import './App.css'

// 三个 Tab 页面体量小，静态导入即可（避免懒加载导致切换页签出现 loading）

function App() {
  const shell = useAppShell()
  useTheme()

  const { words, loadWords } = useWordStore()
  const { clearDashboard } = useStatsStore()
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const { init: initSync, reset: resetSync, syncNow } = useSyncStore()
  const loadCat = useCatStore((s) => s.load)
  const loadFeatures = useFeatureStore((s) => s.load)
  const recordVisit = useAccessStore((s) => s.recordVisit)
  const catEnabled = useFeatureStore((s) => s.cat)

  useEffect(() => {
    void loadFeatures() // 恢复核心功能开关
    void recordVisit() // 采集本次访问
    if (catEnabled) void loadCat() // 云养猫：加载猫咪状态（默认屏蔽）
  }, [loadFeatures, recordVisit, catEnabled, loadCat])

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

  // 切换 Tab
  const handleTabChange = (tab: AppTab) => {
    shell.setTab(tab)
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
      onSwitchToLogin={shell.switchToLogin}
      onSwitchToRegister={shell.switchToRegister}
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
          user: user ? { username: user.username, email: user.email } : null,
          onShowLogin: shell.openLogin,
          onLogout: logout,
          onOpenAdmin: shell.openAdmin,
          onOpenCheckinCalendar: shell.openCheckinCalendar,
          headerActions,
        }}
        wordCount={words.length}
      >
        {authModal}

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
      </Layout>

      <ToastContainer />
      <ConfirmDialog />
      {catEnabled && <CatBoard />}
      <AdminConsole open={shell.showAdmin} onClose={shell.closeAdmin} />
      <CheckinCalendar open={shell.showCheckinCalendar} onClose={shell.closeCheckinCalendar} />
      <PWAUpdateToast />
      <PWAInstallPrompt />
    </>
  )
}

export default App
