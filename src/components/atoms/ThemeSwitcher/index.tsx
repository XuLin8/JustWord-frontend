// src/components/atoms/ThemeSwitcher/index.tsx
// 主题切换（浅色/深色/跟随系统 三态）。自订阅 uiStore，depends on shadcn DropdownMenu。
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useUIStore, type ThemeMode } from '../../../store/uiStore'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const OPTIONS: Array<{ mode: ThemeMode; icon: React.ReactNode; labelKey: string }> = [
  { mode: 'light', icon: <Sun className="size-4" />, labelKey: 'theme.light' },
  { mode: 'dark', icon: <Moon className="size-4" />, labelKey: 'theme.dark' },
  { mode: 'system', icon: <Monitor className="size-4" />, labelKey: 'theme.system' },
]

export const ThemeSwitcher: React.FC = () => {
  const { t } = useTranslation()
  const theme = useUIStore((s) => s.theme)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2" aria-label="Switch theme">
          {OPTIONS.find((o) => o.mode === theme)?.icon ?? <Sun className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((o) => (
          <DropdownMenuItem key={o.mode} onSelect={() => useUIStore.getState().setTheme(o.mode)}>
            <span className="flex items-center gap-2">{o.icon}{t(o.labelKey)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}