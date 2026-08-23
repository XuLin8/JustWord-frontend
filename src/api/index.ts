// src/api/index.ts
export { http, ApiError, AuthError, NetworkError, setupAuthListener } from './client'
export { authApi } from './endpoints/auth.api'
export { wordsApi } from './endpoints/words.api'
export { learningApi } from './endpoints/learning.api'
export { dashboardApi } from './endpoints/dashboard.api'
export { checkinApi } from './endpoints/checkin.api'
export { achievementsApi } from './endpoints/achievements.api'
export { wordbooksApi } from './endpoints/wordbooks.api'
export { API_PATH } from './paths'

export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserResponse,
} from './endpoints/auth.api'

export type {
  WordResponse,
  CreateWordRequest,
  UpdateWordRequest,
  WordMetaData,
} from './endpoints/words.api'

export type {
  LearningRecordResponse,
  LearningStatsResponse,
  PaginatedRecords,
  CreateLearningRecordRequest,
  WordStatItem,
  WrongWordSummaryResponse,
  ReviewSummaryResponse,
  LearningRecord,
  LearningStats,
} from './endpoints/learning.api'

export type {
  DashboardResponse,
  DashboardWordStats,
  DashboardLearningStats,
  DashboardDailyTrend,
  CheckinStats,
} from './endpoints/dashboard.api'

export type {
  CheckinStatusResponse,
  CheckinHistoryResponse,
} from './endpoints/checkin.api'

export type {
  AchievementItem,
  AchievementResponse,
} from './endpoints/achievements.api'

export type {
  WordbookResponse,
  WordbookDetail,
  CreateWordbookRequest,
  UpdateWordbookRequest,
} from './endpoints/wordbooks.api'
