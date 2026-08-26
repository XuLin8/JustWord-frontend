// src/store/statsStore.ts
import { create } from 'zustand'
import {
  dashboardApi,
  checkinApi,
  achievementsApi,
  learningApi,
  type DashboardResponse,
  type AchievementItem,
  type LearningRecordResponse,
} from '../api'
import type {
  DashboardData,
  AchievementView,
  CheckinStatsView,
  RecentActivityItem,
  DashboardWordStatsView,
  DashboardLearningStatsView,
  DashboardDailyTrendView,
} from '../types'
import { useWordStore } from './wordStore'
import i18n from '@/i18n'

// ===== 后端 snake_case → 前端 camelCase 映射 =====
function mapDashboard(data: DashboardResponse): DashboardData {
  const wordStats: DashboardWordStatsView = {
    total: data.word_stats.total,
    learned: data.word_stats.learned,
    mastered: data.word_stats.mastered,
    newWordsDue: data.word_stats.new_words_due,
    reviewWordsDue: data.word_stats.review_words_due,
    distribution: data.word_stats.distribution ?? [],
  }
  const learningStats: DashboardLearningStatsView = {
    totalAttempts: data.learning_stats.total_attempts,
    correctCount: data.learning_stats.correct_count,
    correctRate: data.learning_stats.correct_rate,
    byResult: data.learning_stats.by_result ?? [],
  }
  const dailyTrend: DashboardDailyTrendView[] = (data.daily_trend ?? []).map((t) => ({
    date: typeof t.date === 'string' ? t.date : String(t.date),
    attempts: t.attempts,
    correct: t.correct,
    correctRate: t.correct_rate,
  }))
  const c = data.checkin_stats as any
  const checkinStats: CheckinStatsView = {
    currentStreak: c?.current_streak ?? 0,
    maxStreak: c?.max_streak ?? 0,
    totalDays: c?.total_days ?? 0,
    lastCheckinDate: c?.last_checkin_date ? String(c.last_checkin_date) : null,
  }
  return { wordStats, learningStats, dailyTrend, checkinStats }
}

function mapAchievements(items: AchievementItem[]): AchievementView[] {
  return items.map((it) => ({
    key: it.key,
    name: it.name,
    description: it.description,
    category: it.category,
    target: it.target,
    progress: it.progress,
    progressRate: it.progress_rate,
    unlocked: it.unlocked,
    unlockedAt: it.unlocked_at ? new Date(it.unlocked_at).getTime() : null,
  }))
}

function toTs(d: string | undefined): number {
  return d ? new Date(d).getTime() : 0
}

interface StatsStore {
  dashboard: DashboardData | null
  checkin: CheckinStatsView & { checkedToday: boolean }
  achievements: AchievementView[]
  unlockedAchievementCount: number
  totalAchievementCount: number
  recentActivity: RecentActivity[]
  loadingDashboard: boolean
  loadingAchievements: boolean
  loadingRecent: boolean
  /** 最近活动是否已加载完成（即使为空也置 true，用于记忆曲线默认选词） */
  loadedRecent: boolean
  loadDashboard: () => Promise<void>
  loadAchievements: () => Promise<void>
  loadRecent: (limit?: number) => Promise<void>
  doCheckin: () => Promise<{ ok: boolean; message?: string; created?: boolean }>
  refreshAll: () => Promise<void>
  clearDashboard: () => void
}

type RecentActivity = RecentActivityItem

