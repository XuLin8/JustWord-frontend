// src/components/organisms/RecitationStage/index.tsx
// M2-E 背诵流程：认识/不认识判定 → 展开详情（TTS/音标/释义/例句/形近/近义/反义）
// 输入通道：按钮 / 键盘（判定面 ↑ 不认识 · ↓ 认识 · 空格 发音；详情面 ↑ 上一个 · ↓/Enter 下一个 · 空格 发音）
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type PlanWord } from '@/store/learningPlanStore'
import { useLearningStore } from '@/store/learningStore'
import { useCheckinStore } from '@/store/checkinStore'
import { speakWord, warmupSpeech } from '@/utils/speech'
import { playMeow, playHiss } from '@/utils/catSound'
import { useCatStore, CAT_REWARD } from '@/store/catStore'
import { useFeatureStore } from '@/store/featureStore'
import { useReviewStore } from '@/store/reviewStore'
import { useProgressStore } from '@/store/progressStore'
import { usePreferenceStore } from '@/store/preferenceStore'
import { TodayProgressBar } from '@/components/organisms/TodayProgressBar'
import { CheckinButton } from '@/components/organisms/RecitationModes/CheckinButton'
import { useLearningSession } from '@/hooks/useLearningSession'
import './RecitationStage.css'

interface RecitationStageProps {
  words: PlanWord[]
  onExit: () => void
}

type Judgement = 'known' | 'unknown'

