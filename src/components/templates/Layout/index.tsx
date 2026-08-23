// src/components/templates/Layout/index.tsx
import React from 'react'
import { AppHeader, type AppTab } from './AppHeader'
import { AppFooter } from './AppFooter'
//import { ParticleBackground } from '../../atoms/ParticleBackground'  
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
  headerProps: {
    activeTab: AppTab
    onTabChange: (tab: AppTab) => void
    showImportExport: boolean
    onToggleImportExport: () => void
    onShowLogin: () => void
    onShowRegister: () => void
  }
}

export const Layout: React.FC<LayoutProps> = ({ children, headerProps }) => {
  return (
    <div className="app">
      {/* <ParticleBackground /> */}
      <AppHeader {...headerProps} />
      <main className="app-main">{children}</main>
      <AppFooter />
    </div>
  )
}