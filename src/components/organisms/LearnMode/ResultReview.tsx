// components/LearnMode/ResultReview.tsx
import React, { useMemo } from 'react'
import { AnswerResult } from '../../../types/learning.types'
import type { LearningSession } from '../../../types/learning.types'

interface Props {
  session: LearningSession
  onRestart: () => void
  onContinue?: () => void
  hasRound2?: boolean
}

const RESULT_META: Record<AnswerResult, { label: string; color: string; bg: string }> = {
  correct: { label: '完全正确', color: '#27ae60', bg: '#e8f8ef' },
  partial: { label: '部分正确', color: '#f39c12', bg: '#fff5e0' },
  typo:    { label: '拼写错误', color: '#8e44ad', bg: '#f3e8ff' },
  close:   { label: '近义答案', color: '#4a90d9', bg: '#eaf3ff' },
  wrong:   { label: '错误',     color: '#e74c3c', bg: '#fdecea' },
}

const MASTERY = [
  { thresh: 0.85, level: '已掌握', tone: 'A', color: '#27ae60', bg: '#e8f8ef' },
  { thresh: 0.60, level: '熟悉中', tone: 'B', color: '#4a90d9', bg: '#eaf3ff' },
  { thresh: 0.30, level: '学习中', tone: 'C', color: '#f39c12', bg: '#fff5e0' },
  { thresh: 0,    level: '需巩固', tone: 'D', color: '#e74c3c', bg: '#fdecea' },
]

