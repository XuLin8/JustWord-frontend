// src/components/molecules/WordCard/index.tsx
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../atoms/Button'
import { Input } from '../../atoms/Input'
import type { Word } from '../../../types'
import { isValidEnglish, isValidChinese } from '../../../utils/validation'
import { useUIStore } from '../../../store/uiStore'
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

  const { showToast, openConfirmDialog } = useUIStore()
  const { t } = useTranslation()

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
      showToast(t('word.editEnglishEmpty'), 'warning')
      return
    }
    if (!trimmedChinese) {
      showToast(t('word.editChineseEmpty'), 'warning')
      return
    }
    if (!isValidEnglish(trimmedEnglish)) {
      showToast(t('word.invalidEnglish'), 'warning')
      return
    }
    if (!isValidChinese(trimmedChinese)) {
      showToast(t('word.invalidChinese'), 'warning')
      return
    }

    setIsSubmitting(true)
    try {
      await onUpdate(word.id, trimmedEnglish, trimmedChinese)
      showToast(t('word.updateSuccess'), 'success')
      setIsEditing(false)
    } catch (err: any) {
      showToast(err.message || t('word.updateFailed'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    openConfirmDialog({
      title: t('word.deleteTitle'),
      description: t('word.deleteConfirm', { word: word.english }),
      confirmText: t('word.deleteConfirmText'),
      cancelText: t('word.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await onDelete(word.id)
          showToast(t('word.deleteSuccess'), 'success')
        } catch (err: any) {
          showToast(err.message || t('word.deleteFailed'), 'error')
        }
      },
    })
  }

  if (isEditing) {
    return (
      <div className="word-card editing">
        <div className="word-card-edit">
          <Input
            value={editEnglish}
            onChange={(e) => setEditEnglish(e.target.value)}
            placeholder={t('word.english')}
            disabled={isSubmitting}
          />
          <Input
            value={editChinese}
            onChange={(e) => setEditChinese(e.target.value)}
            placeholder={t('word.chinese')}
            disabled={isSubmitting}
          />
          <Button onClick={handleSaveEdit} loading={isSubmitting}>
            {t('word.save')}
          </Button>
          <Button variant="ghost" onClick={handleCancelEdit}>
            {t('word.cancel')}
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
          {t('word.edit')}
        </Button>
        <Button variant="danger" size="sm" onClick={handleDelete}>
          {t('word.delete')}
        </Button>
      </div>
    </div>
  )
}