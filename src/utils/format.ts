// src/utils/format.ts
// 展示层通用：日期格式化 + 学习/分析展示映射。
// 纯函数与展示映射，不含 React 依赖；文案依赖 i18n 实例（非组件环境）。

import i18n from '@/i18n'

/** 学习结果展示色板（答题结果 -> 颜色） */
export const RESULT_COLORS: Record<string, string> = {
  correct: '#27ae60',
  partial: '#f39c12',
  close: '#3498db',
  typo: '#8e44ad',
  wrong: '#e74c3c',
}

/** 学习结果标签（答题结果 -> 文案；未知结果回退为原始值） */
export function getResultLabel(key: string): string {
  const label = i18n.t(`dashboard.result.${key}`)
  return label === `dashboard.result.${key}` ? key : label
}

/** 学习模式标签（未知模式回退为原始值） */
export function getModeLabel(key: string): string {
  const label = i18n.t(`dashboard.mode.${key}`)
  return label === `dashboard.mode.${key}` ? key : label
}

/** 成就分类展示（分类 -> 图标 + 文案） */
export function getCategoryMeta(key: string): { emoji: string; label: string } {
  const emojiMap: Record<string, string> = {
    words: '📚',
    checkin: '📅',
    answer: '✏️',
    wrong: '🧹',
    holiday: '🎉',
  }
  return { emoji: emojiMap[key] ?? '🎖️', label: i18n.t(`dashboard.category.${key}`) }
}

/**
 * 格式化日期为 "YYYY-MM-DD"。
 * 传入空值/非法值返回占位符 "—"。
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 格式化日期为 "M/D" 短格式（用于趋势横轴标签）。 */
export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** 相对时间文案，如 "刚刚" / "5 分钟前" / "3 天前"。 */
export function timeAgo(ts: number): string {
  if (!ts) return ''
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return i18n.t('dashboard.justNow')
  if (m < 60) return i18n.t('dashboard.minutesAgo', { count: m })
  const h = Math.floor(m / 60)
  if (h < 24) return i18n.t('dashboard.hoursAgo', { count: h })
  const d = Math.floor(h / 24)
  if (d < 30) return i18n.t('dashboard.daysAgo', { count: d })
  return formatDate(new Date(ts).toISOString())
}