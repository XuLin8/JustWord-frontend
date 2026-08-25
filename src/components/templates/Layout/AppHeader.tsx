// src/components/templates/Layout/AppHeader.tsx
import React from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CalendarDays, ChevronDown, Gauge, Minus, Plus, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { HeaderSearch } from '@/components/atoms/HeaderSearch'
import { useCatStore } from '@/store/catStore'
import { useFeatureStore } from '@/store/featureStore'
import { usePreferenceStore } from '@/store/preferenceStore'

export type AppTab = 'home' | 'word' | 'stats'

export interface UserBrief {
  username: string
  email?: string
}

interface AppHeaderProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  user: UserBrief | null
  onShowLogin: () => void
  onLogout: () => void
  /** 打开后台控制台看板 */
  onOpenAdmin: () => void
  /** 打开打卡日历 */
  onOpenCheckinCalendar: () => void
  /** 头部右侧动作插槽（主题/语言切换等全局入口），由 Layout/App 注入。 */
  headerActions?: React.ReactNode
}

const TABS: Array<{ id: AppTab; labelKey: string }> = [
  { id: 'home',  labelKey: 'nav.home' },
  { id: 'word',  labelKey: 'nav.wordbook' },
  { id: 'stats', labelKey: 'nav.stats' },
]

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  onTabChange,
  user,
  onShowLogin,
  onLogout,
  onOpenAdmin,
  onOpenCheckinCalendar,
  headerActions,
}) => {
  const { t } = useTranslation()
  const usernameInitial = user?.username?.trim().slice(0, 1).toUpperCase() ?? 'U'

  // 云养猫入口（「我的」页迁入头像下拉）
  const catAdopted = useCatStore((s) => s.adopted)
  const catName = useCatStore((s) => s.name)
  const catCoins = useCatStore((s) => s.coins)
  const catSatiety = useCatStore((s) => s.satiety)
  const catMood = useCatStore((s) => s.mood)
  const openCatBoard = useCatStore((s) => s.openBoard)
  const catEnabled = useFeatureStore((s) => s.cat)
  const searchEnabled = useFeatureStore((s) => s.search)

  // 每日目标（C1：由首页迁入「我的」头像下拉；偏好走接口，account 级）
  const dailyTarget = usePreferenceStore((s) => s.dailyTarget)
  const setDailyTarget = usePreferenceStore((s) => s.setDailyTarget)

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

      {searchEnabled && <HeaderSearch />}

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
            <DropdownMenuContent align="end" className="w-64">
              {/* 账号信息 */}
              <div className="flex items-center gap-3 px-2 py-1.5">
                <span className="user-avatar !size-10 text-sm" aria-hidden>{usernameInitial}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{user.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />

              {/* 云养猫入口（来自「我的」页；P0-5 屏蔽） */}
              {catEnabled && (
                <DropdownMenuItem onSelect={() => openCatBoard()}>
                  <span className="flex w-full items-center gap-3">
                    <img
                      src="/cat/cat-main.png"
                      alt={t('cat.title')}
                      className="size-9 rounded-full object-cover"
                      draggable={false}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{t('cat.title')}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {catAdopted
                          ? t('cat.profileCoins', { name: catName, coins: catCoins }) +
                            ` · ` +
                            t('cat.satietyShort', { n: catSatiety }) +
                            ` · ` +
                            t('cat.moodShort', { n: catMood })
                          : t('cat.notAdopted')}
                      </span>
                    </span>
                  </span>
                </DropdownMenuItem>
              )}

              {/* 每日目标（自首页迁入「我的」；不关闭菜单的步进器） */}
              <div className="flex items-center justify-between gap-3 px-2 py-1.5">
                <span className="flex items-center gap-2 text-sm">
                  <Target size={16} className="text-muted-foreground" />
                  {t('learningHome.targetConfig')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1 py-0.5">
                  <button
                    type="button"
                    aria-label={t('common.decrease')}
                    disabled={dailyTarget <= 1}
                    onClick={() => void setDailyTarget(dailyTarget - 1)}
                    className="grid size-6 place-items-center rounded-full text-foreground hover:bg-background disabled:opacity-40"
                  >
                    <Minus size={14} />
                  </button>
                  <b className="min-w-9 text-center tabular-nums">{dailyTarget}</b>
                  <button
                    type="button"
                    aria-label={t('common.increase')}
                    disabled={dailyTarget >= 200}
                    onClick={() => void setDailyTarget(dailyTarget + 1)}
                    className="grid size-6 place-items-center rounded-full text-foreground hover:bg-background disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </span>
              </div>

              {/* 打卡日历（P2：头像下拉入口，LeetCode 风格月度日历） */}
              <DropdownMenuItem onSelect={onOpenCheckinCalendar}>
                <CalendarDays size={16} className="mr-2" />
                {t('calendar.title')}
              </DropdownMenuItem>

              {/* 数据与设置（占位） */}
              <DropdownMenuItem disabled>
                <span className="flex-1">{t('profile.dataAndSync')}</span>
                <span className="text-xs text-muted-foreground">{t('profile.comingSoon')}</span>
              </DropdownMenuItem>

              {/* 后台控制台 */}
              <DropdownMenuItem onSelect={onOpenAdmin}>
                <Gauge size={16} className="mr-2" />
                {t('admin.title')}
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
      </div>
    </header>
  )
}