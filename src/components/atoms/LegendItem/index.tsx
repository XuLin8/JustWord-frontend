// src/components/atoms/LegendItem/index.tsx
// 图例条目（色点 + 标签 + 计数 + 可选占比条）。样式类沿用 Dashboard 视觉。
import React from 'react'

interface LegendItemProps {
  color: string
  label: string
  count: number
  share?: number
}

export const LegendItem: React.FC<LegendItemProps> = ({ color, label, count, share }) => (
  <div className="legend-item">
    <span className="legend-dot" style={{ background: color }} />
    <span className="legend-label">{label}</span>
    <span className="legend-count">{count}</span>
    {share != null && (
      <div className="legend-bar">
        <i style={{ width: `${share * 100}%`, background: color }} />
      </div>
    )}
  </div>
)