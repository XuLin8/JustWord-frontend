// src/pages/DashboardPage/index.tsx
// 仪表盘页面：组装统计概览、趋势、成就与最近活动。业务展示块已拆入 molecules/atoms。
import React, { useEffect, useMemo } from 'react'
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
import {
  RESULT_COLORS,
  getResultLabel,
  getModeLabel,
  getCategoryMeta,
  formatDate,
  timeAgo,
} from '../../utils/format'
import './DashboardPage.css'

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
    if (r.ok) showToast(r.message ?? (r.created ? t('dashboard.checkinSuccess') : t('dashboard.checkinToday')), 'success')
    else showToast(r.message ?? t('dashboard.checkinFailed'), 'error')
  }

  const skeleton = !isAuthenticated || !dashboard

  return (
    <div className="dashboard-page">
      {/* ========== 顶部欢迎栏 ========== */}
      <section className="dash-hero">
        <div className="dash-hero-main">
          <h2 className="dash-title">
            {t('dashboard.hello')}<span className="dash-title-em">{t('dashboard.helloSub')}</span>
          </h2>
          <p className="dash-subtitle">
            <Trans
              i18nKey="dashboard.subtitle"
              values={{ totalWords, checkinDays: checkin.totalDays }}
              components={{ b: <b /> }}
            />
          </p>
          <div className="dash-hero-cta">
            <Button variant="primary" size="md" disabled={checkin.checkedToday} onClick={handleCheckin}>
              {checkin.checkedToday ? t('dashboard.checkinDone') : t('dashboard.checkinNow')}
            </Button>
            <Button variant="secondary" size="md" onClick={refreshAll}>
              {t('dashboard.refresh')}
            </Button>
          </div>
        </div>
        <div className="dash-hero-stats">
          <div className="streak-badge">
            <span className="streak-flame" aria-hidden>🔥</span>
            <div className="streak-nums">
              <b>{checkin.currentStreak}</b>
              <small>{t('dashboard.streakCurrent')}</small>
            </div>
          </div>
          <div className="streak-badge streak-badge-muted">
            <span className="streak-flame">🏆</span>
            <div className="streak-nums">
              <b>{checkin.maxStreak}</b>
              <small>{t('dashboard.streakMax')}</small>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 4 格大数字卡片 ========== */}
      <section className="dash-stats-grid">
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

      {/* ========== 中段：分布 + 圆环 + 待复习 ========== */}
      <section className="dash-mid-grid">
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
      </section>

      {/* ========== 下段：趋势 + 成就 + 最近活动 ========== */}
      <section className="dash-bot-grid">
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
              {achievements.slice(0, 8).map((a) => {
                const meta = getCategoryMeta(a.category)
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
      </section>
    </div>
  )
}
