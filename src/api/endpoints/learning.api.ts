// src/api/endpoints/learning.api.ts
import { http } from '../client'
import { API_PATH } from '../paths'

export interface LearningRecordResponse {
  id: number
  word_id: string
  user_id: string
  mode: 'en2zh' | 'zh2en'
  user_answer: string
  correct_answer: string
  result: 'correct' | 'partial' | 'wrong' | 'close' | 'typo'
  score: number
  feedback?: string
  created_at: string
}

export interface PaginatedRecords {
  items: LearningRecordResponse[]
  total: number
  limit: number
  offset: number
}

export interface CreateLearningRecordRequest {
  word_id: string
  mode: 'en2zh' | 'zh2en'
  user_answer: string
  correct_answer: string
  result: 'correct' | 'partial' | 'wrong' | 'close' | 'typo'
  score: number
  feedback?: string
}

export interface WordStatItem {
  word_id: string
  total: number
  correct: number
  rate: number
}

export interface LearningStatsResponse {
  total_attempts: number
  correct_count: number
  correct_rate: number
  word_stats: WordStatItem[]
}

export interface WrongWordSummaryResponse {
  open_count: number
  today_wrong_count: number
  weak_due_count: number
}

export interface ReviewSummaryResponse {
  due_count: number
  new_count: number
  review_count: number
  learned_count: number
}

/** GET /reviews/due 待复习队列条目（SM-2 调度排序） */
export interface DueReviewItem {
  id: string
  english: string
  chinese: string
  meta_data?: Record<string, unknown>
  repetitions: number
  interval_days: number
  next_review_at: string | null
}

export interface DueReviewsResponse {
  items: DueReviewItem[]
  total: number
  limit: number
  offset: number
}

/** POST /reviews 提交复习结果 */
export interface ReviewSubmitRequest {
  word_id: string
  result: 'correct' | 'partial' | 'close' | 'wrong'
  mode?: string
  user_answer?: string
  correct_answer?: string
  response_ms?: number
  feedback?: string
}

export interface ReviewSubmitResponse {
  word_id: string
  quality: number
  ef: number
  interval_days: number
  repetitions: number
  next_review_at: string
}

/** GET /progress 今日学习进度（进度条后端化数据源） */
export interface ProgressResponse {
  learning_date: string
  daily_target: number
  today_correct: number
  progress_percent: number
  checked_today: boolean
  remaining: number
}

/** POST /sessions 学习会话时长上报 */
export interface SessionReportRequest {
  duration_seconds: number
  mode?: string
  date?: string
}

/** GET /stats/daily 每日聚合条目（热力图/日历/趋势数据源） */
export interface DailyStatItem {
  date: string
  attempts: number
  correct_count: number
  partial_count: number
  wrong_count: number
  distinct_words: number
  duration_seconds: number
  avg_response_ms: number
  new_learned: number
  review_learned: number
}

export interface DailyStatsResponse {
  days: number
  start: string
  items: DailyStatItem[]
}

/** GET /stats/snapshots 单词 SM-2 调度快照历史（记忆曲线 EF 演变数据源） */
export interface WordSnapshotItem {
  captured_at: string | null
  repetitions: number
  interval_days: number
  ef: number
  next_review_at: string | null
}

export interface WordSnapshotsResponse {
  word_id: string
  items: WordSnapshotItem[]
}

export const learningApi = {
  createRecord: (data: CreateLearningRecordRequest) =>
    http.post<LearningRecordResponse>(API_PATH.learning.records, data),

  getRecords: (params?: {
    limit?: number
    offset?: number
    word_id?: string
    mode?: 'en2zh' | 'zh2en'
  }) => {
    const qs = new URLSearchParams()
    if (params?.limit != null) qs.set('limit', String(params.limit))
    if (params?.offset != null) qs.set('offset', String(params.offset))
    if (params?.word_id) qs.set('word_id', params.word_id)
    if (params?.mode) qs.set('mode', params.mode)
    const s = qs.toString()
    return http.get<PaginatedRecords>(
      s ? `${API_PATH.learning.records}?${s}` : API_PATH.learning.records,
    )
  },

  clearRecords: () =>
    http.delete<{ message: string }>(API_PATH.learning.records),

  getStats: (word_id?: string) => {
    const url = word_id
      ? `${API_PATH.learning.stats}?word_id=${encodeURIComponent(word_id)}`
      : API_PATH.learning.stats
    return http.get<LearningStatsResponse>(url)
  },

  getWrongSummary: () =>
    http.get<WrongWordSummaryResponse>(API_PATH.wrongWords.summary),

  getReviewSummary: () =>
    http.get<ReviewSummaryResponse>(API_PATH.review.summary),

  /** 待复习队列（SM-2 调度：新词 + 到期复习词，按到期排序） */
  getDueReviews: (params?: { wordbook_id?: number; weak_only?: boolean; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    if (params?.wordbook_id != null) qs.set('wordbook_id', String(params.wordbook_id))
    if (params?.weak_only != null) qs.set('weak_only', String(params.weak_only))
    if (params?.limit != null) qs.set('limit', String(params.limit))
    if (params?.offset != null) qs.set('offset', String(params.offset))
    const s = qs.toString()
    return http.get<DueReviewsResponse>(
      s ? `${API_PATH.review.due}?${s}` : API_PATH.review.due,
    )
  },

  /** 提交一次复习结果（应用 SM-2，更新调度） */
  submitReview: (data: ReviewSubmitRequest) =>
    http.post<ReviewSubmitResponse>(API_PATH.review.submit, data),

  /** 今日学习进度（进度条后端化数据源） */
  getProgress: () =>
    http.get<ProgressResponse>(API_PATH.progress),

  /** 学习会话结束上报时长（并入对应学习日聚合） */
  reportSession: (data: SessionReportRequest) =>
    http.post<{ ok: boolean; learning_date: string }>(API_PATH.learning.sessions, data),

  /** 每日聚合统计（懒聚合回填；热力图/日历/趋势数据源） */
  getDailyStats: (days = 365) =>
    http.get<DailyStatsResponse>(`${API_PATH.learning.statsDaily}?days=${days}`),

  /** 单词 SM-2 调度快照历史（记忆曲线 EF 演变数据源） */
  getWordSnapshots: (wordId: string) =>
    http.get<WordSnapshotsResponse>(
      `${API_PATH.learning.statsSnapshots}?word_id=${encodeURIComponent(wordId)}`,
    ),
}

// 兼容旧命名导出
export type LearningRecord = LearningRecordResponse
export type LearningStats = LearningStatsResponse
