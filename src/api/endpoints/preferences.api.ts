// src/api/endpoints/preferences.api.ts
// 用户偏好接口契约：账户级持久化的偏好设置（背诵模式 / 每日目标），读写后端 /api/preferences
import { http } from '../client'
import { API_PATH } from '../paths'
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

// ============ API 方法（对接后端 /api/preferences） ============
export const preferencesApi = {
  get: () => http.get<UserPreferences>(API_PATH.preferences.root),
  update: (data: UpdatePreferencesRequest) =>
    http.put<UserPreferences>(API_PATH.preferences.root, data),
}

// 兼容命名导出（后端已就绪，与实现一致）
export const preferencesApiHttp = preferencesApi