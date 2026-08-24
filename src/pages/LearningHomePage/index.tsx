// src/pages/LearningHomePage/index.tsx
// M2-D 核心学习首页（登录后默认落地页）：顶部字典搜索（Ctrl+K）+ 今日任务卡片 + 背诵主区入口
// 大屏占比、渐变背景明暗双态。背诵流程（M2-E）与背诵规则（M2-F）在此页深化。
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, CalendarDays, Minus, Play, Plus, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RecitationStage } from '@/components/organisms/RecitationStage'
import { useLearningPlanStore } from '@/store/learningPlanStore'
import { useTextbookStore } from '@/store/textbookStore'
import { useDictionary, type DictionaryEntry } from '@/hooks/useDictionary'
import './LearningHomePage.css'

interface LearningHomePageProps {
  onGoWordbook?: () => void
}

type View = 'home' | 'stage'

export const LearningHomePage: React.FC<LearningHomePageProps> = ({ onGoWordbook }) => {
  const { t } = useTranslation()
  const [view, setView] = useState<View>('home')
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<DictionaryEntry | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const { dailyTarget, setDailyTarget, newWords, reviewWords, planDate, generatePlan } =
    useLearningPlanStore()
  const { enrolledIds, textbooks, loadTextbooks } = useTextbookStore()
  const { search } = useDictionary()

  // 挂载：加载订阅词书 + 生成今日计划
  useEffect(() => {
    if (textbooks.length === 0) void loadTextbooks()
    void generatePlan()
  }, [loadTextbooks, generatePlan, textbooks.length])

  // Ctrl+K 唤起字典搜索
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => (query ? search(query) : []), [query, search])
  const todayWords = useMemo(() => [...newWords, ...reviewWords], [newWords, reviewWords])

  const enrolledBooks = textbooks.filter((b) => enrolledIds.includes(b.id))
  const hasPlan = todayWords.length > 0

  const openDetail = (entry: DictionaryEntry) => {
    setQuery('')
    setDetail(entry)
  }

  const todayLabel = useMemo(() => {
    if (!planDate) return ''
    const d = new Date(planDate + 'T00:00:00')
    return d.toLocaleDateString()
  }, [planDate])

  return (
    <section className="learning-home" aria-label={t('nav.home')}>
      {view === 'home' ? (
        <>
          {/* ============ 顶部字典搜索 ============ */}
          <div className="lh-search" role="search">
            <Search className="lh-search-icon" size={20} />
            <input
              ref={searchRef}
              className="lh-search-input"
              placeholder={t('learningHome.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('learningHome.searchPlaceholder')}
            />
            <span className="lh-search-kbd">Ctrl K</span>

            {query && (
              <div className="lh-search-results">
                {results.length === 0 ? (
                  <div className="lh-search-item">{t('learningHome.searchEmpty')}</div>
                ) : (
                  results.map((it) => (
                    <button key={it.id} className="lh-search-item" onClick={() => openDetail(it)}>
                      <span className="lh-search-item-word">{it.word}</span>
                      <span className="lh-search-item-mean">{it.meaning}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ============ 今日任务卡片 ============ */}
          <div className="lh-task lh-task-gleam">
            <div className="lh-task-top">
              <div className="lh-task-title">
                <Sparkles size={22} />
                {t('learningHome.taskTitle')}
              </div>
              <span className="lh-task-date">
                <CalendarDays size={14} />
                {todayLabel}
              </span>
            </div>

            {enrolledIds.length === 0 ? (
              <div className="lh-empty">
                <BookOpen size={40} className="lh-search-icon" />
                <p>{t('learningHome.subscribeHint')}</p>
                {onGoWordbook && <Button onClick={onGoWordbook}>{t('learningHome.goWordbook')}</Button>}
              </div>
            ) : (
              <>
                <div className="lh-task-metrics">
                  <div className="lh-metric">
                    <span className="lh-metric-label">{t('learningHome.metricTarget')}</span>
                    <span className="lh-metric-value">{dailyTarget}<small> {t('learningHome.targetUnit')}</small></span>
                  </div>
                  <div className="lh-metric">
                    <span className="lh-metric-label">{t('learningHome.metricNew')}</span>
                    <span className="lh-metric-value">{newWords.length}<small> {t('learningHome.targetUnit')}</small></span>
                  </div>
                  <div className="lh-metric">
                    <span className="lh-metric-label">{t('learningHome.metricReview')}</span>
                    <span className="lh-metric-value">{reviewWords.length}<small> {t('learningHome.targetUnit')}</small></span>
                  </div>
                </div>

                <div className="lh-task-source">
                  {t('learningHome.sourceLabel')}：
                  <b>{enrolledBooks.map((b) => b.name).join('、')}</b>
                </div>

                <div className="lh-target-row">
                  {t('learningHome.targetConfig')}
                  <span className="lh-target-stepper">
                    <button
                      type="button"
                      aria-label={t('common.cancel')}
                      onClick={() => void setDailyTarget(dailyTarget - 1)}
                      disabled={dailyTarget <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <b>{dailyTarget}</b>
                    <button
                      type="button"
                      aria-label={t('common.confirm')}
                      onClick={() => void setDailyTarget(dailyTarget + 1)}
                      disabled={dailyTarget >= 200}
                    >
                      <Plus size={14} />
                    </button>
                  </span>
                  {t('learningHome.targetUnit')}
                </div>

                <button className="lh-start-btn" onClick={() => setView('stage')} disabled={!hasPlan}>
                  <Play size={18} />
                  {t('learningHome.start')}
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        /* ============ 背诵主区（M2-E：认识/不认识判定 → 详情 → 打卡） ============ */
        <RecitationStage words={todayWords} onExit={() => setView('home')} />
      )}

      {/* ============ 字典详情弹窗 ============ */}
      {detail && (
        <Dialog open onOpenChange={(open) => !open && setDetail(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{detail.word}</DialogTitle>
              <DialogDescription>{detail.meaning}</DialogDescription>
            </DialogHeader>
            {detail.phonetic && <p>{t('learningHome.detailPhonetic')}：{detail.phonetic}</p>}
            {detail.example && <p>{t('learningHome.detailExample')}：{detail.example}</p>}
          </DialogContent>
        </Dialog>
      )}
    </section>
  )
}
