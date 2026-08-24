// src/components/organisms/PWAInstallPrompt/index.tsx
// M4-PWA-安装引导：beforeinstallprompt 捕获 + 安装引导卡片 + iOS「添加到主屏幕」指引
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './PWAInstallPrompt.css'

// beforeinstallprompt 的标准事件类型（TS 未内置）
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'justword_pwa_install_dismissed'

// 是否已以独立窗口模式运行（从主屏幕打开 / iOS standalone）
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true

// iOS Safari 不支持 beforeinstallprompt，改用「添加到主屏幕」指引
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export const PWAInstallPrompt: React.FC = () => {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [iosMode, setIosMode] = useState(false)

  useEffect(() => {
    // 已安装 / 独立模式运行时不提示
    if (isStandalone()) return
    // 用户此前已关闭引导，不再打扰
    if (localStorage.getItem(DISMISS_KEY)) return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault() // 阻止浏览器默认安装条，交由自绘引导
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const handleAppInstalled = () => {
      setVisible(false)
      localStorage.setItem(DISMISS_KEY, '1')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // iOS：事件不存在，直接展示「添加到主屏幕」指引
    if (isIOS()) {
      setIosMode(true)
      setVisible(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt() // 触发系统安装弹窗
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setVisible(false)
      localStorage.setItem(DISMISS_KEY, '1')
    }
    setDeferredPrompt(null) // 每次事件只可 prompt 一次
  }

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  if (!visible) return null

  return (
    <div className="pwa-install" role="dialog" aria-label={t('pwa.installTitle')}>
      <div className="pwa-install-card">
        <img className="pwa-install-icon" src="/icons/icon-192.png" alt="JustWord" />
        <div className="pwa-install-info">
          <b className="pwa-install-title">{t('app.name')}</b>
          <span className="pwa-install-desc">
            {iosMode ? t('pwa.installIos') : t('pwa.installDesc')}
          </span>
        </div>
        <div className="pwa-install-actions">
          {!iosMode && (
            <button className="pwa-install-btn primary" onClick={install}>
              {t('pwa.install')}
            </button>
          )}
          <button className="pwa-install-btn" onClick={dismiss}>
            {iosMode ? t('pwa.gotIt') : t('pwa.dismiss')}
          </button>
        </div>
      </div>
    </div>
  )
}
