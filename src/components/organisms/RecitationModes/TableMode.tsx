// src/components/organisms/RecitationModes/TableMode.tsx
// M2-F 表格背诵法（Excel 背诵法）：
//   阶段一 正向填意：给出英文列，在中文列填写释义，逐格比对（英译中三档判定）
//   阶段二 反向遮罩写词：隐藏英文列，按中文意思写出英文列（中译英 ≥90% 命中为正确）
// 判定规则（用户确认）：英译中 全部命中=正确 / 部分命中>30%=部分正确 / 否则不正确；
// 中译英 命中≥90%=正确 否则错误；仅 部分正确 + 完全正确 计入学习进度。
// 每格判定一次即提交后端 SM-2；判后显示正确答案方便比对；完成后错词复习。
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, ChevronRight, Grid3X3, PartyPopper, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnswerResult } from '@/types/learning.types'
import { type PlanWord } from '@/store/learningPlanStore'
import { useLearningStore } from '@/store/learningStore'
import { checkChineseTable, checkEnglishTable } from '@/utils/compare'
import { useReviewStore } from '@/store/reviewStore'
import { useProgressStore } from '@/store/progressStore'
import { CheckinButton } from '@/components/organisms/RecitationModes/CheckinButton'
import { useLearningSession } from '@/hooks/useLearningSession'
import './RecitationModes.css'

type Phase = 'en2zh' | 'zh2en'

interface TableModeProps {
  words: PlanWord[]
  onExit: () => void
}

export const TableMode: React.FC<TableModeProps> = ({ words, onExit }) => {
  const { t } = useTranslation()
  const recordJudgement = useLearningStore((s) => s.recordJudgement)
  const submitAttempt = useReviewStore((s) => s.submitAttempt)
  const progressStore = useProgressStore()

  // 会话时长上报
  useLearningSession('table')

  const [phase, setPhase] = useState<Phase>('en2zh')
  const [pool, setPool] = useState<PlanWord[]>(words) // 当前表格词集（错词复习时缩为错词）
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, AnswerResult>>({})
  const [finished, setFinished] = useState(false)
  const [wrongWords, setWrongWords] = useState<PlanWord[]>([])

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  // 结果镜像 ref：避免回调闭包里 results 过期导致同一格被重复判定/重复提交
  const resultsRef = useRef<Record<string, AnswerResult>>({})
  // 每格反应耗时：聚焦该格时记录时间点
  const cellFocusAtRef = useRef<number>(Date.now())

  const setRes = useCallback((id: string, res: AnswerResult) => {
    resultsRef.current = { ...resultsRef.current, [id]: res }
    setResults(resultsRef.current)
  }, [])

  const resetRound = useCallback(() => {
    setInputs({})
    setResults({})
    resultsRef.current = {}
  }, [])

  /** 判定一格（仅一次）：空格在完成列时才判（allowEmpty，判为 wrong） */
  const judgeCell = useCallback(
    (w: PlanWord, value: string, opts?: { allowEmpty?: boolean }): AnswerResult | undefined => {
      if (resultsRef.current[w.id] !== undefined) return resultsRef.current[w.id]
      const trimmed = value.trim()
      if (!trimmed && !opts?.allowEmpty) return undefined
      const res =
        phase === 'en2zh'
          ? checkChineseTable(trimmed, w.meaning)
          : checkEnglishTable(trimmed, w.word)
      setRes(w.id, res)
      void recordJudgement({
        wordId: w.id,
        english: w.word,
        chinese: w.meaning,
        known: res === AnswerResult.CORRECT,
      })
      // 提交后端 SM-2（correct/partial 计入今日答对进度）
      const responseMs = Math.max(0, Date.now() - cellFocusAtRef.current)
      void submitAttempt({
        word: w,
        result: res === AnswerResult.CORRECT ? 'correct' : res === AnswerResult.PARTIAL ? 'partial' : 'wrong',
        mode: 'table',
        userAnswer: trimmed,
        correctAnswer: phase === 'en2zh' ? w.meaning : w.word,
        responseMs,
      }).catch(() => undefined)
      return res
    },
    [phase, recordJudgement, submitAttempt, setRes],
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

  /** 完成当前阶段：未判定的格统一判定（空格=错），统计错词 */
  const finishPhase = useCallback(() => {
    for (const w of pool) {
      judgeCell(w, inputs[w.id] ?? '', { allowEmpty: true })
    }
    if (phase === 'en2zh') {
      // 进入反向默写阶段（隐藏英文列）
      setPhase('zh2en')
      resetRound()
      requestAnimationFrame(() => inputRefs.current[pool[0]?.id]?.focus())
    } else {
      const wrong = pool.filter((w) => resultsRef.current[w.id] !== AnswerResult.CORRECT)
      setFinished(true)
      setWrongWords(wrong)
    }
  }, [phase, pool, inputs, judgeCell, resetRound])

  /** 错词复习：以错词重开反向默写 */
  const reviewWrong = useCallback(() => {
    setPool(wrongWords)
    setPhase('zh2en')
    resetRound()
    setFinished(false)
    requestAnimationFrame(() => inputRefs.current[wrongWords[0]?.id]?.focus())
  }, [wrongWords, resetRound])

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

        <CheckinButton />

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

  // 顶部进度条 = 今日学习进度（已学/目标），刷新/重进后从后端恢复
  const progress = Math.min(100, (progressStore.todayCorrect / Math.max(1, progressStore.dailyTarget)) * 100)

  return (
    <div className="rec-stage rm-mode">
      <div className="rec-progress">
        <div className="rec-progress-bar" style={{ width: `${progress}%` }} />
      </div>

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
                      disabled={res !== undefined}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [w.id]: e.target.value }))}
                      onFocus={() => { cellFocusAtRef.current = Date.now() }}
                      onKeyDown={(e) => onCellKeyDown(e, w)}
                      autoFocus={i === 0}
                    />
                  </td>
                  <td className="rm-td-status">
                    {res === undefined ? (
                      <span className="rm-status-pending">·</span>
                    ) : (
                      <>
                        <span
                          className={`rm-status-ico ${res === AnswerResult.CORRECT ? 'is-correct' : res === AnswerResult.PARTIAL ? 'is-partial' : 'is-wrong'}`}
                          title={res === AnswerResult.PARTIAL ? t('modes.partial') : undefined}
                        >
                          {res === AnswerResult.CORRECT ? (
                            <Check size={16} />
                          ) : res === AnswerResult.PARTIAL ? (
                            <Check size={16} />
                          ) : (
                            <X size={16} />
                          )}
                        </span>
                        {/* 判后显示正确答案方便比对（完成一列后整列可见） */}
                        <span className="rm-cell-answer">
                          {phase === 'en2zh' ? w.meaning : w.word}
                        </span>
                      </>
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
