import { create } from 'zustand'
import localforage from 'localforage'
import type { Word, OperationResult, ImportResult } from '../types'
import { generateId } from '../utils/helpers'

interface WordStore {
  words: Word[]
  loading: boolean
  searchTerm: string
  addWord: (english: string, chinese: string) => Promise<OperationResult>
  deleteWord: (id: string) => Promise<OperationResult>
  updateWord: (id: string, english: string, chinese: string) => Promise<OperationResult>
  loadWords: () => Promise<void>
  setSearchTerm: (term: string) => void
  isWordExist: (english: string, excludeId?: string) => boolean
  // ✅ 导入导出相关方法
  importWords: (words: Omit<Word, 'id' | 'createdAt'>[]) => Promise<ImportResult>
  clearAllWords: () => Promise<OperationResult>
}

const wordStorage = localforage.createInstance({
  name: 'JustWord',
  storeName: 'words',
})

export const useWordStore = create<WordStore>((set, get) => ({
  words: [],
  loading: false,
  searchTerm: '',

  loadWords: async () => {
    set({ loading: true })
    try {
      const saved = await wordStorage.getItem<Word[]>('words')
      if (saved) set({ words: saved })
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      set({ loading: false })
    }
  },

  setSearchTerm: (term: string) => set({ searchTerm: term }),

  isWordExist: (english: string, excludeId?: string) => {
    const { words } = get()
    const trimmed = english.trim().toLowerCase()
    return words.some(word =>
      word.english.toLowerCase() === trimmed && word.id !== excludeId
    )
  },

  addWord: async (english: string, chinese: string) => {
    const trimmedEnglish = english.trim()
    const trimmedChinese = chinese.trim()

    if (get().isWordExist(trimmedEnglish)) {
      return { success: false, message: `单词 "${trimmedEnglish}" 已存在！` }
    }

    const newWord: Word = {
      id: generateId(),
      english: trimmedEnglish,
      chinese: trimmedChinese,
      createdAt: Date.now(),
    }

    const currentWords = get().words
    const updatedWords = [newWord, ...currentWords]
    set({ words: updatedWords })

    try {
      await wordStorage.setItem('words', updatedWords)
      return { success: true }
    } catch (error) {
      set({ words: currentWords })
      return { success: false, message: '保存失败，请重试' }
    }
  },

  deleteWord: async (id: string) => {
    const currentWords = get().words
    const updatedWords = currentWords.filter(w => w.id !== id)
    set({ words: updatedWords })

    try {
      await wordStorage.setItem('words', updatedWords)
      return { success: true }
    } catch (error) {
      set({ words: currentWords })
      return { success: false, message: '删除失败，请重试' }
    }
  },

  updateWord: async (id: string, english: string, chinese: string) => {
    const trimmedEnglish = english.trim()
    const trimmedChinese = chinese.trim()

    if (get().isWordExist(trimmedEnglish, id)) {
      return { success: false, message: `单词 "${trimmedEnglish}" 已存在！` }
    }

    const currentWords = get().words
    const updatedWords = currentWords.map(word =>
      word.id === id ? { ...word, english: trimmedEnglish, chinese: trimmedChinese } : word
    )
    set({ words: updatedWords })

    try {
      await wordStorage.setItem('words', updatedWords)
      return { success: true }
    } catch (error) {
      set({ words: currentWords })
      return { success: false, message: '更新失败，请重试' }
    }
  },

  // ✅ 批量导入
  importWords: async (importData: Omit<Word, 'id' | 'createdAt'>[]) => {
    const currentWords = get().words
    let imported = 0
    let skipped = 0
    const newWords: Word[] = []

    for (const item of importData) {
      const english = item.english.trim()
      const chinese = item.chinese.trim()
      if (!english || !chinese || get().isWordExist(english)) {
        skipped++
        continue
      }
      newWords.push({
        id: generateId() + '_' + imported,
        english,
        chinese,
        createdAt: Date.now(),
      })
      imported++
    }

    if (newWords.length === 0) {
      return { success: false, message: '没有可导入的单词', imported: 0, skipped }
    }

    const updatedWords = [...newWords, ...currentWords]
    set({ words: updatedWords })

    try {
      await wordStorage.setItem('words', updatedWords)
      return { success: true, message: `成功导入 ${imported} 个单词，跳过 ${skipped} 个`, imported, skipped }
    } catch (error) {
      set({ words: currentWords })
      return { success: false, message: '导入失败，请重试', imported: 0, skipped }
    }
  },

  // ✅ 清空所有单词
  clearAllWords: async () => {
    set({ words: [] })
    try {
      await wordStorage.setItem('words', [])
      return { success: true }
    } catch (error) {
      return { success: false, message: '清空失败，请重试' }
    }
  },
}))