// src/api/endpoints/sync.api.ts
// 云端同步接口契约（新增 · 后端实现后续补充，当前走 mock）
// 冲突策略：本地优先 + lastSyncAt 增量
import { http } from '../client'
import { API_PATH } from '../paths'
import { syncMock } from '../mock/sync.mock'

// ============ 类型定义 ============
/** 词库同步条目（含软删除标记与更新时间戳） */
export interface SyncWordItem {
  id: string
  english: string
  chinese: string
  meta_data?: Record<string, unknown>
  updated_at: number
  deleted?: boolean
}

/** 学习记录同步条目（与前端 LearningRecord 对齐的按词聚合结构，id = wordId） */
export interface SyncRecordItem {
  id: string
  english: string
  chinese: string
  en2zhResult: string
  zh2enResult: string
  correctCount: number
  wrongCount: number
  lastLearnedAt: number
  mistakes: string[]
  updated_at: number
}

/** 增量推送请求体 */
export interface SyncPushRequest<T> {
  last_sync_at: number | null
  changes: T[]
}

/** 推送响应 */
export interface SyncPushResponse {
  synced: number
  server_time: number
}

/** 增量拉取响应 */
export interface SyncPullResponse<T> {
  changes: T[]
  server_time: number
}

// ============ API 方法（当前走 mock） ============
export const syncApi = {
  // ---- 词库 ----
  pushWords: (data: SyncPushRequest<SyncWordItem>) =>
    syncMock.pushWords(data),
  pullWords: (lastSyncAt: number | null) =>
    syncMock.pullWords(lastSyncAt),

  // ---- 学习记录 ----
  pushRecords: (data: SyncPushRequest<SyncRecordItem>) =>
    syncMock.pushRecords(data),
  pullRecords: (lastSyncAt: number | null) =>
    syncMock.pullRecords(lastSyncAt),
}

// 兼容命名导出（后端就绪后切换为 http 实现）
export const syncApiHttp = {
  pushWords: (data: SyncPushRequest<SyncWordItem>) =>
    http.put<SyncPushResponse>(API_PATH.sync.words, data),
  pullWords: (lastSyncAt: number | null) => {
    const qs = lastSyncAt != null ? `?lastSyncAt=${lastSyncAt}` : ''
    return http.get<SyncPullResponse<SyncWordItem>>(`${API_PATH.sync.words}${qs}`)
  },
  pushRecords: (data: SyncPushRequest<SyncRecordItem>) =>
    http.put<SyncPushResponse>(API_PATH.sync.records, data),
  pullRecords: (lastSyncAt: number | null) => {
    const qs = lastSyncAt != null ? `?lastSyncAt=${lastSyncAt}` : ''
    return http.get<SyncPullResponse<SyncRecordItem>>(`${API_PATH.sync.records}${qs}`)
  },
}
