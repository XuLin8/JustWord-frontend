// src/components/templates/Layout/AppFooter.tsx
import React from 'react'
import { useTranslation } from 'react-i18next'

interface AppFooterProps {
  wordCount: number
}

export const AppFooter: React.FC<AppFooterProps> = ({ wordCount }) => {
  const { t } = useTranslation()
  return <footer className="app-footer">{t('word.footerCount', { count: wordCount })}</footer>
}