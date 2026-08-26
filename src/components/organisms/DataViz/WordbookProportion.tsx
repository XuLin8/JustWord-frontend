// src/components/organisms/DataViz/WordbookProportion.tsx
// 单词本学习占比：展示各单词本已学 / 掌握进度条（个人主页「解决数」卡片）
import React from 'react'
import { useTranslation } from 'react-i18next'
import type { WordbookStatsItem } from '@/api/endpoints/wordbooks.api'

interface WordbookProportionProps {
  items: WordbookStatsItem[]
}

export const WordbookProportion: React.FC<WordbookProportionProps> = ({ items }) => {
  const { t } = useTranslation()

  const totalWords = items.reduce((s, b) => s + b.total, 0)
  const learnedWords = items.reduce((s, b) => s + b.learned, 0)
  const sorted = [...items].sort(
    (a, b) => b.learned_rate - a.learned_rate || b.total - a.total,
  )

  if (items.length === 0) {
    return <p className="dash-row-item-empty">{t('viz.bookStatsEmpty')}</p>
  }

  return (
    <div className="book-stats">
      <p className="book-stats-summary">
        {t('viz.bookStatsSummary', { books: items.length, learned: learnedWords, total: totalWords })}
      </p>
      <ul className="book-stats-list">
        {sorted.map((b) => (
          <li key={b.id} className="book-stat-item">
            <div className="book-stat-head">
              <span className="book-stat-name" title={b.name}>
                {b.name}
              </span>
              <span className="book-stat-nums">
                {t('viz.bookStatsLearned', { learned: b.learned, total: b.total })}
              </span>
            </div>
            <div className="book-stat-bar">
              <i
                className="book-stat-learned"
                style={{ width: `${Math.max(0, Math.min(100, b.learned_rate * 100))}%` }}
              />
              <i
                className="book-stat-mastered"
                style={{ width: `${Math.max(0, Math.min(100, b.mastered_rate * 100))}%` }}
              />
            </div>
            <div className="book-stat-foot">
              <span>{t('viz.bookStatsMastered', { mastered: b.mastered })}</span>
              <span>{Math.round(b.learned_rate * 100)}%</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
