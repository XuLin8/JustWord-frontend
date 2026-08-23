// components/LearnMode/LearnMode.tsx

import { useState } from 'react'
import { useWordStore } from '../../../store/wordStore'
import { useLearning } from '../../../hooks/useLearning'
import { LearnMode as LearnModeEnum } from '../../../types/learning.types'
import { useUIStore } from '../../../store/uiStore'
import EnglishToChinese from './EnglishToChinese'
import ChineseToEnglish from './ChineseToEnglish'
import ResultReview from './ResultReview'
import './LearnMode.css'

export default function LearnMode() {
  const { words } = useWordStore()
  const { showToast } = useUIStore()
  const [selectedMode, setSelectedMode] = useState<LearnModeEnum | null>(null)

  const {
    session,
    currentWord,
    progress,
    submitAnswer,
    nextQuestion,
    isFinished,
    startLearning
  } = useLearning(words)

  const handleStart = (mode: LearnModeEnum) => {
    if (words.length < 5) {
      showToast('词库至少需要 5 个单词才能开始学习！', 'warning')
      return
    }
    startLearning(mode)
    setSelectedMode(mode)
  }

  if (!selectedMode) {
    return (
      <div className="learn-mode-select">
        <h2>📚 选择学习模式</h2>
        <div className="learn-mode-cards">
          <div className="learn-card" onClick={() => handleStart(LearnModeEnum.ENGLISH_TO_CHINESE)}>  {/* ← 改这里 */}
            <div className="card-icon">🇬🇧→🇨🇳</div>
            <h3>英译汉</h3>
            <p>看英文写中文释义</p>
            <span className="card-count">📝 {words.length} 个单词</span>
          </div>
          
          <div className="learn-card" onClick={() => handleStart(LearnModeEnum.CHINESE_TO_ENGLISH)}>  {/* ← 改这里 */}
            <div className="card-icon">🇨🇳→🇬🇧</div>
            <h3>汉译英</h3>
            <p>看中文写英文拼写</p>
            <span className="card-count">📝 {words.length} 个单词</span>
          </div>
        </div>
      </div>
    )
  }

  if (isFinished && session) {
    return (
      <ResultReview 
        session={session}
        onRestart={() => setSelectedMode(null)}
        onContinue={() => {
          if (selectedMode === LearnModeEnum.ENGLISH_TO_CHINESE) {  // ← 改这里
            startLearning(LearnModeEnum.CHINESE_TO_ENGLISH)  // ← 改这里
          }
        }}
        hasRound2={selectedMode === LearnModeEnum.ENGLISH_TO_CHINESE}  // ← 改这里
      />
    )
  }

  if (currentWord) {
    return (
      <div className="learn-session">
        <div className="learn-header">
          <div className="learn-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>
              {session?.questions.length || 0} / {session?.wordList.length || 0}
            </span>
          </div>
          <div className="learn-score">
            ✅ {session?.score.correct || 0} 
            ⚠️ {session?.score.partial || 0}
            ❌ {session?.score.wrong || 0}
          </div>
        </div>

        {selectedMode === LearnModeEnum.ENGLISH_TO_CHINESE ? (  // ← 改这里
          <EnglishToChinese
            word={currentWord}
            onSubmit={submitAnswer}
            onNext={nextQuestion}
            questionNumber={session?.questions.length || 0}
            total={session?.wordList.length || 0}
          />
        ) : (
          <ChineseToEnglish
            word={currentWord}
            onSubmit={submitAnswer}
            onNext={nextQuestion}
            questionNumber={session?.questions.length || 0}
            total={session?.wordList.length || 0}
          />
        )}
      </div>
    )
  }

  return null
}