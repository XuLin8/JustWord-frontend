// src/components/organisms/WordForm/index.tsx
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '../../atoms/Input'
import { Button } from '../../atoms/Button'
import { isValidEnglish, isValidChinese } from '../../../utils/validation'
import { useUIStore } from '../../../store/uiStore'

interface WordFormProps {
  onSubmit: (english: string, chinese: string) => Promise<void>
}

export const WordForm: React.FC<WordFormProps> = ({ onSubmit }) => {
  const [english, setEnglish] = useState('')
  const [chinese, setChinese] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useUIStore()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedEnglish = english.trim()
    const trimmedChinese = chinese.trim()

    if (!trimmedEnglish) {
      setError(t('word.emptyEnglish'))
      return
    }
    if (!trimmedChinese) {
      setError(t('word.emptyChinese'))
      return
    }
    if (!isValidEnglish(trimmedEnglish)) {
      setError(t('word.invalidEnglish'))
      return
    }
    if (!isValidChinese(trimmedChinese)) {
      setError(t('word.invalidChinese'))
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(trimmedEnglish, trimmedChinese)
      showToast(t('word.addSuccess'), 'success')
      setEnglish('')
      setChinese('')
    } catch (err: any) {
      showToast(err.message || t('word.addFailed'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="mb-6 flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm" onSubmit={handleSubmit}>
      <div className="flex items-end gap-2 max-sm:flex-col max-sm:items-stretch">
        <Input
          id="add-english"
          name="english"
          placeholder={t('word.englishPlaceholder')}
          value={english}
          onChange={(e) => {
            const filtered = e.target.value.replace(/[^a-zA-Z\s\-']/g, '')
            setEnglish(filtered)
          }}
          autoComplete="off"
          disabled={isSubmitting}
          fullWidth
        />
        <Input
          id="add-chinese"
          name="chinese"
          placeholder={t('word.chinesePlaceholder')}
          value={chinese}
          onChange={(e) => setChinese(e.target.value)}
          autoComplete="off"
          disabled={isSubmitting}
          fullWidth
        />
        <Button type="submit" loading={isSubmitting}>
          {t('word.add')}
        </Button>
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
    </form>
  )
}