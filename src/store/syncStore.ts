// src/store/syncStore.ts
// 同步引擎：词库 + 学习记录的增量推送/拉取，本地优先冲突 + lastSyncAt 增量
import { create } from 'zustand'
import localforage from 'localforage'
import { syncApi } from '@/api'
import { useWordStore } from './wordStore'
import { useLearningStore } from './learningStore'
import i18n from '@/i18n'

const syncStorage = localforage.createInstance({
  name: 'JustWord',
  storeName: 'sync-meta',
})

interface SyncMeta {
  lastSyncAt: number | null
  lastSyncTime: number | null
}

interface SyncStore {
  syncing: boolean
  lastSyncAt: number | null
  lastSyncTime: number | null
  lastError: string | null
  /** 启动时从本地恢复同步游标 */
  init: () => Promise<void>
  /** 执行一次完整同步（push 增量 → pull 增量 → 本地优先合并） */
  syncNow: () => Promise<boolean>
  /** 登出时清空同步状态 */
  reset: () => Promise<void>
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  syncing: false,
  lastSyncAt: null,
  lastSyncTime: null,
  lastError: null,

  init: async () => {
    try {
      const saved = await syncStorage.getItem<SyncMeta>('meta')
      if (saved) {
        set({ lastSyncAt: saved.lastSyncAt ?? null, lastSyncTime: saved.lastSyncTime ?? null })
      }
    } catch {
      // 读取出错时保持初始状态
    }
  },

  syncNow: async () => {
    if (get().syncing) return false
    const { lastSyncAt } = get()
    set({ syncing: true, lastError: null })
    try {
      // 1. 词库：push 增量 → pull 增量 → 本地优先合并
      const localWords = useWordStore.getState().getWordsSince(lastSyncAt)
      if (localWords.length > 0) {
        await syncApi.pushWords({ last_sync_at: lastSyncAt, changes: localWords })
      }
      const wordsRes = await syncApi.pullWords(lastSyncAt)
      await useWordStore.getState().mergeRemoteWords(wordsRes.changes)

      // 2. 学习记录：push 增量 → pull 增量 → 本地优先合并
      const localRecords = useLearningStore.getState().getRecordsSince(lastSyncAt)
      if (localRecords.length > 0) {
        await syncApi.pushRecords({ last_sync_at: lastSyncAt, changes: localRecords })
      }
      const recordsRes = await syncApi.pullRecords(lastSyncAt)
      await useLearningStore.getState().mergeRemoteRecords(recordsRes.changes)

      // 3. 推进游标（取两端服务端时间的最大值）
      const newLastSyncAt = Math.max(
        lastSyncAt ?? 0,
        wordsRes.server_time,
        recordsRes.server_time
      )
      const now = Date.now()
      set({ lastSyncAt: newLastSyncAt, lastSyncTime: now })
      await syncStorage.setItem('meta', { lastSyncAt: newLastSyncAt, lastSyncTime: now })

      return true
    } catch (error: any) {
      console.error('同步失败:', error)
      set({ lastError: error?.message || i18n.t('sync.failed') })
      return false
    } finally {
      set({ syncing: false })
    }
  },

  reset: async () => {
    try {
      await syncStorage.removeItem('meta')
    } catch {
      // 忽略清除失败
    }
    set({ lastSyncAt: null, lastSyncTime: null, lastError: null })
  },
}))
