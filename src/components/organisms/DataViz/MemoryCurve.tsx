// src/components/organisms/DataViz/MemoryCurve.tsx
// P2 EF 记忆曲线（自研 SVG 折线）：横轴快照时间，纵轴易度因子 EF
import React, { useMemo } from 'react'

export interface CurvePoint {
  captured_at: string | null
  ef: number
}

interface MemoryCurveProps {
  items: CurvePoint[]
}

const W = 380
const H = 190
const PAD = { top: 14, right: 14, bottom: 26, left: 34 }
const EF_MIN = 1.3
const EF_MAX = 2.6
const EF_TICKS = [2.6, 2.2, 1.8, 1.4, 1.3]

function fmtTime(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const MemoryCurve: React.FC<MemoryCurveProps> = ({ items }) => {
  const { path, dots, yTicks, baselineY } = useMemo(() => {
    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom
    const clamp = (ef: number) => Math.min(EF_MAX, Math.max(EF_MIN, ef))
    const yOf = (ef: number) => PAD.top + innerH - ((clamp(ef) - EF_MIN) / (EF_MAX - EF_MIN)) * innerH

    const times = items.map((it) => Date.parse(it.captured_at ?? '') || 0)
    const tMin = times.length ? Math.min(...times) : 0
    const tMax = times.length ? Math.max(...times) : 0
    const span = tMax - tMin

    const dots = items.map((it, i) => {
      const x =
        span > 0
          ? PAD.left + (innerW * (times[i] - tMin)) / span
          : PAD.left + (innerW * i) / Math.max(1, items.length - 1)
      const y = yOf(it.ef)
      return { x, y, ef: it.ef, time: it.captured_at ? fmtTime(times[i]) : '' }
    })

    const path = dots.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const yTicks = EF_TICKS.map((v) => ({ v, y: yOf(v) }))
    const baselineY = yOf(2.5) // 初始易度因子基线

    return { path, dots, yTicks, baselineY }
  }, [items])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="viz-curve-svg" role="img" aria-label="EF 记忆曲线">
      {/* 横向网格 + Y 轴刻度 */}
      {yTicks.map((t) => (
        <g key={t.v}>
          <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} className="viz-curve-grid" />
          <text x={PAD.left - 6} y={t.y + 3} textAnchor="end" className="viz-curve-ytick">
            {t.v}
          </text>
        </g>
      ))}
      {/* 初始 EF=2.5 基线 */}
      <line x1={PAD.left} y1={baselineY} x2={W - PAD.right} y2={baselineY} className="viz-curve-baseline" />
      <text x={W - PAD.right} y={baselineY - 4} textAnchor="end" className="viz-curve-baseline-label">
        EF 2.5
      </text>

      {dots.length === 0 ? null : (
        <>
          <path d={path} className="viz-curve-line" />
          {dots.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3.5} className="viz-curve-dot">
              <title>{`${p.time} · EF ${p.ef.toFixed(2)}`}</title>
            </circle>
          ))}
        </>
      )}
    </svg>
  )
}
