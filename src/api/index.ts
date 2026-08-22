// src/api/index.ts
export { http, ApiError, AuthError, NetworkError, setupAuthListener } from './client'
export { authApi } from './endpoints/auth.api'
export { wordsApi } from './endpoints/words.api'
export { learningApi } from './endpoints/learning.api'
export { API_PATH } from './paths'

// 导出类型
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
  LearningRecord,
  LearningStats,
  CreateLearningRecordRequest,
} from './endpoints/learning.api'