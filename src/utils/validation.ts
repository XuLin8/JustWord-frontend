// 验证英文：只允许字母、空格、连字符、撇号
export const isValidEnglish = (text: string): boolean => {
  return /^[a-zA-Z\s\-']+$/.test(text.trim())
}

// 验证中文：包含中文字符
export const isValidChinese = (text: string): boolean => {
  return /[\u4e00-\u9fa5]/.test(text.trim())
}

// 验证是否为空
export const isNotEmpty = (text: string): boolean => {
  return text.trim().length > 0
}