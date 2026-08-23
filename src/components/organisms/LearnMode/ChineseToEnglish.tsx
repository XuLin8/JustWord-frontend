// components/LearnMode/ChineseToEnglish.tsx

import { useState, useRef, useEffect } from 'react'
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
      showToast('请输入英文拼写！', 'warning')
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
      case AnswerResult.CORRECT: return '✅ 拼写完全正确！'
      case AnswerResult.TYPO: return '⚠️ 拼写有误（建议检查拼写）'
      case AnswerResult.CLOSE: return '📖 是近义词，有细微差别'
      default: return '❌ 不正确'
    }
  }

  return (
    <div className="question-card">
      <div className="question-number">
        第 {questionNumber + 1} / {total} 题
      </div>
      
      <div className="question-word">
        <h2>{word.chinese}</h2>
        {showHint && (
          <div className="hint">
            💡 提示：{word.chinese} 对应的英文是...
          </div>
        )}
      </div>

      <div className="question-input">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="请输入英文拼写..."
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
            💡 提示
          </button>
          <button 
            className="submit-btn"
            onClick={handleSubmit}
          >
            ✓ 提交
          </button>
        </div>
      ) : (
        <div className={`result-box ${getResultColor()}`}>
          <div className="result-text">{getResultLabel()}</div>
          <div className="result-detail">
            <span>你的答案：{answer}</span>
            <span>正确答案：{word.english}</span>
          </div>

          {/* 近义词详解 */}
          {result === AnswerResult.CLOSE && similarWords.length > 0 && (
            <div className="similar-words-section">
              <h4>📖 近义词辨析</h4>
              {similarWords.map((sw, idx) => (
                <div key={idx} className="similar-word-detail">
                  <div className="sw-compare">
                    <span className="sw-word">{word.english}</span>
                    <span className="sw-vs">vs</span>
                    <span className="sw-word">{sw.word}</span>
                  </div>
                  <div className="sw-meaning">
                    <span>"{word.english}" 含义：{word.chinese}</span>
                    <span>"{sw.word}" 含义：{sw.meaning}</span>
                  </div>
                  <div className="sw-usage">
                    <span>使用场景：{sw.usage}</span>
                  </div>
                  <div className="sw-difference">
                    💡 {sw.difference}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 拼写错误提示 */}
          {result === AnswerResult.TYPO && (
            <div className="typo-hint">
              💡 检查拼写：你写的是 "{answer}"，正确拼写是 "{word.english}"
            </div>
          )}

          <button className="next-btn" onClick={handleNext}>
            {questionNumber + 1 === total ? '📊 查看结果' : '下一题 →'}
          </button>
        </div>
      )}
    </div>
  )
}