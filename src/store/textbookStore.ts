// src/store/textbookStore.ts
// 内置词书订阅 store（M2-B）：维护可用词书列表 + 已订阅集合。
// 订阅状态以服务端为准（账号级），不再使用 localforage，避免跨账号污染（新用户误继承旧用户订阅）。
import { create } from 'zustand'
import { textbooksApi, type Textbook } from '../api/endpoints/textbooks.api'

interface TextbookStore {
  textbooks: Textbook[]
  enrolledIds: number[]
  loading: boolean
  loadTextbooks: () => Promise<void>
  enroll: (id: number) => Promise<boolean>
  unsubscribe: (id: number) => Promise<void>
  isEnrolled: (id: number) => boolean
}

export const useTextbookStore = create<TextbookStore>((set, get) => ({
  textbooks: [],
  enrolledIds: [],
  loading: false,

  loadTextbooks: async () => {
    set({ loading: true })
    try {
      const [textbooks, enrolledIds] = await Promise.all([
        textbooksApi.list(),
        // 已订阅列表来自后端（登录后）；未登录/失败时视为未订阅
        textbooksApi.enrolled().catch(() => [] as number[]),
      ])
      set({ textbooks, enrolledIds })
    } catch (error) {
      console.error('加载内置词书失败:', error)
    } finally {
      set({ loading: false })
    }
  },

  enroll: async (id) => {
    const { enrolledIds } = get()
    if (enrolledIds.includes(id)) return true
    try {
      await textbooksApi.enroll(id)
      set({ enrolledIds: [...enrolledIds, id] })
      return true
    } catch (error) {
      console.error('订阅词书失败:', error)
      return false
    }
  },

  unsubscribe: async (id) => {
    const next = get().enrolledIds.filter((x) => x !== id)
    try {
      await textbooksApi.unsubscribe(id)
    } catch (error) {
      console.error('取消订阅词书失败:', error)
    }
    set({ enrolledIds: next })
  },

  isEnrolled: (id) => get().enrolledIds.includes(id),
}))
