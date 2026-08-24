// components/LearnMode/EnglishToChinese.tsx

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AnswerResult } from '../../../types/learning.types'
import type { Word } from '../../../types/learning.types'
import { useUIStore } from '../../../store/uiStore'

interface Props {
  word: Word
  onSubmit: (answer: string) => { result: AnswerResult } | null
  onNext: () => void
  questionNumber: number
  total: number
}

export default function EnglishToChinese({ word, onSubmit, onNext, questionNumber, total }: Props) {
  const { t } = useTranslation()
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useUIStore()

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [questionNumber])

  const handleSubmit = () => {
    if (!answer.trim()) {
      showToast(t('learn.inputChineseWarning'), 'warning')
      return
    }

    const submitResult = onSubmit(answer.trim())
    if (!submitResult) return
    
    setResult(submitResult.result)
  }

  const handleNext = () => {
    setAnswer('')
    setResult(null)
    setShowHint(false)
    onNext()
  }

  const getResultColor = () => {
    switch (result) {
      case AnswerResult.CORRECT: return 'green'
      case AnswerResult.PARTIAL: return 'orange'
      default: return 'red'
    }
  }

  const getResultLabel = () => {
    switch (result) {
      case AnswerResult.CORRECT: return t('learn.resultCorrect')
      case AnswerResult.PARTIAL: return t('learn.resultPartial')
      default: return t('learn.resultWrong')
    }
  }

  return (
    <div className="question-card">
      <div className="question-number">
        {t('learn.questionCount', { current: questionNumber + 1, total })}
      </div>
      
      <div className="question-word">
        <h2>{word.english}</h2>
        {showHint && (
          <div className="hint">
            {t('learn.hintEn2zh', { word: word.english })}
          </div>
        )}
      </div>

      <div className="question-input">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={t('learn.inputChinesePlaceholder')}
          disabled={!!result}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (result) {
                handleNext()
              } else {
                handleSubmit()
              }
            }
          }}
        />
      </div>

      {!result ? (
        <div className="question-actions">
          <button 
            className="hint-btn"
            onClick={() => setShowHint(!showHint)}
          >
            {t('learn.hint')}
          </button>
          <button 
            className="submit-btn"
            onClick={handleSubmit}
          >
            {t('learn.submit')}
          </button>
        </div>
      ) : (
        <div className={`result-box ${getResultColor()}`}>
          <div className="result-text">{getResultLabel()}</div>
          <div className="result-detail">
            <span>{t('learn.yourAnswer', { answer })}</span>
            <span>{t('learn.correctAnswer', { answer: word.chinese })}</span>
          </div>
          <button className="next-btn" onClick={handleNext}>
            {questionNumber + 1 === total ? t('learn.viewResult') : t('learn.nextQuestion')}
          </button>
        </div>
      )}
    </div>
  )
}