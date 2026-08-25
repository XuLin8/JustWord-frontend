// src/store/vizStore.ts
// P2 数据可视化数据源：每日聚合（热力图/雷达图）+ 单词快照（记忆曲线）
import { create } from 'zustand'
import { learningApi, dashboardApi, checkinApi } from '@/api'
import type { DailyStatItem, WordSnapshotItem } from '@/api/endpoints/learning.api'
import type { RadarDimension } from '@/components/organisms/DataViz/AbilityRadar'
import type { HeatDay } from '@/components/organisms/DataViz/HeatmapChart'
import i18n from '@/i18n'

// 六维能力：近 30 天每日聚合 + 词汇掌握度 + 打卡连续天数
export function computeRadar(
  daily: DailyStatItem[],
  masteredRate: number,
  streak: number,
): RadarDimension[] {
  const days = Math.max(1, daily.length)
  const recent = daily.slice(-30)
  const attempts = recent.reduce((s, d) => s + d.attempts, 0)
  const correct = recent.reduce((s, d) => s + d.correct_count, 0)
  const distinct = recent.reduce((s, d) => s + d.distinct_words, 0)
  const newL = recent.reduce((s, d) => s + d.new_learned, 0)
  const revL = recent.reduce((s, d) => s + d.review_learned, 0)
  const resp = recent.filter((d) => d.avg_response_ms > 0)
  const avgResp = resp.length ? resp.reduce((s, d) => s + d.avg_response_ms, 0) / resp.length : 0

  return [
    { key: 'accuracy', label: i18n.t('viz.dimAccuracy'), value: attempts > 0 ? correct / attempts : 0 },
    { key: 'volume', label: i18n.t('viz.dimVolume'), value: Math.min(1, distinct / days / 50) },
    { key: 'focus', label: i18n.t('viz.dimFocus'), value: avgResp > 0 ? Math.min(1, 8000 / avgResp) : 0 },
    { key: 'review', label: i18n.t('viz.dimReview'), value: newL + revL > 0 ? revL / (newL + revL) : 0 },
    { key: 'streak', label: i18n.t('viz.dimStreak'), value: Math.min(1, streak / 14) },
    { key: 'mastery', label: i18n.t('viz.dimMastery'), value: Math.min(1, masteredRate) },
  ]
}

interface VizStore {
  daily: DailyStatItem[]
  heat: HeatDay[]
  radar: RadarDimension[]
  loadingDaily: boolean
  snapshots: WordSnapshotItem[]
  snapshotWordId: string | null
  loadingSnapshots: boolean
  loadDaily: () => Promise<void>
  loadSnapshots: (wordId: string) => Promise<void>
  clear: () => void
}

export const useVizStore = create<VizStore>((set, get) => ({
  daily: [],
  heat: [],
  radar: [],
  loadingDaily: false,
  snapshots: [],
  snapshotWordId: null,
  loadingSnapshots: false,

  loadDaily: async () => {
    if (get().loadingDaily) return
    set({ loadingDaily: true })
    try {
      const [stats, dash, checkin] = await Promise.all([
        learningApi.getDailyStats(365),
        dashboardApi.getDashboard(7),
        checkinApi.getStatus(),
      ])
      const total = Math.max(1, dash.word_stats.total)
      set({
        daily: stats.items,
        heat: stats.items.map((d) => ({ date: d.date, attempts: d.attempts })),
        radar: computeRadar(stats.items, dash.word_stats.mastered / total, checkin.current_streak),
      })
    } catch {
      set({ daily: [], heat: [], radar: [] })
    } finally {
      set({ loadingDaily: false })
    }
  },

  loadSnapshots: async (wordId) => {
    if (!wordId) {
      set({ snapshots: [], snapshotWordId: null })
      return
    }
    set({ loadingSnapshots: true, snapshotWordId: wordId })
    try {
      const res = await learningApi.getWordSnapshots(wordId)
      set({ snapshots: res.items })
    } catch {
      set({ snapshots: [] })
    } finally {
      set({ loadingSnapshots: false })
    }
  },

  clear: () => set({ daily: [], heat: [], radar: [], snapshots: [], snapshotWordId: null }),
}))
