// src/components/organisms/CatBoard/index.tsx
// 云养猫 · 猫咪看板页：领养 / 状态（饱食·心情）/ 金币 / 喂食·玩耍 / 设为看板
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bone, Check, Coins, Heart, Info, Pizza, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCatStore, CAT_COST } from '@/store/catStore'
import { useUIStore } from '@/store/uiStore'
import { CatAvatar } from '@/components/organisms/CatAvatar'
import './CatBoard.css'

export const CatBoard: React.FC = () => {
  const { t } = useTranslation()
  const boardOpen = useCatStore((s) => s.boardOpen)
  const closeBoard = useCatStore((s) => s.closeBoard)
  const adopted = useCatStore((s) => s.adopted)
  const name = useCatStore((s) => s.name)
  const coins = useCatStore((s) => s.coins)
  const satiety = useCatStore((s) => s.satiety)
  const mood = useCatStore((s) => s.mood)
  const asBoard = useCatStore((s) => s.asBoard)
  const adopt = useCatStore((s) => s.adopt)
  const feed = useCatStore((s) => s.feed)
  const play = useCatStore((s) => s.play)
  const toggleAsBoard = useCatStore((s) => s.toggleAsBoard)
  const showToast = useUIStore((s) => s.showToast)

  // Esc 关闭
  useEffect(() => {
    if (!boardOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeBoard()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [boardOpen, closeBoard])

  if (!boardOpen) return null

  const onFeed = async () => {
    const ok = await feed()
    if (!ok) showToast(t('cat.insufficientCoins'), 'warning')
    else showToast(t('cat.fed'), 'success')
  }
  const onPlay = async () => {
    const ok = await play()
    if (!ok) showToast(t('cat.insufficientCoins'), 'warning')
    else showToast(t('cat.played'), 'success')
  }
  const onAdopt = () => {
    void adopt()
    showToast(t('cat.adopted'), 'success')
  }

  return (
    <div className="cat-board" role="dialog" aria-modal="true" aria-label={t('cat.title')} onClick={closeBoard}>
      <div className="cat-board-card" onClick={(e) => e.stopPropagation()}>
        <div className="cat-board-head">
          <h3 className="cat-board-title">
            <Sparkles size={18} />
            {t('cat.title')}
          </h3>
          <button type="button" className="cat-board-close" onClick={closeBoard} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        {!adopted ? (
          /* ============ 领养态 ============ */
          <div className="cat-board-adopt">
            <CatAvatar size="lg" showRing={false} />
            <p className="cat-board-adopt-text">{t('cat.adoptHint')}</p>
            <Button size="lg" onClick={onAdopt}>
              <Check size={18} />
              {t('cat.adopt')}
            </Button>
          </div>
        ) : (
          /* ============ 日常态 ============ */
          <>
            <div className="cat-board-hero">
              <CatAvatar size="xl" />
              <div className="cat-board-hero-meta">
                <b className="cat-board-name">{name}</b>
                <span className="cat-board-coins">
                  <Coins size={15} />
                  {coins}
                </span>
              </div>
            </div>

            {/* 状态条 */}
            <div className="cat-board-stats">
              <div className="cat-board-stat">
                <span className="cat-board-stat-label">
                  <Pizza size={14} />
                  {t('cat.satiety')}
                </span>
                <div className="cat-bar">
                  <div className={`cat-bar-fill is-satiety`} style={{ width: `${satiety}%` }} />
                </div>
                <span className="cat-board-stat-val">{satiety}</span>
              </div>
              <div className="cat-board-stat">
                <span className="cat-board-stat-label">
                  <Heart size={14} />
                  {t('cat.mood')}
                </span>
                <div className="cat-bar">
                  <div className={`cat-bar-fill is-mood`} style={{ width: `${mood}%` }} />
                </div>
                <span className="cat-board-stat-val">{mood}</span>
              </div>
            </div>

            {/* 互动按钮 */}
            <div className="cat-board-actions">
              <Button variant="outline" className="cat-board-action" onClick={onFeed} disabled={coins < CAT_COST.FEED}>
                <Pizza size={17} />
                <span>
                  {t('cat.feed')}
                  <small>{CAT_COST.FEED} {t('cat.coinUnit')}</small>
                </span>
              </Button>
              <Button variant="outline" className="cat-board-action" onClick={onPlay} disabled={coins < CAT_COST.PLAY}>
                <Bone size={17} />
                <span>
                  {t('cat.play')}
                  <small>{CAT_COST.PLAY} {t('cat.coinUnit')}</small>
                </span>
              </Button>
            </div>

            {/* 设为看板 */}
            <button type="button" className="cat-board-switch" onClick={() => void toggleAsBoard()}>
              <span className="cat-board-switch-label">
                {t('cat.asBoard')}
                <Info size={13} className="cat-board-switch-hint" />
              </span>
              <span className={`cat-switch ${asBoard ? 'is-on' : ''}`} aria-hidden>
                <span className="cat-switch-thumb" />
              </span>
            </button>

            <p className="cat-board-tip">{t('cat.boardTip')}</p>
          </>
        )}
      </div>
    </div>
  )
}
