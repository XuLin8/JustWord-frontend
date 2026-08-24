// src/store/textbookStore.ts
// 内置词书订阅 store（M2-B）：维护可用词书列表 + 已订阅集合，localforage 持久化
import { create } from 'zustand'
import localforage from 'localforage'
import { textbooksApi, type Textbook } from '../api/endpoints/textbooks.api'

const enrollStorage = localforage.createInstance({
  name: 'JustWord',
  storeName: 'textbook-enroll',
})

interface TextbookStore {
  textbooks: Textbook[]
  enrolledIds: number[]
  loading: boolean
  loadTextbooks: () => Promise<void>
  enroll: (id: number) => Promise<boolean>
  unsubscribe: (id: number) => Promise<void>
  isEnrolled: (id: number) => boolean
}

async function loadEnrolled(): Promise<number[]> {
  try {
    return (await enrollStorage.getItem<number[]>('enrolledIds')) ?? []
  } catch {
    return []
  }
}

async function persistEnrolled(ids: number[]): Promise<void> {
  try {
    await enrollStorage.setItem('enrolledIds', ids)
  } catch (e) {
    console.error('词书订阅本地持久化失败:', e)
  }
}

export const useTextbookStore = create<TextbookStore>((set, get) => ({
  textbooks: [],
  enrolledIds: [],
  loading: false,

  loadTextbooks: async () => {
    set({ loading: true })
    try {
      const [textbooks, enrolledIds] = await Promise.all([textbooksApi.list(), loadEnrolled()])
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
      const next = [...enrolledIds, id]
      set({ enrolledIds: next })
      await persistEnrolled(next)
      return true
    } catch (error) {
      console.error('订阅词书失败:', error)
      return false
    }
  },

  unsubscribe: async (id) => {
    const next = get().enrolledIds.filter((x) => x !== id)
    set({ enrolledIds: next })
    await persistEnrolled(next)
  },

  isEnrolled: (id) => get().enrolledIds.includes(id),
}))
