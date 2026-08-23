// src/api/endpoints/checkin.api.ts
import { http } from '../client'
import { API_PATH } from '../paths'

export interface CheckinStatusResponse {
  checked_today: boolean
  current_streak: number
  max_streak: number
  total_days: number
  last_checkin_date: string | null
}

export interface CheckinHistoryResponse {
  days: number
  start: string
  dates: string[]
  count: number
}

export const checkinApi = {
  getStatus: () =>
    http.get<CheckinStatusResponse>(API_PATH.learning.checkinStatus),

  getHistory: (days = 30) =>
    http.get<CheckinHistoryResponse>(`${API_PATH.learning.checkinHistory}?days=${days}`),

  checkin: () =>
    http.post<{ checked_today: boolean; created: boolean; message: string }>(
      API_PATH.learning.checkin,
    ),
}
