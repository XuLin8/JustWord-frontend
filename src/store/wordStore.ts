// src/store/wordStore.ts
import { create } from 'zustand'
import localforage from 'localforage'
import type { Word, OperationResult, ImportResult, WordMetadata } from '../types'
import { wordsApi, type WordResponse, type SyncWordItem } from '../api'
import i18n from '@/i18n'

// ============ 本地缓存（离线可学习 + 本地优先同步） ============
const wordCache = localforage.createInstance({
  name: 'JustWord',
  storeName: 'word-cache',
})

/** 本地删除墓碑：删除传播到云端所需 */
export interface WordTombstone {
  id: string
  deleted_at: number
}

async function persistCache(words: Word[], tombstones: WordTombstone[]): Promise<void> {
  try {
    await wordCache.setItem('words', words)
    await wordCache.setItem('tombstones', tombstones)
  } catch (e) {
    console.error('词库本地缓存写入失败:', e)
  }
}

async function loadCached(): Promise<{ words: Word[]; tombstones: WordTombstone[] }> {
  try {
    const words = (await wordCache.getItem<Word[]>('words')) ?? []
    const tombstones = (await wordCache.getItem<WordTombstone[]>('tombstones')) ?? []
    return { words, tombstones }
  } catch {
    return { words: [], tombstones: [] }
  }
}

// ============ 辅助函数：API 响应 → 前端 Word ============
function toWord(response: WordResponse): Word {
  return {
    id: response.id,
    english: response.english,
    chinese: response.chinese,
    createdAt: new Date(response.created_at).getTime(),
    updatedAt: response.updated_at ? new Date(response.updated_at).getTime() : Date.now(),
    meta_data: response.meta_data || {},
  }
}

