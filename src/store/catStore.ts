// src/store/catStore.ts
// 云养猫 store：领养 / 饱食 / 心情 / 金币，localforage 持久化 + 时间衰减（离线期间状态随时间下降）
import { create } from 'zustand'
import localforage from 'localforage'
import { playMeow, playPurr } from '@/utils/catSound'

const catStorage = localforage.createInstance({
  name: 'JustWord',
  storeName: 'cat',
})

// ===== 数值模型（MVP 精简版） =====
export const CAT_COST = {
  FEED: 10,        // 喂食花费
  PLAY: 5,         // 玩耍花费
  FEED_GAIN: 25,   // 喂食饱食提升
  PLAY_GAIN: 22,   // 玩耍心情提升
  PET_GAIN: 4,     // 抚摸心情提升（免费）
} as const

export const CAT_REWARD = {
  KNOWN: 2,   // 判定「认识」得币
  UNKNOWN: 1, // 判定「不认识」得币
  CHECKIN: 10, // 每日打卡得币
} as const

const SATIETY_DECAY_PER_HOUR = 2.5
const MOOD_DECAY_PER_HOUR = 1.5
const HUNGRY_THRESHOLD = 20 // 饱食低于该值时心情加速下降
const MAX_ELAPSED_HOURS = 48 // 离线衰减上限，防止长期离线直接清零

export interface CatStateData {
  adopted: boolean
  name: string
  coins: number
  satiety: number // 0-100
  mood: number // 0-100
  adoptedAt: number
  lastActiveAt: number
  /** 是否将猫咪设为首页看板 */
  asBoard: boolean
}

interface CatStore extends CatStateData {
  loaded: boolean
  boardOpen: boolean
  /** 从本地存储加载并应用时间衰减 */
  load: () => Promise<void>
  /** 领养猫咪（默认名） */
  adopt: (name?: string) => Promise<void>
  /** 获得货币 */
  earnCoins: (n: number) => Promise<void>
  /** 喂食：花费金币提升饱食；返回是否成功 */
  feed: () => Promise<boolean>
  /** 玩耍：花费金币提升心情；返回是否成功 */
  play: () => Promise<boolean>
  /** 抚摸：免费，轻微提升心情 */
  pet: () => Promise<void>
  /** 切换「设为看板」 */
  toggleAsBoard: () => Promise<void>
  openBoard: () => void
  closeBoard: () => void
}

const defaultData: CatStateData = {
  adopted: false,
  name: 'Momo',
  coins: 0,
  satiety: 80,
  mood: 70,
  adoptedAt: 0,
  lastActiveAt: 0,
  asBoard: true,
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** 应用时间衰减：根据距上次活跃的小时数扣减饱食/心情 */
function applyDecay(d: CatStateData): CatStateData {
  if (!d.adopted || !d.lastActiveAt) return d
  const hours = clamp((Date.now() - d.lastActiveAt) / 3_600_000, 0, MAX_ELAPSED_HOURS)
  if (hours <= 0) return d
  let satiety = d.satiety - hours * SATIETY_DECAY_PER_HOUR
  let mood = d.mood - hours * MOOD_DECAY_PER_HOUR
  if (satiety <= HUNGRY_THRESHOLD) mood -= hours * 2 // 饥饿时心情加速下滑
  return {
    ...d,
    satiety: Math.round(clamp(satiety, 0, 100)),
    mood: Math.round(clamp(mood, 0, 100)),
    lastActiveAt: Date.now(),
  }
}

/** 从当前状态提取可持久化数据字段（排除 store 函数） */
function snapshot(s: CatStore): CatStateData {
  return {
    adopted: s.adopted,
    name: s.name,
    coins: s.coins,
    satiety: s.satiety,
    mood: s.mood,
    adoptedAt: s.adoptedAt,
    lastActiveAt: s.lastActiveAt,
    asBoard: s.asBoard,
  }
}

async function persist(d: CatStateData): Promise<void> {
  try {
    await catStorage.setItem('state', d)
  } catch (e) {
    console.error('保存猫咪状态失败:', e)
  }
}

export const useCatStore = create<CatStore>((set, get) => ({
  ...defaultData,
  loaded: false,
  boardOpen: false,

  load: async () => {
    try {
      const saved = await catStorage.getItem<CatStateData>('state')
      if (!saved) {
        set({ loaded: true })
        return
      }
      const decayed = applyDecay(saved)
      set({ ...decayed, loaded: true })
      void persist(decayed)
    } catch (e) {
      console.error('加载猫咪状态失败:', e)
      set({ loaded: true })
    }
  },

  adopt: async (name) => {
    const d: CatStateData = {
      ...defaultData,
      adopted: true,
      name: name?.trim() || defaultData.name,
      adoptedAt: Date.now(),
      lastActiveAt: Date.now(),
    }
    set(d)
    await persist(d)
    playMeow()
  },

  earnCoins: async (n) => {
    const s = get()
    const next: CatStateData = {
      ...snapshot(s),
      coins: s.coins + n,
      lastActiveAt: Date.now(),
    }
    set(next)
    await persist(next)
  },

  feed: async () => {
    const s = get()
    if (!s.adopted || s.coins < CAT_COST.FEED) return false
    const next: CatStateData = {
      ...snapshot(s),
      coins: s.coins - CAT_COST.FEED,
      satiety: clamp(s.satiety + CAT_COST.FEED_GAIN, 0, 100),
      lastActiveAt: Date.now(),
    }
    set(next)
    await persist(next)
    playPurr()
    return true
  },

  play: async () => {
    const s = get()
    if (!s.adopted || s.coins < CAT_COST.PLAY) return false
    const next: CatStateData = {
      ...snapshot(s),
      coins: s.coins - CAT_COST.PLAY,
      mood: clamp(s.mood + CAT_COST.PLAY_GAIN, 0, 100),
      lastActiveAt: Date.now(),
    }
    set(next)
    await persist(next)
    playMeow()
    return true
  },

  pet: async () => {
    const s = get()
    if (!s.adopted) return
    const next: CatStateData = {
      ...snapshot(s),
      mood: clamp(s.mood + CAT_COST.PET_GAIN, 0, 100),
      lastActiveAt: Date.now(),
    }
    set(next)
    await persist(next)
    playMeow()
  },

  toggleAsBoard: async () => {
    const s = get()
    if (!s.adopted) return
    const next: CatStateData = { ...snapshot(s), asBoard: !s.asBoard }
    set(next)
    await persist(next)
  },

  openBoard: () => set({ boardOpen: true }),
  closeBoard: () => set({ boardOpen: false }),
}))
