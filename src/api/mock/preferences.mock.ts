// src/api/mock/preferences.mock.ts
// 用户偏好服务端模拟（前端先行 · 后端实现后切换 preferencesApiHttp）
// 语义：按账户（token）隔离的偏好存储，内存态，刷新清空
import type {
  UserPreferences,
  UpdatePreferencesRequest,
} from '../endpoints/preferences.api'
import type { RecitationRule } from '../../components/organisms/RecitationModes/RulePicker'

const store = new Map<string, UserPreferences>()

function keyOf(): string {
  return localStorage.getItem('justword_token') ?? 'anon'
}

const DEFAULT_RULE: RecitationRule = 'judge'
const DEFAULT_TARGET = 20

function fresh(): UserPreferences {
  return {
    recitation_rule: DEFAULT_RULE,
    daily_target: DEFAULT_TARGET,
    created_at: Date.now(),
    updated_at: Date.now(),
  }
}

// ============ 偏好读写 ============
function get(): UserPreferences {
  const key = keyOf()
  if (!store.has(key)) store.set(key, fresh())
  return store.get(key)!
}

function update(data: UpdatePreferencesRequest): UserPreferences {
  const key = keyOf()
  const current = store.get(key) ?? fresh()
  const next: UserPreferences = {
    ...current,
    ...data,
    updated_at: Date.now(),
  }
  store.set(key, next)
  return next
}

export const preferencesMock = {
  get,
  update,
}