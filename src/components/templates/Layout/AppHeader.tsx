// src/components/templates/Layout/AppHeader.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { Button } from '../../atoms/Button'

export type AppTab = 'home' | 'word' | 'learn'

interface AppHeaderProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  showImportExport: boolean
  onToggleImportExport: () => void
  onShowLogin: () => void
  onShowRegister: () => void
}

const TABS: Array<{ id: AppTab; label: string }> = [
  { id: 'home',  label: '首页' },
  { id: 'word',  label: '单词本' },
  { id: 'learn', label: '学习' },
]

export const AppHeader: React.FC<AppHeaderProps> = (props) => {
  const { activeTab, onTabChange, showImportExport, onToggleImportExport, onShowLogin } = props
  void props.onShowRegister
  const { user, logout } = useAuth()

  const tabsRef = useRef<HTMLDivElement | null>(null)
  const buttonRefs = useRef<Record<AppTab, HTMLButtonElement | null>>({
    home: null, word: null, learn: null,
  })

  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  const syncIndicator = () => {
    const btn = buttonRefs.current[activeTab]
    const tabs = tabsRef.current
    if (!btn || !tabs) return
    const b = btn.getBoundingClientRect()
    const t = tabs.getBoundingClientRect()
    setIndicator({ left: b.left - t.left - 3, width: b.width })
  }

  useLayoutEffect(() => {
    syncIndicator()
  }, [activeTab])

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => syncIndicator())
    if (tabsRef.current) ro.observe(tabsRef.current)
    window.addEventListener('resize', syncIndicator)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', syncIndicator)
    }
  }, [])

  const usernameInitial = user?.username?.trim().slice(0, 1).toUpperCase() ?? 'U'

  return (
    <header className="app-header">
      <h1>Just Word</h1>

      <div className="header-right">
        {user ? (
          <div className="user-info">
            <span className="user-avatar" aria-hidden>{usernameInitial}</span>
            <span>{user.username}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              退出
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={onShowLogin}>
            登录
          </Button>
        )}

        <div className="tab-buttons" ref={tabsRef}>
          <span
            className="tab-indicator"
            style={{
              width: `${indicator.width}px`,
              transform: `translateX(${indicator.left}px)`,
            }}
            aria-hidden
          />
          {TABS.map((t) => (
            <button
              key={t.id}
              ref={(el) => { buttonRefs.current[t.id] = el }}
              className={activeTab === t.id ? 'tab-active' : 'tab-inactive'}
              onClick={() => onTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Button
          variant={showImportExport ? 'primary' : 'secondary'}
          size="sm"
          onClick={onToggleImportExport}
        >
          {showImportExport ? '关闭' : '管理词库'}
        </Button>
      </div>
    </header>
  )
}
