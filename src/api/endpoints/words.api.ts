// src/api/endpoints/words.api.ts
import { http } from '../client'

// ============ 类型定义 ============
export interface WordMetaData {
  phonetic?: {
    uk?: string
    us?: string
  }
  wordType?: string
  difficulty?: number
  tags?: string[]
  [key: string]: any
}

export interface WordResponse {
  id: string
  english: string
  chinese: string
  created_at: string
  updated_at: string
  meta_data: WordMetaData
}

export interface CreateWordRequest {
  english: string
  chinese: string
  meta_data?: WordMetaData
}

export interface UpdateWordRequest {
  english?: string
  chinese?: string
  meta_data?: WordMetaData
}

// ============ API 方法 ============
export const wordsApi = {
  // 获取所有单词
  getAll: () =>
    http.get<WordResponse[]>('/api/words/'),

  // 获取单个单词
  getOne: (id: string) =>
    http.get<WordResponse>(`/api/words/${id}`),

  // 创建单词
  create: (data: CreateWordRequest) =>
    http.post<WordResponse>('/api/words/', data),

  // 更新单词
  update: (id: string, data: UpdateWordRequest) =>
    http.put<WordResponse>(`/api/words/${id}`, data),

  // 删除单词
  delete: (id: string) =>
    http.delete<{ message: string; id: string }>(`/api/words/${id}`),

  // 删除所有单词
  deleteAll: () =>
    http.delete<{ message: string }>('/api/words/'),
}