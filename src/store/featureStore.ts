// src/store/featureStore.ts
// 核心功能开关（后台控制台）：控制台可运行期开关核心能力，localforage 持久化。
// 默认：云养猫屏蔽（P0-5），其余核心功能开启。
import { create } from 'zustand'
import localforage from 'localforage'

const featureStorage = localforage.createInstance({
  name: 'JustWord',
  storeName: 'feature-flags',
})

export type CoreFeatureKey = 'cat' | 'review' | 'search' | 'speech' | 'checkin'

export interface FeatureStateData {
  /** 云养猫 */
  cat: boolean
  /** 复习队列（计划内混入最近学习单词） */
  review: boolean
  /** 字典搜索（header 搜索框） */
  search: boolean
  /** 语音发音（TTS） */
  speech: boolean
  /** 每日打卡 */
  checkin: boolean
}

interface FeatureStore extends FeatureStateData {
  loaded: boolean
  /** 启动时从本地恢复开关状态 */
  load: () => Promise<void>
  /** 切换某项开关并持久化 */
  toggle: (key: CoreFeatureKey) => Promise<void>
  /** 查询某项是否开启（供非组件侧调用） */
  enabled: (key: CoreFeatureKey) => boolean
}

const defaults: FeatureStateData = {
  cat: false, // P0-5 云养猫默认屏蔽
  review: true,
  search: true,
  speech: true,
  checkin: true,
}

function pickFlags(s: FeatureStateData): FeatureStateData {
  return {
    cat: s.cat,
    review: s.review,
    search: s.search,
    speech: s.speech,
    checkin: s.checkin,
  }
}

export const useFeatureStore = create<FeatureStore>((set, get) => ({
  ...defaults,
  loaded: false,

  load: async () => {
    try {
      const saved = await featureStorage.getItem<Partial<FeatureStateData>>('flags')
      set({ ...defaults, ...(saved ?? {}), loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  toggle: async (key) => {
    const next = { ...get(), [key]: !get()[key] }
    set(next)
    try {
      await featureStorage.setItem('flags', pickFlags(next))
    } catch (e) {
      console.error('保存功能开关失败:', e)
    }
  },

  enabled: (key) => get()[key],
}))