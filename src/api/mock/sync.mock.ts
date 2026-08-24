// src/api/mock/sync.mock.ts
// 云端同步服务端模拟（前端先行 · 后端实现后切换 syncApiHttp）
// 语义：lastSyncAt 增量 + 本地优先冲突（push 时以客户端为准覆盖服务端）
import type {
  SyncWordItem,
  SyncRecordItem,
  SyncPushRequest,
  SyncPushResponse,
  SyncPullResponse,
} from '../endpoints/sync.api'

// ============ 模拟服务端存储（内存态） ============
const serverWords = new Map<string, SyncWordItem>()
const serverRecords = new Map<string, SyncRecordItem>()

// 种子数据：模拟云端已有数据（便于演示 pull 增量）
serverWords.set('seed-recall', {
  id: 'seed-recall',
  english: 'recall',
  chinese: 'v. 回想；召回',
  meta_data: { phonetic: { uk: '/rɪˈkɔːl/', us: '/rɪˈkɔːl/' } },
  updated_at: Date.now() - 24 * 3600 * 1000, // 昨天写入，便于增量演示
})

/** 模拟服务端时钟（单调递增的毫秒时间戳） */
let serverClock = Date.now()
function tick(): number {
  serverClock = Math.max(Date.now(), serverClock + 1)
  return serverClock
}

// ============ 词库同步 ============
function pushWords(data: SyncPushRequest<SyncWordItem>): SyncPushResponse {
  const now = tick() // 同一批推送使用同一个服务端时间戳
  let synced = 0
  for (const item of data.changes) {
    if (!item.id) continue
    serverWords.set(item.id, { ...item, updated_at: now }) // 本地优先：以客户端为准；服务端统一盖章
    synced++
  }
  return { synced, server_time: now }
}

function pullWords(lastSyncAt: number | null): SyncPullResponse<SyncWordItem> {
  const since = lastSyncAt ?? 0
  const changes = [...serverWords.values()].filter((it) => it.updated_at > since)
  return { changes, server_time: tick() }
}

// ============ 学习记录同步 ============
function pushRecords(data: SyncPushRequest<SyncRecordItem>): SyncPushResponse {
  const now = tick()
  let synced = 0
  for (const item of data.changes) {
    if (!item.id) continue
    serverRecords.set(item.id, { ...item, updated_at: now })
    synced++
  }
  return { synced, server_time: now }
}

function pullRecords(lastSyncAt: number | null): SyncPullResponse<SyncRecordItem> {
  const since = lastSyncAt ?? 0
  const changes = [...serverRecords.values()].filter((it) => it.updated_at > since)
  return { changes, server_time: tick() }
}

export const syncMock = {
  pushWords,
  pullWords,
  pushRecords,
  pullRecords,
}
