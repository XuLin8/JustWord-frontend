// src/services/api.ts
import { API } from '../config/api'

interface Word {
  id: string
  english: string
  chinese: string
  created_at: string
}

export const wordService = {
  // 获取所有单词
  async getWords(): Promise<Word[]> {
    const response = await fetch(API.words)
    if (!response.ok) throw new Error('获取单词失败')
    const data = await response.json()
    return data.words
  },

  // 添加单词
  async addWord(english: string, chinese: string): Promise<Word> {
    const response = await fetch(API.words, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ english, chinese })
    })
    if (!response.ok) throw new Error('添加失败')
    const data = await response.json()
    return data.word
  },

  // AI 判断
  async judgeTranslation(
    word: string,
    userAnswer: string,
    correctAnswer: string,
    mode: 'en2zh' | 'zh2en'
  ) {
    const response = await fetch(API.ai.judge, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        mode
      })
    })
    if (!response.ok) throw new Error('AI 判断失败')
    return response.json()
  }
}