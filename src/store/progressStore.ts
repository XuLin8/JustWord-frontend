// src/store/progressStore.ts
// 今日学习进度 store（P0 进度条后端化）：数据源为后端 GET /api/progress。
// 所有背诵模式（认识/听音/选择/表格/两轮）共用同一份进度：
//   todayCorrect = 学习日内答对次数（correct + partial）；进度条 = todayCorrect / dailyTarget。
// 每次判定提交成功后本地乐观 +1，并防抖拉取后端校正（刷新/重进/换设备一致）。
import { create } from 'zustand'
import { learningApi } from '../api/endpoints/learning.api'

interface ProgressStore {
  learningDate: string | null
  dailyTarget: number
  todayCorrect: number
  progressPercent: number
  checkedToday: boolean
  remaining: number
  loading: boolean
  /** 拉取后端今日进度 */
  load: () => Promise<void>
  /** 判定成功后本地乐观累计（correct/partial 计 1），并防抖向后端校正 */
  bumpCorrect: (n?: number) => void
  /** 每日目标变更后同步（由偏好设置处调用） */
  syncTarget: () => void
  reset: () => void
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export const useProgressStore = create<ProgressStore>((set, get) => ({
  learningDate: null,
  dailyTarget: 20,
  todayCorrect: 0,
  progressPercent: 0,
  checkedToday: false,
  remaining: 0,
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const p = await learningApi.getProgress()
      set({
        learningDate: p.learning_date,
        dailyTarget: p.daily_target,
        todayCorrect: p.today_correct,
        progressPercent: p.progress_percent,
        checkedToday: p.checked_today,
        remaining: p.remaining,
      })
    } catch (e) {
      console.error('加载今日进度失败:', e)
    } finally {
      set({ loading: false })
    }
  },

  bumpCorrect: (n = 1) => {
    const s = get()
    const todayCorrect = s.todayCorrect + Math.max(0, n)
    const dailyTarget = Math.max(1, s.dailyTarget)
    const progressPercent = Math.min(100, Math.round((todayCorrect / dailyTarget) * 1000) / 10)
    set({
      todayCorrect,
      progressPercent,
      remaining: Math.max(0, dailyTarget - todayCorrect),
    })
    // 防抖向后端校正（进度以后端为准）
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      void get().load()
    }, 800)
  },

  syncTarget: () => {
    void get().load()
  },

  reset: () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    set({
      learningDate: null,
      dailyTarget: 20,
      todayCorrect: 0,
      progressPercent: 0,
      checkedToday: false,
      remaining: 0,
    })
  },
}))
