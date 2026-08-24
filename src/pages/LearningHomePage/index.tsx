// src/pages/LearningHomePage/index.tsx
// 核心学习首页（登录后默认落地页）。
// M2-A：占位骨架 + 词库入口；M2-D 扩展为沉浸式背单词主界面（搜索条 + 今日任务卡片 + 背诵主区 + 控制区）。
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/atoms/Button'

interface LearningHomePageProps {
  /** 跳转到词库 Tab 选词书（M2-A 占位入口，M2-D 后由今日任务卡片接管） */
  onGoWordbook?: () => void
}

export const LearningHomePage: React.FC<LearningHomePageProps> = ({ onGoWordbook }) => {
  const { t } = useTranslation()

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center" aria-label={t('nav.home')}>
      <h2 className="text-2xl font-semibold">{t('nav.home')}</h2>
      <p className="text-muted-foreground">{t('learningHome.placeholder')}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{t('learningHome.subscribeHint')}</p>
      {onGoWordbook && <Button onClick={onGoWordbook}>{t('learningHome.goWordbook')}</Button>}
    </section>
  )
}
