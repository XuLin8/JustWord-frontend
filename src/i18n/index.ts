// src/i18n/index.ts
// i18n 初始化（react-i18next）。当前作为"国际化预留"：
// 已接入语言包解析、语言持久化与切换基础，待逐步迁移各组件文案。
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en-US', label: 'English' },
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

export const LANGUAGE_STORAGE_KEY = 'justword.locale'

/** 读取当前语言：优先 localStorage，其次浏览器语言，兜底中文。 */
export function getInitialLanguage(): LanguageCode {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
    return saved as LanguageCode
  }
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith('en')) return 'en-US'
  return 'zh-CN'
}

/** 切换并持久化语言。 */
export function setLanguage(lang: LanguageCode): void {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  void i18n.changeLanguage(lang)
}

void i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'en-US': { translation: enUS },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false, // React 已做 XSS 转义
  },
})

export default i18n