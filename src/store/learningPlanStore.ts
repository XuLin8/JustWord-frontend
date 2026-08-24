// src/store/learningPlanStore.ts
// 学习计划 store（M2-C）：今日任务 = 词书新词 N（未掌握优先）+ 复习队列 M（最近学习）
// dailyTarget 可配置并持久化（JustWord/learning-plan）
import { create } from 'zustand'
import localforage from 'localforage'
import { textbooksApi, type TextbookWord } from '../api/endpoints/textbooks.api'
import { useTextbookStore } from './textbookStore'
import { useLearningStore } from './learningStore'

const planStorage = localforage.createInstance({
  name: 'JustWord',
  storeName: 'learning-plan',
})

export interface PlanWord {
  id: string
  word: string
  phonetic?: string
  meaning: string
  example?: string
  source: 'new' | 'review'
  /** 形近词 */
  similarWords?: string[]
  /** 近义词 */
  synonyms?: string[]
  /** 反义词 */
  antonyms?: string[]
}

interface LearningPlanStore {
  dailyTarget: number // 当日目标 N，默认 20
  reviewSize: number // 复习队列 M，默认 5
  planDate: string | null // 计划生成日期（YYYY-MM-DD）
  newWords: PlanWord[]
  reviewWords: PlanWord[]
  loading: boolean
  setDailyTarget: (n: number) => Promise<void>
  generatePlan: () => Promise<void>
  /** 今日待学总列表：新词 + 复习 */
  getTodayWords: () => PlanWord[]
}

const DEFAULT_TARGET = 20
const DEFAULT_REVIEW = 5

function todayStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

async function loadPersisted(): Promise<{ dailyTarget: number; planDate: string | null; newWords: PlanWord[]; reviewWords: PlanWord[] }> {
  try {
    const data = await planStorage.getItem<{ dailyTarget: number; planDate: string | null; newWords: PlanWord[]; reviewWords: PlanWord[] }>('plan')
    return data ?? { dailyTarget: DEFAULT_TARGET, planDate: null, newWords: [], reviewWords: [] }
  } catch {
    return { dailyTarget: DEFAULT_TARGET, planDate: null, newWords: [], reviewWords: [] }
  }
}

async function persistPlan(state: { dailyTarget: number; planDate: string | null; newWords: PlanWord[]; reviewWords: PlanWord[] }): Promise<void> {
  try {
    await planStorage.setItem('plan', state)
  } catch (e) {
    console.error('学习计划本地持久化失败:', e)
  }
}

/** 判定单词是否已掌握（正确率 >= 80% 视为掌握） */
function isMastered(correctCount: number, wrongCount: number): boolean {
  const total = correctCount + wrongCount
  if (total === 0) return false
  return correctCount / total >= 0.8
}

export const useLearningPlanStore = create<LearningPlanStore>((set, get) => ({
  dailyTarget: DEFAULT_TARGET,
  reviewSize: DEFAULT_REVIEW,
  planDate: null,
  newWords: [],
  reviewWords: [],
  loading: false,

  setDailyTarget: async (n) => {
    const target = Math.max(1, Math.min(200, Math.round(n)))
    set({ dailyTarget: target })
    await persistPlan({
      dailyTarget: target,
      planDate: get().planDate,
      newWords: get().newWords,
      reviewWords: get().reviewWords,
    })
  },

  generatePlan: async () => {
    set({ loading: true })
    try {
      // 1. 恢复持久化配置
      const persisted = await loadPersisted()
      const dailyTarget = persisted.dailyTarget
      const reviewSize = get().reviewSize

      // 2. 读取已订阅词书词条
      const enrolledIds = useTextbookStore.getState().enrolledIds
      const words: TextbookWord[] = []
      for (const id of enrolledIds) {
        const res = await textbooksApi.getWords(id, { page: 1, size: 500 })
        words.push(...res.items)
      }

      // 3. 读取学习记录，区分已掌握 / 未掌握
      const records = useLearningStore.getState().records
      const masteredSet = new Set(
        records.filter((r) => isMastered(r.correctCount, r.wrongCount)).map((r) => r.wordId),
      )
      const learnedMap = new Map(records.map((r) => [r.wordId, r]))

      // 4. 新词：未掌握优先（排除已掌握），去重
      const seen = new Set<string>()
      const newWords: PlanWord[] = []
      for (const it of words) {
        const key = it.word.toLowerCase()
        if (seen.has(key) || masteredSet.has(it.id)) continue
        seen.add(key)
        newWords.push({
          id: it.id,
          word: it.word,
          phonetic: it.phonetic,
          meaning: it.meaning,
          example: it.example,
          source: 'new',
          similarWords: it.similarWords,
          synonyms: it.synonyms,
          antonyms: it.antonyms,
        })
        if (newWords.length >= dailyTarget) break
      }

      // 5. 复习队列：最近学习记录（lastLearnedAt 降序），补足今日任务
      const reviewWords: PlanWord[] = [...records]
        .sort((a, b) => (b.lastLearnedAt ?? 0) - (a.lastLearnedAt ?? 0))
        .filter((r) => !masteredSet.has(r.wordId) || learnedMap.has(r.wordId))
        .map((r) => ({
          id: r.wordId,
          word: r.english,
          meaning: r.chinese,
          source: 'review' as const,
        }))
        .filter((r) => !seen.has(r.word.toLowerCase()))
        .slice(0, reviewSize)

      const planDate = todayStr()
      set({ dailyTarget, planDate, newWords, reviewWords })
      await persistPlan({ dailyTarget, planDate, newWords, reviewWords })
    } catch (error) {
      console.error('生成学习计划失败:', error)
    } finally {
      set({ loading: false })
    }
  },

  getTodayWords: () => [...get().newWords, ...get().reviewWords],
}))
