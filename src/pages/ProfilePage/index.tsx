// src/pages/ProfilePage/index.tsx
// 「我的」页：账号信息 + 云养猫入口 + 数据/设置入口
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { CatAvatar } from '@/components/organisms/CatAvatar'
import { useCatStore } from '@/store/catStore'

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const adopted = useCatStore((s) => s.adopted)
  const name = useCatStore((s) => s.name)
  const coins = useCatStore((s) => s.coins)
  const satiety = useCatStore((s) => s.satiety)
  const mood = useCatStore((s) => s.mood)
  const openBoard = useCatStore((s) => s.openBoard)

  return (
    <section className="flex flex-col gap-4" aria-label={t('nav.profile')}>
      <h2 className="text-2xl font-semibold">{t('nav.profile')}</h2>

      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">{t('profile.account')}</h3>
        <p className="mt-2 text-lg font-semibold">{user?.username}</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      {/* 云养猫入口 */}
      <div
        role="button"
        tabIndex={0}
        onClick={openBoard}
        onKeyDown={(e) => e.key === 'Enter' && openBoard()}
        className="cursor-pointer rounded-lg border bg-card p-6 text-left text-card-foreground shadow-sm transition hover:bg-accent/50"
      >
        <div className="flex items-center gap-4">
          <CatAvatar size="md" showRing={false} />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-muted-foreground">{t('cat.title')}</h3>
            <p className="mt-1 truncate font-semibold">
              {adopted ? t('cat.profileCoins', { name, coins }) : t('cat.notAdopted')}
            </p>
            <p className="text-xs text-muted-foreground">
              {adopted ? t('cat.satietyShort', { n: satiety }) + ' · ' + t('cat.moodShort', { n: mood }) : ''}
            </p>
          </div>
          <span aria-hidden className="text-muted-foreground">›</span>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">{t('profile.dataAndSync')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t('profile.comingSoon')}</p>
      </div>
    </section>
  )
}
