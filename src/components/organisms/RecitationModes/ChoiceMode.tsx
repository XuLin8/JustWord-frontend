// src/components/organisms/RecitationModes/ChoiceMode.tsx
// M2-F 看词选意：显示英文单词 → 从 4 个中文释义选项中选正确项
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, ChevronRight, ListChecks, PartyPopper, Volume2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type PlanWord } from '@/store/learningPlanStore'
import { useLearningStore } from '@/store/learningStore'
import { speakWord } from '@/utils/speech'
import './RecitationModes.css'

interface ChoiceModeProps {
  words: PlanWord[]
  onExit: () => void
}

export const ChoiceMode: React.FC<ChoiceModeProps> = ({ words, onExit }) => {
  const { t } = useTranslation()
  const recordJudgement = useLearningStore((s) => s.recordJudgement)

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const countsRef = useRef({ correct: 0, wrong: 0 })

  const word = words[index]

  /** 当前词的 4 个选项：1 正确 + 3 干扰 */
  const options = useMemo(() => {
    if (!word) return []
    const distractors = words
      .filter((w) => w.id !== word.id && w.meaning !== word.meaning)
      .map((w) => w.meaning)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    const all = [word.meaning, ...distractors].sort(() => Math.random() - 0.5)
    return all
  }, [word, words])

  useEffect(() => {
    if (word && !finished) speakWord(word.word)
  }, [word, finished])

  const pick = useCallback(
    (opt: string) => {
      if (!word || selected) return
      setSelected(opt)
      const known = opt === word.meaning
      countsRef.current[known ? 'correct' : 'wrong'] += 1
      void recordJudgement({ wordId: word.id, english: word.word, chinese: word.meaning, known })
    },
    [word, selected, recordJudgement],
  )

  const next = useCallback(() => {
    if (index >= words.length - 1) {
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
  }, [index, words.length])

  if (finished) {
    const { correct, wrong } = countsRef.current
    return (
      <div className="rec-done rm-done">
        <div className="rec-done-icon">
          <PartyPopper size={40} />
        </div>
        <h3 className="rec-done-title">{t('modes.choiceDoneTitle')}</h3>
        <p className="rec-done-sub">{t('modes.doneSub', { total: words.length })}</p>
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
      <div className="rec-progress">
        <div
          className="rec-progress-bar"
          style={{ width: `${((index + (selected ? 1 : 0)) / words.length) * 100}%` }}
        />
      </div>

      <div className="rec-stage-head">
        <span className="rec-stage-count">
          {index + 1} / {words.length}
        </span>
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
          <button className="rm-choice-play" onClick={() => speakWord(word.word)} aria-label={t('modes.play')}>
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
