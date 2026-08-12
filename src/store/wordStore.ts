/**
 * ============================================
 * 文件用途：Zustand 状态管理 Store（单词数据核心）
 * 主要功能：
 *   - 单词 CRUD 操作（增、删、改、查）
 *   - 通过后端 API 与 MySQL 同步
 *   - 批量导入单词（importWords）
 *   - 清空所有单词（clearAllWords）
 *   - 加载状态管理（loading）
 *   - 搜索关键词管理（searchTerm）
 *   - 应用启动时从后端加载数据（loadWords）
 * 依赖关系：
 *   - zustand：状态管理
 *   - Word 类型定义（../types）
 * 导出内容：
 *   - useWordStore：React Hook（包含所有状态和方法）
 * ============================================
 */

import { create } from 'zustand'
import type { Word, OperationResult, ImportResult } from '../types'
import { API } from '../config/api'

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
  importWords: (words: Omit<Word, 'id' | 'createdAt'>[]) => Promise<ImportResult>
  clearAllWords: () => Promise<OperationResult>
}

export const useWordStore = create<WordStore>((set, get) => ({
  words: [],
  loading: false,
  searchTerm: '',

  // ========== 从后端加载数据 ==========
  loadWords: async () => {
    set({ loading: true })
    try {
      const response = await fetch(API.words)
      if (!response.ok) throw new Error('加载失败')
      const data = await response.json()
      // 后端返回的是数组，需要转换成 Word 类型
      const words = data.map((item: any) => ({
        id: item.id,
        english: item.english,
        chinese: item.chinese,
        createdAt: new Date(item.created_at).getTime(),
      }))
      set({ words })
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

  // ========== 添加单词到后端 ==========
  addWord: async (english: string, chinese: string) => {
    const trimmedEnglish = english.trim()
    const trimmedChinese = chinese.trim()

    if (get().isWordExist(trimmedEnglish)) {
      return { success: false, message: `单词 "${trimmedEnglish}" 已存在！` }
    }

    try {
      const response = await fetch(API.words, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          english: trimmedEnglish,
          chinese: trimmedChinese,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, message: error.detail || '添加失败' }
      }

      const newWord = await response.json()
      
      // 更新本地状态
      const word: Word = {
        id: newWord.id,
        english: newWord.english,
        chinese: newWord.chinese,
        createdAt: new Date(newWord.created_at).getTime(),
      }
      
      set((state) => ({
        words: [word, ...state.words],
      }))

      return { success: true }
    } catch (error) {
      console.error('添加失败:', error)
      return { success: false, message: '网络错误，请重试' }
    }
  },

  // ========== 删除单词 ==========
  deleteWord: async (id: string) => {
    try {
      const response = await fetch(`${API.words}/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        return { success: false, message: '删除失败' }
      }

      set((state) => ({
        words: state.words.filter(w => w.id !== id),
      }))

      return { success: true }
    } catch (error) {
      console.error('删除失败:', error)
      return { success: false, message: '网络错误，请重试' }
    }
  },

  // ========== 更新单词 ==========
  updateWord: async (id: string, english: string, chinese: string) => {
    const trimmedEnglish = english.trim()
    const trimmedChinese = chinese.trim()

    if (get().isWordExist(trimmedEnglish, id)) {
      return { success: false, message: `单词 "${trimmedEnglish}" 已存在！` }
    }

    try {
      const response = await fetch(`${API.words}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          english: trimmedEnglish,
          chinese: trimmedChinese,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, message: error.detail || '更新失败' }
      }

      const updatedWord = await response.json()
      
      set((state) => ({
        words: state.words.map(word =>
          word.id === id
            ? {
                ...word,
                english: updatedWord.english,
                chinese: updatedWord.chinese,
              }
            : word
        ),
      }))

      return { success: true }
    } catch (error) {
      console.error('更新失败:', error)
      return { success: false, message: '网络错误，请重试' }
    }
  },

  // ========== 批量导入 ==========
  importWords: async (importData: Omit<Word, 'id' | 'createdAt'>[]) => {
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
        const response = await fetch(API.words, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ english, chinese }),
        })

        if (response.ok) {
          const newWord = await response.json()
          const word: Word = {
            id: newWord.id,
            english: newWord.english,
            chinese: newWord.chinese,
            createdAt: new Date(newWord.created_at).getTime(),
          }
          set((state) => ({
            words: [word, ...state.words],
          }))
          imported++
        } else {
          skipped++
        }
      } catch (error) {
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

  // ========== 清空所有单词 ==========
  clearAllWords: async () => {
    try {
      const response = await fetch(API.words, {
        method: 'DELETE',
      })

      if (!response.ok) {
        return { success: false, message: '清空失败' }
      }

      set({ words: [] })
      return { success: true }
    } catch (error) {
      console.error('清空失败:', error)
      return { success: false, message: '网络错误，请重试' }
    }
  },
}))