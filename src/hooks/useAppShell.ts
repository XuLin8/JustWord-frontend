// src/hooks/useAppShell.ts
// App 全局 UI 编排状态：当前 Tab、登录/注册弹窗。
// 收敛到单一 hook，使 App.tsx 只做声明式编排，边界清晰、易于测试。
import { useState, useCallback, useEffect } from 'react'
import type { AppTab } from '../components/templates/Layout/AppHeader'

/** 地址栏 hash → 顶层 Tab 映射（支持 #/profile 等直达，并对齐 app 内 setTab） */
const HASH_TAB: Record<string, AppTab> = {
  '#/home': 'home',
  '#/word': 'word',
  '#/profile': 'profile',
}

function tabFromHash(): AppTab {
  return HASH_TAB[window.location.hash] ?? 'home'
}

export interface AppShellState {
  activeTab: AppTab
  setTab: (tab: AppTab) => void
  showLogin: boolean
  showRegister: boolean
  openLogin: () => void
  closeLogin: () => void
  openRegister: () => void
  closeRegister: () => void
  switchToRegister: () => void
  switchToLogin: () => void
  showAdmin: boolean
  openAdmin: () => void
  closeAdmin: () => void
  showCheckinCalendar: boolean
  openCheckinCalendar: () => void
  closeCheckinCalendar: () => void
  showChangePassword: boolean
  openChangePassword: () => void
  closeChangePassword: () => void
}

export function useAppShell(): AppShellState {
  // 初次渲染即从地址栏 hash 读取目标 Tab（支持 #/profile 直达）
  const [activeTab, setActiveTab] = useState<AppTab>(() => tabFromHash())
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showCheckinCalendar, setShowCheckinCalendar] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)

  // 地址栏 hash 变化（浏览器前进/后退/手输 #/profile）→ 同步 Tab
  useEffect(() => {
    const onHash = () => setActiveTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // 统一切 Tab：既改内存态，又同步地址栏 hash（历史记录可回退）
  const setTab = useCallback((tab: AppTab) => {
    const target = `#/${tab}`
    if (window.location.hash !== target) {
      window.location.hash = target
    }
    setActiveTab(tab)
  }, [])

  const openLogin = useCallback(() => setShowLogin(true), [])
  const closeLogin = useCallback(() => setShowLogin(false), [])
  const openRegister = useCallback(() => setShowRegister(true), [])
  const closeRegister = useCallback(() => setShowRegister(false), [])
  const openAdmin = useCallback(() => setShowAdmin(true), [])
  const closeAdmin = useCallback(() => setShowAdmin(false), [])
  const openCheckinCalendar = useCallback(() => setShowCheckinCalendar(true), [])
  const closeCheckinCalendar = useCallback(() => setShowCheckinCalendar(false), [])
  const openChangePassword = useCallback(() => setShowChangePassword(true), [])
  const closeChangePassword = useCallback(() => setShowChangePassword(false), [])

  const switchToRegister = useCallback(() => {
    setShowLogin(false)
    setShowRegister(true)
  }, [])

  const switchToLogin = useCallback(() => {
    setShowRegister(false)
    setShowLogin(true)
  }, [])

  return {
    activeTab,
    setTab,
    showLogin,
    showRegister,
    openLogin,
    closeLogin,
    openRegister,
    closeRegister,
    switchToRegister,
    switchToLogin,
    showAdmin,
    openAdmin,
    closeAdmin,
    showCheckinCalendar,
    openCheckinCalendar,
    closeCheckinCalendar,
    showChangePassword,
    openChangePassword,
    closeChangePassword,
  }
}