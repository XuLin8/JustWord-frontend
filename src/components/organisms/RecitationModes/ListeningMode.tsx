// src/components/organisms/RecitationModes/ListeningMode.tsx
// M2-F 听词默写：播放发音 → 写出英文单词 → 拼写比对
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, ChevronRight, Ear, PartyPopper, Volume2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnswerResult } from '@/types/learning.types'
import { type PlanWord } from '@/store/learningPlanStore'
import { useLearningStore } from '@/store/learningStore'
import { speakWord } from '@/utils/speech'
import { checkEnglish } from '@/utils/compare'
import './RecitationModes.css'

interface ListeningModeProps {
  words: PlanWord[]
  onExit: () => void
}

export const ListeningMode: React.FC<ListeningModeProps> = ({ words, onExit }) => {
  const { t } = useTranslation()
  const recordJudgement = useLearningStore((s) => s.recordJudgement)

  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [finished, setFinished] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const countsRef = useRef({ correct: 0, wrong: 0 })

  const word = words[index]

  // 进入新词时自动播放发音并聚焦
  useEffect(() => {
    if (!word || finished) return
    speakWord(word.word)
    inputRef.current?.focus()
  }, [word, finished])

  const playAgain = useCallback(() => {
    if (word) speakWord(word.word)
  }, [word])

  const submit = useCallback(() => {
    if (!word || result) return
    if (!answer.trim()) return
    const res = checkEnglish(answer, word.word)
    setResult(res)
    const known = res === AnswerResult.CORRECT
    countsRef.current[known ? 'correct' : 'wrong'] += 1
    void recordJudgement({ wordId: word.id, english: word.word, chinese: word.meaning, known })
  }, [word, answer, result, recordJudgement])

  const next = useCallback(() => {
    if (index >= words.length - 1) {
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setAnswer('')
    setResult(null)
  }, [index, words.length])

  if (finished) {
    const { correct, wrong } = countsRef.current
    return (
      <div className="rec-done rm-done">
        <div className="rec-done-icon">
          <PartyPopper size={40} />
        </div>
        <h3 className="rec-done-title">{t('modes.listenDoneTitle')}</h3>
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
          <Button variant="outline" onClick={() => { setIndex(0); setAnswer(''); setResult(null); setFinished(false); countsRef.current = { correct: 0, wrong: 0 } }}>
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
          style={{ width: `${((index + (result ? 1 : 0)) / words.length) * 100}%` }}
        />
      </div>

      <div className="rec-stage-head">
        <span className="rec-stage-count">
          {index + 1} / {words.length}
        </span>
        <span className="rm-mode-tag">
          <Ear size={14} />
          {t('modes.listenTitle')}
        </span>
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft size={16} />
          {t('modes.exit')}
        </Button>
      </div>

      <div className="rm-listen">
        <div className="rm-listen-word">
          <h2 className="rm-listen-hidden">
            {result ? word.word : t('modes.hiddenWord')}
          </h2>
          {word.phonetic && result && <p className="rec-front-phonetic">{word.phonetic}</p>}
        </div>

        <button className="rm-listen-play" onClick={playAgain} aria-label={t('modes.playAgain')}>
          <Volume2 size={34} />
          <span>{t('modes.playAgain')}</span>
        </button>

        <input
          ref={inputRef}
          className="rm-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!!result}
          placeholder={t('modes.typeWord')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (result) next()
              else submit()
            }
          }}
        />

        {result && (
          <div className={`rm-result ${result === AnswerResult.CORRECT ? 'is-correct' : 'is-wrong'}`}>
            {result === AnswerResult.CORRECT ? <Check size={18} /> : <X size={18} />}
            <span>{result === AnswerResult.CORRECT ? t('modes.correct') : t('modes.wrong')}</span>
            {result !== AnswerResult.CORRECT && (
              <span className="rm-result-answer">{word.word}</span>
            )}
          </div>
        )}
      </div>

      <div className="rec-actions">
        {result ? (
          <Button size="lg" className="rec-next-btn" onClick={next}>
            {t('modes.next')}
            <ChevronRight size={18} />
          </Button>
        ) : (
          <Button size="lg" className="rec-next-btn" onClick={submit} disabled={!answer.trim()}>
            {t('modes.submit')}
          </Button>
        )}
      </div>

      <p className="rec-kbd-hint">
        <kbd>Enter</kbd> {t('modes.enterHint')} · <kbd>{t('recitation.space')}</kbd> {t('recitation.play')}
      </p>
    </div>
  )
}
