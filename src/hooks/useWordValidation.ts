/**
 * ============================================
 * 文件用途：单词表单验证自定义 Hook
 * 主要功能：
 *   - 验证英文输入（格式、非空）
 *   - 验证中文输入（包含中文字符、非空）
 *   - 返回统一的验证结果（是否通过 + 错误信息）
 *   - 管理错误状态（设置、清除）
 * 依赖关系：
 *   - react（useState）
 *   - 验证工具函数（../utils/validation）
 * 导出内容：
 *   - useWordValidation：自定义 Hook
 *   - ValidationResult：验证结果接口
 * ============================================
 */

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