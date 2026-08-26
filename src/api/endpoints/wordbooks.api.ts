// src/api/endpoints/wordbooks.api.ts
import { http } from '../client'
import { API_PATH } from '../paths'
import type { WordResponse } from './words.api'

export interface WordbookResponse {
  id: number
  name: string
  description: string
  word_count: number
  created_at: string
}

export interface WordbookDetail extends WordbookResponse {
  words: WordResponse[]
}

export interface CreateWordbookRequest {
  name: string
  description?: string
}

export interface UpdateWordbookRequest {
  name?: string
  description?: string
}

/** 单词本学习占比统计（GET /wordbooks/stats） */
export interface WordbookStatsItem {
  id: number
  name: string
  total: number
  learned: number
  mastered: number
  learned_rate: number
  mastered_rate: number
}

export const wordbooksApi = {
  list: () =>
    http.get<WordbookResponse[]>(API_PATH.wordbooks.root),

  /** 单词本学习占比统计（总词数/已学/已掌握） */
  getStats: () =>
    http.get<WordbookStatsItem[]>(API_PATH.wordbooks.stats),

  create: (data: CreateWordbookRequest) =>
    http.post<WordbookResponse>(API_PATH.wordbooks.root, data),

  get: (id: number, q?: string, limit?: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (limit != null) params.set('limit', String(limit))
    const qs = params.toString()
    return http.get<WordbookDetail>(
      qs ? `${API_PATH.wordbooks.detail(id)}?${qs}` : API_PATH.wordbooks.detail(id),
    )
  },

  update: (id: number, data: UpdateWordbookRequest) =>
    http.put<WordbookResponse>(API_PATH.wordbooks.detail(id), data),

  remove: (id: number) =>
    http.delete<{ message: string }>(API_PATH.wordbooks.detail(id)),

  addWord: (bookId: number, wordId: string) =>
    http.post<WordResponse>(API_PATH.wordbooks.word(bookId, wordId)),

  removeWord: (bookId: number, wordId: string) =>
    http.delete<WordResponse>(API_PATH.wordbooks.word(bookId, wordId)),
}
