// src/api/endpoints/textbooks.api.ts
// 内置词书接口（M2-B）：对接后端真实词库 /api/library
// 后端四级完整词表由 migrations/load_cet4.py 载入，本模块负责响应字段映射与分页换算。
import { http } from '../client'
import { API_PATH } from '../paths'

// ============ 前端类型定义 ============
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

// ============ 后端响应结构（/api/library） ============
interface BackendLibrary {
  id: number
  name: string
  description: string
  words_count: number
}

interface BackendLibraryWord {
  id: number
  english: string
  chinese: string
  phonetic: string | null
  part_of_speech: string | null
  example: string | null
}

interface BackendLibraryWordsResponse {
  id: number
  name: string
  description: string
  total: number
  limit: number
  offset: number
  words: BackendLibraryWord[]
}

interface BackendImportResult {
  library_id: number
  imported: number
  skipped: number
  skipped_english: string[]
}

// ============ 字段映射 ============
/** 词库名 -> 级别标签（后端未单独存 level，按名称推断） */
function deriveLevel(name: string): string {
  if (name.includes('四级')) return 'CET4'
  if (name.includes('六级')) return 'CET6'
  if (name.includes('考研')) return 'KAOYAN'
  return 'OTHER'
}

function mapLibrary(lib: BackendLibrary): Textbook {
  return {
    id: lib.id,
    name: lib.name,
    level: deriveLevel(lib.name),
    word_count: lib.words_count,
    description: lib.description ?? '',
    created_at: '',
  }
}

function mapLibraryWord(w: BackendLibraryWord, level: string): TextbookWord {
  return {
    id: String(w.id),
    word: w.english,
    phonetic: w.phonetic ?? undefined,
    meaning: w.chinese,
    example: w.example ?? undefined,
    level,
  }
}

// ============ API 方法（真实后端） ============
export const textbooksApi = {
  // 词库列表（公开接口，无需登录）
  list: () =>
    http.get<BackendLibrary[]>(API_PATH.textbooks.root, { requiresAuth: false }).then((libs) =>
      libs.map(mapLibrary),
    ),

  // 词条分页拉取（公开接口，q/limit/offset 分页）
  getWords: (id: number, params?: TextbookWordsParams) => {
    const qs = new URLSearchParams()
    if (params?.keyword?.trim()) qs.set('q', params.keyword.trim())
    if (params?.size != null) qs.set('limit', String(params.size))
    const offset = ((params?.page ?? 1) - 1) * (params?.size ?? 20)
    qs.set('offset', String(offset))
    const s = qs.toString()
    return http
      .get<BackendLibraryWordsResponse>(
        s ? `${API_PATH.textbooks.words(id)}?${s}` : API_PATH.textbooks.words(id),
        { requiresAuth: false },
      )
      .then((res) => ({
        items: res.words.map((w) => mapLibraryWord(w, deriveLevel(res.name))),
        total: res.total,
        page: params?.page ?? 1,
        size: params?.size ?? 20,
      }))
  },

  // 订阅词书 -> 导入到个人单词本（真实落库）
  enroll: (id: number) =>
    http
      .post<BackendImportResult>(API_PATH.textbooks.enroll(id))
      .then((res) => ({
        enrolled: res.imported > 0 || res.skipped > 0,
        textbook_id: res.library_id,
        subscribed: res.imported,
      })),

  // 已订阅词库 ID 列表（服务端为准，账号级）
  enrolled: () => http.get<number[]>(API_PATH.textbooks.enrolled),

  // 取消订阅（仅移除订阅关系，保留已导入单词与学习记录）
  unsubscribe: (id: number) =>
    http.delete<{ unsubscribed: boolean; library_id: number }>(API_PATH.textbooks.unsubscribe(id)),
}
