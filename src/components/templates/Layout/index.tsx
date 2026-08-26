// src/components/templates/Layout/index.tsx
import React from 'react'
import { AppHeader, type AppTab, type UserBrief } from './AppHeader'
import { AppFooter } from './AppFooter'
//import { ParticleBackground } from '../../atoms/ParticleBackground'  
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
  wordCount: number
  headerProps: {
    activeTab: AppTab
    onTabChange: (tab: AppTab) => void
    user: UserBrief | null
    onShowLogin: () => void
    onLogout: () => void
    onOpenAdmin: () => void
    onOpenCheckinCalendar: () => void
    onOpenProfile: () => void
    headerActions?: React.ReactNode
  }
}

export const Layout: React.FC<LayoutProps> = ({ children, wordCount, headerProps }) => {
  return (
    <div className="app">
      {/* <ParticleBackground /> */}
      <AppHeader {...headerProps} />
      <main className="app-main">{children}</main>
      <AppFooter wordCount={wordCount} />
    </div>
  )
}