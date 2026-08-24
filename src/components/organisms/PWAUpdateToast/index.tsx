// src/components/organisms/PWAUpdateToast/index.tsx
// M3-C 更新提示：新版本可刷新 + 离线就绪提示
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { registerSW } from 'virtual:pwa-register'
import './PWAUpdateToast.css'

export const PWAUpdateToast: React.FC = () => {
  const { t } = useTranslation()
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [updateSW, setUpdateSW] = useState<((reload?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    let timer: number | undefined
    // 开发环境（devOptions.enabled=false）为 no-op；生产构建注入真实 Service Worker
    const sw = registerSW({
      immediate: true,
      onOfflineReady() {
        setOfflineReady(true)
        timer = window.setTimeout(() => setOfflineReady(false), 6000)
      },
      onNeedRefresh() {
        setNeedRefresh(true)
      },
    })
    setUpdateSW(() => sw)
    return () => window.clearTimeout(timer)
  }, [])

  const reload = () => {
    void updateSW?.(true)
  }

  return (
    <>
      {needRefresh && (
        <div className="pwa-toast" role="status">
          <span className="pwa-toast-text">{t('pwa.updateAvailable')}</span>
          <div className="pwa-toast-actions">
            <button className="pwa-toast-btn primary" onClick={reload}>
              {t('pwa.reload')}
            </button>
            <button className="pwa-toast-btn" onClick={() => setNeedRefresh(false)}>
              {t('pwa.dismiss')}
            </button>
          </div>
        </div>
      )}
      {offlineReady && (
        <div className="pwa-toast" role="status">
          <span className="pwa-toast-text">{t('pwa.offlineReady')}</span>
        </div>
      )}
    </>
  )
}
