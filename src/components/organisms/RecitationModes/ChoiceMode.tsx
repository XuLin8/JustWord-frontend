// src/components/organisms/RecitationModes/ChoiceMode.tsx
// M2-F 看词选意：显示英文单词 → 从 4 个中文释义选项中选正确项
// 进度：顶部进度条 = 今日学习进度（今日答对/每日目标，后端为准）；判定结果提交后端 SM-2。
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, ChevronRight, ListChecks, PartyPopper, Volume2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type PlanWord } from '@/store/learningPlanStore'
import { useLearningStore } from '@/store/learningStore'
import { speakWord } from '@/utils/speech'
import { useReviewStore } from '@/store/reviewStore'
import { usePreferenceStore } from '@/store/preferenceStore'
import { TodayProgressBar } from '@/components/organisms/TodayProgressBar'
import { CheckinButton } from '@/components/organisms/RecitationModes/CheckinButton'
import { useLearningSession } from '@/hooks/useLearningSession'
import './RecitationModes.css'

interface ChoiceModeProps {
  words: PlanWord[]
  onExit: () => void
}

export const ChoiceMode: React.FC<ChoiceModeProps> = ({ words, onExit }) => {
  const { t } = useTranslation()
  const recordJudgement = useLearningStore((s) => s.recordJudgement)
  const submitAttempt = useReviewStore((s) => s.submitAttempt)
  const { audioEnabled } = usePreferenceStore()

  // 会话时长上报
  useLearningSession('choose')

  // 词序快照：判定过程中固定本轮词序列，不受 submit 从 store.todayWords 移除词影响
  const [queue] = useState<PlanWord[]>(() => words)

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const countsRef = useRef({ correct: 0, wrong: 0 })
  // 反应耗时埋点：进入新词记录时间点，判定时算差
  const shownAtRef = useRef<number>(Date.now())

  const word = queue[index]

  /** 当前词的 4 个选项：1 正确 + 3 干扰 */
  const options = useMemo(() => {
    if (!word) return []
    const distractors = queue
      .filter((w) => w.id !== word.id && w.meaning !== word.meaning)
      .map((w) => w.meaning)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    const all = [word.meaning, ...distractors].sort(() => Math.random() - 0.5)
    return all
  }, [word, queue])

  useEffect(() => {
    if (word && !finished) speakWord(word.word)
  }, [word, finished])

  // 进入新词时刷新计时起点
  useEffect(() => {
    shownAtRef.current = Date.now()
  }, [word?.id])

  const pick = useCallback(
    (opt: string) => {
      if (!word || selected) return
      setSelected(opt)
      const known = opt === word.meaning
      countsRef.current[known ? 'correct' : 'wrong'] += 1
      void recordJudgement({ wordId: word.id, english: word.word, chinese: word.meaning, known })
      // SM-2 提交后端（选对=correct，选错=wrong，mode='choose'，附反应耗时）
      const responseMs = Math.max(0, Date.now() - shownAtRef.current)
      void submitAttempt({
        word,
        result: known ? 'correct' : 'wrong',
        mode: 'choose',
        userAnswer: opt,
        correctAnswer: word.meaning,
        responseMs,
      }).catch(() => undefined)
    },
    [word, selected, recordJudgement, submitAttempt],
  )

  const next = useCallback(() => {
    if (index >= queue.length - 1) {
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
  }, [index, queue.length])

  if (finished) {
    const { correct, wrong } = countsRef.current
    return (
      <div className="rec-done rm-done">
        <div className="rec-done-icon">
          <PartyPopper size={40} />
        </div>
        <h3 className="rec-done-title">{t('modes.choiceDoneTitle')}</h3>
        <p className="rec-done-sub">{t('modes.doneSub', { total: queue.length })}</p>
        <div className="rec-done-stats">
          <div className="rec-done-stat is-known">
            <span className="rec-done-stat-num">{correct}</span>
            <span className="rec-done-stat-label">{t('modes.correct')}</span>
          </div>
          <div className="rec-done-stat is-unknown">
            <span className="rec-done-stat-num">{wrong}</span>
            <span className="rec-done-stat-label">{t('modes.wrong')}</span>
          </div>
        </div>

        <CheckinButton />

        <div className="rec-done-actions">
          <Button variant="outline" onClick={() => { setIndex(0); setSelected(null); setFinished(false); countsRef.current = { correct: 0, wrong: 0 } }}>
            {t('modes.again')}
          </Button>
          <Button variant="ghost" onClick={onExit}>
            <ArrowLeft size={16} />
            {t('modes.backHome')}
          </Button>
        </div>
      </div>
    )
  }

  if (!word) return null

  return (
    <div className="rec-stage rm-mode">
      <TodayProgressBar />

      <div className="rec-stage-head">
        <span className="rm-mode-tag">
          <ListChecks size={14} />
          {t('modes.choiceTitle')}
        </span>
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft size={16} />
          {t('modes.exit')}
        </Button>
      </div>

      <div className="rm-choice">
        <div className="rm-choice-word">
          <h2 className="rec-word-huge">{word.word}</h2>
          <button className="rm-choice-play" onClick={() => audioEnabled && speakWord(word.word)} aria-label={t('modes.play')}>
            <Volume2 size={18} />
          </button>
        </div>

        <div className="rm-choice-opts">
          {options.map((opt) => {
            const isCorrectOpt = opt === word.meaning
            const isPicked = selected === opt
            let cls = 'rm-choice-opt'
            if (selected) {
              if (isCorrectOpt) cls += ' is-correct'
              else if (isPicked) cls += ' is-wrong'
              else cls += ' is-dim'
            }
            return (
              <button key={opt} className={cls} onClick={() => pick(opt)} disabled={!!selected}>
                <span>{opt}</span>
                {selected && isCorrectOpt && <Check size={16} />}
                {selected && isPicked && !isCorrectOpt && <X size={16} />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rec-actions">
        {selected ? (
          <Button size="lg" className="rec-next-btn" onClick={next}>
            {t('modes.next')}
            <ChevronRight size={18} />
          </Button>
        ) : (
          <p className="rm-choice-hint">{t('modes.choiceHint')}</p>
        )}
      </div>
    </div>
  )
}
