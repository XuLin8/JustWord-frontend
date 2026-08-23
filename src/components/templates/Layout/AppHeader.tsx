// src/components/templates/Layout/AppHeader.tsx
import React from 'react'
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

export const AppHeader: React.FC<AppHeaderProps> = (props) => {
  const {
    activeTab,
    onTabChange,
    showImportExport,
    onToggleImportExport,
    onShowLogin,
  } = props
  void props.onShowRegister
  const { user, logout } = useAuth()

  return (
    <header className="app-header">
      <h1>📚 Just Word</h1>

      <div className="header-right">
        {user ? (
          <div className="user-info">
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

        <div className="tab-buttons">
          <button
            className={activeTab === 'home' ? 'tab-active' : 'tab-inactive'}
            onClick={() => onTabChange('home')}
          >
            🏠 首页
          </button>
          <button
            className={activeTab === 'word' ? 'tab-active' : 'tab-inactive'}
            onClick={() => onTabChange('word')}
          >
            📝 单词本
          </button>
          <button
            className={activeTab === 'learn' ? 'tab-active' : 'tab-inactive'}
            onClick={() => onTabChange('learn')}
          >
            🧠 学习模式
          </button>
        </div>

        <Button
          variant={showImportExport ? 'primary' : 'secondary'}
          size="sm"
          onClick={onToggleImportExport}
        >
          {showImportExport ? '✕ 关闭' : '📦 管理词库'}
        </Button>
      </div>
    </header>
  )
}