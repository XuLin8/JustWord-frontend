// src/utils/compare.ts
// 答案比对工具（供听词默写 / 表格背诵 / 看词选意使用）
// 参考 useLearning 的 Levenshtein 方案，抽离为可复用纯函数。

import { AnswerResult } from '../types/learning.types'

/** Levenshtein 距离 */
export function levenshtein(a: string, b: string): number {
  const s1 = a.toLowerCase().trim()
  const s2 = b.toLowerCase().trim()
  const matrix: number[][] = []
  for (let i = 0; i <= s1.length; i++) matrix[i] = [i]
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
    }
  }
  return matrix[s1.length][s2.length]
}

/** 英文拼写比对：完全一致=correct，高度相似=typo，否则 wrong */
export function checkEnglish(userInput: string, correct: string): AnswerResult {
  const similarity = 1 - levenshtein(userInput, correct) / Math.max(correct.length, 1)
  if (similarity >= 0.999) return AnswerResult.CORRECT
  if (similarity >= 0.8) return AnswerResult.TYPO
  return AnswerResult.WRONG
}

/** 中文释义比对：完全一致或包含关键释义=correct，否则 wrong */
export function checkChinese(userInput: string, correct: string): AnswerResult {
  const input = userInput.trim()
  const target = correct.trim()
  if (!input) return AnswerResult.WRONG
  if (input === target) return AnswerResult.CORRECT
  const correctWords = target.split(/[，,、;\s]+/).filter((w) => w.length > 0)
  const matched = correctWords.filter((w) => input.includes(w))
  if (matched.length > 0 && matched.length >= correctWords.length * 0.5) return AnswerResult.CORRECT
  // 输入包含正确答案 或 正确答案包含输入（简短缩写）
  if (input.length >= 2 && (target.includes(input) || input.includes(target))) return AnswerResult.CORRECT
  return AnswerResult.WRONG
}
