// src/components/organisms/AdminConsole/index.tsx
// 后台控制台看板页：核心功能开关 + 使用情况 + 访问信息（featureStore / statsStore / accessStore）
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  CalendarCheck,
  Gauge,
  Info,
  Monitor,
  RotateCcw,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeatureStore, type CoreFeatureKey } from '@/store/featureStore'
import { useAccessStore } from '@/store/accessStore'
import { useStatsStore } from '@/store/statsStore'
import { useWordStore } from '@/store/wordStore'
import { useUIStore } from '@/store/uiStore'
import './AdminConsole.css'

interface AdminConsoleProps {
  open: boolean
  onClose: () => void
}

interface FeatureConfig {
  key: CoreFeatureKey
  icon: React.ReactNode
}

function formatTime(ts: number): string {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ open, onClose }) => {
  const { t } = useTranslation()
  const showToast = useUIStore((s) => s.showToast)

  // Esc 关闭
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // 功能开关
  const cat = useFeatureStore((s) => s.cat)
  const review = useFeatureStore((s) => s.review)
  const search = useFeatureStore((s) => s.search)
  const speech = useFeatureStore((s) => s.speech)
  const checkin = useFeatureStore((s) => s.checkin)
  const toggle = useFeatureStore((s) => s.toggle)

  // 访问信息
  const access = useAccessStore()
  const resetAccess = useAccessStore((s) => s.reset)

  // 使用情况
  const dashboard = useStatsStore((s) => s.dashboard)
  const loadingDashboard = useStatsStore((s) => s.loadingDashboard)
  const loadDashboard = useStatsStore((s) => s.loadDashboard)
  const words = useWordStore((s) => s.words)

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const features: FeatureConfig[] = [
    { key: 'cat', icon: <Sparkles size={16} /> },
    { key: 'review', icon: <RotateCcw size={16} /> },
    { key: 'search', icon: <Monitor size={16} /> },
    { key: 'speech', icon: <Send size={16} /> },
    { key: 'checkin', icon: <CalendarCheck size={16} /> },
  ]
  const featureState: Record<CoreFeatureKey, boolean> = { cat, review, search, speech, checkin }

  // 今日访问次数
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const todayVisits = access.daily[todayKey] ?? 0

  const metrics = [
    { label: t('admin.metric.totalWords'), value: dashboard?.wordStats.total ?? words.length },
    { label: t('admin.metric.learned'), value: dashboard?.wordStats.learned ?? 0 },
    { label: t('admin.metric.mastered'), value: dashboard?.wordStats.mastered ?? 0 },
    { label: t('admin.metric.streak'), value: dashboard?.checkinStats.currentStreak ?? 0 },
    { label: t('admin.metric.checkinDays'), value: dashboard?.checkinStats.totalDays ?? 0 },
    { label: t('admin.metric.visits'), value: access.visits },
    { label: t('admin.metric.todayVisits'), value: todayVisits },
  ]

  const accessFields = [
    { label: t('admin.accessField.firstSeen'), value: formatTime(access.firstSeen) },
    { label: t('admin.accessField.lastSeen'), value: formatTime(access.lastSeen) },
    { label: t('admin.accessField.browser'), value: access.browser || '—' },
    { label: t('admin.accessField.os'), value: access.os || '—' },
    { label: t('admin.accessField.viewport'), value: access.viewport || '—' },
    { label: t('admin.accessField.screen'), value: access.screenW ? `${access.screenW}x${access.screenH}` : '—' },
    { label: t('admin.accessField.language'), value: access.language || '—' },
    { label: t('admin.accessField.theme'), value: access.theme || '—' },
    { label: t('admin.accessField.standalone'), value: access.standalone ? '✓' : '—' },
  ]

  const onResetAccess = async () => {
    await resetAccess()
    showToast(t('admin.resetDone'), 'success')
  }

  const toggleFeature = (key: CoreFeatureKey) => () => void toggle(key)

  if (!open) return null

  return (
    <div className="admin-console" role="dialog" aria-modal="true" aria-label={t('admin.title')} onClick={onClose}>
      <div className="admin-console-inner" onClick={(e) => e.stopPropagation()}>
        <header className="admin-console-head">
          <div className="admin-console-title">
            <Gauge size={20} />
            <span>{t('admin.title')}</span>
          </div>
          <button type="button" className="admin-console-close" onClick={onClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </header>
        <span className="admin-console-sub">{t('admin.footnote')}</span>

        {/* ===== 功能开关 ===== */}
        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h3 className="admin-section-title">
                <Settings2 size={17} />
                {t('admin.featuresTitle')}
              </h3>
              <p className="admin-section-sub">{t('admin.featuresSub')}</p>
            </div>
            <Info size={15} className="admin-section-more" />
          </div>

          <div className="admin-feature-list">
            {features.map((f) => {
              const on = featureState[f.key]
              return (
                <button
                  key={f.key}
                  type="button"
                  className="admin-feature"
                  onClick={toggleFeature(f.key)}
                  aria-pressed={on}
                >
                  <span className="admin-feature-icon">{f.icon}</span>
                  <span className="admin-feature-body">
                    <span className="admin-feature-name">{t(`admin.feature.${f.key}`)}</span>
                    <span className="admin-feature-desc">{t(`admin.feature.${f.key}Desc`)}</span>
                  </span>
                  <span className={`admin-switch ${on ? 'is-on' : ''}`} aria-hidden>
                    <span className="admin-switch-thumb" />
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ===== 使用情况 ===== */}
        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h3 className="admin-section-title">
                <Activity size={17} />
                {t('admin.usageTitle')}
              </h3>
              <p className="admin-section-sub">{t('admin.usageSub')}</p>
            </div>
          </div>

          {loadingDashboard && !dashboard ? (
            <p className="admin-empty">{t('admin.never')}</p>
          ) : (
            <div className="admin-metrics">
              {metrics.map((m) => (
                <div key={m.label} className="admin-metric">
                  <span className="admin-metric-value">{m.value}</span>
                  <span className="admin-metric-label">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== 访问信息 ===== */}
        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h3 className="admin-section-title">
                <Gauge size={17} />
                {t('admin.accessTitle')}
              </h3>
              <p className="admin-section-sub">{t('admin.accessSub')}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={onResetAccess}
            >
              <Trash2 size={14} />
              {t('admin.reset')}
            </Button>
          </div>

          {access.visits === 0 ? (
            <p className="admin-empty">{t('admin.never')}</p>
          ) : (
            <div className="admin-access-grid">
              {accessFields.map((f) => (
                <div key={f.label} className="admin-access-item">
                  <span className="admin-access-label">{f.label}</span>
                  <span className="admin-access-value">{f.value}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}