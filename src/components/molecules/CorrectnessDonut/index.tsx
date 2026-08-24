// src/components/molecules/CorrectnessDonut/index.tsx
// 作答正确率圆环图（纯 CSS conic-gradient）。样式类沿用 Dashboard 视觉。
import React from 'react'
import { useTranslation } from 'react-i18next'

interface CorrectnessDonutProps {
  rate: number
  loading?: boolean
}

export const CorrectnessDonut: React.FC<CorrectnessDonutProps> = ({ rate, loading }) => {
  const { t } = useTranslation()
  const pct = Math.max(0, Math.min(100, Math.round((rate || 0) * 100)))
  const deg = Math.round((rate || 0) * 360)
  return (
    <div className="donut-wrap">
      <div
        className="donut-ring"
        style={{
          background: loading
            ? 'conic-gradient(#e0e0e0 0deg 360deg)'
            : `conic-gradient(#4a90d9 0deg ${deg}deg, #f0f0f0 ${deg}deg 360deg)`,
        }}
        aria-hidden
      >
        <div className="donut-hole">
          <span className="donut-value">{loading ? '—' : `${pct}%`}</span>
          <small>{t('dashboard.accuracy')}</small>
        </div>
      </div>
    </div>
  )
}