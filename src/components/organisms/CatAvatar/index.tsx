// src/components/organisms/CatAvatar/index.tsx
// 猫咪头像：圆形透明形象 + 待机呼吸动画 + 点击抚摸（音效 + 爱心反馈）
import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCatStore } from '@/store/catStore'
import './CatAvatar.css'

interface CatAvatarProps {
  /** 尺寸档位 */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** 是否显示状态光环（默认 true） */
  showRing?: boolean
  /** 点击自定义动作（默认抚摸） */
  onClick?: () => void
}

interface Heart {
  id: number
  x: number
}

export const CatAvatar: React.FC<CatAvatarProps> = ({ size = 'md', showRing = true, onClick }) => {
  const { t } = useTranslation()
  const adopted = useCatStore((s) => s.adopted)
  const satiety = useCatStore((s) => s.satiety)
  const mood = useCatStore((s) => s.mood)
  const pet = useCatStore((s) => s.pet)

  const [hearts, setHearts] = useState<Heart[]>([])
  const heartId = useRef(0)

  const handleClick = useCallback(() => {
    void pet()
    const id = ++heartId.current
    const x = 20 + Math.random() * 60
    setHearts((h) => [...h, { id, x }])
    window.setTimeout(() => {
      setHearts((h) => h.filter((it) => it.id !== id))
    }, 900)
    onClick?.()
  }, [pet, onClick])

  const needy = adopted && (satiety < 20 || mood < 20)
  const classList = [
    'cat-avatar',
    `cat-avatar-${size}`,
    showRing ? 'has-ring' : '',
    needy ? 'is-needy' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classList}
      onClick={handleClick}
      aria-label={t('cat.petAria')}
      title={t('cat.petAria')}
    >
      {adopted ? (
        <img className="cat-avatar-img" src="/cat/cat-main.png" alt="" draggable={false} />
      ) : (
        <span className="cat-avatar-ghost" aria-hidden>
          ?
        </span>
      )}
      {hearts.map((h) => (
        <span key={h.id} className="cat-heart" style={{ left: `${h.x}%` }} aria-hidden>
          ♥
        </span>
      ))}
    </button>
  )
}
