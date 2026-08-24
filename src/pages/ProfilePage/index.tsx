// src/pages/ProfilePage/index.tsx
// 「我的」页：账号信息 + 数据/设置入口（后续承载云养猫看板入口占位）。
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <section className="flex flex-col gap-4" aria-label={t('nav.profile')}>
      <h2 className="text-2xl font-semibold">{t('nav.profile')}</h2>

      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">{t('profile.account')}</h3>
        <p className="mt-2 text-lg font-semibold">{user?.username}</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">{t('profile.dataAndSync')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t('profile.comingSoon')}</p>
      </div>
    </section>
  )
}
