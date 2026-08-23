// components/LearnMode/ResultReview.tsx
import { AnswerResult } from '../../../types/learning.types'
import type { LearningSession } from '../../../types/learning.types'
interface Props {
  session: LearningSession
  onRestart: () => void
  onContinue?: () => void
  hasRound2?: boolean
}

export default function ResultReview({ session, onRestart, onContinue, hasRound2 }: Props) {
  const { wordList, questions, score } = session

  const getResultEmoji = (result: AnswerResult) => {
    switch (result) {
      case AnswerResult.CORRECT: return '✅'
      case AnswerResult.PARTIAL: return '⚠️'
      case AnswerResult.TYPO: return '📝'
      case AnswerResult.CLOSE: return '📖'
      default: return '❌'
    }
  }

  const getResultColor = (result: AnswerResult) => {
    switch (result) {
      case AnswerResult.CORRECT: return 'text-green'
      case AnswerResult.PARTIAL: return 'text-orange'
      case AnswerResult.TYPO: return 'text-orange'
      case AnswerResult.CLOSE: return 'text-blue'
      default: return 'text-red'
    }
  }

  const accuracy = wordList.length > 0 
    ? Math.round((score.correct / wordList.length) * 100) 
    : 0

  return (
    <div className="result-review">
      <div className="result-header">
        <h2>📊 学习结果</h2>
        <div className="result-summary">
          <div className="score-big">{accuracy}%</div>
          <div className="score-detail">
            <span className="correct">✅ {score.correct}</span>
            <span className="partial">⚠️ {score.partial}</span>
            <span className="wrong">❌ {score.wrong}</span>
            <span className="total">共 {wordList.length} 题</span>
          </div>
        </div>
      </div>

      <div className="result-list">
        <h3>📋 逐题回顾</h3>
        {questions.map((q, idx) => (
          <div key={idx} className="result-item">
            <span className="result-index">{idx + 1}.</span>
            <span className={`result-emoji ${getResultColor(q.result)}`}>
              {getResultEmoji(q.result)}
            </span>
            <span className="result-word">{q.english}</span>
            <span className="result-user-answer">{q.userAnswer}</span>
            <span className="result-correct-answer">{q.correctAnswer}</span>
          </div>
        ))}
      </div>

      <div className="result-actions">
        {hasRound2 && accuracy >= 80 ? (
          <button className="continue-btn" onClick={onContinue}>
            🚀 进入第二轮（汉译英）
          </button>
        ) : hasRound2 && accuracy < 80 && (
          <div className="round2-hint">
            <span>💪 建议先巩固第一轮（正确率 80% 以上再进入第二轮）</span>
            <button className="restart-btn" onClick={onRestart}>
              🔄 重新学习
            </button>
          </div>
        )}
        <button className="restart-btn" onClick={onRestart}>
          🔄 重新开始
        </button>
      </div>
    </div>
  )
}