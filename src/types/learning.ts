// types/learning.ts

export interface Word {
  id: string
  english: string
  chinese: string
  createdAt: number
}

// 学习模式枚举
export const LearnMode = {
  ENGLISH_TO_CHINESE: 'en2zh', // 英译汉
  CHINESE_TO_ENGLISH: 'zh2en', // 汉译英
  REVIEW: 'review' // 回顾
} as const

//类型注解
export type LearnMode = typeof LearnMode[keyof typeof LearnMode]
// 类型: "en2zh" | "zh2en" | "review"

// 答题状态枚举
export const AnswerResult = {
  CORRECT: 'correct', // 完全正确
  PARTIAL: 'partial', // 部分正确
  WRONG: 'wrong', // 错误
  CLOSE: 'close', // 近义词
  TYPO: 'typo' // 拼写错误
} as const

//类型（编译时存在）
export type AnswerResult = typeof AnswerResult[keyof typeof AnswerResult]

// 单道题
export interface Question {
  wordId: string
  english: string
  chinese: string
  userAnswer: string
  result: AnswerResult
  confidence?: number // 信心度 1-5
  timeSpent?: number // 用时（秒）
  similarWords?: SimilarWord[] // 近义词信息
  correctAnswer: string // 正确答案
}

// 近义词
export interface SimilarWord {
  word: string
  meaning: string
  usage: string // 使用场景说明
  difference: string // 与正确答案的区别
}

// 学习轮次
export interface LearningSession {
  id: string
  mode: LearnMode
  wordList: Word[]
  questions: Question[]
  startTime: number
  endTime?: number
  score: {
    correct: number
    partial: number
    wrong: number
    total: number
  }
  // 第二轮记录（关联第一轮的单词）
  round2SessionId?: string
}

// 学习记录（持久化）
export interface LearningRecord {
  wordId: string
  english: string
  chinese: string
  en2zhResult: AnswerResult
  zh2enResult: AnswerResult
  correctCount: number // 正确次数
  wrongCount: number // 错误次数
  lastLearnedAt: number
  mistakes: string[] // 常见错误
  similarWords: SimilarWord[]
}

// 学习统计
export interface LearningStats {
  totalWords: number
  mastered: number // 掌握（正确率 >= 80%）
  learning: number // 学习中（正确率 50-80%）
  struggling: number // 困难（正确率 < 50%）
  todayLearned: number
  streak: number // 连续学习天数
}