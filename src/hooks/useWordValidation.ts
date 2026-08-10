// src/hooks/useWordValidation.ts

import { useState } from 'react'
import { isValidEnglish, isValidChinese, isNotEmpty } from '../utils/validation'

interface ValidationResult {
  isValid: boolean
  error: string | null
}

export const useWordValidation = () => {
  const [error, setError] = useState<string | null>(null)

  const validateWord = (english: string, chinese: string): ValidationResult => {
    const trimmedEnglish = english.trim()
    const trimmedChinese = chinese.trim()

    if (!isNotEmpty(trimmedEnglish)) {
      return { isValid: false, error: '请输入英文单词' }
    }

    if (!isNotEmpty(trimmedChinese)) {
      return { isValid: false, error: '请输入中文释义' }
    }

    if (!isValidEnglish(trimmedEnglish)) {
      return { isValid: false, error: '英文只能包含字母、空格、连字符和撇号' }
    }

    if (!isValidChinese(trimmedChinese)) {
      return { isValid: false, error: '请输入中文释义' }
    }

    return { isValid: true, error: null }
  }

  const clearError = () => setError(null)
  const setValidationError = (message: string) => setError(message)

  return {
    error,
    setValidationError,
    clearError,
    validateWord,
  }
}