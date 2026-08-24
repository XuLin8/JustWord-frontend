// src/components/organisms/WordForm/index.tsx
import React, { useState } from 'react'
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
    try {
      await onSubmit(trimmedEnglish, trimmedChinese)
      showToast('单词添加成功', 'success')
      setEnglish('')
      setChinese('')
    } catch (err: any) {
      showToast(err.message || '添加失败', 'error')
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
      {error && <div className="text-sm text-destructive">{error}</div>}
    </form>
  )
}