// src/pages/DashboardPage/index.tsx
import React, { useEffect, useMemo } from 'react'
import { useStatsStore } from '../../store/statsStore'
import { useWordStore } from '../../store/wordStore'
import { useAuth } from '../../context/AuthContext'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../../components/atoms/Button'
import { Spinner } from '../../components/atoms/Spinner'
import './DashboardPage.css'

const CATEGORY_LABELS: Record<string, { emoji: string; label: string }> = {
  words: { emoji: '📚', label: '词汇' },
  checkin: { emoji: '📅', label: '打卡' },
  answer: { emoji: '✏️', label: '作答' },
  wrong: { emoji: '🧹', label: '错题' },
}

const RESULT_COLORS: Record<string, string> = {
  correct: '#27ae60',
  partial: '#f39c12',
  close: '#3498db',
  typo: '#8e44ad',
  wrong: '#e74c3c',
}

const RESULT_LABELS: Record<string, string> = {
  correct: '完全正确',
  partial: '部分正确',
  close: '近义词',
  typo: '拼写错误',
  wrong: '错误',
}

const MODE_LABELS: Record<string, string> = {
  en2zh: '英译汉',
  zh2en: '汉译英',
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function timeAgo(ts: number): string {
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

export const DashboardPage: React.FC = () => {
  const {
    dashboard,
    checkin,
    achievements,
    unlockedAchievementCount,
    totalAchievementCount,
    recentActivity,
    loadingDashboard,
    loadingAchievements,
    loadingRecent,
    refreshAll,
    doCheckin,
  } = useStatsStore()

  const { words } = useWordStore()
  const { isAuthenticated } = useAuth()
  const { showToast } = useUIStore()

  useEffect(() => {
    if (isAuthenticated) refreshAll()
  }, [isAuthenticated, refreshAll])

  const totalWords = dashboard?.wordStats.total ?? words.length
  const masteredRate = totalWords > 0 ? (dashboard?.wordStats.mastered ?? 0) / totalWords : 0
  const learnedRate = totalWords > 0 ? (dashboard?.wordStats.learned ?? 0) / totalWords : 0
  const correctRate = dashboard?.learningStats.correctRate ?? 0

  const distribution = dashboard?.wordStats.distribution ?? []
  const distTotal = Math.max(1, distribution.reduce((s, d) => s + d.count, 0))

  const byResult = dashboard?.learningStats.byResult ?? []
  const resultTotal = Math.max(1, byResult.reduce((s, r) => s + r.count, 0))

  const dailyTrend = dashboard?.dailyTrend ?? []
  const trendMax = Math.max(1, ...dailyTrend.map((d) => d.attempts))

  const todayAttempts = useMemo(() => {
    if (dailyTrend.length === 0) return 0
    const last = dailyTrend[dailyTrend.length - 1]
    // 后端按 trend_days 范围返回最近 N 天，今天一般是最后一条，若日期对不上保守返回 0
    const today = new Date()
    const d = new Date(last.date)
    const sameDay =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    return sameDay ? last.attempts : 0
  }, [dailyTrend])

  const handleCheckin = async () => {
    const r = await doCheckin()
    if (r.ok) showToast(r.message ?? (r.created ? '打卡成功！' : '今日已打卡'), 'success')
    else showToast(r.message ?? '打卡失败', 'error')
  }

  const skeleton = !isAuthenticated || !dashboard

  return (
    <div className="dashboard-page">
      {/* ========== 顶部欢迎栏 ========== */}
      <section className="dash-hero">
        <div className="dash-hero-main">
          <h2 className="dash-title">
            你好，<span className="dash-title-em">今天也来背单词吧</span>
          </h2>
          <p className="dash-subtitle">
            坚持 1 分钟也比昨天强。你一共收录了 <b>{totalWords}</b> 个单词，
            累计打卡 <b>{checkin.totalDays}</b> 天。
          </p>
          <div className="dash-hero-cta">
            <Button variant="primary" size="md" disabled={checkin.checkedToday} onClick={handleCheckin}>
              {checkin.checkedToday ? '✓ 今日已打卡' : '📅 立即打卡'}
            </Button>
            <Button variant="secondary" size="md" onClick={refreshAll}>
              ↻ 刷新数据
            </Button>
          </div>
        </div>
        <div className="dash-hero-stats">
          <div className="streak-badge">
            <span className="streak-flame" aria-hidden>🔥</span>
            <div className="streak-nums">
              <b>{checkin.currentStreak}</b>
              <small>天 · 当前连续</small>
            </div>
          </div>
          <div className="streak-badge streak-badge-muted">
            <span className="streak-flame">🏆</span>
            <div className="streak-nums">
              <b>{checkin.maxStreak}</b>
              <small>历史最长</small>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 4 格大数字卡片 ========== */}
      <section className="dash-stats-grid">
        <MetricCard
          title="总单词数"
          value={totalWords}
          hint={skeleton ? '单词本已有单词' : `已学 ${dashboard?.wordStats.learned ?? 0} / 掌握 ${dashboard?.wordStats.mastered ?? 0}`}
          progress={learnedRate}
          tone="primary"
          loading={loadingDashboard}
        />
        <MetricCard
          title="掌握度"
          value={Math.round(masteredRate * 100) + '%'}
          hint={`掌握 ${dashboard?.wordStats.mastered ?? 0} 个，占全部单词的比例`}
          progress={masteredRate}
          tone="success"
          loading={loadingDashboard}
        />
        <MetricCard
          title="今日练习"
          value={todayAttempts}
          hint={`今日待学新词 ${dashboard?.wordStats.newWordsDue ?? 0} · 待复习 ${dashboard?.wordStats.reviewWordsDue ?? 0}`}
          progress={0}
          tone="warning"
          loading={loadingDashboard}
        />
        <MetricCard
          title="作答正确率"
          value={Math.round(correctRate * 100) + '%'}
          hint={`累计作答 ${dashboard?.learningStats.totalAttempts ?? 0} 次，答对 ${dashboard?.learningStats.correctCount ?? 0} 次`}
          progress={correctRate}
          tone="violet"
          loading={loadingDashboard}
        />
      </section>

      {/* ========== 中段：分布 + 圆环 + 待复习 ========== */}
      <section className="dash-mid-grid">
        <div className="dash-card">
          <div className="dash-card-head">
            <h3 className="dash-card-title">熟练度分布</h3>
            <span className="dash-card-sub">基于 SRS 复习次数分级</span>
          </div>
          {loadingDashboard ? (
            <Spinner size="sm" />
          ) : distribution.length === 0 ? (
            <EmptyHint text="去学习模式答题，这里会自动生成熟练度分层" />
          ) : (
            <div className="dist-stack">
              {distribution.map((d) => (
                <div
                  key={d.label}
                  className="dist-seg"
                  style={{ width: `${(d.count / distTotal) * 100}%` }}
                  title={`${d.label}：${d.count} 个`}
                >
                  <span className="dist-seg-label">{d.label}</span>
                  <em className="dist-seg-count">{d.count}</em>
                </div>
              ))}
            </div>
          )}
          <div className="dash-row-list">
            {distribution.map((d) => (
              <div key={d.label} className="dash-row-item">
                <span className="dash-dot" aria-hidden />
                <span className="dash-row-label">{d.label}</span>
                <span className="dash-row-count">{d.count}</span>
                <div className="dash-row-bar">
                  <i style={{ width: `${(d.count / distTotal) * 100}%` }} />
                </div>
              </div>
            ))}
            {distribution.length === 0 && (
              <div className="dash-row-item dash-row-item-empty">
                暂无熟练度数据，先开始学习～
              </div>
            )}
          </div>
        </div>

        <div className="dash-card dash-card-center">
          <div className="dash-card-head">
            <h3 className="dash-card-title">作答构成</h3>
            <span className="dash-card-sub">按答题结果聚合</span>
          </div>
          <CorrectnessDonut rate={correctRate} loading={loadingDashboard} />
          <div className="legend-list">
            {byResult.length === 0
              ? ['correct', 'partial', 'close', 'typo', 'wrong'].map((k) => (
                  <LegendItem key={k} color={RESULT_COLORS[k]} label={RESULT_LABELS[k]} count={0} />
                ))
              : byResult
                  .concat()
                  .sort((a, b) => b.count - a.count)
                  .map((r) => (
                    <LegendItem
                      key={r.result}
                      color={RESULT_COLORS[r.result] || '#999'}
                      label={RESULT_LABELS[r.result] || r.result}
                      count={r.count}
                      share={r.count / resultTotal}
                    />
                  ))}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <h3 className="dash-card-title">学习任务</h3>
            <span className="dash-card-sub">今日建议完成</span>
          </div>
          <TodoItem
            tone="primary"
            title={`学习 ${dashboard?.wordStats.newWordsDue ?? 0} 个新词`}
            count={dashboard?.wordStats.newWordsDue ?? 0}
          />
          <TodoItem
            tone="warning"
            title={`复习 ${dashboard?.wordStats.reviewWordsDue ?? 0} 个到期词`}
            count={dashboard?.wordStats.reviewWordsDue ?? 0}
          />
          <TodoItem
            tone="success"
            title="连续打卡保持"
            count={checkin.checkedToday ? 1 : 0}
            suffix={checkin.checkedToday ? '已完成' : '尚未打卡'}
          />
          <TodoItem
            tone="violet"
            title="最近 7 天练习"
            count={dailyTrend.reduce((s, d) => s + d.attempts, 0)}
            suffix={`共 ${dailyTrend.length} 天记录`}
          />
        </div>
      </section>

      {/* ========== 下段：趋势 + 成就 + 最近活动 ========== */}
      <section className="dash-bot-grid">
        <div className="dash-card">
          <div className="dash-card-head">
            <h3 className="dash-card-title">近 7 天学习趋势</h3>
            <span className="dash-card-sub">每日作答次数（柱）与正确率（线）</span>
          </div>
          {loadingDashboard ? (
            <Spinner size="sm" />
          ) : dailyTrend.length === 0 ? (
            <EmptyHint text="暂无趋势数据，开始你的第一次作答吧" />
          ) : (
            <TrendChart data={dailyTrend} max={trendMax} />
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <h3 className="dash-card-title">成就进度</h3>
            <span className="dash-card-sub">
              已解锁 <b>{unlockedAchievementCount}</b> / {totalAchievementCount}
            </span>
          </div>
          {loadingAchievements ? (
            <Spinner size="sm" />
          ) : achievements.length === 0 ? (
            <EmptyHint text="未登录或暂无可显示成就" />
          ) : (
            <div className="achieve-grid">
              {achievements.slice(0, 8).map((a) => {
                const meta = CATEGORY_LABELS[a.category] ?? { emoji: '🎖️', label: a.category }
                return (
                  <div
                    key={a.key}
                    className={`ach-card ${a.unlocked ? 'ach-unlocked' : 'ach-locked'}`}
                    title={a.description}
                  >
                    <div className="ach-head">
                      <span className="ach-emoji">{a.unlocked ? meta.emoji : '🔒'}</span>
                      <div className="ach-meta">
                        <b>{a.name}</b>
                        <small>{meta.label} · {a.description}</small>
                      </div>
                    </div>
                    <div className="ach-progress">
                      <i style={{ width: `${Math.min(100, a.progressRate * 100)}%` }} />
                    </div>
                    <div className="ach-foot">
                      <span>{a.progress} / {a.target}</span>
                      <span>{Math.round(a.progressRate * 100)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <h3 className="dash-card-title">最近学习活动</h3>
            <span className="dash-card-sub">
              {checkin.lastCheckinDate ? `上次打卡 ${formatDate(checkin.lastCheckinDate)}` : '还未打卡'}
            </span>
          </div>
          {loadingRecent ? (
            <Spinner size="sm" />
          ) : recentActivity.length === 0 ? (
            <EmptyHint text="暂无活动，切到学习模式做几道题吧" />
          ) : (
            <ul className="activity-list">
              {recentActivity.map((a) => (
                <li key={a.id} className="activity-item">
                  <span
                    className="activity-dot"
                    style={{ background: RESULT_COLORS[a.result] || '#999' }}
                  />
                  <div className="activity-main">
                    <div className="activity-title">
                      <span className="activity-word">{a.english}</span>
                      <span className="activity-chip">{MODE_LABELS[a.mode] ?? a.mode}</span>
                      <span
                        className="activity-result"
                        style={{ color: RESULT_COLORS[a.result] || '#999' }}
                      >
                        {RESULT_LABELS[a.result] ?? a.result}
                      </span>
                    </div>
                    <div className="activity-sub">
                      答：{a.userAnswer || '（空）'} · 正确：<b>{a.correctAnswer}</b>
                    </div>
                  </div>
                  <span className="activity-time">{timeAgo(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

/* ========== 小组件 ========== */

interface MetricCardProps {
  title: string
  value: string | number
  hint: string
  progress: number
  tone: 'primary' | 'success' | 'warning' | 'violet'
  loading?: boolean
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, hint, progress, tone, loading }) => (
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

interface TodoItemProps {
  title: string
  count: number
  tone: MetricCardProps['tone']
  suffix?: string
}

const TodoItem: React.FC<TodoItemProps> = ({ title, count, tone, suffix }) => (
  <div className={`todo-item todo-${tone}`}>
    <div className="todo-badge">{count}</div>
    <div className="todo-body">
      <span className="todo-title">{title}</span>
      {suffix && <small className="todo-suffix">{suffix}</small>}
    </div>
  </div>
)

interface LegendItemProps {
  color: string
  label: string
  count: number
  share?: number
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label, count, share }) => (
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

interface CorrectnessDonutProps {
  rate: number
  loading?: boolean
}

const CorrectnessDonut: React.FC<CorrectnessDonutProps> = ({ rate, loading }) => {
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
          <small>正确率</small>
        </div>
      </div>
    </div>
  )
}

const EmptyHint: React.FC<{ text: string }> = ({ text }) => (
  <div className="empty-hint">
    <span className="empty-emoji" aria-hidden>🌱</span>
    <p>{text}</p>
  </div>
)

interface TrendChartProps {
  data: { date: string; attempts: number; correct: number; correctRate: number }[]
  max: number
}

const TrendChart: React.FC<TrendChartProps> = ({ data, max }) => (
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
