// src/types/index.ts
// ============================================
// 统一导出所有类型
// ============================================

// 单词 & 通用操作
export interface Word {
  id: string
  english: string
  chinese: string
  createdAt: number
  updatedAt?: number
  meta_data?: WordMetadata
}

export interface WordMetadata {
  phonetic?: { uk?: string; us?: string }
  wordType?: string
  plural?: string
  example?: { en: string; zh: string }
  difficulty?: number
  tags?: string[]
  synonyms?: string[]
  antonyms?: string[]
  conjugation?: { present: string; past: string; pastParticiple: string }
  phraseConfig?: {
    type: 'single' | 'phrase'
    wordCount: number
    gapCount?: number
    gapPositions?: number[]
    displayFormat?: string
    gaps?: Array<{ position: number; length: number; placeholder: string }>
    fullSentence?: string
  }
  [key: string]: any
}

export interface OperationResult {
  success: boolean
  message?: string
}

export interface ImportResult extends OperationResult {
  imported: number
  skipped: number
}

// 认证相关
export type {
  LoginData,
  RegisterData,
  AuthResult,
  User,
  LoginResponse,
  UserResponse,
} from './auth.types'

// 学习模式相关
export type {
  Word as LearningWord,
  Question,
  SimilarWord,
  LearningSession,
  LearningRecord,
  LearningStats,
} from './learning.types'
export { LearnMode, AnswerResult } from './learning.types'
