// src/hooks/useLearningSession.ts
// 学习会话时长上报（P1 每日聚合）：进入背诵模式记录开始时间，离开（卸载/模式切换）时上报秒数。
// 后端把时长并入对应学习日的 DailyStat.duration_seconds，支撑热力图/雷达图「专注度」维度。
import { useEffect, useRef } from 'react'
import { learningApi } from '@/api/endpoints/learning.api'

export function useLearningSession(mode: string, active = true): void {
  const startRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!active) return
    startRef.current = Date.now()
    return () => {
      const seconds = Math.max(1, Math.round((Date.now() - startRef.current) / 1000))
      learningApi
        .reportSession({ duration_seconds: seconds, mode })
        .catch(() => undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, active])
}
