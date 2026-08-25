// src/store/preferenceStore.ts
// 账户级偏好 store：背诵模式等偏好从后端偏好接口读写（当前走 mock，后端就绪后切 preferencesApiHttp）
// 发音开关（audioEnabled）为设备本地偏好（localforage 持久化），跨会话保留，不依赖后端。
import { create } from 'zustand'
import localforage from 'localforage'
import { preferencesApi, type UpdatePreferencesRequest } from '../api/endpoints/preferences.api'
import type { RecitationRule } from '../components/organisms/RecitationModes/RulePicker'

const DEFAULT_RULE: RecitationRule = 'judge'
const DEFAULT_TARGET = 20

const prefsStorage = localforage.createInstance({
  name: 'JustWord',
  storeName: 'preferences',
})

interface PreferenceStore {
  recitationRule: RecitationRule
  dailyTarget: number
  /** 单词发音自动播报开关（设备本地持久化） */
  audioEnabled: boolean
  loaded: boolean
  /** 登录/刷新后从偏好接口恢复上次选择的背诵模式 */
  loadPreferences: () => Promise<void>
  /** 记录/切换背诵模式并同步到偏好接口 */
  setRecitationRule: (rule: RecitationRule) => Promise<void>
  /** 设置每日目标并同步到偏好接口 */
  setDailyTarget: (n: number) => Promise<void>
  /** 切换发音开关并本地持久化 */
  setAudioEnabled: (enabled: boolean) => Promise<void>
}

export const usePreferenceStore = create<PreferenceStore>((set, get) => ({
  recitationRule: DEFAULT_RULE,
  dailyTarget: DEFAULT_TARGET,
  audioEnabled: true,
  loaded: false,

  loadPreferences: async () => {
    if (get().loaded) return
    // 发音开关：设备本地恢复（默认开）
    try {
      const saved = await prefsStorage.getItem<boolean>('audioEnabled')
      if (typeof saved === 'boolean') set({ audioEnabled: saved })
    } catch (e) {
      console.error('读取发音开关失败:', e)
    }
    try {
      const prefs = await preferencesApi.get()
      const rule = prefs.recitation_rule ?? DEFAULT_RULE
      const dailyTarget = prefs.daily_target ?? DEFAULT_TARGET
      set({ recitationRule: rule, dailyTarget, loaded: true })
    } catch (e) {
      console.error('读取偏好失败:', e)
      set({ loaded: true }) // 失败也标记已加载，避免反复请求
    }
  },

  setRecitationRule: async (rule) => {
    set({ recitationRule: rule })
    const data: UpdatePreferencesRequest = { recitation_rule: rule }
    try {
      await preferencesApi.update(data)
    } catch (e) {
      console.error('保存偏好失败:', e)
    }
  },

  setDailyTarget: async (n) => {
    const target = Math.max(1, Math.min(200, Math.round(n)))
    set({ dailyTarget: target })
    try {
      await preferencesApi.update({ daily_target: target })
    } catch (e) {
      console.error('保存每日目标失败:', e)
    }
  },

  setAudioEnabled: async (enabled) => {
    set({ audioEnabled: enabled })
    try {
      await prefsStorage.setItem('audioEnabled', enabled)
    } catch (e) {
      console.error('保存发音开关失败:', e)
    }
  },
}))