// src/pages/DashboardPage/index.tsx
// 个人主页（LeetCode 式布局）：左栏个人信息，右栏能力指标 / 雷达 / 勋章 / 单词本占比 / 热力图 / 记忆曲线 / 最近通过 / 折叠区。
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { useStatsStore } from '../../store/statsStore'
import { useWordStore } from '../../store/wordStore'
import { useAuth } from '../../context/AuthContext'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../../components/atoms/Button'
import { Spinner } from '../../components/atoms/Spinner'
import { EmptyHint } from '../../components/atoms/EmptyHint'
import { LegendItem } from '../../components/atoms/LegendItem'
import { TodoItem } from '../../components/atoms/TodoItem'
import { MetricCard } from '../../components/molecules/MetricCard'
import { CorrectnessDonut } from '../../components/molecules/CorrectnessDonut'
import { TrendChart } from '../../components/molecules/TrendChart'
import { AbilityRadar } from '../../components/organisms/DataViz/AbilityRadar'
import { HeatmapChart } from '../../components/organisms/DataViz/HeatmapChart'
import { MemoryCurve } from '../../components/organisms/DataViz/MemoryCurve'
import { WordbookProportion } from '../../components/organisms/DataViz/WordbookProportion'
import { useVizStore } from '../../store/vizStore'
import '../../components/organisms/DataViz/DataViz.css'
import {
  RESULT_COLORS,
  getResultLabel,
  getModeLabel,
  getCategoryMeta,
  formatDate,
  timeAgo,
} from '../../utils/format'
import './DashboardPage.css'

/** 热力图时间范围（周数映射） */
const HEAT_RANGES = [
  { key: '7d',   weeks: 1,  label: 'viz.heatRange7' },
  { key: '30d',  weeks: 5,  label: 'viz.heatRange30' },
  { key: '90d',  weeks: 13, label: 'viz.heatRange90' },
  { key: '365d', weeks: 53, label: 'viz.heatRange365' },
] as const
type HeatRangeKey = (typeof HEAT_RANGES)[number]['key']

