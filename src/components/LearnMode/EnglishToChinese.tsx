// components/LearnMode/EnglishToChinese.tsx

import { useState, useRef, useEffect } from 'react'
import { AnswerResult } from '../../types/learning'
import type { Word } from '../../types/learning'

interface Props {
  word: Word
  onSubmit: (answer: string) => { result: AnswerResult } | null
  onNext: () => void
  questionNumber: number
  total: number
}

export default function EnglishToChinese({ word, onSubmit, onNext, questionNumber, total }: Props) {
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [questionNumber])

  const handleSubmit = () => {
    if (!answer.trim()) {
      alert('请输入中文释义！')
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
      case AnswerResult.CORRECT: return '✅ 完全正确！'
      case AnswerResult.PARTIAL: return '⚠️ 部分正确'
      default: return '❌ 错误'
    }
  }

  return (
    <div className="question-card">
      <div className="question-number">
        第 {questionNumber + 1} / {total} 题
      </div>
      
      <div className="question-word">
        <h2>{word.english}</h2>
        {showHint && (
          <div className="hint">
            💡 提示：{word.english} 的意思是...
          </div>
        )}
      </div>

      <div className="question-input">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="请输入中文释义..."
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
            <span>正确答案：{word.chinese}</span>
          </div>
          <button className="next-btn" onClick={handleNext}>
            {questionNumber + 1 === total ? '📊 查看结果' : '下一题 →'}
          </button>
        </div>
      )}
    </div>
  )
}