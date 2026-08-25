// src/components/organisms/RecitationModes/RulePicker.tsx
// M2-F 背诵规则自选：认识判定 / 听词默写 / 看词选意 / 表格背诵法
// （两轮学习为表格记忆的中间产物，已从入口隐藏，后续随表格记忆完善再定去留）
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Ear, Grid3X3, Hand, ListChecks } from 'lucide-react'
import './RecitationModes.css'

export type RecitationRule = 'judge' | 'listen' | 'choice' | 'table' | 'round2'

interface RulePickerProps {
  onSelect: (rule: RecitationRule) => void
  onBack: () => void
}

export const RulePicker: React.FC<RulePickerProps> = ({ onSelect, onBack }) => {
  const { t } = useTranslation()

  const rules: { id: RecitationRule; icon: React.ReactNode; title: string; desc: string }[] = [
    {
      id: 'judge',
      icon: <Hand size={22} />,
      title: t('modes.judgeTitle'),
      desc: t('modes.judgeDesc'),
    },
    {
      id: 'listen',
      icon: <Ear size={22} />,
      title: t('modes.listenTitle'),
      desc: t('modes.listenDesc'),
    },
    {
      id: 'choice',
      icon: <ListChecks size={22} />,
      title: t('modes.choiceTitle'),
      desc: t('modes.choiceDesc'),
    },
    {
      id: 'table',
      icon: <Grid3X3 size={22} />,
      title: t('modes.tableTitle'),
      desc: t('modes.tableDesc'),
    },
  ]

  return (
    <div className="rm-picker">
      <div className="rm-picker-head">
        <button className="rm-back-btn" onClick={onBack} aria-label={t('modes.back')}>
          <ArrowLeft size={18} />
          {t('modes.back')}
        </button>
        <h2 className="rm-picker-title">{t('modes.pickTitle')}</h2>
        <p className="rm-picker-sub">{t('modes.pickSub')}</p>
      </div>

      <div className="rm-picker-grid">
        {rules.map((r) => (
          <button key={r.id} className="rm-picker-card" onClick={() => onSelect(r.id)}>
            <span className="rm-picker-icon">{r.icon}</span>
            <span className="rm-picker-card-title">{r.title}</span>
            <span className="rm-picker-card-desc">{r.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
