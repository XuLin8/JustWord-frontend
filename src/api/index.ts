// src/api/index.ts
export { http, ApiError, AuthError, NetworkError, setupAuthListener } from './client'
export { authApi } from './endpoints/auth.api'
export { wordsApi } from './endpoints/words.api'
export { learningApi } from './endpoints/learning.api'
export { dashboardApi } from './endpoints/dashboard.api'
export { checkinApi } from './endpoints/checkin.api'
export { achievementsApi } from './endpoints/achievements.api'
export { wordbooksApi } from './endpoints/wordbooks.api'
export { textbooksApi } from './endpoints/textbooks.api'
export { syncApi } from './endpoints/sync.api'
export { preferencesApi, preferencesApiHttp } from './endpoints/preferences.api'
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
  DueReviewItem,
  DueReviewsResponse,
  ReviewSubmitRequest,
  ReviewSubmitResponse,
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

export type {
  Textbook,
  TextbookWord,
  TextbookWordsResponse,
  TextbookWordsParams,
  EnrollResponse,
} from './endpoints/textbooks.api'

export type {
  SyncWordItem,
  SyncRecordItem,
  SyncPushRequest,
  SyncPushResponse,
  SyncPullResponse,
} from './endpoints/sync.api'

export type {
  UserPreferences,
  UpdatePreferencesRequest,
} from './endpoints/preferences.api'
