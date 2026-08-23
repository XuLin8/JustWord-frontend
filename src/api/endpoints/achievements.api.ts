// src/api/endpoints/achievements.api.ts
import { http } from '../client'
import { API_PATH } from '../paths'

export interface AchievementItem {
  key: string
  name: string
  description: string
  category: 'words' | 'checkin' | 'answer' | 'wrong'
  target: number
  progress: number
  progress_rate: number
  unlocked: boolean
  unlocked_at: string | null
}

export interface AchievementResponse {
  items: AchievementItem[]
  unlocked_count: number
  total_count: number
}

export const achievementsApi = {
  getAll: () =>
    http.get<AchievementResponse>(API_PATH.achievements),
}
