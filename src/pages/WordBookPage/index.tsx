// src/pages/WordBookPage/index.tsx
import React, { useMemo, useState } from 'react'
import { useWordStore } from '../../store/wordStore'
import { WordForm } from '../../components/organisms/WordForm'
import { WordList } from '../../components/organisms/WordList'
import { Input } from '../../components/atoms/Input'
import { useUIStore } from '../../store/uiStore'
import './WordBookPage.css'

type DifficultyFilter = 0 | 1 | 2 | 3 | 4 | 5

export const WordBookPage: React.FC = () => {
  const { words, loading, searchTerm, setSearchTerm, addWord, deleteWord, updateWord, deduplicate } =
    useWordStore()
  const { showToast, openConfirmDialog } = useUIStore()
  const [difficulty, setDifficulty] = useState<DifficultyFilter>(0)

  const overview = useMemo(() => {
    const total = words.length
    const engLower = new Map<string, number>()
    const posSet = new Set<string>()
    const diffBuckets = [0, 0, 0, 0, 0, 0] // 0（未标）/ 1 / 2 / 3 / 4 / 5
    for (const w of words) {
      const k = w.english.trim().toLowerCase()
      engLower.set(k, (engLower.get(k) ?? 0) + 1)
      const meta = w.meta_data
      const pos = meta?.wordType ?? meta?.partOfSpeech ?? meta?.part_of_speech
      if (pos) posSet.add(String(pos))
      const d = Number(meta?.difficulty ?? 0) || 0
      const bucket = Math.max(0, Math.min(5, Math.round(d)))
      diffBuckets[bucket] += 1
    }
    const duplicateCount = total - engLower.size
    const duplicateRate = total > 0 ? duplicateCount / total : 0
    return { total, uniqueCount: engLower.size, duplicateCount, duplicateRate, posCount: posSet.size, diffBuckets }
  }, [words])

  const filteredWords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return words.filter((w) => {
      if (query) {
        const match =
          w.english.toLowerCase().includes(query) || w.chinese.toLowerCase().includes(query)
        if (!match) return false
      }
      if (difficulty > 0) {
        const d = Number(w.meta_data?.difficulty ?? 0) || 0
        if (Math.max(0, Math.min(5, Math.round(d))) !== difficulty) return false
      }
      return true
    })
  }, [words, searchTerm, difficulty])

  const posDistribution = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of filteredWords) {
      const meta = w.meta_data
      const pos = meta?.wordType ?? meta?.partOfSpeech ?? meta?.part_of_speech
      if (!pos) continue
      const key = String(pos).toLowerCase()
      m.set(key, (m.get(key) ?? 0) + 1)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [filteredWords])

  const handleAddWord = async (english: string, chinese: string): Promise<void> => {
    const result = await addWord(english, chinese)
    if (!result.success) throw new Error(result.message || '添加失败')
  }

  const handleDeleteWord = async (id: string): Promise<void> => {
    const result = await deleteWord(id)
    if (!result.success) throw new Error(result.message || '删除失败')
  }

  const handleUpdateWord = async (id: string, english: string, chinese: string): Promise<void> => {
    const result = await updateWord(id, english, chinese)
    if (!result.success) throw new Error(result.message || '更新失败')
  }

  const handleDeduplicate = () => {
    if (overview.duplicateCount === 0) {
      showToast('当前无重复单词', 'info')
      return
    }
    openConfirmDialog({
      title: '一键去重',
      description: `检测到 ${overview.duplicateCount} 个重复项（共 ${overview.total} 个单词，重复率 ${(overview.duplicateRate * 100).toFixed(1)}%）。保留最后创建的一条，其他删除。是否继续？`,
      confirmText: '去重',
      confirmVariant: 'primary',
      onConfirm: async () => {
        const r = await deduplicate()
        showToast(r.message ?? '去重完成', r.success ? 'success' : 'error')
      },
    })
  }

  return (
    <div className="word-book-page">
      {/* ============ 顶部 Overview 条带 ============ */}
      <section className="wb-overview">
        <div className="wb-overview-left">
          <div className="wb-metric">
            <span className="wb-metric-label">单词总数</span>
            <b className="wb-metric-value">{overview.total}</b>
          </div>
          <div className="wb-metric">
            <span className="wb-metric-label">不重复</span>
            <b className="wb-metric-value">{overview.uniqueCount}</b>
          </div>
          <div className={`wb-metric ${overview.duplicateCount > 0 ? 'wb-metric-warn' : ''}`}>
            <span className="wb-metric-label">重复项</span>
            <b className="wb-metric-value">{overview.duplicateCount}</b>
          </div>
          <div className="wb-metric">
            <span className="wb-metric-label">词性种类</span>
            <b className="wb-metric-value">{overview.posCount}</b>
          </div>
          <button className="wb-dedup-btn" onClick={handleDeduplicate} disabled={overview.duplicateCount === 0}>
            🧹 一键去重 · {overview.duplicateCount === 0 ? '已干净' : `节省 ${overview.duplicateCount} 条`}
          </button>
        </div>
        <div className="wb-overview-right">
          <div className="wb-dist-stack" aria-hidden>
            <span
              className="wb-dist-seg wb-d-0"
              style={{ width: `${(overview.diffBuckets[0] / Math.max(1, overview.total)) * 100}%` }}
              title={`未标难度：${overview.diffBuckets[0]}`}
            />
            <span
              className="wb-dist-seg wb-d-1"
              style={{ width: `${(overview.diffBuckets[1] / Math.max(1, overview.total)) * 100}%` }}
              title={`★ 入门：${overview.diffBuckets[1]}`}
            />
            <span
              className="wb-dist-seg wb-d-2"
              style={{ width: `${(overview.diffBuckets[2] / Math.max(1, overview.total)) * 100}%` }}
              title={`★★ 简单：${overview.diffBuckets[2]}`}
            />
            <span
              className="wb-dist-seg wb-d-3"
              style={{ width: `${(overview.diffBuckets[3] / Math.max(1, overview.total)) * 100}%` }}
              title={`★★★ 中等：${overview.diffBuckets[3]}`}
            />
            <span
              className="wb-dist-seg wb-d-4"
              style={{ width: `${(overview.diffBuckets[4] / Math.max(1, overview.total)) * 100}%` }}
              title={`★★★★ 较难：${overview.diffBuckets[4]}`}
            />
            <span
              className="wb-dist-seg wb-d-5"
              style={{ width: `${(overview.diffBuckets[5] / Math.max(1, overview.total)) * 100}%` }}
              title={`★★★★★ 高难：${overview.diffBuckets[5]}`}
            />
          </div>
          <div className="wb-dist-legend">
            <LegendDot color="#cbd5e1" label={`未 ${overview.diffBuckets[0]}`} />
            <LegendDot color="#22c55e" label={`★ ${overview.diffBuckets[1]}`} />
            <LegendDot color="#38bdf8" label={`★★ ${overview.diffBuckets[2]}`} />
            <LegendDot color="#4a90d9" label={`★★★ ${overview.diffBuckets[3]}`} />
            <LegendDot color="#8e44ad" label={`★★★★ ${overview.diffBuckets[4]}`} />
            <LegendDot color="#e74c3c" label={`★★★★★ ${overview.diffBuckets[5]}`} />
          </div>
        </div>
      </section>

      <WordForm onSubmit={handleAddWord} />

      <div className="word-book-toolbar">
        <div className="wb-toolbar-top">
          <Input
            placeholder="🔍 搜索英文或中文..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            aria-label="搜索单词"
          />
          <div className="word-book-stats" aria-live="polite">
            {searchTerm
              ? `找到 ${filteredWords.length} / ${words.length} 个单词`
              : `共 ${words.length} 个单词${difficulty ? ` · 筛选难度 ${difficulty}` : ''}`}
          </div>
        </div>

        <div className="wb-filter-row">
          <span className="wb-filter-label">难度筛选：</span>
          {([0, 1, 2, 3, 4, 5] as DifficultyFilter[]).map((lv) => (
            <button
              key={lv}
              className={`wb-chip ${difficulty === lv ? 'wb-chip-active' : ''}`}
              onClick={() => setDifficulty(lv)}
              type="button"
            >
              {lv === 0 ? '全部' : `${'★'.repeat(lv)}`}
            </button>
          ))}
        </div>

        {posDistribution.length > 0 && (
          <div className="wb-pos-row">
            <span className="wb-filter-label">词性分布：</span>
            {posDistribution.map(([pos, c]) => (
              <span key={pos} className="wb-pos-pill">
                {pos}
                <em>{c}</em>
              </span>
            ))}
          </div>
        )}
      </div>

      <WordList
        words={filteredWords}
        loading={loading}
        onDelete={handleDeleteWord}
        onUpdate={handleUpdateWord}
      />
    </div>
  )
}

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className="wb-legend-dot">
    <i style={{ background: color }} />
    {label}
  </span>
)
