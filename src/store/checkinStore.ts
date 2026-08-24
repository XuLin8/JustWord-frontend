// src/store/checkinStore.ts
// 打卡 store（M2-E）：当日背诵完成后打卡，localforage 持久化历史记录
import { create } from 'zustand'
import localforage from 'localforage'

const checkinStorage = localforage.createInstance({
  name: 'JustWord',
  storeName: 'checkin',
})

function todayStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

interface CheckinStore {
  checkins: string[] // 已打卡日期（YYYY-MM-DD）
  loading: boolean
  /** 今日是否已打卡 */
  todayChecked: boolean
  loadCheckins: () => Promise<void>
  /** 打卡今日，返回是否成功 */
  checkIn: () => Promise<boolean>
}

export const useCheckinStore = create<CheckinStore>((set, get) => ({
  checkins: [],
  loading: false,
  todayChecked: false,

  loadCheckins: async () => {
    set({ loading: true })
    try {
      const saved = await checkinStorage.getItem<string[]>('checkins')
      const checkins = saved ?? []
      set({ checkins, todayChecked: checkins.includes(todayStr()) })
    } catch (e) {
      console.error('加载打卡记录失败:', e)
    } finally {
      set({ loading: false })
    }
  },

  checkIn: async () => {
    const today = todayStr()
    if (get().todayChecked) return false
    const next = [...get().checkins, today]
    try {
      await checkinStorage.setItem('checkins', next)
      set({ checkins: next, todayChecked: true })
      return true
    } catch (e) {
      console.error('打卡失败:', e)
      return false
    }
  },
}))
