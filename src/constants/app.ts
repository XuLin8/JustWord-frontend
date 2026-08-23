// src/constants/app.ts
// 应用全局常量

export const APP_NAME = 'JustWord'
export const APP_DESCRIPTION = '智能单词学习应用'

// 学习配置
export const LEARNING_CONFIG = {
  /** 开始学习所需最少单词数 */
  MIN_WORDS_TO_START: 5,
  /** 最少单词数提示 */
  MIN_WORDS_HINT: '词库至少需要 5 个单词才能开始学习！',
  /** Toast 默认显示时长(ms) */
  TOAST_DEFAULT_DURATION: 3000,
} as const

// 表单验证常量
export const VALIDATION_PATTERNS = {
  /** 英文单词: 字母、空格、连字符、撇号 */
  ENGLISH_WORD: /^[a-zA-Z\s\-']+$/,
  /** 中文释义: 中文字符、标点、空格 */
  CHINESE_TEXT: /[\u4e00-\u9fa5]/,
} as const

// 路由/标签页
export const TABS = {
  WORD_BOOK: 'word' as const,
  LEARN: 'learn' as const,
}

// 搜索配置
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 0,
  PLACEHOLDER: '🔍 搜索英文或中文...',
} as const

// 可导出/导入文件类型提示
export const FILE_HINTS = {
  JSON_FORMAT: '需包含 english 和 chinese 字段的数组',
  CSV_FORMAT: '需包含 "英文/english" 和 "中文/chinese/释义" 列',
} as const