export const useStatsStore = create<StatsStore>((set, get) => ({
  dashboard: null,
  checkin: {
    currentStreak: 0,
    maxStreak: 0,
    totalDays: 0,
    lastCheckinDate: null,
    checkedToday: false,
  },
  achievements: [],
  unlockedAchievementCount: 0,
  totalAchievementCount: 0,
  recentActivity: [],
  loadingDashboard: false,
  loadingAchievements: false,
  loadingRecent: false,
  loadedRecent: false,

  loadDashboard: async () => {
    set({ loadingDashboard: true })
    try {
      const [dashRaw, checkinStatus] = await Promise.all([
        dashboardApi.getDashboard(7),
        (async () => {
          try {
            return await checkinApi.getStatus()
          } catch {
            return {
              checked_today: false,
              current_streak: 0,
              max_streak: 0,
              total_days: 0,
              last_checkin_date: null,
            }
          }
        })(),
      ])
      const mapped = mapDashboard(dashRaw)
      set({
        dashboard: mapped,
        checkin: {
          currentStreak: checkinStatus.current_streak,
          maxStreak: checkinStatus.max_streak,
          totalDays: checkinStatus.total_days,
          lastCheckinDate: checkinStatus.last_checkin_date
            ? String(checkinStatus.last_checkin_date)
            : null,
          checkedToday: checkinStatus.checked_today,
        },
      })
    } catch (_err: any) {
      // 没登录或后端离线时，退化为基于本地 wordStore 的骨架统计
      const words = useWordStore.getState().words
      const fallback: DashboardData = {
        wordStats: {
          total: words.length,
          learned: 0,
          mastered: 0,
          newWordsDue: 0,
          reviewWordsDue: 0,
          distribution: [],
        },
        learningStats: { totalAttempts: 0, correctCount: 0, correctRate: 0, byResult: [] },
        dailyTrend: [],
        checkinStats: { currentStreak: 0, maxStreak: 0, totalDays: 0, lastCheckinDate: null },
      }
      set({ dashboard: fallback })
    } finally {
      set({ loadingDashboard: false })
    }
  },

  loadAchievements: async () => {
    set({ loadingAchievements: true })
    try {
      const res = await achievementsApi.getAll()
      set({
        achievements: mapAchievements(res.items),
        unlockedAchievementCount: res.unlocked_count,
        totalAchievementCount: res.total_count,
      })
    } catch {
      set({
        achievements: [],
        unlockedAchievementCount: 0,
        totalAchievementCount: 0,
      })
    } finally {
      set({ loadingAchievements: false })
    }
  },

  loadRecent: async (limit = 8) => {
    set({ loadingRecent: true })
    try {
      const paginated = await learningApi.getRecords({ limit, offset: 0 })
      const words = useWordStore.getState().words
      const wordMap = new Map(words.map((w) => [w.id, w]))
      const items: RecentActivity[] = paginated.items.map(
        (r: LearningRecordResponse): RecentActivity => {
          const w = wordMap.get(r.word_id)
          return {
            id: r.id,
            wordId: r.word_id,
            english: w?.english ?? r.correct_answer,
            chinese: w?.chinese ?? r.correct_answer,
            mode: r.mode as any,
            userAnswer: r.user_answer,
            correctAnswer: r.correct_answer,
            result: r.result as any,
            score: r.score,
            createdAt: toTs(r.created_at),
          }
        },
      )
      set({ recentActivity: items })
    } catch {
      set({ recentActivity: [] })
    } finally {
      set({ loadingRecent: false, loadedRecent: true })
    }
  },

  doCheckin: async () => {
    try {
      const res = await checkinApi.checkin()
      const prev = get().checkin
      set({
        checkin: {
          ...prev,
          checkedToday: true,
          currentStreak: res.created ? prev.currentStreak + 1 : prev.currentStreak,
          totalDays: res.created ? prev.totalDays + 1 : prev.totalDays,
        },
      })
      return { ok: true, message: res.message, created: res.created }
    } catch (e: any) {
      return { ok: false, message: e?.message ?? i18n.t('dashboard.checkinFailed') }
    }
  },

  refreshAll: async () => {
    await Promise.all([get().loadDashboard(), get().loadAchievements(), get().loadRecent()])
  },

  clearDashboard: () =>
    set({
      dashboard: null,
      checkin: {
        currentStreak: 0,
        maxStreak: 0,
        totalDays: 0,
        lastCheckinDate: null,
        checkedToday: false,
      },
      achievements: [],
      unlockedAchievementCount: 0,
      totalAchievementCount: 0,
      recentActivity: [],
      loadedRecent: false,
    }),
}))
