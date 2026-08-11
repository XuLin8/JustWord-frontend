/**
 * ============================================
 * 文件用途：表单输入验证工具函数
 * 主要功能：
 *   - 验证英文单词格式（只允许字母、空格、连字符、撇号）
 *   - 验证中文内容（是否包含中文字符）
 *   - 验证是否为空字符串
 * 依赖关系：
 *   - 无外部依赖（纯函数）
 * 导出内容：
 *   - isValidEnglish：英文格式验证
 *   - isValidChinese：中文格式验证
 *   - isNotEmpty：空值验证
 * ============================================
 */


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