// src/pages/LearningHomePage/index.tsx
// D3 首页即背诵：登录后直接进入 SM-2 排词的背诵界面。
// 顶部常驻状态条：当前词库（点击跳转词库 tab）+ 当前模式切换入口；每日目标已迁入「我的」（头像下拉）。
// 发音/详情/模式/猫咪陪伴等交互延续 M2-E/F。
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookMarked, BookOpen, Coins, Layers, Loader, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecitationStage } from '@/components/organisms/RecitationStage'
import { RulePicker, type RecitationRule } from '@/components/organisms/RecitationModes/RulePicker'
import { ListeningMode } from '@/components/organisms/RecitationModes/ListeningMode'
import { ChoiceMode } from '@/components/organisms/RecitationModes/ChoiceMode'
import { TableMode } from '@/components/organisms/RecitationModes/TableMode'
import LearnMode from '@/components/organisms/LearnMode/LearnMode'
import { CatAvatar } from '@/components/organisms/CatAvatar'
import { useTextbookStore } from '@/store/textbookStore'
import { useCatStore } from '@/store/catStore'
import { useFeatureStore } from '@/store/featureStore'
import { usePreferenceStore } from '@/store/preferenceStore'
import { useReviewStore } from '@/store/reviewStore'
import { useLearningStore } from '@/store/learningStore'
import './LearningHomePage.css'

interface LearningHomePageProps {
  onGoWordbook?: () => void
}

type View = 'mode' | 'rules' | 'empty'

// 背诵模式对应的 i18n 标题键
const RULE_TITLE: Record<RecitationRule, string> = {
  judge: 'modes.judgeTitle',
  listen: 'modes.listenTitle',
  choice: 'modes.choiceTitle',
  table: 'modes.tableTitle',
  round2: 'modes.round2Title',
}

