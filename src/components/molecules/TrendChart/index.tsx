// src/components/molecules/TrendChart/index.tsx
// 近 N 天学习趋势图：作答次数柱状 + 正确率分层 + 图例。依赖 atoms/LegendItem 与 utils/format。
import React from 'react'
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

export const TrendChart: React.FC<TrendChartProps> = ({ data, max }) => (
  <div className="trend-chart">
    <div className="trend-bars">
      {data.map((d) => {
        const h = (d.attempts / max) * 100
        const correctH = (d.correct / Math.max(1, d.attempts)) * 100
        return (
          <div
            key={d.date}
            className="trend-col"
            title={`${formatShortDate(d.date)} 作答 ${d.attempts}，正确率 ${Math.round(d.correctRate * 100)}%`}
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
      <LegendItem color="#27ae60" label="答对" count={data.reduce((s, d) => s + d.correct, 0)} />
      <LegendItem color="#e74c3c" label="答错" count={data.reduce((s, d) => s + (d.attempts - d.correct), 0)} />
    </div>
  </div>
)