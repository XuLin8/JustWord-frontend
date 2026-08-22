/**
 * ============================================
 * 文件用途：TypeScript 类型定义文件
 * 主要功能：
 *   - 定义单词数据结构（Word）
 *   - 定义操作结果类型（OperationResult）
 *   - 定义导入结果类型（ImportResult）
 * 依赖关系：
 *   - 无外部依赖（纯 TypeScript 类型定义）
 * 导出内容：
 *   - Word：单词数据接口（id、英文、中文、创建时间）
 *   - OperationResult：操作结果接口（成功状态、可选消息）
 *   - ImportResult：导入结果接口（继承 OperationResult，增加导入/跳过数量）
 * ============================================
 */

// 单词类型
export interface Word {
  id: string
  english: string
  chinese: string
  createdAt: number
  updatedAt?: number
  meta_data?: WordMetadata
}
// ✅ 单词元数据（可扩展）
export interface WordMetadata {
  // 音标
  phonetic?: {
    uk?: string
    us?: string
  }
  // 词性
  wordType?: string
  // 复数形式
  plural?: string
  // 例句
  example?: {
    en: string
    zh: string
  }
  // 难度等级 1-5
  difficulty?: number
  // 标签
  tags?: string[]
  // 近义词
  synonyms?: string[]
  // 反义词
  antonyms?: string[]
  // 动词变位
  conjugation?: {
    present: string
    past: string
    pastParticiple: string
  }
  // ✅ 词组配置（拼写缺省支持）
  phraseConfig?: {
    type: 'single' | 'phrase'
    wordCount: number
    gapCount?: number
    gapPositions?: number[]
    displayFormat?: string
    gaps?: Array<{
      position: number
      length: number
      placeholder: string
    }>
    fullSentence?: string
  }
  // 其他扩展字段
  [key: string]: any
}

// 操作结果类型
export interface OperationResult {
  success: boolean
  message?: string
}

// 导入结果类型
export interface ImportResult extends OperationResult {
  imported: number
  skipped: number
}

// src/types/index.ts

// ============================================
// 统一导出所有类型
// ============================================

// 认证相关
export type {
  LoginData,
  RegisterData,
  AuthResult,
  User,
  LoginResponse,
  UserResponse,
} from './auth.types'

// 单词相关（如果有）
// export type { Word, WordMetadata } from './word.types'

// 通用类型（如果有）
// export type { ApiResponse, PaginatedResponse } from './common.types'