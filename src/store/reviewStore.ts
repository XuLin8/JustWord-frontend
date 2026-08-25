// src/store/reviewStore.ts
// 复习 store（D2）：对接后端 SM-2 调度。
// 取词：GET /reviews/due（新词 + 到期复习词，按到期排序，limit = 当日目标）
// 提交：POST /reviews 应用 SM-2 更新调度，写学习记录，答错自动计错题。
// 替代原先前端本地 learningPlanStore 的"任务卡片 + 手动开始"取词逻辑。
import { create } from 'zustand'
import { learningApi, type DueReviewItem, type ReviewSubmitRequest } from '../api/endpoints/learning.api'
import type { PlanWord } from './learningPlanStore'
import { usePreferenceStore } from './preferenceStore'

export interface ReviewSummary {
  dueCount: number
  newCount: number
  reviewCount: number
  learnedCount: number
}

interface ReviewStore {
  // 待学词（SM-2 调度结果，映射为背诵模式通用的 PlanWord）
  todayWords: PlanWord[]
  totalDue: number
  summary: ReviewSummary | null
  loading: boolean
  submitting: boolean
  /** 拉取待学词队列（limit 默认取偏好中的当日目标值对应的词数上限） */
  loadDue: (opts?: { limit?: number }) => Promise<void>
  /** 提交一次复习作答（SM-2 生效） */
  submit: (req: ReviewSubmitRequest) => Promise<void>
  /** 提交后从当前队列移除该词 */
  removeWord: (wordId: string) => void
  clear: () => void
}

/** 把后端 due 条目映射为背诵模式通用 PlanWord（details 从 meta_data 取） */
function toPlanWord(it: DueReviewItem): PlanWord {
  const meta = it.meta_data ?? {}
  return {
    id: it.id,
    word: it.english,
    phonetic: meta.phonetic as string | undefined,
    meaning: it.chinese,
    example: meta.example as string | undefined,
    source: it.repetitions > 0 ? 'review' : 'new',
    similarWords: meta.similarWords as string[] | undefined,
    synonyms: meta.synonyms as string[] | undefined,
    antonyms: meta.antonyms as string[] | undefined,
  }
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  todayWords: [],
  totalDue: 0,
  summary: null,
  loading: false,
  submitting: false,

  loadDue: async ({ limit } = {}) => {
    const l = limit ?? usePreferenceStore.getState().dailyTarget
    set({ loading: true })
    try {
      const res = await learningApi.getDueReviews({ limit: l })
      set({
        todayWords: res.items.map(toPlanWord),
        totalDue: res.total,
      })
    } catch (e) {
      console.error('加载待复习队列失败:', e)
      set({ todayWords: [], totalDue: 0 })
    } finally {
      set({ loading: false })
    }
  },

  submit: async (req) => {
    set({ submitting: true })
    try {
      await learningApi.submitReview(req)
      set({ todayWords: get().todayWords.filter((w) => w.id !== req.word_id) })
    } catch (e) {
      console.error('提交复习结果失败:', e)
      throw e
    } finally {
      set({ submitting: false })
    }
  },

  removeWord: (wordId) => {
    set({ todayWords: get().todayWords.filter((w) => w.id !== wordId) })
  },

  clear: () => set({ todayWords: [], totalDue: 0, summary: null }),
}))