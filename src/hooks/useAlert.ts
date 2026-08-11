/**
 * ============================================
 * 文件用途：防抖 Alert 自定义 Hook（防止频繁弹窗）
 * 主要功能：
 *   - 限制 alert 弹窗频率（默认 500ms 内只弹一次）
 *   - 避免短时间内多次弹窗干扰用户
 * 依赖关系：
 *   - react（useRef）
 * 导出内容：
 *   - useAlert：自定义 Hook，返回防抖后的 showAlert 方法
 * ============================================
 */

import { useRef } from 'react'

export const useAlert = () => {
  const lastAlertTime = useRef(0)

  const showAlert = (message: string) => {
    const now = Date.now()
    if (now - lastAlertTime.current > 500) {
      alert(message)
      lastAlertTime.current = now
    }
  }

  return { showAlert }
}