// src/components/templates/Layout/AppHeader.tsx
import React from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Archive, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type AppTab = 'home' | 'word' | 'stats' | 'profile'

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
  /** 头部右侧动作插槽（主题/语言切换等全局入口），由 Layout/App 注入。 */
  headerActions?: React.ReactNode
}

const TABS: Array<{ id: AppTab; labelKey: string }> = [
  { id: 'home',    labelKey: 'nav.home' },
  { id: 'word',    labelKey: 'nav.wordbook' },
  { id: 'stats',   labelKey: 'nav.stats' },
  { id: 'profile', labelKey: 'nav.profile' },
]

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  onTabChange,
  showImportExport,
  onToggleImportExport,
  user,
  onShowLogin,
  onLogout,
  headerActions,
}) => {
  const { t } = useTranslation()
  const usernameInitial = user?.username?.trim().slice(0, 1).toUpperCase() ?? 'U'

  return (
    <header className="app-header">
      <h1>Just Word</h1>

      {/* 主导航：shadcn Tabs（受控） */}
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as AppTab)}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="header-right">
        {headerActions}

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
              <DropdownMenuLabel>{t('common.manageBook')}：{user.username}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onToggleImportExport}>
                {t('common.manageBook')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onLogout}>
                {t('common.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" onClick={onShowLogin}>
            {t('common.login')}
          </Button>
        )}

        <Button
          variant={showImportExport ? 'secondary' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={onToggleImportExport}
        >
          <Archive className="size-3.5" />
          {showImportExport ? t('common.close') : t('common.manageBook')}
        </Button>
      </div>
    </header>
  )
}