export default function ResultReview({ session, onRestart, onContinue, hasRound2 }: Props) {
  const { wordList, questions, score, mode } = session

  const countMap: Record<AnswerResult, number> = useMemo(() => {
    const base: Record<AnswerResult, number> = {
      correct: score.correct, partial: score.partial, typo: 0, close: 0, wrong: score.wrong,
    }
    for (const q of questions) {
      if (q.result === 'typo') base.typo += 1
      if (q.result === 'close') base.close += 1
    }
    // questions 里的 correct/partial/wrong 已算在 score 内，不需要再累计
    return base
  }, [questions, score])

  const total = Math.max(1, wordList.length)
  const accuracy = Math.round((countMap.correct / total) * 100)

  // 单词级掌握度：按两轮合并结果评估（只看当前 session 里的 questions，简单加权）
  const wordMastery = useMemo(() => {
    const map = new Map<string, { word: string; chinese: string; weighted: number; answered: number }>()
    for (const q of questions) {
      const prev = map.get(q.wordId) ?? {
        word: q.english, chinese: q.chinese, weighted: 0, answered: 0,
      }
      prev.answered += 1
      switch (q.result) {
        case 'correct': prev.weighted += 1.0; break
        case 'close': prev.weighted += 0.7; break
        case 'partial': prev.weighted += 0.5; break
        case 'typo': prev.weighted += 0.35; break
        case 'wrong':
        default: prev.weighted += 0; break
      }
      map.set(q.wordId, prev)
    }
    return [...map.values()]
      .map((m) => {
        const rate = m.answered > 0 ? m.weighted / m.answered : 0
        const mastery = MASTERY.find((mst) => rate >= mst.thresh) ?? MASTERY[MASTERY.length - 1]
        return { ...m, rate, mastery }
      })
      .sort((a, b) => a.rate - b.rate)
  }, [questions])

  // 每 5 题答对率分布
  const chunkStats = useMemo(() => {
    const size = Math.max(5, Math.ceil(questions.length / 6))
    const chunks: Array<{ idx: string; total: number; correct: number; rate: number }> = []
    for (let i = 0; i < questions.length; i += size) {
      const slice = questions.slice(i, i + size)
      const correct = slice.filter((q) => q.result === 'correct').length
      chunks.push({
        idx: `${i + 1}-${Math.min(i + size, questions.length)}`,
        total: slice.length,
        correct,
        rate: slice.length === 0 ? 0 : correct / slice.length,
      })
    }
    return chunks
  }, [questions])

  // 用时估算（Date.now() 放在初始化中，避免 render 里调用不纯函数）
  const duration = useMemo(() => {
    const end = session.endTime ?? Date.now()
    return Math.max(0, (end - session.startTime) / 1000)
  }, [session.startTime, session.endTime])
  const avgSecPerQ = questions.length === 0 ? 0 : duration / questions.length
  const modeLabel = mode === 'zh2en' ? '汉译英' : '英译汉'

  const accuracyDeg = Math.round(Math.max(0, Math.min(100, accuracy)) * 3.6)
  const countSegments = [
    { result: 'correct', count: countMap.correct, color: RESULT_META.correct.color },
    { result: 'partial', count: countMap.partial, color: RESULT_META.partial.color },
    { result: 'close',   count: countMap.close,   color: RESULT_META.close.color   },
    { result: 'typo',    count: countMap.typo,    color: RESULT_META.typo.color    },
    { result: 'wrong',   count: countMap.wrong,   color: RESULT_META.wrong.color   },
  ].filter((s) => s.count > 0) as Array<{ result: AnswerResult; count: number; color: string }>
  return (
    <div className="result-review">
      {/* ========== 顶部 ========== */}
      <div className="result-hero">
        <div className="result-hero-left">
          <div className="result-mode-chip">
            <i className="mode-chip-dot" />
            <span>当前模式：<b>{modeLabel}</b> · 共 {total} 题</span>
          </div>
          <h2>📊 本轮学习报告</h2>
          <p className="result-hero-sub">
            用时 <b>{formatDuration(duration)}</b>，平均每题 <b>{avgSecPerQ.toFixed(1)} 秒</b>。
            根据你的作答情况，下方给出掌握度分层与逐题回顾。
          </p>
          <div className="result-quick-metrics">
            <Metric label="正确数" value={countMap.correct} tone="success" />
            <Metric label="部分正确" value={countMap.partial} tone="warning" />
            <Metric label="拼写偏差" value={countMap.typo} tone="violet" />
            <Metric label="错误数" value={countMap.wrong} tone="danger" />
          </div>
        </div>
        <div className="result-hero-right">
          <div
            className="score-ring"
            style={{ background: `conic-gradient(#4a90d9 0deg ${accuracyDeg}deg, #edf1f7 ${accuracyDeg}deg 360deg)` }}
            aria-hidden
          >
            <div className="score-hole">
              <div className="score-value">{accuracy}%</div>
              <small>正确率</small>
            </div>
          </div>
          <MasteryBadge level={getMastery(accuracy / 100)} />
        </div>
      </div>

      {/* ========== 构成堆叠条 ========== */}
      <div className="result-card">
        <div className="result-card-head">
          <h3>答题构成</h3>
          <small>5 档结果分布 · 按占比可视化</small>
        </div>
        <div className="result-stack">
          {countSegments.length === 0 ? (
            <div className="result-stack-empty">暂无数据</div>
          ) : (
            countSegments.map((s) => (
              <div
                key={s.result}
                className="result-stack-seg"
                style={{
                  width: `${(s.count / total) * 100}%`,
                  background: s.color,
                  minWidth: s.count > 0 ? 6 : 0,
                }}
                title={`${RESULT_META[s.result].label}：${s.count}`}
              />
            ))
          )}
        </div>
        <div className="result-stack-legend">
          {(Object.keys(RESULT_META) as AnswerResult[]).map((k) => (
            <div className="legend-line" key={k}>
              <span className="legend-dot" style={{ background: RESULT_META[k].color }} />
              <span className="legend-label">{RESULT_META[k].label}</span>
              <span className="legend-count">{countMap[k]}</span>
              <div className="legend-bar">
                <i style={{ background: RESULT_META[k].color, width: `${(countMap[k] / total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========== 节奏柱状 + 掌握度卡 ========== */}
      <div className="result-grid">
        <div className="result-card">
          <div className="result-card-head">
            <h3>节奏分布</h3>
            <small>按题号分块 · 每块正确率</small>
          </div>
          {chunkStats.length === 0 ? (
            <EmptyTip text="暂无作答" />
          ) : (
            <div className="chunk-chart">
              {chunkStats.map((c) => {
                const wrong = c.total - c.correct
                return (
                  <div key={c.idx} className="chunk-col">
                    <div className="chunk-stack" title={`${c.idx} 题 · 正确率 ${Math.round(c.rate * 100)}%`}>
                      <i className="chunk-correct" style={{ height: `${Math.max(6, c.rate * 100)}%` }} />
                      {wrong > 0 && (
                        <i className="chunk-wrong" style={{ height: `${Math.max(0, (1 - c.rate) * 100)}%` }} />
                      )}
                    </div>
                    <span className="chunk-label">{c.idx}</span>
                    <span className="chunk-rate">{Math.round(c.rate * 100)}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="result-card">
          <div className="result-card-head">
            <h3>掌握度分层</h3>
            <small>基于本轮作答，按得分率从低到高</small>
          </div>
          <div className="mastery-summary">
            {MASTERY.map((m) => {
              const n = wordMastery.filter((w) => w.mastery.tone === m.tone).length
              return (
                <div className="mastery-chip" key={m.tone} style={{ background: m.bg, color: m.color, borderColor: m.color }}>
                  <b className="mastery-tone">{m.tone}</b>
                  <span>{m.level}</span>
                  <em>{n}</em>
                </div>
              )
            })}
          </div>
          <ul className="mastery-list">
            {wordMastery.slice(0, 10).map((w) => (
              <li key={w.word} className="mastery-row">
                <span
                  className="mastery-badge-inline"
                  style={{
                    background: w.mastery.bg,
                    color: w.mastery.color,
                    borderColor: w.mastery.color,
                  }}
                >
                  {w.mastery.tone}
                </span>
                <span className="mastery-word">{w.word}</span>
                <span className="mastery-chinese">{w.chinese}</span>
                <div className="mastery-bar">
                  <i style={{ width: `${w.rate * 100}%`, background: w.mastery.color }} />
                </div>
                <span className="mastery-rate">{Math.round(w.rate * 100)}%</span>
              </li>
            ))}
            {wordMastery.length === 0 && <EmptyTip text="暂无掌握度数据" inline />}
          </ul>
        </div>
      </div>

      {/* ========== 逐题回顾 ========== */}
      <div className="result-card">
        <div className="result-card-head">
          <h3>逐题回顾</h3>
          <small>点击题目可快速定位</small>
        </div>
        <div className="result-list">
          {questions.map((q, idx) => {
            const meta = RESULT_META[q.result] ?? RESULT_META.wrong
            const mastery = getMasteryByResult(q.result)
            return (
              <div key={idx} className="result-item" style={{ borderLeftColor: meta.color }}>
                <div className="result-item-head">
                  <span className="result-index">#{idx + 1}</span>
                  <span className="result-tag" style={{ background: meta.bg, color: meta.color }}>
                    {meta.label}
                  </span>
                  <span
                    className="result-mini-mastery"
                    style={{ background: mastery.bg, color: mastery.color, borderColor: mastery.color }}
                  >
                    {mastery.level}
                  </span>
                </div>
                <div className="result-item-body">
                  <div className="result-word-col">
                    <div className="result-word">{q.english}</div>
                    <div className="result-chinese">{q.chinese}</div>
                  </div>
                  <div className="result-answers">
                    <div className="result-answer-row">
                      <span className="answer-label">你的答案</span>
                      <span className="answer-value answer-user">
                        {q.userAnswer || <em>（未作答）</em>}
                      </span>
                    </div>
                    <div className="result-answer-row">
                      <span className="answer-label">正确答案</span>
                      <span className="answer-value answer-correct">{q.correctAnswer}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ========== 底部操作 ========== */}
      <div className="result-actions">
        {hasRound2 && accuracy >= 80 ? (
          <button className="continue-btn" onClick={onContinue}>
            🚀 进入第二轮（汉译英）
          </button>
        ) : hasRound2 && accuracy < 80 ? (
          <div className="round2-hint">
            <span>💪 建议先巩固第一轮（正确率 80% 以上再进入第二轮）</span>
            <button className="restart-btn" onClick={onRestart}>
              🔄 重新学习
            </button>
          </div>
        ) : null}
        <button className="restart-btn" onClick={onRestart}>
          🔄 重新开始
        </button>
      </div>
    </div>
  )
}

/* ========== 小组件 ========== */

const Metric: React.FC<{ label: string; value: number; tone: 'success' | 'warning' | 'violet' | 'danger' }> = ({
  label, value, tone,
}) => (
  <div className={`result-metric result-metric-${tone}`}>
    <span>{label}</span>
    <b>{value}</b>
  </div>
)

const MasteryBadge: React.FC<{ level: typeof MASTERY[number] }> = ({ level }) => (
  <div className="mastery-hero-badge" style={{ background: level.bg, color: level.color, borderColor: level.color }}>
    <b className="mastery-tone-lg">{level.tone}</b>
    <span>{level.level}</span>
  </div>
)

const EmptyTip: React.FC<{ text: string; inline?: boolean }> = ({ text, inline }) => (
  <div className={`empty-tip ${inline ? 'inline' : ''}`}>
    <span className="empty-dot" aria-hidden />
    <p>{text}</p>
  </div>
)

/* ========== 工具函数 ========== */

function formatDuration(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return '0 秒'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  if (m <= 0) return `${s} 秒`
  return `${m} 分 ${s} 秒`
}

function getMastery(rate: number) {
  return MASTERY.find((m) => rate >= m.thresh) ?? MASTERY[MASTERY.length - 1]
}

function getMasteryByResult(r: AnswerResult): typeof MASTERY[number] {
  switch (r) {
    case 'correct': return getMastery(0.92)
    case 'close':   return getMastery(0.70)
    case 'partial': return getMastery(0.45)
    case 'typo':    return getMastery(0.35)
    case 'wrong':
    default:        return getMastery(0)
  }
}
