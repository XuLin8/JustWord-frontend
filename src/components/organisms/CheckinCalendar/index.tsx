// src/components/organisms/CheckinCalendar/index.tsx
// P2 打卡日历：LeetCode 每日一题风格月度打卡日历（头像下拉入口打开）。
// 数据源：checkinStore（后端 checkins 历史 + streak），打开时刷新。
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  RotateCcw,
  X,
} from 'lucide-react'
import { useCheckinStore } from '@/store/checkinStore'
import './CheckinCalendar.css'

interface CheckinCalendarProps {
  open: boolean
  onClose: () => void
}

// 周一起始的中文周几兜底（i18n 取不到时使用）
const WEEKDAYS_FALLBACK = ['一', '二', '三', '四', '五', '六', '日']

function toKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export const CheckinCalendar: React.FC<CheckinCalendarProps> = ({ open, onClose }) => {
  const { t } = useTranslation()
  const { checkins, currentStreak, maxStreak, totalDays, todayChecked, loadCheckins } =
    useCheckinStore()

  // 当前浏览的月份游标
  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return { y: n.getFullYear(), m: n.getMonth() }
  })

  // Esc 关闭 + 打开时刷新打卡数据
  useEffect(() => {
    if (!open) return
    void loadCheckins()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, loadCheckins])

  const checkedSet = useMemo(() => new Set(checkins), [checkins])

  // 今日键（用于今日高亮）
  const now = new Date()
  const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate())

  const { y, m } = cursor
  const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7 // 周一起始
  const daysInMonth = new Date(y, m + 1, 0).getDate()

  const prev = () => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))
  const next = () => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))
  const backToday = () => {
    const n = new Date()
    setCursor({ y: n.getFullYear(), m: n.getMonth() })
  }

  if (!open) return null

  // 生成格子：前置空位 + 当月日期
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const weekdayLabels =
    (t('calendar.weekdays', { returnObjects: true }) as unknown as string[]) ?? WEEKDAYS_FALLBACK

  return (
    <div
      className="checkin-cal"
      role="dialog"
      aria-modal="true"
      aria-label={t('calendar.title')}
      onClick={onClose}
    >
      <div className="checkin-cal-inner" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <header className="checkin-cal-head">
          <div className="checkin-cal-title">
            <CalendarDays size={20} />
            <span>{t('calendar.title')}</span>
          </div>
          <button
            type="button"
            className="checkin-cal-close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </header>
        <span className="checkin-cal-sub">{t('calendar.subtitle')}</span>

        {/* 连续/累计统计条 */}
        <div className="checkin-cal-stats">
          <div className="checkin-cal-stat">
            <span className="checkin-cal-stat-value">
              <Flame size={15} className="checkin-cal-flame" />
              {currentStreak}
            </span>
            <span className="checkin-cal-stat-label">{t('calendar.currentStreak')}</span>
          </div>
          <div className="checkin-cal-stat">
            <span className="checkin-cal-stat-value">{maxStreak}</span>
            <span className="checkin-cal-stat-label">{t('calendar.maxStreak')}</span>
          </div>
          <div className="checkin-cal-stat">
            <span className="checkin-cal-stat-value">{totalDays}</span>
            <span className="checkin-cal-stat-label">{t('calendar.totalDays')}</span>
          </div>
        </div>

        {/* 月度日历 */}
        <div className="checkin-cal-month">
          <div className="checkin-cal-month-head">
            <button
              type="button"
              className="checkin-cal-nav"
              onClick={prev}
              aria-label={t('calendar.prevMonth')}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="checkin-cal-month-title">
              {t('calendar.monthFormat', { year: y, month: m + 1 })}
            </span>
            <button
              type="button"
              className="checkin-cal-nav"
              onClick={next}
              aria-label={t('calendar.nextMonth')}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="checkin-cal-week">
            {weekdayLabels.map((w) => (
              <span key={w} className="checkin-cal-weekday">
                {w}
              </span>
            ))}
          </div>

          <div className="checkin-cal-grid">
            {cells.map((d, i) => {
              if (d === null) return <span key={`e-${i}`} className="checkin-cal-cell is-empty" />
              const key = toKey(y, m, d)
              const checked = checkedSet.has(key)
              const isToday = key === todayKey
              return (
                <span
                  key={key}
                  className={`checkin-cal-cell ${checked ? 'is-checked' : ''} ${isToday ? 'is-today' : ''}`}
                  title={isToday ? t('calendar.today') : checked ? t('calendar.checked') : t('calendar.notChecked')}
                >
                  {d}
                </span>
              )
            })}
          </div>

          {/* 底部：回到本月 + 今日打卡状态 */}
          <div className="checkin-cal-foot">
            <button type="button" className="checkin-cal-back" onClick={backToday}>
              <RotateCcw size={13} />
              {t('calendar.backToday')}
            </button>
            <span className={`checkin-cal-status ${todayChecked ? 'is-done' : ''}`}>
              {todayChecked ? t('calendar.checkedToday') : t('calendar.notCheckedToday')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
