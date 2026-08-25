// src/components/organisms/RecitationModes/CheckinButton.tsx
// 打卡按钮（各背诵模式完成页共用）：今日答对 >= 每日目标才可点击；未达标显示还差 N 个。
// 数据以进度 store（后端为准）驱动，成功后联动云养猫得币。
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useCheckinStore } from '@/store/checkinStore'
import { useProgressStore } from '@/store/progressStore'
import { useUIStore } from '@/store/uiStore'
import { useCatStore, CAT_REWARD } from '@/store/catStore'
import { useFeatureStore } from '@/store/featureStore'

export const CheckinButton: React.FC = () => {
  const { t } = useTranslation()
  const { checkIn, todayChecked } = useCheckinStore()
  const { remaining, load } = useProgressStore()
  const showToast = useUIStore((s) => s.showToast)
  const catEnabled = useFeatureStore((s) => s.cat)
  const earnCoins = useCatStore((s) => s.earnCoins)

  const onCheckin = () => {
    void (async () => {
      const ok = await checkIn()
      if (ok) {
        showToast(t('recitation.checkinSuccess'), 'success')
        if (catEnabled) void earnCoins(CAT_REWARD.CHECKIN) // 云养猫：打卡得币（P0-5 屏蔽）
      } else {
        void load() // 刷新后端进度，展示最新 remaining
      }
    })()
  }

  return (
    <Button
      size="lg"
      className="rec-done-checkin"
      disabled={todayChecked || remaining > 0}
      onClick={onCheckin}
    >
      <Check size={18} />
      {todayChecked
        ? t('recitation.checked')
        : remaining > 0
          ? t('recitation.checkinNeeds', { n: remaining })
          : t('recitation.checkin')}
    </Button>
  )
}
