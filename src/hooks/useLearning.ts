// hooks/useLearning.ts

import { useState, useCallback, useMemo } from 'react'
import type { Word, Question, LearningSession, SimilarWord } from '../types/learning.types'
import { LearnMode, AnswerResult } from '../types/learning.types'  

// 近义词数据库（可配置）—— meaning/usage/difference 存 i18n 键，渲染时经 t() 解析
export const SIMILAR_WORDS_DB: Record<string, SimilarWord[]> = {
  'run': [
    {
      word: 'jog',
      meaning: 'learn.similar.run.jog.meaning',
      usage: 'learn.similar.run.jog.usage',
      difference: 'learn.similar.run.jog.difference',
    },
    {
      word: 'sprint',
      meaning: 'learn.similar.run.sprint.meaning',
      usage: 'learn.similar.run.sprint.usage',
      difference: 'learn.similar.run.sprint.difference',
    },
  ],
  'big': [
    {
      word: 'large',
      meaning: 'learn.similar.big.large.meaning',
      usage: 'learn.similar.big.large.usage',
      difference: 'learn.similar.big.large.difference',
    },
    {
      word: 'huge',
      meaning: 'learn.similar.big.huge.meaning',
      usage: 'learn.similar.big.huge.usage',
      difference: 'learn.similar.big.huge.difference',
    },
  ],
  // ... 可扩展
}

export function useLearning(words: Word[]) {
  const [session, setSession] = useState<LearningSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<string[]>([])

  // 计算相似度（Levenshtein 距离）
  const calculateSimilarity = useCallback((str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()
    
    if (s1 === s2) return 1
    
    // Levenshtein 距离
    const matrix: number[][] = []
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j
    }
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i-1] === s2[j-1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i-1][j] + 1,
          matrix[i][j-1] + 1,
          matrix[i-1][j-1] + cost
        )
      }
    }
    const distance = matrix[s1.length][s2.length]
    const maxLen = Math.max(s1.length, s2.length)
    return maxLen === 0 ? 1 : 1 - distance / maxLen
  }, [])

  // 判断英文拼写是否正确
  const checkEnglishSpelling = useCallback((
    userInput: string,
    correct: string
  ): { result: AnswerResult; similarWords?: SimilarWord[] } => {
    const similarity = calculateSimilarity(userInput, correct)
    
    // 完全正确
    if (similarity === 1) {
      return { result: AnswerResult.CORRECT }
    }
    
    // 高度相似（可能是拼写错误）
    if (similarity >= 0.8) {
      return { result: AnswerResult.TYPO }
    }
    
    // 检查是否是近义词
    const similarWords = SIMILAR_WORDS_DB[correct.toLowerCase()] || []
    const isSimilar = similarWords.some(s => 
      calculateSimilarity(userInput, s.word) >= 0.7
    )
    
    if (isSimilar) {
      return { 
        result: AnswerResult.CLOSE,
        similarWords: similarWords.filter(s => 
          calculateSimilarity(userInput, s.word) >= 0.7
        )
      }
    }
    
    return { result: AnswerResult.WRONG }
  }, [calculateSimilarity])

  // 判断中文释义是否正确
  const checkChineseMeaning = useCallback((
    userInput: string,
    correct: string
  ): { result: AnswerResult; partialMatches?: string[] } => {
    const input = userInput.toLowerCase().trim()
    const correctLower = correct.toLowerCase().trim()
    
    // 完全匹配
    if (input === correctLower) {
      return { result: AnswerResult.CORRECT }
    }
    
    // 包含关键信息（部分正确）
    const correctWords = correctLower.split(/[，,、\s]+/).filter(w => w.length > 0)
    const matchedWords = correctWords.filter(w => input.includes(w))
    
    if (matchedWords.length > 0 && matchedWords.length >= correctWords.length * 0.5) {
      return { 
        result: AnswerResult.PARTIAL,
        partialMatches: matchedWords
      }
    }
    
    return { result: AnswerResult.WRONG }
  }, [])

  // 开始学习
  const startLearning = useCallback((mode: LearnMode) => {
    const shuffled = [...words].sort(() => Math.random() - 0.5)
    const wordList = shuffled.slice(0, 20) // 每次学习 20 个
    
    setSession({
      id: Date.now().toString(),
      mode,
      wordList,
      questions: [],
      startTime: Date.now(),
      score: { correct: 0, partial: 0, wrong: 0, total: wordList.length }
    })
    setCurrentQuestionIndex(0)
    setUserAnswers([])
  }, [words])

  // 提交答案
  const submitAnswer = useCallback((answer: string) => {
    if (!session) return null
    
    const currentWord = session.wordList[currentQuestionIndex]
    let result: AnswerResult
    let similarWords: SimilarWord[] = []

    if (session.mode === LearnMode.ENGLISH_TO_CHINESE) {
      // 英译汉：检查中文释义
      const check = checkChineseMeaning(answer, currentWord.chinese)
      result = check.result
    } else {
      // 汉译英：检查英文拼写
      const check = checkEnglishSpelling(answer, currentWord.english)
      result = check.result
      similarWords = check.similarWords || []
    }

    const question: Question = {
      wordId: currentWord.id,
      english: currentWord.english,
      chinese: currentWord.chinese,
      userAnswer: answer,
      result,
      correctAnswer: session.mode === LearnMode.ENGLISH_TO_CHINESE 
        ? currentWord.chinese 
        : currentWord.english,
      similarWords: result === AnswerResult.CLOSE ? similarWords : undefined
    }

    // 更新分数
    const newScore = { ...session.score }
    if (result === AnswerResult.CORRECT) newScore.correct++
    else if (result === AnswerResult.PARTIAL || result === AnswerResult.TYPO || result === AnswerResult.CLOSE) {
      newScore.partial++
    } else {
      newScore.wrong++
    }

    setSession({
      ...session,
      questions: [...session.questions, question],
      score: newScore
    })

    return question
  }, [session, currentQuestionIndex, checkChineseMeaning, checkEnglishSpelling])

  // 下一题
  const nextQuestion = useCallback(() => {
    if (!session) return false
    if (currentQuestionIndex >= session.wordList.length - 1) {
      // 学习结束
      setSession({
        ...session,
        endTime: Date.now()
      })
      return false
    }
    setCurrentQuestionIndex(prev => prev + 1)
    return true
  }, [session, currentQuestionIndex])

  // 获取当前题目
  const currentWord = useMemo(() => {
    if (!session || currentQuestionIndex >= session.wordList.length) return null
    return session.wordList[currentQuestionIndex]
  }, [session, currentQuestionIndex])

  // 获取学习进度
  const progress = useMemo(() => {
    if (!session) return 0
    return (session.questions.length / session.wordList.length) * 100
  }, [session])

  return {
    session,
    currentQuestionIndex,
    currentWord,
    progress,
    userAnswers,
    startLearning,
    submitAnswer,
    nextQuestion,
    isFinished: session?.questions.length === session?.wordList.length,
    score: session?.score
  }
}