// 记忆曲线选词器：独立 memo 组件。父页每次重渲染都会传同一份 curveWords（useMemo 稳定引用）
// 与稳定 onChange，避免把数千个 <option> 全量重建（否则热力图切换范围时会卡顿数秒）。
const CurveSelect = React.memo(function CurveSelect({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; english: string; chinese: string }>
  value: string | null
  onChange: (id: string) => void
}) {
  const { t } = useTranslation()
  return (
    <select value={value ?? ''} onChange={(e) => { const v = e.target.value; if (v) onChange(v) }}>
      <option value="" disabled>
        {t('viz.curveSelectPlaceholder')}
      </option>
      {options.map((w) => (
        <option key={w.id} value={w.id}>
          {w.english} · {w.chinese}
        </option>
      ))}
    </select>
  )
})

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation()
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
    loadedRecent,
    refreshAll,
    doCheckin,
  } = useStatsStore()

  const { words } = useWordStore()
  const { isAuthenticated, user } = useAuth()
  const { showToast } = useUIStore()
  const {
    radar,
    heat,
    loadingDaily,
    snapshots,
    snapshotWordId,
    loadingSnapshots,
    bookStats,
    loadingBookStats,
    loadDaily,
    loadSnapshots,
    loadBookStats,
  } = useVizStore()

  // 热力图时间范围 + 折叠区
  const [heatRangeKey, setHeatRangeKey] = useState<HeatRangeKey>('365d')
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    if (isAuthenticated) refreshAll()
  }, [isAuthenticated, refreshAll])

  // 数据可视化：每日聚合（雷达/热力图）+ 单词本占比
  useEffect(() => {
    if (isAuthenticated) loadDaily()
  }, [isAuthenticated, loadDaily])

  useEffect(() => {
    if (isAuthenticated) loadBookStats()
  }, [isAuthenticated, loadBookStats])

  // 最近学过的 wordId（来自最近活动，保持最近在前且去重）
  const recentWordIds = useMemo(
    () => Array.from(new Set(recentActivity.map((a) => a.wordId))),
    [recentActivity],
  )

  // 记忆曲线选词器候选：最近学过的词排最前（便于默认展示），其余按英文升序
  const curveWords = useMemo(() => {
    const map = new Map(words.map((w) => [w.id, w]))
    const recents = recentWordIds
      .map((id) => map.get(id))
      .filter((w): w is NonNullable<typeof w> => !!w)
    const rest = words
      .filter((w) => !recentWordIds.includes(w.id))
      .sort((a, b) => a.english.localeCompare(b.english))
    return [...recents, ...rest]
  }, [words, recentWordIds])

  // 记忆曲线默认选词：跟随最近学过的词（曲线词首项）。
  // 用 ref 记录「上一次自动选中的默认词」：只要当前选中仍是自动默认（未被用户改过），
  // 就随最近活动/词库加载完成自动纠正到最近词；用户手动切换后停止跟随。
  const lastDefaultWordRef = useRef<string | null>(null)
  useEffect(() => {
    if (!isAuthenticated || !loadedRecent) return
    const first = curveWords[0]
    if (!first) return
    const isDefault = snapshotWordId === null || (lastDefaultWordRef.current !== null && snapshotWordId === lastDefaultWordRef.current)
    if (isDefault) {
      lastDefaultWordRef.current = first.id
      loadSnapshots(first.id)
    } else {
      lastDefaultWordRef.current = null
    }
  }, [isAuthenticated, loadedRecent, curveWords, snapshotWordId, loadSnapshots])

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

  const heatWeeks = HEAT_RANGES.find((r) => r.key === heatRangeKey)?.weeks ?? 53

  // 记忆曲线选词：稳定引用，让 CurveSelect(memo) 在父页重渲染时不必重建
  const handleCurveChange = useCallback(
    (v: string) => {
      if (v) loadSnapshots(v)
    },
    [loadSnapshots],
  )

  const handleCheckin = async () => {
    const r = await doCheckin()
    if (r.ok) showToast(r.message ?? (r.created ? t('dashboard.checkinSuccess') : t('dashboard.checkinToday')), 'success')
    else showToast(r.message ?? t('dashboard.checkinFailed'), 'error')
  }

  const skeleton = !isAuthenticated || !dashboard
  const usernameInitial = user?.username?.trim().slice(0, 1).toUpperCase() ?? 'U'

  return (
    <div className="profile-page">
      <div className="profile-grid">
        {/* ================= 左栏：个人信息 ================= */}
        <aside className="profile-side">
          <div className="profile-avatar" aria-hidden>{usernameInitial}</div>
          <h2 className="profile-name">{user?.username}</h2>
          <p className="profile-email">{user?.email}</p>
          <p className="profile-joined">{t('profile.joined', { date: formatDate(user?.created_at) })}</p>

          <div className="profile-stats">
            <div className="profile-stat">
              <b>🔥 {checkin.currentStreak}</b>
              <span>{t('profile.streakDays')}</span>
            </div>
            <div className="profile-stat">
              <b>{checkin.totalDays}</b>
              <span>{t('profile.totalDays')}</span>
            </div>
            <div className="profile-stat">
              <b>{totalWords}</b>
              <span>{t('profile.totalWords')}</span>
            </div>
          </div>

          <div className="profile-cta">
            <Button variant="primary" size="md" disabled={checkin.checkedToday} onClick={handleCheckin}>
              {checkin.checkedToday ? t('dashboard.checkinDone') : t('dashboard.checkinNow')}
            </Button>
            <Button variant="secondary" size="md" onClick={refreshAll}>
              {t('dashboard.refresh')}
            </Button>
          </div>
        </aside>

        {/* ================= 右栏：主体 ================= */}
        <div className="profile-main">
          {/* 能力指标（4 格大数字卡） */}
          <section className="dash-metrics">
            <MetricCard
              title={t('dashboard.metricTotalTitle')}
              value={totalWords}
              hint={skeleton ? t('dashboard.metricTotalSkeleton') : t('dashboard.metricTotalHint', { learned: dashboard?.wordStats.learned ?? 0, mastered: dashboard?.wordStats.mastered ?? 0 })}
              progress={learnedRate}
              tone="primary"
              loading={loadingDashboard}
            />
            <MetricCard
              title={t('dashboard.metricMasteredTitle')}
              value={Math.round(masteredRate * 100) + '%'}
              hint={t('dashboard.metricMasteredHint', { count: dashboard?.wordStats.mastered ?? 0 })}
              progress={masteredRate}
              tone="success"
              loading={loadingDashboard}
            />
            <MetricCard
              title={t('dashboard.metricTodayTitle')}
              value={todayAttempts}
              hint={t('dashboard.metricTodayHint', { new: dashboard?.wordStats.newWordsDue ?? 0, review: dashboard?.wordStats.reviewWordsDue ?? 0 })}
              progress={0}
              tone="warning"
              loading={loadingDashboard}
            />
            <MetricCard
              title={t('dashboard.metricAccuracyTitle')}
              value={Math.round(correctRate * 100) + '%'}
              hint={t('dashboard.metricAccuracyHint', { total: dashboard?.learningStats.totalAttempts ?? 0, correct: dashboard?.learningStats.correctCount ?? 0 })}
              progress={correctRate}
              tone="violet"
              loading={loadingDashboard}
            />
          </section>

          {/* 雷达 / 勋章 / 单词本占比 */}
          <section className="dash-mid-grid">
            <div className="dash-card">
              <div className="dash-card-head">
                <h3 className="dash-card-title">{t('viz.radarTitle')}</h3>
                <span className="dash-card-sub">{t('viz.radarSub')}</span>
              </div>
              {loadingDaily ? (
                <Spinner size="sm" />
              ) : radar.length === 0 ? (
                <EmptyHint text={t('viz.radarEmpty')} />
              ) : (
                <AbilityRadar data={radar} />
              )}
            </div>

            <div className="dash-card">
              <div className="dash-card-head">
                <h3 className="dash-card-title">{t('dashboard.achieveTitle')}</h3>
                <span className="dash-card-sub">
                  <Trans
                    i18nKey="dashboard.achieveSub"
                    values={{ unlocked: unlockedAchievementCount, total: totalAchievementCount }}
                    components={{ b: <b /> }}
                  />
                </span>
              </div>
              {loadingAchievements ? (
                <Spinner size="sm" />
              ) : achievements.length === 0 ? (
                <EmptyHint text={t('dashboard.achieveEmpty')} />
              ) : (
                <div className="achieve-grid">
                  {achievements.map((a) => {
                    const meta = getCategoryMeta(a.category)
                    const isHolidayEgg = a.unlocked && a.category === 'holiday'
                    return (
                      <div
                        key={a.key}
                        className={`ach-card ${a.unlocked ? 'ach-unlocked' : 'ach-locked'} ${isHolidayEgg ? 'ach-holiday' : ''}`}
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
                <h3 className="dash-card-title">{t('viz.bookStatsTitle')}</h3>
                <span className="dash-card-sub">{t('viz.bookStatsSub')}</span>
              </div>
              {loadingBookStats ? (
                <Spinner size="sm" />
              ) : (
                <WordbookProportion items={bookStats} />
              )}
            </div>
          </section>

          {/* 热力图（支持时间范围筛选） */}
          <section className="dash-card profile-heat-card">
            <div className="dash-card-head">
              <div>
                <h3 className="dash-card-title">{t('viz.heatTitle')}</h3>
                <span className="dash-card-sub">{t('viz.heatSub')}</span>
              </div>
              <div className="heat-range-btns" role="group" aria-label={t('viz.heatRangeLabel')}>
                {HEAT_RANGES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    className={heatRangeKey === r.key ? 'heat-range-btn is-active' : 'heat-range-btn'}
                    onClick={() => setHeatRangeKey(r.key)}
                  >
                    {t(r.label)}
                  </button>
                ))}
              </div>
            </div>
            {loadingDaily ? (
              <Spinner size="sm" />
            ) : heat.length === 0 ? (
              <EmptyHint text={t('viz.heatEmpty')} />
            ) : (
              <HeatmapChart items={heat} weeks={heatWeeks} />
            )}
          </section>

          {/* 记忆曲线 */}
          <section className="dash-card">
            <div className="dash-card-head">
              <div>
                <h3 className="dash-card-title">{t('viz.curveTitle')}</h3>
                <span className="dash-card-sub">{t('viz.curveSub')}</span>
              </div>
            </div>
            <label className="viz-curve-select">
              <span>{t('viz.curveSelectLabel')}</span>
              <CurveSelect
                options={curveWords}
                value={snapshotWordId}
                onChange={handleCurveChange}
              />
            </label>
            {loadingSnapshots ? (
              <Spinner size="sm" />
            ) : snapshots.length === 0 ? (
              <EmptyHint text={t('viz.curveEmpty')} />
            ) : (
              <MemoryCurve items={snapshots} />
            )}
            <p className="viz-curve-hint">{t('viz.curveHint')}</p>
          </section>

          {/* 最近通过 + 近 7 天趋势 */}
          <section className="dash-bot-grid">
            <div className="dash-card">
              <div className="dash-card-head">
                <h3 className="dash-card-title">{t('dashboard.activityTitle')}</h3>
                <span className="dash-card-sub">
                  {checkin.lastCheckinDate
                    ? t('dashboard.lastCheckin', { date: formatDate(checkin.lastCheckinDate) })
                    : t('dashboard.notCheckedInYet')}
                </span>
              </div>
              {loadingRecent ? (
                <Spinner size="sm" />
              ) : recentActivity.length === 0 ? (
                <EmptyHint text={t('dashboard.activityEmpty')} />
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
                          <span className="activity-chip">{getModeLabel(a.mode)}</span>
                          <span
                            className="activity-result"
                            style={{ color: RESULT_COLORS[a.result] || '#999' }}
                          >
                            {getResultLabel(a.result)}
                          </span>
                        </div>
                        <div className="activity-sub">
                          <Trans
                            i18nKey="dashboard.activityAnswer"
                            values={{ answer: a.userAnswer || t('dashboard.emptyAnswer'), correct: a.correctAnswer }}
                            components={{ b: <b /> }}
                          />
                        </div>
                      </div>
                      <span className="activity-time">{timeAgo(a.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="dash-card">
              <div className="dash-card-head">
                <h3 className="dash-card-title">{t('dashboard.trendTitle')}</h3>
                <span className="dash-card-sub">{t('dashboard.trendSub')}</span>
              </div>
              {loadingDashboard ? (
                <Spinner size="sm" />
              ) : dailyTrend.length === 0 ? (
                <EmptyHint text={t('dashboard.trendEmpty')} />
              ) : (
                <TrendChart data={dailyTrend} max={trendMax} />
              )}
            </div>
          </section>

          {/* 折叠区：熟练度分布 / 作答构成 / 学习任务 */}
          <section className="profile-more">
            <button
              type="button"
              className="profile-more-toggle"
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
            >
              <span>{t('viz.moreStats')}</span>
              <i className={showMore ? 'is-open' : ''} aria-hidden />
            </button>
            {showMore && (
              <div className="dash-mid-grid profile-more-grid">
                <div className="dash-card">
                  <div className="dash-card-head">
                    <h3 className="dash-card-title">{t('dashboard.distTitle')}</h3>
                    <span className="dash-card-sub">{t('dashboard.distSub')}</span>
                  </div>
                  {loadingDashboard ? (
                    <Spinner size="sm" />
                  ) : distribution.length === 0 ? (
                    <EmptyHint text={t('dashboard.distEmpty')} />
                  ) : (
                    <div className="dist-stack">
                      {distribution.map((d) => (
                        <div
                          key={d.label}
                          className="dist-seg"
                          style={{ width: `${(d.count / distTotal) * 100}%` }}
                          title={t('dashboard.distSegTitle', { label: d.label, count: d.count })}
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
                        {t('dashboard.distNoData')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="dash-card dash-card-center">
                  <div className="dash-card-head">
                    <h3 className="dash-card-title">{t('dashboard.compositionTitle')}</h3>
                    <span className="dash-card-sub">{t('dashboard.compositionSub')}</span>
                  </div>
                  <CorrectnessDonut rate={correctRate} loading={loadingDashboard} />
                  <div className="legend-list">
                    {byResult.length === 0
                      ? ['correct', 'partial', 'close', 'typo', 'wrong'].map((k) => (
                          <LegendItem key={k} color={RESULT_COLORS[k]} label={getResultLabel(k)} count={0} />
                        ))
                      : byResult
                          .concat()
                          .sort((a, b) => b.count - a.count)
                          .map((r) => (
                            <LegendItem
                              key={r.result}
                              color={RESULT_COLORS[r.result] || '#999'}
                              label={getResultLabel(r.result)}
                              count={r.count}
                              share={r.count / resultTotal}
                            />
                          ))}
                  </div>
                </div>

                <div className="dash-card">
                  <div className="dash-card-head">
                    <h3 className="dash-card-title">{t('dashboard.todoTitle')}</h3>
                    <span className="dash-card-sub">{t('dashboard.todoSub')}</span>
                  </div>
                  <TodoItem
                    tone="primary"
                    title={t('dashboard.todoNewWords', { count: dashboard?.wordStats.newWordsDue ?? 0 })}
                    count={dashboard?.wordStats.newWordsDue ?? 0}
                  />
                  <TodoItem
                    tone="warning"
                    title={t('dashboard.todoReviewWords', { count: dashboard?.wordStats.reviewWordsDue ?? 0 })}
                    count={dashboard?.wordStats.reviewWordsDue ?? 0}
                  />
                  <TodoItem
                    tone="success"
                    title={t('dashboard.todoCheckin')}
                    count={checkin.checkedToday ? 1 : 0}
                    suffix={checkin.checkedToday ? t('dashboard.done') : t('dashboard.notCheckedIn')}
                  />
                  <TodoItem
                    tone="violet"
                    title={t('dashboard.todoWeekPractice')}
                    count={dailyTrend.reduce((s, d) => s + d.attempts, 0)}
                    suffix={t('dashboard.todoWeekDays', { count: dailyTrend.length })}
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
