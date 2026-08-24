// src/store/wordStore.ts
import { create } from 'zustand'
import type { Word, OperationResult, ImportResult, WordMetadata } from '../types'
import { wordsApi, type WordResponse } from '../api'
import i18n from '@/i18n'

// ============ 辅助函数：API 响应 → 前端 Word ============
function toWord(response: WordResponse): Word {
  return {
    id: response.id,
    english: response.english,
    chinese: response.chinese,
    createdAt: new Date(response.created_at).getTime(),
    updatedAt: response.updated_at ? new Date(response.updated_at).getTime() : undefined,
    meta_data: response.meta_data || {},
  }
}

interface WordStore {
  words: Word[]
  loading: boolean
  searchTerm: string
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
}

export const useWordStore = create<WordStore>((set, get) => ({
  words: [],
  loading: false,
  searchTerm: '',

  // ========== loadWords ==========
  loadWords: async () => {
    set({ loading: true })
    try {
      const data = await wordsApi.getAll()
      const words = data.map(toWord)
      set({ words })
    } catch (error) {
      console.error('加载数据失败:', error)
      set({ words: [] })
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
      return { success: false, message: `单词 "${trimmedEnglish}" 已存在！` }
    }

    try {
      const response = await wordsApi.create({
        english: trimmedEnglish,
        chinese: trimmedChinese,
        meta_data: metadata || {},
      })
      const newWord = toWord(response)

      set((state) => ({
        words: [newWord, ...state.words],
      }))

      return { success: true }
    } catch (error: any) {
      console.error('添加失败:', error)
      return { success: false, message: error.message || '添加失败，请重试' }
    }
  },

  // ========== deleteWord ==========
  deleteWord: async (id: string) => {
    try {
      await wordsApi.delete(id)

      set((state) => ({
        words: state.words.filter(w => w.id !== id),
      }))

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
      return { success: false, message: `单词 "${trimmedEnglish}" 已存在！` }
    }

    try {
      const response = await wordsApi.update(id, {
        english: trimmedEnglish,
        chinese: trimmedChinese,
        meta_data: metadata,
      })
      const updatedWord = toWord(response)

      set((state) => ({
        words: state.words.map(word =>
          word.id === id ? updatedWord : word
        ),
      }))

      return { success: true }
    } catch (error: any) {
      console.error('更新失败:', error)
      return { success: false, message: error.message || '更新失败，请重试' }
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

        set((state) => ({
          words: [newWord, ...state.words],
        }))
        imported++
      } catch (_error) {
        skipped++
      }
    }

    if (imported === 0) {
      return { success: false, message: '没有可导入的单词', imported: 0, skipped }
    }

    return {
      success: true,
      message: `成功导入 ${imported} 个单词，跳过 ${skipped} 个`,
      imported,
      skipped,
    }
  },

  // ========== clearAllWords ==========
  clearAllWords: async () => {
    try {
      await wordsApi.deleteAll()
      set({ words: [] })
      return { success: true }
    } catch (error: any) {
      console.error('清空失败:', error)
      return { success: false, message: error.message || i18n.t('word.clearFailedRetry') }
    }
  },

  // ========== clearWords ==========
  clearWords: () => {
    set({ words: [] })
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
      return { success: true, message: '当前无重复单词', removed: 0 }
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
}))