export const LearningHomePage: React.FC<LearningHomePageProps> = ({ onGoWordbook }) => {
  const { t } = useTranslation()
  const { recitationRule, setRecitationRule, loadPreferences } = usePreferenceStore()
  const { enrolledIds, textbooks, loadTextbooks } = useTextbookStore()
  const { todayWords, loadDue, loading, totalDue, session, setSession } = useReviewStore()
  const loadRecords = useLearningStore((s) => s.loadRecords)
  const catAdopted = useCatStore((s) => s.adopted)
  const catCoins = useCatStore((s) => s.coins)
  const catAsBoard = useCatStore((s) => s.asBoard)
  const loadCat = useCatStore((s) => s.load)
  const openBoard = useCatStore((s) => s.openBoard)
  const catEnabled = useFeatureStore((s) => s.cat)

  const [rule, setRule] = useState<RecitationRule | null>(null)
  const [view, setView] = useState<View>('mode')
  // 已自动拉取过一次队列（避免 due 为空时陷入无限重试）
  const autoLoadAttempted = useRef(false)

  const enrolledBooks = textbooks.filter((b) => enrolledIds.includes(b.id))
  const bookName = enrolledBooks.map((b) => b.name).join('、') || t('learningHome.noBook')

  // 挂载：加载订阅词书 + 恢复偏好 + 恢复今日学习记录（供进度条刷新后不清零）；待学队列由下方 effect 在订阅就绪后拉取（首页即背诵）
  useEffect(() => {
    const boot = async () => {
      if (textbooks.length === 0) await loadTextbooks()
      await loadPreferences()
      await loadRecords()
    }
    void boot()
    if (catEnabled) void loadCat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 已订阅但尚未取词时：仅自动拉取一次（避免空队列无限循环请求）；生词本复习会话不触发日常取词
  useEffect(() => {
    if (session !== 'normal') return
    if (autoLoadAttempted.current) return
    if (!loading && enrolledIds.length > 0 && todayWords.length === 0 && view === 'mode') {
      autoLoadAttempted.current = true
      void loadDue()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, enrolledIds.length, todayWords.length, session, view])

  // 生词本复习会话：强制回到判定模式并加载收藏词队列（保留今日进度条/打卡，判定仍走 SM-2）
  useEffect(() => {
    if (session !== 'favorite') return
    setRule(null)
    setView('mode')
    void loadDue({ favoritedOnly: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const exitMode = () => {
    if (session === 'favorite') {
      // 生词本复习退出：恢复日常会话并重新拉取日常队列
      setSession('normal')
      setRule(null)
      setView('mode')
      void loadDue()
      return
    }
    if (rule === null) {
      // 判定模式（首页即背诵）：退出回到「背诵方式选择」层，避免状态不变导致退出按钮无反应
      setView('rules')
    } else {
      setRule(null)
      setView('mode')
    }
    void loadDue() // 重新拉取剩余队列，供下一轮/再次进入
  }

  /* 云养猫金币角 */
  const coinsChip = () => (
    <button type="button" className="lh-cat-coins" onClick={openBoard} aria-label={t('cat.openBoard')}>
      <Coins size={14} />
      {catCoins}
    </button>
  )

  /** 顶部状态条：当前词库 + 模式切换（生词本复习会话显示静态「生词本复习」标签） */
  const statusBar = (
    <div className="lh-topbar">
      <button type="button" className="lh-book-chip" onClick={onGoWordbook} disabled={!onGoWordbook}>
        <BookOpen size={15} className="lh-book-chip-icon" />
        <span className="lh-book-chip-label">{bookName}</span>
        <span className="lh-book-chip-count">{totalDue ? `已约 ${totalDue}` : ''}</span>
      </button>
      {session === 'favorite' ? (
        <span className="lh-mode-chip lh-mode-chip-static" title={t('learningHome.favoriteReview')}>
          <BookMarked size={15} />
          <span>{t('learningHome.favoriteReview')}</span>
        </span>
      ) : (
        <button type="button" className="lh-mode-chip" onClick={() => setView('rules')} title={t('learningHome.switchMode')}>
          <Layers size={15} />
          <span>{t(RULE_TITLE[recitationRule])}</span>
        </button>
      )}
    </div>
  )

  // ============ 背诵主区 ============
  if (view === 'mode') {
    // 未订阅词库 → 空态引导
    if (enrolledIds.length === 0) {
      return (
        <section className="learning-home" aria-label={t('nav.home')}>
          {statusBar}
          <div className="lh-empty">
            <BookOpen size={40} className="lh-search-icon" />
            <p>{t('learningHome.subscribeHint')}</p>
            <div className="lh-empty-actions">
              {onGoWordbook && <Button onClick={onGoWordbook}>{t('learningHome.goWordbook')}</Button>}
            </div>
          </div>
          {catEnabled && catAdopted && (
            <div className={`lh-cat-corner ${catAsBoard ? 'is-board' : ''}`}>
              {coinsChip()}
              <CatAvatar size={catAsBoard ? 'lg' : 'md'} onClick={openBoard} />
            </div>
          )}
        </section>
      )
    }

    // 加载中
    if (loading) {
      return (
        <section className="learning-home" aria-label={t('nav.home')}>
          {statusBar}
          <div className="lh-empty">
            <Loader className="lh-spin" size={28} />
            <p>{t('learningHome.loading')}</p>
          </div>
        </section>
      )
    }

    // 今日无待学 / 生词本为空
    if (todayWords.length === 0) {
      return (
        <section className="learning-home" aria-label={t('nav.home')}>
          {statusBar}
          <div className="lh-empty">
            {session === 'favorite' ? <BookMarked size={40} className="lh-search-icon" /> : <Sparkles size={40} className="lh-search-icon" />}
            <p>{session === 'favorite' ? t('learningHome.favoriteEmpty') : t('learningHome.doneToday')}</p>
            {session === 'favorite' ? (
              <Button variant="outline" onClick={exitMode}>{t('learningHome.exitFavorite')}</Button>
            ) : (
              <Button variant="outline" onClick={() => void loadDue()}>{t('learningHome.refresh')}</Button>
            )}
          </div>
          {catEnabled && catAdopted && (
            <div className={`lh-cat-corner ${catAsBoard ? 'is-board' : ''}`}>
              {coinsChip()}
              <CatAvatar size={catAsBoard ? 'lg' : 'md'} onClick={openBoard} />
            </div>
          )}
        </section>
      )
    }

    return (
      <section className="learning-home" aria-label={t('nav.home')}>
        {statusBar}
        {rule === 'listen' ? (
          <ListeningMode words={todayWords} onExit={exitMode} />
        ) : rule === 'choice' ? (
          <ChoiceMode words={todayWords} onExit={exitMode} />
        ) : rule === 'table' ? (
          <TableMode words={todayWords} onExit={exitMode} />
        ) : rule === 'round2' ? (
          <LearnMode words={todayWords} onExit={exitMode} />
        ) : (
          <RecitationStage words={todayWords} onExit={exitMode} />
        )}

        {catEnabled && catAdopted && (
          <div className={`lh-cat-corner ${catAsBoard ? 'is-board' : ''}`}>
            {coinsChip()}
            <CatAvatar size={catAsBoard ? 'lg' : 'md'} onClick={openBoard} />
          </div>
        )}
      </section>
    )
  }

  // ============ 模式选择（顶部 chip 展开） ============
  return (
    <section className="learning-home" aria-label={t('nav.home')}>
      {statusBar}
      <RulePicker
        onSelect={(r) => {
          void setRecitationRule(r) // 记录并持久化到偏好接口（账户级）
          setRule(r)
          setView('mode')
          if (todayWords.length === 0) void loadDue()
        }}
        onBack={() => setView('mode')}
      />
      {catEnabled && catAdopted && (
        <div className={`lh-cat-corner ${catAsBoard ? 'is-board' : ''}`}>
          {coinsChip()}
          <CatAvatar size={catAsBoard ? 'lg' : 'md'} onClick={openBoard} />
        </div>
      )}
    </section>
  )
}