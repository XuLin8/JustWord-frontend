// src/hooks/useTheme.ts
// 主题应用 hook：把 uiStore 的 ThemeMode 应用到 <html> 的 .dark 类。
// - system 模式监听 prefers-color-scheme，跟随系统变化
// - 始终同步 resolvedTheme 到 store，供 UI 读取实际生效主题
import { useEffect } from 'react'
import { useUIStore, type ThemeMode } from '../store/uiStore'

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode
}

/** 依据 theme 设置 <html>-class 并广播 resolvedTheme。 */
export function applyTheme(mode: ThemeMode): void {
  const resolved = resolveTheme(mode)
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  useUIStore.getState().setResolvedTheme(resolved)
}

export function useTheme(): void {
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    applyTheme(theme)

    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => {
      const resolved: 'light' | 'dark' = e.matches ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', resolved === 'dark')
      useUIStore.getState().setResolvedTheme(resolved)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])
}