// src/store/checkinStore.ts
// 打卡 store（M2-E）：当日背诵完成后打卡。
// 数据源：后端 /api/learning/checkin（POST）+ /status + /history，账号级持久化、跨设备一致。
// 打卡门槛：今日答对次数 >= 每日目标（后端校验，未达标返回 403 + remaining）。
import { create } from 'zustand'
import { checkinApi } from '../api/endpoints/checkin.api'
import { useFeatureStore } from './featureStore'
import { useProgressStore } from './progressStore'

interface CheckinStore {
  checkins: string[] // 已打卡日期（YYYY-MM-DD，供日历/热力图）
  currentStreak: number
  maxStreak: number
  totalDays: number
  loading: boolean
  /** 今日是否已打卡 */
  todayChecked: boolean
  /** 拉取今日状态 + 打卡历史 */
  loadCheckins: () => Promise<void>
  /** 打卡今日，返回是否成功（未达标/重复打卡返回 false） */
  checkIn: () => Promise<boolean>
}

export const useCheckinStore = create<CheckinStore>((set, get) => ({
  checkins: [],
  currentStreak: 0,
  maxStreak: 0,
  totalDays: 0,
  loading: false,
  todayChecked: false,

  loadCheckins: async () => {
    set({ loading: true })
    try {
      const [status, history] = await Promise.all([
        checkinApi.getStatus(),
        checkinApi.getHistory(365).catch(() => null),
      ])
      set({
        todayChecked: status.checked_today,
        currentStreak: status.current_streak,
        maxStreak: status.max_streak,
        totalDays: status.total_days,
        checkins: history?.dates ?? [],
      })
    } catch (e) {
      console.error('加载打卡状态失败:', e)
    } finally {
      set({ loading: false })
    }
  },

  checkIn: async () => {
    if (!useFeatureStore.getState().enabled('checkin')) return false // 打卡功能开关关闭
    if (get().todayChecked) return false
    try {
      await checkinApi.checkin()
      set({ todayChecked: true })
      void get().loadCheckins()
      return true
    } catch (e) {
      // 未达标等失败：以后端进度为准，刷新 remaining 提示
      void useProgressStore.getState().load()
      return false
    }
  },
}))
