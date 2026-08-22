// src/components/molecules/WordCard/index.tsx
import React, { useState } from 'react'
import { Button } from '../../atoms/Button'
import { Input } from '../../atoms/Input'
import type { Word } from '../../../types'
import { isValidEnglish, isValidChinese } from '../../../utils/validation'
import './WordCard.css'

interface WordCardProps {
  word: Word
  onDelete: (id: string) => Promise<void>
  onUpdate: (id: string, english: string, chinese: string) => Promise<void>
}

export const WordCard: React.FC<WordCardProps> = ({ word, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editEnglish, setEditEnglish] = useState(word.english)
  const [editChinese, setEditChinese] = useState(word.chinese)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditEnglish(word.english)
    setEditChinese(word.chinese)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditEnglish(word.english)
    setEditChinese(word.chinese)
  }

  const handleSaveEdit = async () => {
    const trimmedEnglish = editEnglish.trim()
    const trimmedChinese = editChinese.trim()

    if (!trimmedEnglish) {
      alert('⚠️ 英文单词不能为空')
      return
    }
    if (!trimmedChinese) {
      alert('⚠️ 中文释义不能为空')
      return
    }
    if (!isValidEnglish(trimmedEnglish)) {
      alert('⚠️ 英文只能包含字母、空格、连字符和撇号')
      return
    }
    if (!isValidChinese(trimmedChinese)) {
      alert('⚠️ 请输入中文释义')
      return
    }

    setIsSubmitting(true)
    await onUpdate(word.id, trimmedEnglish, trimmedChinese)
    setIsEditing(false)
    setIsSubmitting(false)
  }

  const handleDelete = async () => {
    if (window.confirm('🗑️ 确定要删除这个单词吗？')) {
      await onDelete(word.id)
    }
  }

  if (isEditing) {
    return (
      <div className="word-card editing">
        <div className="word-card-edit">
          <Input
            value={editEnglish}
            onChange={(e) => setEditEnglish(e.target.value)}
            placeholder="英文"
            disabled={isSubmitting}
          />
          <Input
            value={editChinese}
            onChange={(e) => setEditChinese(e.target.value)}
            placeholder="中文"
            disabled={isSubmitting}
          />
          <Button onClick={handleSaveEdit} loading={isSubmitting}>
            保存
          </Button>
          <Button variant="ghost" onClick={handleCancelEdit}>
            取消
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="word-card">
      <div className="word-card-content">
        <span className="word-english">{word.english}</span>
        <span className="word-separator">-</span>
        <span className="word-chinese">{word.chinese}</span>
      </div>
      <div className="word-card-actions">
        <Button variant="secondary" size="sm" onClick={handleStartEdit}>
          编辑
        </Button>
        <Button variant="danger" size="sm" onClick={handleDelete}>
          删除
        </Button>
      </div>
    </div>
  )
}