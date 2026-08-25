// src/components/organisms/DataViz/AbilityRadar.tsx
// P2 六维能力雷达图（自研 SVG，无第三方图表库）
import React from 'react'

export interface RadarDimension {
  key: string
  label: string
  /** 归一化分值 0-1 */
  value: number
}

interface AbilityRadarProps {
  data: RadarDimension[]
  /** 视图尺寸（px） */
  size?: number
}

const RINGS = 4

export const AbilityRadar: React.FC<AbilityRadarProps> = ({ data, size = 300 }) => {
  const n = data.length
  const cx = size / 2
  const cy = size / 2
  // 顶部留出标签空间（起始角度 -90°）
  const r = size / 2 - 46

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2
  const pt = (i: number, ratio: number) => ({
    x: cx + Math.cos(angle(i)) * r * ratio,
    y: cy + Math.sin(angle(i)) * r * ratio,
  })
  const ringPoints = (ratio: number) =>
    data.map((_, i) => {
      const p = pt(i, ratio)
      return `${p.x},${p.y}`
    }).join(' ')
  const areaPoints = data
    .map((_, i) => {
      const p = pt(i, Math.max(0.03, data[i].value))
      return `${p.x},${p.y}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="viz-radar-svg"
      role="img"
      aria-label="六维能力雷达图"
    >
      {/* 网格圈（25% / 50% / 75% / 100%） */}
      {[1, 2, 3, 4].map((k) => (
        <polygon key={k} points={ringPoints(k / RINGS)} className="viz-radar-ring" />
      ))}
      {/* 轴线 */}
      {data.map((d, i) => {
        const p = pt(i, 1)
        return (
          <line
            key={`ax-${d.key}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            className="viz-radar-axis"
          />
        )
      })}
      {/* 数据多边形 */}
      <polygon points={areaPoints} className="viz-radar-area" />
      {/* 数据点 */}
      {data.map((d, i) => {
        const p = pt(i, Math.max(0.03, d.value))
        return <circle key={`pt-${d.key}`} cx={p.x} cy={p.y} r={3} className="viz-radar-dot" />
      })}
      {/* 维度标签 */}
      {data.map((d, i) => {
        const a = angle(i)
        const lx = cx + Math.cos(a) * (r + 26)
        const ly = cy + Math.sin(a) * (r + 26)
        return (
          <text
            key={`lb-${d.key}`}
            x={lx}
            y={ly}
            className="viz-radar-label"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {d.label}
            <tspan
              x={lx}
              y={ly + 13}
              className="viz-radar-label-val"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {Math.round(d.value * 100)}%
            </tspan>
          </text>
        )
      })}
    </svg>
  )
}
