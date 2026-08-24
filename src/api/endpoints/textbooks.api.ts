// src/api/endpoints/textbooks.api.ts
// 内置词书接口契约（新增 · 后端实现后续补充，当前走 mock）
import { http } from '../client'
import { API_PATH } from '../paths'
import { textbooksMock } from '../mock/textbooks.mock'

// ============ 类型定义 ============
export interface Textbook {
  id: number
  name: string
  level: 'CET4' | 'CET6' | 'KAOYAN' | string
  word_count: number
  description: string
  created_at: string
}

export interface TextbookWord {
  id: string
  word: string
  phonetic?: string
  meaning: string
  example?: string
  level: string
  /** 形近词（外观相近、易混） */
  similarWords?: string[]
  /** 近义词 */
  synonyms?: string[]
  /** 反义词 */
  antonyms?: string[]
}

export interface TextbookWordsResponse {
  items: TextbookWord[]
  total: number
  page: number
  size: number
}

export interface EnrollResponse {
  enrolled: boolean
  textbook_id: number
  subscribed: number
}

export interface TextbookWordsParams {
  page?: number
  size?: number
  keyword?: string
}

// ============ API 方法 ============
export const textbooksApi = {
  // 词书列表
  list: () =>
    textbooksMock.list(),

  // 词条分页拉取
  getWords: (id: number, params?: TextbookWordsParams) =>
    textbooksMock.getWords(id, params),

  // 订阅词书到个人学习计划
  enroll: (id: number) =>
    textbooksMock.enroll(id),
}

// 兼容命名导出（后端就绪后切换为 http 实现）
export const textbooksApiHttp = {
  list: () =>
    http.get<Textbook[]>(API_PATH.textbooks.root),

  getWords: (id: number, params?: TextbookWordsParams) => {
    const qs = new URLSearchParams()
    if (params?.page != null) qs.set('page', String(params.page))
    if (params?.size != null) qs.set('size', String(params.size))
    if (params?.keyword) qs.set('keyword', params.keyword)
    const s = qs.toString()
    return http.get<TextbookWordsResponse>(
      s ? `${API_PATH.textbooks.words(id)}?${s}` : API_PATH.textbooks.words(id),
    )
  },

  enroll: (id: number) =>
    http.post<EnrollResponse>(API_PATH.textbooks.enroll(id)),
}
