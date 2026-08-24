// src/pages/LoginGate/index.tsx
// 登录门禁（M1）：未登录进入应用时的全屏引导页。
// 纯展示组件，登录/注册动作由 App.tsx 注入（受控编排）。
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { BookOpen, Repeat, Cloud } from 'lucide-react'
import './LoginGate.css'

export interface LoginGateProps {
  onShowLogin: () => void
  onShowRegister: () => void
  /** 顶部右侧动作插槽（语言/主题切换等全局入口） */
  headerActions?: React.ReactNode
}

export const LoginGate: React.FC<LoginGateProps> = ({
  onShowLogin,
  onShowRegister,
  headerActions,
}) => {
  const { t } = useTranslation()

  const features = [
    { icon: BookOpen, title: t('gate.feature1Title'), desc: t('gate.feature1Desc') },
    { icon: Repeat, title: t('gate.feature2Title'), desc: t('gate.feature2Desc') },
    { icon: Cloud, title: t('gate.feature3Title'), desc: t('gate.feature3Desc') },
  ]

  return (
    <div className="login-gate">
      {headerActions && <div className="login-gate-top">{headerActions}</div>}

      <div className="login-gate-hero">
        <div className="login-gate-logo">
          Just<span>Word</span>
        </div>
        <p className="login-gate-tagline">{t('gate.tagline')}</p>
        <p className="login-gate-subtitle">{t('gate.subtitle')}</p>

        <div className="login-gate-features">
          {features.map((f) => (
            <div key={f.title} className="login-gate-feature lift">
              <f.icon className="login-gate-feature-icon" />
              <div>
                <div className="login-gate-feature-title">{f.title}</div>
                <div className="login-gate-feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="login-gate-actions">
          <Button size="lg" className="login-gate-btn shine" onClick={onShowLogin}>
            {t('gate.login')}
          </Button>
          <Button size="lg" variant="outline" className="login-gate-btn" onClick={onShowRegister}>
            {t('gate.register')}
          </Button>
        </div>
      </div>
    </div>
  )
}
