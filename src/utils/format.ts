// src/utils/format.ts
// 展示层通用：日期格式化 + 学习/分析展示常量映射。
// 纯函数与静态数据，不含 React 依赖，可独立单元测试。

/** 学习结果展示色板（答题结果 -> 颜色） */
export const RESULT_COLORS: Record<string, string> = {
  correct: '#27ae60',
  partial: '#f39c12',
  close: '#3498db',
  typo: '#8e44ad',
  wrong: '#e74c3c',
}

/** 学习结果中文标签（答题结果 -> 文案） */
export const RESULT_LABELS: Record<string, string> = {
  correct: '完全正确',
  partial: '部分正确',
  close: '近义词',
  typo: '拼写错误',
  wrong: '错误',
}

/** 学习模式中文标签 */
export const MODE_LABELS: Record<string, string> = {
  en2zh: '英译汉',
  zh2en: '汉译英',
}

/** 成就分类展示（分类 -> 图标 + 文案） */
export const CATEGORY_LABELS: Record<string, { emoji: string; label: string }> = {
  words: { emoji: '📚', label: '词汇' },
  checkin: { emoji: '📅', label: '打卡' },
  answer: { emoji: '✏️', label: '作答' },
  wrong: { emoji: '🧹', label: '错题' },
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
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return formatDate(new Date(ts).toISOString())
}