// src/components/molecules/MetricCard/index.tsx
// 大数字指标卡：标题 + 数值 + 说明 + 进度条。依赖 atoms/Spinner 与 atoms/TodoItem 的 tone。
import React from 'react'
import { Spinner } from '../../atoms/Spinner'
import type { TaskTone } from '../../atoms/TodoItem'

export type MetricTone = TaskTone

interface MetricCardProps {
  title: string
  value: string | number
  hint: string
  progress: number
  tone: MetricTone
  loading?: boolean
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, hint, progress, tone, loading }) => (
  <div className={`metric-card metric-${tone}`}>
    {loading && <Spinner size="sm" />}
    <div className="metric-head">
      <span className="metric-title">{title}</span>
    </div>
    <div className="metric-value">{loading ? '—' : value}</div>
    <div className="metric-hint">{hint}</div>
    <div className="metric-progress">
      <i style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }} />
    </div>
  </div>
)