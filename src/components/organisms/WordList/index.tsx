// src/components/organisms/WordList/index.tsx
import React from 'react'
import { WordCard } from '../../molecules/WordCard'
import { Spinner } from '../../atoms/Spinner'
import type { Word } from '../../../types'
import './WordList.css'

interface WordListProps {
  words: Word[]
  loading: boolean
  onDelete: (id: string) => Promise<void>
  onUpdate: (id: string, english: string, chinese: string) => Promise<void>
}

export const WordList: React.FC<WordListProps> = ({
  words,
  loading,
  onDelete,
  onUpdate,
}) => {
  if (loading) {
    return (
      <div className="word-list-loading">
        <Spinner size="lg" />
        <p>加载中...</p>
      </div>
    )
  }

  if (words.length === 0) {
    return <p className="word-list-empty">还没有单词，添加一个吧！</p>
  }

  return (
    <div className="word-list">
      {words.map((word) => (
        <WordCard
          key={word.id}
          word={word}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  )
}