export const RecitationStage: React.FC<RecitationStageProps> = ({ words, onExit }) => {
  const { t } = useTranslation()
  const recordJudgement = useLearningStore((s) => s.recordJudgement)
  const loadCheckins = useCheckinStore((s) => s.loadCheckins)
  const earnCoins = useCatStore((s) => s.earnCoins)
  const catEnabled = useFeatureStore((s) => s.cat)
  const { audioEnabled, setAudioEnabled } = usePreferenceStore()

  // 会话时长上报（离开本模式时并入今日聚合）
  useLearningSession('judge')

  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [finished, setFinished] = useState(false)
  // 每个词的判定结果：回退到已判定的词时恢复详情面（不重复提交 SM-2）
  const [judgedMap, setJudgedMap] = useState<Record<string, Judgement>>({})
  const countsRef = useRef({ known: 0, unknown: 0 })
  // 词序快照：判定过程中固定本轮词序列，不受 submit 从 store.todayWords 移除词
  // 导致 words prop 缩短的影响（否则切词会错位、进度条/完成统计会错乱）
  const [queue] = useState<PlanWord[]>(() => words)

  // SM-2 提交（A1）：认识=correct，不认识=wrong，让后端记忆曲线生效
  const submitAttempt = useReviewStore((s) => s.submitAttempt)

  // 今日进度（后端为准，刷新/重进/换设备一致）：今日答对 / 每日目标
  const progressStore = useProgressStore()

  const word = queue[index]
  const lastJudgement: Judgement | null = revealed ? (judgedMap[word?.id ?? ''] ?? null) : null

  // 反应耗时埋点：进入新词记录时间点，判定时算差
  const shownAtRef = useRef<number>(Date.now())

  useEffect(() => {
    warmupSpeech()
    void loadCheckins()
    void progressStore.load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadCheckins])

  // 进入新词时刷新计时起点
  useEffect(() => {
    shownAtRef.current = Date.now()
  }, [word?.id])

  // 展示新词时自动播报一次发音（发音开关开启时）
  useEffect(() => {
    if (word && audioEnabled) speakWord(word.word)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.id, audioEnabled])

  /** 判定当前单词（三通道共同入口） */
  const judge = useCallback(
    (j: Judgement) => {
      if (!word || revealed || finished) return
      countsRef.current[j] += 1
      void recordJudgement({
        wordId: word.id,
        english: word.word,
        chinese: word.meaning,
        known: j === 'known',
      })
      // SM-2 提交给后端（认识=correct，不认识=wrong，mode='judge'，附反应耗时）
      const responseMs = Math.max(0, Date.now() - shownAtRef.current)
      void submitAttempt({
        word,
        result: j === 'known' ? 'correct' : 'wrong',
        mode: 'judge',
        responseMs,
      }).catch(() => undefined)
      // 云养猫联动：认识 → 甜美喵声 + 2 币；不认识 → 哈气音 + 1 币（P0-5 屏蔽）
      if (catEnabled) {
        if (j === 'known') {
          playMeow()
          void earnCoins(CAT_REWARD.KNOWN)
        } else {
          playHiss()
          void earnCoins(CAT_REWARD.UNKNOWN)
        }
      }
      setJudgedMap((m) => ({ ...m, [word.id]: j }))
      setRevealed(true)
    },
    [word, revealed, finished, recordJudgement, earnCoins, submitAttempt],
  )

  /** 播发音 */
  const playAudio = useCallback(() => {
    if (!word || !audioEnabled) return
    speakWord(word.word)
  }, [word, audioEnabled])

  /** 下一个（目标词若已判定则回到详情面，否则回到判定面） */
  const next = useCallback(() => {
    if (index >= queue.length - 1) {
      setFinished(true)
      return
    }
    const ni = index + 1
    setIndex(ni)
    const nw = queue[ni]
    setRevealed(!!(nw && judgedMap[nw.id]))
  }, [index, queue, judgedMap])

  /** 返回上一个单词（回退到其已判定/未判定状态） */
  const prev = useCallback(() => {
    if (index <= 0) return
    const pi = index - 1
    setIndex(pi)
    const pw = queue[pi]
    setRevealed(!!(pw && judgedMap[pw.id]))
  }, [index, queue, judgedMap])

  /** 返回重来（保留已判定计数） */
  const restart = useCallback(() => {
    setIndex(0)
    setRevealed(false)
    setFinished(false)
    setJudgedMap({})
  }, [])

  /** 键盘：判定面 ↑ 不认识 · ↓ 认识 · 空格 发音；详情面 ↑ 上一个 · ↓/Enter 下一个 · 空格 发音 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      let handled = false
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        handled = true
        if (revealed) prev()
        else judge('unknown')
      } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        handled = true
        if (revealed) next()
        else judge('known')
      } else if (e.code === 'Space') {
        e.preventDefault()
        handled = true
        playAudio()
      }
      // 若焦点停留在按钮上，处理键后移除焦点，避免 Space/Enter 再次触发按钮激活（重复判定/连跳）
      if (handled && document.activeElement instanceof HTMLElement && document.activeElement.tagName === 'BUTTON') {
        document.activeElement.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [judge, playAudio, next, prev, revealed, finished])

  // ============ 完成页 ============
  if (finished) {
    const { known, unknown } = countsRef.current
    return (
      <div className="rec-stage">
        <div className="rec-done">
          <div className="rec-done-icon">
            <PartyPopper size={40} />
          </div>
          <h3 className="rec-done-title">{t('recitation.doneTitle')}</h3>
          <p className="rec-done-sub">{t('recitation.doneSub', { total: queue.length })}</p>

          <div className="rec-done-stats">
            <div className="rec-done-stat is-known">
              <span className="rec-done-stat-num">{known}</span>
              <span className="rec-done-stat-label">{t('recitation.known')}</span>
            </div>
            <div className="rec-done-stat is-unknown">
              <span className="rec-done-stat-num">{unknown}</span>
              <span className="rec-done-stat-label">{t('recitation.unknown')}</span>
            </div>
          </div>

          <CheckinButton />

          <div className="rec-done-actions">
            <Button variant="outline" onClick={restart}>
              <RotateCcw size={16} />
              {t('recitation.restart')}
            </Button>
            <Button variant="ghost" onClick={onExit}>
              <ArrowLeft size={16} />
              {t('recitation.backHome')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!word) return null

  return (
    <div className="rec-stage">
      {/* 今日学习进度（双段式：今日计划 + 超额完成） */}
      <TodayProgressBar />

      <div className="rec-stage-head">
        {/* 发音开关（点击开启/关闭自动发音；顶部模式 chip 承担退出/切换模式入口） */}
        <Button
          variant="ghost"
          size="sm"
          className="rec-head-audio"
          onClick={() => void setAudioEnabled(!audioEnabled)}
          aria-label={t('recitation.audio')}
          title={audioEnabled ? t('recitation.audioOn') : t('recitation.audioOff')}
        >
          {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </Button>
      </div>

      {/* 单词卡片 */}
      <div className={`rec-card-wrap ${revealed ? 'is-revealed' : ''}`}>
        <div className="rec-card">
          {revealed ? (
            /* ============ 详情面 ============ */
            <div className="rec-detail">
              <span className={`rec-verdict-badge ${lastJudgement === 'known' ? 'is-known' : 'is-unknown'}`}>
                {lastJudgement === 'known' ? <Check size={14} /> : <X size={14} />}
                {lastJudgement === 'known' ? t('recitation.known') : t('recitation.unknown')}
              </span>

              <div className="rec-word">
                <h2 className="rec-word-en">{word.word}</h2>
                <button className="rec-phonetic-btn" onClick={playAudio} aria-label={t('recitation.play')}>
                  {word.phonetic && <span className="rec-phonetic">{word.phonetic}</span>}
                  <Volume2 size={16} />
                </button>
              </div>

              <p className="rec-meaning">{word.meaning}</p>
              {word.example && (
                <p className="rec-example">
                  <Sparkles size={14} className="rec-example-ico" />
                  {word.example}
                </p>
              )}

              <div className="rec-detail-grid">
                {word.similarWords && word.similarWords.length > 0 && (
                  <div className="rec-detail-block">
                    <span className="rec-detail-label">{t('recitation.similar')}</span>
                    <div className="rec-tags">
                      {word.similarWords.map((s) => (
                        <span key={s} className="rec-tag is-similar">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {word.synonyms && word.synonyms.length > 0 && (
                  <div className="rec-detail-block">
                    <span className="rec-detail-label">{t('recitation.synonym')}</span>
                    <div className="rec-tags">
                      {word.synonyms.map((s) => (
                        <span key={s} className="rec-tag is-synonym">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {word.antonyms && word.antonyms.length > 0 && (
                  <div className="rec-detail-block">
                    <span className="rec-detail-label">{t('recitation.antonym')}</span>
                    <div className="rec-tags">
                      {word.antonyms.map((s) => (
                        <span key={s} className="rec-tag is-antonym">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ============ 判定面 ============ */
            <div className="rec-front">
              <span className={`rec-chip rec-front-chip ${word.source === 'new' ? 'is-new' : 'is-review'}`}>
                {word.source === 'new' ? t('recitation.badgeNew') : t('recitation.badgeReview')}
              </span>
              <h2 className="rec-word-en rec-word-huge">{word.word}</h2>
              {word.phonetic && <p className="rec-front-phonetic">{word.phonetic}</p>}
            </div>
          )}
        </div>
      </div>

      {/* 底部操作区 */}
      {revealed ? (
        <div className="rec-actions">
          <Button variant="outline" size="lg" className="rec-prev-btn" onClick={prev} disabled={index <= 0}>
            <ChevronLeft size={18} />
            {t('recitation.prev')}
          </Button>
          <Button size="lg" className="rec-next-btn" onClick={next}>
            {t('recitation.next')}
            <ChevronRight size={18} />
          </Button>
        </div>
      ) : (
        <div className="rec-actions">
          <button className="rec-judge-btn is-unknown" onClick={() => judge('unknown')}>
            <X size={20} />
            <span>{t('recitation.unknown')}</span>
            <kbd>↑</kbd>
          </button>
          <button className="rec-judge-btn is-known" onClick={() => judge('known')}>
            <Check size={20} />
            <span>{t('recitation.known')}</span>
            <kbd>↓</kbd>
          </button>
        </div>
      )}

      {revealed ? (
        <p className="rec-kbd-hint">
          <kbd>↑</kbd> {t('recitation.prev')} · <kbd>↓</kbd> / <kbd>Enter</kbd> {t('recitation.next')} · <kbd>{t('recitation.space')}</kbd> {t('recitation.play')}
        </p>
      ) : (
        <p className="rec-kbd-hint">
          <kbd>↑</kbd> {t('recitation.unknown')} · <kbd>↓</kbd> {t('recitation.known')} · <kbd>{t('recitation.space')}</kbd> {t('recitation.play')}
        </p>
      )}
    </div>
  )
}
