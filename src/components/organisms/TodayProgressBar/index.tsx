// src/components/organisms/TodayProgressBar/index.tsx
// 今日学习进度条（双段式）：颜色拆分「今日计划」与「超额完成」。
//   计划段   = min(今日答对, 每日目标)   → 主题蓝渐变
//   超额段   = max(0, 今日答对 - 每日目标) → 高亮橙
// 填充总宽 = min(100, 今日答对/每日目标*100)%，未超额时按实际比例，超额后两段在 100% 内按量分摊，
// 保证 UI 占比始终正确（从 0 开始，不会出现从中间截断/无端 50% 的显示）。
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '@/store/progressStore'
import './TodayProgressBar.css'

export const TodayProgressBar: React.FC = () => {
  const { t } = useTranslation()
  const { todayCorrect, dailyTarget } = useProgressStore()

  const target = Math.max(1, dailyTarget)
  const planned = Math.min(todayCorrect, target)
  const extra = Math.max(0, todayCorrect - target)

  // 总填充宽度（超额时封顶 100%，未超额时 = 实际完成比例）
  const fillPct = Math.min(100, (todayCorrect / target) * 100)
  // 两段在填充内的宽度占比（超额时按 计划:超额 分摊，未超额时计划段占满）
  const plannedShare = todayCorrect > 0 ? (planned / todayCorrect) * 100 : 100
  const extraShare = todayCorrect > 0 ? (extra / todayCorrect) * 100 : 0

  return (
    <div className="tp-wrap">
      <div
        className="tp-bar"
        role="progressbar"
        aria-valuenow={Math.round(fillPct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="tp-fill" style={{ width: `${fillPct}%` }}>
          <span className="tp-seg is-planned" style={{ width: `${plannedShare}%` }} />
          {extra > 0 && <span className="tp-seg is-extra" style={{ width: `${extraShare}%` }} />}
        </div>
      </div>
      <div className="tp-caption">
        <span>{t('progress.todayLearned', { learned: todayCorrect, target: dailyTarget })}</span>
        {extra > 0 && <span className="tp-extra">{t('progress.extraDone', { extra })}</span>}
      </div>
    </div>
  )
}
