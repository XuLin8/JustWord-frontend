// components/LearnMode/LearnMode.tsx

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLearning } from '../../../hooks/useLearning'
import { LearnMode as LearnModeEnum } from '../../../types/learning.types'
import { useUIStore } from '../../../store/uiStore'
import { useReviewStore } from '../../../store/reviewStore'
import { TodayProgressBar } from '../TodayProgressBar'
import { useLearningSession } from '../../../hooks/useLearningSession'
import type { PlanWord } from '../../../store/learningPlanStore'
import EnglishToChinese from './EnglishToChinese'
import ChineseToEnglish from './ChineseToEnglish'
import ResultReview from './ResultReview'
import './LearnMode.css'

interface LearnModeProps {
  onExit?: () => void
  /** 可选：SM-2 待学队列（由首页传入）；缺省时取 reviewStore.todayWords */
  words?: PlanWord[]
}

export default function LearnMode({ onExit, words }: LearnModeProps) {
  const { t } = useTranslation()
  const { showToast } = useUIStore()
  const storeWords = useReviewStore((s) => s.todayWords)
  const [selectedMode, setSelectedMode] = useState<LearnModeEnum | null>(null)

  // 词序快照：进入模式时固定当日待学队列，两轮共用同一批词，不随提交移除而变化
  const [sessionWords] = useState<PlanWord[]>(() => words ?? storeWords)

  // 会话时长上报（两轮模式共用同一 mode 标识）
  useLearningSession('tworound')

  const {
    session,
    currentWord,
    submitAnswer,
    nextQuestion,
    isFinished,
    startLearning
  } = useLearning(sessionWords)

  const handleStart = (mode: LearnModeEnum) => {
    if (sessionWords.length < 5) {
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
            <span className="card-count">{t('learn.wordCount', { count: sessionWords.length })}</span>
          </div>

          <div className="learn-card" onClick={() => handleStart(LearnModeEnum.CHINESE_TO_ENGLISH)}>
            <div className="card-icon">🇨🇳→🇬🇧</div>
            <h3>{t('dashboard.mode.zh2en')}</h3>
            <p>{t('learn.zh2enDesc')}</p>
            <span className="card-count">{t('learn.wordCount', { count: sessionWords.length })}</span>
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
          if (selectedMode === LearnModeEnum.ENGLISH_TO_CHINESE) {
            startLearning(LearnModeEnum.CHINESE_TO_ENGLISH)
          }
        }}
        hasRound2={selectedMode === LearnModeEnum.ENGLISH_TO_CHINESE}
        onExit={onExit}
      />
    )
  }

  if (currentWord) {
    return (
      <div className="learn-session">
        <div className="learn-header">
          {/* 今日学习进度（双段式：今日计划 + 超额完成），与其它模式共用 */}
          <TodayProgressBar />
          <div className="learn-meta">
            <span className="learn-progress-count">
              {session?.questions.length || 0} / {session?.wordList.length || 0}
            </span>
            <div className="learn-score">
              ✅ {session?.score.correct || 0} 
              ⚠️ {session?.score.partial || 0}
              ❌ {session?.score.wrong || 0}
            </div>
          </div>
        </div>

        {selectedMode === LearnModeEnum.ENGLISH_TO_CHINESE ? (
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
