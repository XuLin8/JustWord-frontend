// src/api/endpoints/learning.api.ts
import { http } from '../client'

// ============ 类型定义 ============
export interface LearningRecord {
  id: number
  word_id: string
  mode: 'en2zh' | 'zh2en'
  user_answer: string
  correct_answer: string
  result: 'correct' | 'partial' | 'wrong' | 'close'
  score: number
  feedback?: string
  created_at: string
}

export interface LearningStats {
  total_attempts: number
  correct_count: number
  correct_rate: number
  word_stats: Array<{
    word_id: string
    total: number
    correct: number
    rate: number
  }>
}

export interface CreateLearningRecordRequest {
  word_id: string
  mode: 'en2zh' | 'zh2en'
  user_answer: string
  correct_answer: string
  result: 'correct' | 'partial' | 'wrong' | 'close'
  score: number
  feedback?: string
}

// ============ API 方法 ============
export const learningApi = {
  // 获取学习记录
  getRecords: (params?: { word_id?: string; mode?: string; limit?: number }) =>
    http.get<LearningRecord[]>('/api/learning/records', {
      // GET 参数通过 URL 传递
    }),

  // 创建学习记录
  createRecord: (data: CreateLearningRecordRequest) =>
    http.post<LearningRecord>('/api/learning/records', data),

  // 获取学习统计
  getStats: (word_id?: string) =>
    http.get<LearningStats>('/api/learning/stats', {
      // 通过 URL 参数传递 word_id
    }),

  // 清空学习记录
  clearRecords: () =>
    http.delete<{ message: string }>('/api/learning/records'),
}