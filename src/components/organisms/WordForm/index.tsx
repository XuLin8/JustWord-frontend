// src/components/organisms/WordForm/index.tsx
import React, { useState } from 'react'
import { Input } from '../../atoms/Input'
import { Button } from '../../atoms/Button'
import { isValidEnglish, isValidChinese } from '../../../utils/validation'
import './WordForm.css'

interface WordFormProps {
  onSubmit: (english: string, chinese: string) => Promise<void>
}

export const WordForm: React.FC<WordFormProps> = ({ onSubmit }) => {
  const [english, setEnglish] = useState('')
  const [chinese, setChinese] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedEnglish = english.trim()
    const trimmedChinese = chinese.trim()

    if (!trimmedEnglish) {
      setError('请输入英文单词')
      return
    }
    if (!trimmedChinese) {
      setError('请输入中文释义')
      return
    }
    if (!isValidEnglish(trimmedEnglish)) {
      setError('英文只能包含字母、空格、连字符和撇号')
      return
    }
    if (!isValidChinese(trimmedChinese)) {
      setError('请输入中文释义')
      return
    }

    setIsSubmitting(true)
    await onSubmit(trimmedEnglish, trimmedChinese)
    setEnglish('')
    setChinese('')
    setIsSubmitting(false)
  }

  return (
    <form className="word-form" onSubmit={handleSubmit}>
      <div className="word-form-row">
        <Input
          id="add-english"
          name="english"
          placeholder="英文单词 (仅字母)"
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
          placeholder="中文释义"
          value={chinese}
          onChange={(e) => setChinese(e.target.value)}
          autoComplete="off"
          disabled={isSubmitting}
          fullWidth
        />
        <Button type="submit" loading={isSubmitting}>
          添加
        </Button>
      </div>
      {error && <div className="word-form-error">{error}</div>}
    </form>
  )
}