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
}

// 兼容旧命名导出
export type LearningRecord = LearningRecordResponse
export type LearningStats = LearningStatsResponse
