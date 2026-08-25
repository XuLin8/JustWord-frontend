// src/components/organisms/DataViz/HeatmapChart.tsx
// P2 GitHub 风格学习热力图（自研 SVG）：横向 53 周 × 纵向 7 天
import React, { useMemo } from 'react'

export interface HeatDay {
  date: string // YYYY-MM-DD
  attempts: number
}

interface HeatmapChartProps {
  items: HeatDay[]
  /** 覆盖周数（默认 53，约一年） */
  weeks?: number
}

const CELL = 11
const GAP = 3

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function level(attempts: number): number {
  if (attempts <= 0) return 0
  if (attempts <= 2) return 1
  if (attempts <= 5) return 2
  if (attempts <= 10) return 3
  return 4
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ items, weeks = 53 }) => {
  const map = useMemo(() => new Map(items.map((i) => [i.date, i.attempts])), [items])

  const { cols, monthLabels } = useMemo(() => {
    const today = new Date()
    const dow = today.getDay() // 0=Sun … 6=Sat
    const built: { key: string; lvl: number; attempts: number }[][] = []
    for (let c = 0; c < weeks; c++) {
      const col: { key: string; lvl: number; attempts: number }[] = []
      for (let r = 0; r < 7; r++) {
        // 该格真实日期：从今天所在周向左回退
        const d = new Date(today)
        d.setDate(today.getDate() - (weeks - 1 - c) * 7 - (dow - r))
        const key = toKey(d)
        const attempts = map.get(key) ?? 0
        col.push({ key, attempts, lvl: level(attempts) })
      }
      built.push(col)
    }

    // 月份标签：每列顶部，取该列首个「月初前 7 天内」的日子
    const labels: { x: number; text: string }[] = []
    const seen = new Set<string>()
    built.forEach((col, ci) => {
      for (const cell of col) {
        const d = new Date(`${cell.key}T00:00:00`)
        if (d.getDate() <= 7) {
          const mKey = `${d.getFullYear()}-${d.getMonth()}`
          if (!seen.has(mKey)) {
            seen.add(mKey)
            labels.push({ x: ci, text: MONTHS[d.getMonth()] })
            break
          }
        }
      }
    })
    return { cols: built, monthLabels: labels }
  }, [map, weeks])

  const width = weeks * (CELL + GAP)
  const height = 7 * (CELL + GAP) + 16

  return (
    <div className="viz-heat-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="viz-heat-svg"
        role="img"
        aria-label="学习热力图"
      >
        {monthLabels.map((m, i) => (
          <text key={i} x={m.x * (CELL + GAP)} y={10} className="viz-heat-month">
            {m.text}
          </text>
        ))}
        {cols.map((col, c) =>
          col.map((cell, r) => (
            <rect
              key={`${c}-${r}`}
              x={c * (CELL + GAP)}
              y={16 + r * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={2}
              className={`viz-heat-cell hv-${cell.lvl}`}
            >
              <title>{`${cell.key} · ${cell.attempts} 次作答`}</title>
            </rect>
          )),
        )}
      </svg>
      <div className="viz-heat-legend">
        <span className="viz-heat-legend-text">少</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <i key={l} className={`viz-heat-cell hv-${l}`} />
        ))}
        <span className="viz-heat-legend-text">多</span>
      </div>
    </div>
  )
}
