// src/api/endpoints/dashboard.api.ts
import { http } from '../client'
import { API_PATH } from '../paths'

export interface DashboardWordStats {
  total: number
  learned: number
  mastered: number
  new_words_due: number
  review_words_due: number
  distribution: Array<{ label: string; count: number }>
}

export interface DashboardLearningStats {
  total_attempts: number
  correct_count: number
  correct_rate: number
  by_result: Array<{ result: string; count: number }>
}

export interface DashboardDailyTrend {
  date: string
  attempts: number
  correct: number
  correct_rate: number
}

export interface CheckinStats {
  current_streak: number
  max_streak: number
  total_days: number
  last_checkin_date: string | null
}

export interface DashboardResponse {
  word_stats: DashboardWordStats
  learning_stats: DashboardLearningStats
  daily_trend: DashboardDailyTrend[]
  checkin_stats: CheckinStats
}

export const dashboardApi = {
  getDashboard: (trendDays = 7) =>
    http.get<DashboardResponse>(`${API_PATH.learning.dashboard}?trend_days=${trendDays}`),
}
