// components/LearnMode/ChineseToEnglish.tsx

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Word, SimilarWord } from '../../../types/learning.types'
import { AnswerResult } from '../../../types/learning.types'
import { useUIStore } from '../../../store/uiStore'

interface Props {
  word: Word
  onSubmit: (answer: string) => { result: AnswerResult; similarWords?: SimilarWord[] } | null
  onNext: () => void
  questionNumber: number
  total: number
}

export default function ChineseToEnglish({ word, onSubmit, onNext, questionNumber, total }: Props) {
  const { t } = useTranslation()
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [similarWords, setSimilarWords] = useState<SimilarWord[]>([])
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
      showToast(t('learn.inputEnglishWarning'), 'warning')
      return
    }

    const submitResult = onSubmit(answer.trim())
    if (!submitResult) return
    
    setResult(submitResult.result)
    if (submitResult.similarWords) {
      setSimilarWords(submitResult.similarWords)
    }
  }

  const handleNext = () => {
    setAnswer('')
    setResult(null)
    setSimilarWords([])
    setShowHint(false)
    onNext()
  }

  const getResultColor = () => {
    switch (result) {
      case AnswerResult.CORRECT: return 'green'
      case AnswerResult.TYPO: return 'orange'
      case AnswerResult.CLOSE: return 'orange'
      default: return 'red'
    }
  }

  const getResultLabel = () => {
    switch (result) {
      case AnswerResult.CORRECT: return t('learn.resultSpellCorrect')
      case AnswerResult.TYPO: return t('learn.resultSpellTypo')
      case AnswerResult.CLOSE: return t('learn.resultClose')
      default: return t('learn.resultIncorrect')
    }
  }

  return (
    <div className="question-card">
      <div className="question-number">
        {t('learn.questionCount', { current: questionNumber + 1, total })}
      </div>
      
      <div className="question-word">
        <h2>{word.chinese}</h2>
        {showHint && (
          <div className="hint">
            {t('learn.hintZh2en', { word: word.chinese })}
          </div>
        )}
      </div>

      <div className="question-input">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={t('learn.inputEnglishPlaceholder')}
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
            <span>{t('learn.correctAnswer', { answer: word.english })}</span>
          </div>

          {/* 近义词详解 */}
          {result === AnswerResult.CLOSE && similarWords.length > 0 && (
            <div className="similar-words-section">
              <h4>{t('learn.similarTitle')}</h4>
              {similarWords.map((sw, idx) => (
                <div key={idx} className="similar-word-detail">
                  <div className="sw-compare">
                    <span className="sw-word">{word.english}</span>
                    <span className="sw-vs">vs</span>
                    <span className="sw-word">{sw.word}</span>
                  </div>
                  <div className="sw-meaning">
                    <span>{t('learn.similarMeaning', { word: word.english, meaning: word.chinese })}</span>
                    <span>{t('learn.similarMeaning', { word: sw.word, meaning: t(sw.meaning) })}</span>
                  </div>
                  <div className="sw-usage">
                    <span>{t('learn.similarUsage', { usage: t(sw.usage) })}</span>
                  </div>
                  <div className="sw-difference">
                    {t('learn.similarDifference', { difference: t(sw.difference) })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 拼写错误提示 */}
          {result === AnswerResult.TYPO && (
            <div className="typo-hint">
              {t('learn.typoHint', { answer, word: word.english })}
            </div>
          )}

          <button className="next-btn" onClick={handleNext}>
            {questionNumber + 1 === total ? t('learn.viewResult') : t('learn.nextQuestion')}
          </button>
        </div>
      )}
    </div>
  )
}