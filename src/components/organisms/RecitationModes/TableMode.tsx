// src/components/organisms/RecitationModes/TableMode.tsx
// M2-F 表格背诵法（Excel 背诵法）：
//   阶段一 正向填意：给出英文列，在中文列填写释义，逐格比对
//   阶段二 反向遮罩写词：隐藏英文列，按中文意思写出英文列
// 支持单元格焦点跳格（Enter/Tab）、错词标记、完成后错词复习
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, ChevronRight, Grid3X3, PartyPopper, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnswerResult } from '@/types/learning.types'
import { type PlanWord } from '@/store/learningPlanStore'
import { useLearningStore } from '@/store/learningStore'
import { checkChinese, checkEnglish } from '@/utils/compare'
import './RecitationModes.css'

type Phase = 'en2zh' | 'zh2en'

interface TableModeProps {
  words: PlanWord[]
  onExit: () => void
}

export const TableMode: React.FC<TableModeProps> = ({ words, onExit }) => {
  const { t } = useTranslation()
  const recordJudgement = useLearningStore((s) => s.recordJudgement)

  const [phase, setPhase] = useState<Phase>('en2zh')
  const [pool, setPool] = useState<PlanWord[]>(words) // 当前表格词集（错词复习时缩为错词）
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, AnswerResult>>({})
  const [finished, setFinished] = useState(false)
  const [wrongWords, setWrongWords] = useState<PlanWord[]>([])

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const judgeCell = useCallback(
    (w: PlanWord, value: string) => {
      const trimmed = value.trim()
      const res =
        phase === 'en2zh'
          ? checkChinese(trimmed, w.meaning)
          : checkEnglish(trimmed, w.word)
      setResults((prev) => ({ ...prev, [w.id]: res }))
      // 实时 upsert 学习记录
      void recordJudgement({
        wordId: w.id,
        english: w.word,
        chinese: w.meaning,
        known: res === AnswerResult.CORRECT,
      })
      return res
    },
    [phase, recordJudgement],
  )

  const onCellKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, w: PlanWord) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        judgeCell(w, inputs[w.id] ?? '')
        // 焦点跳格到下一行
        const idx = pool.findIndex((x) => x.id === w.id)
        const nextRow = pool[idx + 1]
        if (nextRow) inputRefs.current[nextRow.id]?.focus()
      }
    },
    [judgeCell, inputs, pool],
  )

  /** 完成当前阶段：比对所有格（未填记为错），统计 */
  const finishPhase = useCallback(() => {
    const nextResults = { ...results }
    const wrong: PlanWord[] = []
    for (const w of pool) {
      const val = inputs[w.id] ?? ''
      const res = val.trim() ? judgeCell(w, val) : AnswerResult.WRONG
      nextResults[w.id] = res
      if (res !== AnswerResult.CORRECT) wrong.push(w)
    }
    setResults(nextResults)
    if (phase === 'en2zh') {
      // 进入反向默写阶段（隐藏英文列）
      setPhase('zh2en')
      setInputs({})
      setResults({})
      // 聚焦第一格
      requestAnimationFrame(() => inputRefs.current[pool[0]?.id]?.focus())
    } else {
      setFinished(true)
      setWrongWords(wrong)
    }
  }, [phase, pool, inputs, results, judgeCell])

  /** 错词复习：以错词重开反向默写 */
  const reviewWrong = useCallback(() => {
    setPool(wrongWords)
    setPhase('zh2en')
    setInputs({})
    setResults({})
    setFinished(false)
    requestAnimationFrame(() => inputRefs.current[wrongWords[0]?.id]?.focus())
  }, [wrongWords])

  const phaseTitle = useMemo(
    () => (phase === 'en2zh' ? t('modes.tablePhase1') : t('modes.tablePhase2')),
    [phase, t],
  )

  if (finished) {
    const total = pool.length
    const correct = pool.filter((w) => results[w.id] === AnswerResult.CORRECT).length
    return (
      <div className="rec-done rm-done">
        <div className="rec-done-icon">
          <PartyPopper size={40} />
        </div>
        <h3 className="rec-done-title">{t('modes.tableDoneTitle')}</h3>
        <p className="rec-done-sub">{t('modes.tableDoneSub', { correct, total })}</p>

        {wrongWords.length > 0 && (
          <div className="rm-wrong-list">
            <p className="rm-wrong-title">{t('modes.wrongWords')}</p>
            <div className="rm-wrong-tags">
              {wrongWords.map((w) => (
                <span key={w.id} className="rm-wrong-tag">{w.word}</span>
              ))}
            </div>
          </div>
        )}

        <div className="rec-done-actions">
          {wrongWords.length > 0 && (
            <Button className="rec-done-checkin" onClick={reviewWrong}>
              <RotateCcw size={16} />
              {t('modes.reviewWrong')}
            </Button>
          )}
          <Button variant="ghost" onClick={onExit}>
            <ArrowLeft size={16} />
            {t('modes.backHome')}
          </Button>
        </div>
      </div>
    )
  }

  if (pool.length === 0) return null

  return (
    <div className="rec-stage rm-mode">
      <div className="rec-stage-head">
        <span className="rm-mode-tag">
          <Grid3X3 size={14} />
          {t('modes.tableTitle')}
        </span>
        <span className="rm-phase-badge">{phaseTitle}</span>
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft size={16} />
          {t('modes.exit')}
        </Button>
      </div>

      <p className="rm-table-hint">{t('modes.tableHint')}</p>

      <div className="rm-table-scroll">
        <table className="rm-table">
          <thead>
            <tr>
              <th className="rm-th-index">#</th>
              <th>{phase === 'en2zh' ? t('modes.colWord') : t('modes.colMeaning')}</th>
              <th>{phase === 'en2zh' ? t('modes.colMeaning') : t('modes.colWord')}</th>
              <th className="rm-th-status">{t('modes.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {pool.map((w, i) => {
              const res = results[w.id]
              return (
                <tr key={w.id}>
                  <td className="rm-td-index">{i + 1}</td>
                  <td className="rm-td-label">
                    {phase === 'en2zh' ? w.word : w.meaning}
                  </td>
                  <td className="rm-td-input">
                    <input
                      ref={(el) => { inputRefs.current[w.id] = el }}
                      className="rm-cell"
                      value={inputs[w.id] ?? ''}
                      disabled={phase === 'en2zh' && res !== undefined}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [w.id]: e.target.value }))}
                      onKeyDown={(e) => onCellKeyDown(e, w)}
                      onBlur={() => judgeCell(w, inputs[w.id] ?? '')}
                      autoFocus={i === 0}
                    />
                  </td>
                  <td className="rm-td-status">
                    {res === undefined ? (
                      <span className="rm-status-pending">·</span>
                    ) : res === AnswerResult.CORRECT ? (
                      <Check size={16} className="rm-status-correct" />
                    ) : (
                      <X size={16} className="rm-status-wrong" />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="rec-actions">
        <Button size="lg" className="rec-next-btn" onClick={finishPhase}>
          {phase === 'en2zh' ? t('modes.tableNext') : t('modes.tableFinish')}
          <ChevronRight size={18} />
        </Button>
      </div>

      <p className="rec-kbd-hint">
        <kbd>Enter</kbd> / <kbd>Tab</kbd> {t('modes.enterHint')} · {t('modes.tableHint2')}
      </p>
    </div>
  )
}