interface WordStore {
  words: Word[]
  loading: boolean
  searchTerm: string
  tombstones: WordTombstone[]
  addWord: (english: string, chinese: string, metadata?: WordMetadata) => Promise<OperationResult>
  deleteWord: (id: string) => Promise<OperationResult>
  updateWord: (id: string, english: string, chinese: string, metadata?: WordMetadata) => Promise<OperationResult>
  loadWords: () => Promise<void>
  refreshWords: () => Promise<void>
  setSearchTerm: (term: string) => void
  isWordExist: (english: string, excludeId?: string) => boolean
  importWords: (words: Omit<Word, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<ImportResult>
  clearAllWords: () => Promise<OperationResult>
  clearWords: () => void
  deduplicate: () => Promise<OperationResult & { removed: number }>
  /** 同步引擎：合并服务端增量（本地优先冲突策略） */
  mergeRemoteWords: (remote: SyncWordItem[]) => Promise<void>
  /** 同步引擎：返回 lastSyncAt 之后的本地增量（含删除墓碑，供 push） */
  getWordsSince: (lastSyncAt: number | null) => SyncWordItem[]
}

export const useWordStore = create<WordStore>((set, get) => ({
  words: [],
  loading: false,
  searchTerm: '',
  tombstones: [],

  // ========== loadWords ==========
  loadWords: async () => {
    set({ loading: true })
    try {
      const data = await wordsApi.getAll()
      const words = data.map(toWord)
      set({ words })
      await persistCache(words, get().tombstones)
    } catch (error) {
      // 后端不可用（离线/未启动）：读取本地缓存兜底，保证离线可学习
      console.error('加载数据失败，回退本地缓存:', error)
      const cached = await loadCached()
      set({ words: cached.words, tombstones: cached.tombstones })
    } finally {
      set({ loading: false })
    }
  },

  // ========== refreshWords ==========
  refreshWords: async () => {
    await get().loadWords()
  },

  // ========== setSearchTerm ==========
  setSearchTerm: (term: string) => set({ searchTerm: term }),

  // ========== isWordExist ==========
  isWordExist: (english: string, excludeId?: string) => {
    const { words } = get()
    const trimmed = english.trim().toLowerCase()
    return words.some(word =>
      word.english.toLowerCase() === trimmed && word.id !== excludeId
    )
  },

  // ========== addWord ==========
  addWord: async (english: string, chinese: string, metadata?: WordMetadata) => {
    const trimmedEnglish = english.trim()
    const trimmedChinese = chinese.trim()

    if (get().isWordExist(trimmedEnglish)) {
      return { success: false, message: i18n.t('word.exists', { word: trimmedEnglish }) }
    }

    try {
      const response = await wordsApi.create({
        english: trimmedEnglish,
        chinese: trimmedChinese,
        meta_data: metadata || {},
      })
      const newWord = toWord(response)
      newWord.updatedAt = Date.now() // 本地变更时间戳，用于增量同步

      set((state) => ({
        words: [newWord, ...state.words],
      }))
      await persistCache(get().words, get().tombstones)

      return { success: true }
    } catch (error: any) {
      console.error('添加失败:', error)
      return { success: false, message: error.message || i18n.t('word.addFailedRetry') }
    }
  },

  // ========== deleteWord ==========
  deleteWord: async (id: string) => {
    try {
      await wordsApi.delete(id)
      const deletedAt = Date.now()

      set((state) => ({
        words: state.words.filter(w => w.id !== id),
        tombstones: [...state.tombstones.filter(t => t.id !== id), { id, deleted_at: deletedAt }],
      }))
      await persistCache(get().words, get().tombstones)

      return { success: true }
    } catch (error: any) {
      console.error('删除失败:', error)
      return { success: false, message: error.message || i18n.t('word.deleteFailedRetry') }
    }
  },

  // ========== updateWord ==========
  updateWord: async (id: string, english: string, chinese: string, metadata?: WordMetadata) => {
    const trimmedEnglish = english.trim()
    const trimmedChinese = chinese.trim()

    if (get().isWordExist(trimmedEnglish, id)) {
      return { success: false, message: i18n.t('word.exists', { word: trimmedEnglish }) }
    }

    try {
      const response = await wordsApi.update(id, {
        english: trimmedEnglish,
        chinese: trimmedChinese,
        meta_data: metadata,
      })
      const updatedWord = toWord(response)
      updatedWord.updatedAt = Date.now() // 本地变更时间戳，用于增量同步

      set((state) => ({
        words: state.words.map(word =>
          word.id === id ? updatedWord : word
        ),
      }))
      await persistCache(get().words, get().tombstones)

      return { success: true }
    } catch (error: any) {
      console.error('更新失败:', error)
      return { success: false, message: error.message || i18n.t('word.updateFailedRetry') }
    }
  },

  // ========== importWords ==========
  importWords: async (importData: Omit<Word, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    let imported = 0
    let skipped = 0

    for (const item of importData) {
      const english = item.english.trim()
      const chinese = item.chinese.trim()
      if (!english || !chinese || get().isWordExist(english)) {
        skipped++
        continue
      }

      try {
        const response = await wordsApi.create({
          english,
          chinese,
          meta_data: item.meta_data || {},
        })
        const newWord = toWord(response)
        newWord.updatedAt = Date.now()

        set((state) => ({
          words: [newWord, ...state.words],
        }))
        imported++
      } catch (_error) {
        skipped++
      }
    }

    await persistCache(get().words, get().tombstones)

    if (imported === 0) {
      return { success: false, message: i18n.t('word.noImportable'), imported: 0, skipped }
    }

    return {
      success: true,
      message: i18n.t('word.importResult', { imported, skipped }),
      imported,
      skipped,
    }
  },

  // ========== clearAllWords ==========
  clearAllWords: async () => {
    try {
      await wordsApi.deleteAll()
      const deletedAt = Date.now()
      const existing = get().words

      set((state) => ({
        words: [],
        tombstones: [
          ...state.tombstones,
          ...existing.map(w => ({ id: w.id, deleted_at: deletedAt })),
        ],
      }))
      await persistCache([], get().tombstones)

      return { success: true }
    } catch (error: any) {
      console.error('清空失败:', error)
      return { success: false, message: error.message || i18n.t('word.clearFailedRetry') }
    }
  },

  // ========== clearWords（内存重置：登出/401 时调用，不产生墓碑） ==========
  clearWords: () => {
    set({ words: [] })
    // 同步清空本地缓存，避免下次离线登录读到上一个账号的数据
    void wordCache.removeItem('words')
  },

  // ========== deduplicate ==========
  deduplicate: async () => {
    const { words } = get()
    const groups = new Map<string, Word[]>()
    for (const w of words) {
      const k = w.english.trim().toLowerCase()
      const list = groups.get(k) ?? []
      list.push(w)
      groups.set(k, list)
    }

    const toRemove: Word[] = []
    for (const list of groups.values()) {
      if (list.length <= 1) continue
      // 保留 createdAt 最新（或最大 id）的一条，其余删
      const sorted = [...list].sort((a, b) => {
        const byTime = (b.createdAt ?? 0) - (a.createdAt ?? 0)
        if (byTime !== 0) return byTime
        return b.id.localeCompare(a.id)
      })
      toRemove.push(...sorted.slice(1))
    }

    if (toRemove.length === 0) {
      return { success: true, message: i18n.t('word.noDuplicate'), removed: 0 }
    }

    let removed = 0
    let failed = 0
    for (const w of toRemove) {
      try {
        await wordsApi.delete(w.id)
        removed++
      } catch {
        failed++
      }
    }
    if (removed > 0) {
      set((state) => ({ words: state.words.filter((w) => !toRemove.find((r) => r.id === w.id)) }))
      await persistCache(get().words, get().tombstones)
    }

    if (failed > 0) {
      return {
        success: removed > 0,
        message: i18n.t('word.dedupPartial', { removed, failed }),
        removed,
      }
    }
    return {
      success: true,
      message: i18n.t('word.dedupDone', { removed }),
      removed,
    }
  },

  // ========== 同步：合并服务端增量（本地优先冲突） ==========
  mergeRemoteWords: async (remote) => {
    if (!remote || remote.length === 0) return

    set((state) => {
      const localMap = new Map(state.words.map(w => [w.id, w]))
      const tombIds = new Set(state.tombstones.map(t => t.id))
      const next = [...state.words]
      let changed = false

      for (const item of remote) {
        if (!item.id) continue

        // 远端删除标记 → 本地移除（若存在）
        if (item.deleted) {
          const idx = next.findIndex(w => w.id === item.id)
          if (idx >= 0) {
            next.splice(idx, 1)
            changed = true
          }
          continue
        }

        // 本地墓碑 → 本地删除优先，忽略远端恢复
        if (tombIds.has(item.id)) continue

        // 本地已存在 → 本地优先，保留本地版本
        if (localMap.has(item.id)) continue

        // 新增远端词条
        next.push({
          id: item.id,
          english: item.english,
          chinese: item.chinese,
          createdAt: item.updated_at,
          updatedAt: item.updated_at,
          meta_data: item.meta_data as WordMetadata | undefined,
        })
        changed = true
      }

      return changed ? { words: next } : state
    })

    await persistCache(get().words, get().tombstones)
  },

  // ========== 同步：lastSyncAt 之后的本地产出（含删除墓碑） ==========
  getWordsSince: (lastSyncAt) => {
    const since = lastSyncAt ?? 0
    const { words, tombstones } = get()
    const changed: SyncWordItem[] = []

    for (const w of words) {
      const updatedAt = w.updatedAt ?? w.createdAt ?? 0
      if (updatedAt > since) {
        changed.push({
          id: w.id,
          english: w.english,
          chinese: w.chinese,
          meta_data: w.meta_data,
          updated_at: updatedAt,
        })
      }
    }

    for (const t of tombstones) {
      if (t.deleted_at > since) {
        changed.push({ id: t.id, english: '', chinese: '', updated_at: t.deleted_at, deleted: true })
      }
    }

    return changed
  },
}))
