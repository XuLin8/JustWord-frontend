// src/components/molecules/TrendChart/index.tsx
// 近 N 天学习趋势图：作答次数柱状 + 正确率分层 + 图例。依赖 atoms/LegendItem 与 utils/format。
import React from 'react'
import { useTranslation } from 'react-i18next'
import { LegendItem } from '../../atoms/LegendItem'
import { formatShortDate } from '../../../utils/format'

export interface TrendDatum {
  date: string
  attempts: number
  correct: number
  correctRate: number
}

interface TrendChartProps {
  data: TrendDatum[]
  max: number
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, max }) => {
  const { t } = useTranslation()
  return (
    <div className="trend-chart">
      <div className="trend-bars">
        {data.map((d) => {
          const h = (d.attempts / max) * 100
          const correctH = (d.correct / Math.max(1, d.attempts)) * 100
          return (
            <div
              key={d.date}
              className="trend-col"
              title={t('dashboard.trendTooltip', {
                date: formatShortDate(d.date),
                attempts: d.attempts,
                rate: Math.round(d.correctRate * 100),
              })}
            >
              <div className="trend-col-stack" style={{ height: `${h}%` }}>
                <i className="trend-col-wrong" style={{ height: `${100 - correctH}%` }} />
                <i className="trend-col-correct" style={{ height: `${correctH}%` }} />
              </div>
              <span className="trend-col-label">{formatShortDate(d.date)}</span>
            </div>
          )
        })}
      </div>
      <div className="trend-legend">
        <LegendItem color="#27ae60" label={t('dashboard.correct')} count={data.reduce((s, d) => s + d.correct, 0)} />
        <LegendItem color="#e74c3c" label={t('dashboard.wrong')} count={data.reduce((s, d) => s + (d.attempts - d.correct), 0)} />
      </div>
    </div>
  )
}