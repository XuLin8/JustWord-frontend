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
  /** 是否已收藏（生词本） */
  favorited?: boolean
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

// 单词本
export interface Wordbook {
  id: number
  name: string
  description: string
  wordCount: number
  createdAt: number
}

// 看板 / 学习统计（对齐后端 DashboardResponse 前端映射版，时间戳化）
export interface DashboardWordStatsView {
  total: number
  learned: number
  mastered: number
  newWordsDue: number
  reviewWordsDue: number
  distribution: Array<{ label: string; count: number }>
}

export interface DashboardLearningStatsView {
  totalAttempts: number
  correctCount: number
  correctRate: number
  byResult: Array<{ result: string; count: number }>
}

export interface DashboardDailyTrendView {
  date: string
  attempts: number
  correct: number
  correctRate: number
}

export interface CheckinStatsView {
  currentStreak: number
  maxStreak: number
  totalDays: number
  lastCheckinDate: string | null
  checkedToday?: boolean
}

export interface AchievementView {
  key: string
  name: string
  description: string
  category: 'words' | 'checkin' | 'answer' | 'wrong' | string
  target: number
  progress: number
  progressRate: number
  unlocked: boolean
  unlockedAt: number | null
}

export interface DashboardData {
  wordStats: DashboardWordStatsView
  learningStats: DashboardLearningStatsView
  dailyTrend: DashboardDailyTrendView[]
  checkinStats: CheckinStatsView
}

// 最近学习记录（精简视图）
export interface RecentActivityItem {
  id: number
  wordId: string
  english: string
  chinese: string
  mode: 'en2zh' | 'zh2en'
  userAnswer: string
  correctAnswer: string
  result: 'correct' | 'partial' | 'wrong' | 'close' | 'typo'
  score: number
  createdAt: number
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
