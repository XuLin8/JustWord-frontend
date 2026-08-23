// store/learningStore.ts

import { create } from 'zustand'
import localforage from 'localforage'
import type { LearningRecord, LearningStats } from '../types/learning.types'

const learningStorage = localforage.createInstance({
  name: 'JustWord',
  storeName: 'learning'
})

interface LearningStore {
  records: LearningRecord[]
  stats: LearningStats
  addRecord: (record: LearningRecord) => Promise<void>
  loadRecords: () => Promise<void>
  getStats: () => LearningStats
}

export const useLearningStore = create<LearningStore>((set, get) => ({
  records: [],
  stats: {
    totalWords: 0,
    mastered: 0,
    learning: 0,
    struggling: 0,
    todayLearned: 0,
    streak: 0
  },
  
  loadRecords: async () => {
    const saved = await learningStorage.getItem<LearningRecord[]>('records')
    if (saved) {
      set({ records: saved })
      // 加载后更新统计
      const stats = get().getStats()
      set({ stats })
    }
  },
  
  addRecord: async (record) => {
    const records = [...get().records, record]
    set({ records })
    await learningStorage.setItem('records', records)
    // 添加后更新统计
    const stats = get().getStats()
    set({ stats })
  },
  
  // ✅ 实现 getStats
  getStats: () => {
    const { records } = get()
    const totalWords = records.length
    
    // 计算掌握情况
    let mastered = 0
    let learning = 0
    let struggling = 0
    
    records.forEach(record => {
      const totalAttempts = record.correctCount + record.wrongCount
      if (totalAttempts === 0) {
        struggling++
        return
      }
      const rate = record.correctCount / totalAttempts
      if (rate >= 0.8) mastered++
      else if (rate >= 0.5) learning++
      else struggling++
    })
    
    // 今日学习数量
    const today = new Date().toDateString()
    const todayLearned = records.filter(r => 
      new Date(r.lastLearnedAt).toDateString() === today
    ).length
    
    // 连续学习天数（简化版）
    const streak = calculateStreak(records)
    
    return {
      totalWords,
      mastered,
      learning,
      struggling,
      todayLearned,
      streak
    }
  }
}))

// 辅助函数：计算连续学习天数
function calculateStreak(records: LearningRecord[]): number {
  if (records.length === 0) return 0
  
  const dates = records
    .map(r => new Date(r.lastLearnedAt).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i) // 去重
    .sort()
  
  let streak = 1
  let current = new Date(dates[dates.length - 1])
  current.setDate(current.getDate() - 1)
  
  for (let i = dates.length - 2; i >= 0; i--) {
    const date = new Date(dates[i])
    if (date.toDateString() === current.toDateString()) {
      streak++
      current.setDate(current.getDate() - 1)
    } else {
      break
    }
  }
  
  return streak
}