// components/LearnMode/LearnMode.tsx

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWordStore } from '../../../store/wordStore'
import { useLearning } from '../../../hooks/useLearning'
import { LearnMode as LearnModeEnum } from '../../../types/learning.types'
import { useUIStore } from '../../../store/uiStore'
import EnglishToChinese from './EnglishToChinese'
import ChineseToEnglish from './ChineseToEnglish'
import ResultReview from './ResultReview'
import './LearnMode.css'

interface LearnModeProps {
  onExit?: () => void
}

export default function LearnMode({ onExit }: LearnModeProps) {
  const { t } = useTranslation()
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
      showToast(t('learn.minWordsWarning', { count: 5 }), 'warning')
      return
    }
    startLearning(mode)
    setSelectedMode(mode)
  }

  if (!selectedMode) {
    return (
      <div className="learn-mode-select">
        {onExit && (
          <button className="learn-exit-btn" onClick={onExit}>
            ← {t('modes.backHome')}
          </button>
        )}
        <h2>{t('learn.selectTitle')}</h2>
        <div className="learn-mode-cards">
          <div className="learn-card" onClick={() => handleStart(LearnModeEnum.ENGLISH_TO_CHINESE)}>
            <div className="card-icon">🇬🇧→🇨🇳</div>
            <h3>{t('dashboard.mode.en2zh')}</h3>
            <p>{t('learn.en2zhDesc')}</p>
            <span className="card-count">{t('learn.wordCount', { count: words.length })}</span>
          </div>

          <div className="learn-card" onClick={() => handleStart(LearnModeEnum.CHINESE_TO_ENGLISH)}>
            <div className="card-icon">🇨🇳→🇬🇧</div>
            <h3>{t('dashboard.mode.zh2en')}</h3>
            <p>{t('learn.zh2enDesc')}</p>
            <span className="card-count">{t('learn.wordCount', { count: words.length })}</span>
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
        onExit={onExit}
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