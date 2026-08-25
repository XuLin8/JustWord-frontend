// src/store/accessStore.ts
// 访问信息采集（后台控制台）：记录首次/最近访问、访问次数、每日访问、设备/浏览器、
// 视口、语言、主题、是否以独立窗口（PWA/安装）打开。localforage 持久化。
import { create } from 'zustand'
import localforage from 'localforage'

const accessStorage = localforage.createInstance({
  name: 'JustWord',
  storeName: 'access',
})

function dayStr(ts: number = Date.now()): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge'
  if (/opr\//i.test(ua)) return 'Opera'
  if (/chrome\//i.test(ua)) return 'Chrome'
  if (/safari\//i.test(ua)) return 'Safari'
  if (/firefox\//i.test(ua)) return 'Firefox'
  return 'Unknown'
}

function detectOS(ua: string): string {
  if (/windows\snt/i.test(ua)) return 'Windows'
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/mac os x/i.test(ua)) return 'macOS'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Unknown'
}

export interface AccessStateData {
  firstSeen: number
  lastSeen: number
  visits: number // 累计访问（打开应用）次数
  daily: Record<string, number> // 每日访问次数，YYYY-MM-DD -> n
  ua: string
  browser: string
  os: string
  viewport: string // 如 1440x900
  language: string
  theme: string
  standalone: boolean // 是否以独立/PWA 窗口打开
  screenW: number
  screenH: number
}

interface AccessStore extends AccessStateData {
  loaded: boolean
  /** 启动时恢复历史 + 采集本次访问并落盘 */
  recordVisit: () => Promise<void>
  /** 清空访问记录 */
  reset: () => Promise<void>
}

function snapshot(s: AccessStore): AccessStateData {
  return {
    firstSeen: s.firstSeen,
    lastSeen: s.lastSeen,
    visits: s.visits,
    daily: s.daily,
    ua: s.ua,
    browser: s.browser,
    os: s.os,
    viewport: s.viewport,
    language: s.language,
    theme: s.theme,
    standalone: s.standalone,
    screenW: s.screenW,
    screenH: s.screenH,
  }
}

export const useAccessStore = create<AccessStore>((set, get) => ({
  firstSeen: 0,
  lastSeen: 0,
  visits: 0,
  daily: {},
  ua: '',
  browser: 'Unknown',
  os: 'Unknown',
  viewport: '',
  language: '',
  theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  standalone: false,
  screenW: 0,
  screenH: 0,
  loaded: false,

  recordVisit: async () => {
    const now = Date.now()
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const today = dayStr(now)
    let base: AccessStateData
    try {
      const saved = await accessStorage.getItem<AccessStateData>('state')
      base = saved ?? {
        firstSeen: 0,
        lastSeen: 0,
        visits: 0,
        daily: {},
        ua: '',
        browser: 'Unknown',
        os: 'Unknown',
        viewport: '',
        language: '',
        theme: 'light',
        standalone: false,
        screenW: 0,
        screenH: 0,
      }
    } catch {
      base = {
        firstSeen: 0,
        lastSeen: 0,
        visits: 0,
        daily: {},
        ua: '',
        browser: 'Unknown',
        os: 'Unknown',
        viewport: '',
        language: '',
        theme: 'light',
        standalone: false,
        screenW: 0,
        screenH: 0,
      }
    }

    const isStandalone =
      typeof navigator !== 'undefined' && Boolean((navigator as any).standalone) ||
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches)

    const next: AccessStateData = {
      ...base,
      firstSeen: base.firstSeen || now,
      lastSeen: now,
      visits: base.visits + 1,
      daily: { ...base.daily, [today]: (base.daily[today] ?? 0) + 1 },
      ua,
      browser: detectBrowser(ua),
      os: detectOS(ua),
      viewport:
        typeof window !== 'undefined'
          ? `${window.innerWidth}x${window.innerHeight}`
          : '',
      language: (typeof navigator !== 'undefined' && (navigator.language || '')) || '',
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      standalone: isStandalone,
      screenW: typeof window !== 'undefined' ? window.screen.width : 0,
      screenH: typeof window !== 'undefined' ? window.screen.height : 0,
    }
    set(next)
    try {
      await accessStorage.setItem('state', snapshot(get()))
    } catch (e) {
      console.error('保存访问信息失败:', e)
    }
  },

  reset: async () => {
    try {
      await accessStorage.removeItem('state')
    } catch {
      // 忽略
    }
    set({
      firstSeen: 0,
      lastSeen: 0,
      visits: 0,
      daily: {},
      ua: '',
      browser: 'Unknown',
      os: 'Unknown',
      viewport: '',
      language: '',
      theme: 'light',
      standalone: false,
      screenW: 0,
      screenH: 0,
    })
  },
}))