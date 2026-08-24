// src/components/templates/Layout/AppHeader.tsx
import React from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Archive, ChevronDown } from 'lucide-react'

export type AppTab = 'home' | 'word' | 'learn'

export interface UserBrief {
  username: string
}

interface AppHeaderProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  showImportExport: boolean
  onToggleImportExport: () => void
  user: UserBrief | null
  onShowLogin: () => void
  onLogout: () => void
}

const TABS: Array<{ id: AppTab; label: string }> = [
  { id: 'home',  label: '首页' },
  { id: 'word',  label: '单词本' },
  { id: 'learn', label: '学习' },
]

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  onTabChange,
  showImportExport,
  onToggleImportExport,
  user,
  onShowLogin,
  onLogout,
}) => {
  const usernameInitial = user?.username?.trim().slice(0, 1).toUpperCase() ?? 'U'

  return (
    <header className="app-header">
      <h1>Just Word</h1>

      {/* 主导航：shadcn Tabs（受控） */}
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as AppTab)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="header-right">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="user-avatar" aria-hidden>{usernameInitial}</span>
                {user.username}
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>已登录：{user.username}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onToggleImportExport}>
                管理词库
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onLogout}>
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" onClick={onShowLogin}>
            登录
          </Button>
        )}

        <Button
          variant={showImportExport ? 'secondary' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={onToggleImportExport}
        >
          <Archive className="size-3.5" />
          {showImportExport ? '关闭' : '管理词库'}
        </Button>
      </div>
    </header>
  )
}