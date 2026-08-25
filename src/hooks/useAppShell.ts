// src/hooks/useAppShell.ts
// App 全局 UI 编排状态：当前 Tab、登录/注册弹窗。
// 收敛到单一 hook，使 App.tsx 只做声明式编排，边界清晰、易于测试。
import { useState, useCallback } from 'react'
import type { AppTab } from '../components/templates/Layout/AppHeader'

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
}

export function useAppShell(): AppShellState {
  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showCheckinCalendar, setShowCheckinCalendar] = useState(false)

  const openLogin = useCallback(() => setShowLogin(true), [])
  const closeLogin = useCallback(() => setShowLogin(false), [])
  const openRegister = useCallback(() => setShowRegister(true), [])
  const closeRegister = useCallback(() => setShowRegister(false), [])
  const openAdmin = useCallback(() => setShowAdmin(true), [])
  const closeAdmin = useCallback(() => setShowAdmin(false), [])
  const openCheckinCalendar = useCallback(() => setShowCheckinCalendar(true), [])
  const closeCheckinCalendar = useCallback(() => setShowCheckinCalendar(false), [])

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
    setTab: setActiveTab,
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
  }
}