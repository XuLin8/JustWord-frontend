// src/api/endpoints/preferences.api.ts
// 用户偏好接口契约（新增 · 后端实现后续补充，当前走 mock）
// 语义：账户级持久化的偏好设置（如「上次选择的背诵模式」）
import { http } from '../client'
import { API_PATH } from '../paths'
import { preferencesMock } from '../mock/preferences.mock'
import type { RecitationRule } from '../../components/organisms/RecitationModes/RulePicker'

/** 用户偏好（开放扩展字段；前端只消费已知字段） */
export interface UserPreferences {
  /** 上次选择/默认背诵模式 */
  recitation_rule?: RecitationRule
  /** 每日目标（单词数） */
  daily_target?: number
  created_at?: number
  updated_at?: number
}

/** 更新偏好请求体（仅提交变更字段） */
export interface UpdatePreferencesRequest {
  /** 上次选择的背诵模式 */
  recitation_rule?: RecitationRule
  /** 每日目标（单词数） */
  daily_target?: number
}

// ============ API 方法（当前走 mock） ============
export const preferencesApi = {
  get: () => preferencesMock.get(),
  update: (data: UpdatePreferencesRequest) => preferencesMock.update(data),
}

// 兼容命名导出（后端就绪后切换为 http 实现）
export const preferencesApiHttp = {
  get: () => http.get<UserPreferences>(API_PATH.preferences.root),
  update: (data: UpdatePreferencesRequest) =>
    http.put<UserPreferences>(API_PATH.preferences.root, data),
}