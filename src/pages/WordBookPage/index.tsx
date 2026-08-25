// src/pages/WordBookPage/index.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWordStore } from '../../store/wordStore'
import { WordForm } from '../../components/organisms/WordForm'
import { WordList } from '../../components/organisms/WordList'
import { WordbookSection } from '../../components/organisms/WordbookSection'
import { ImportExportPanel } from '../../components/organisms/ImportExportPanel'
import { Input } from '../../components/atoms/Input'
import { useUIStore } from '../../store/uiStore'
import './WordBookPage.css'

type DifficultyFilter = 0 | 1 | 2 | 3 | 4 | 5

/** 词列表每页条数（订阅导入可能数千条，分页避免一次性全量渲染） */
const PAGE_SIZE = 50

export const WordBookPage: React.FC = () => {
  const { t } = useTranslation()
  const { words, loading, searchTerm, setSearchTerm, addWord, deleteWord, updateWord, deduplicate, loadWords } =
    useWordStore()
  const { showToast, openConfirmDialog } = useUIStore()
  const [difficulty, setDifficulty] = useState<DifficultyFilter>(0)
  const [page, setPage] = useState(1)

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

  // 筛选条件变化时回到第一页
  useEffect(() => {
    setPage(1)
  }, [searchTerm, difficulty])

  // ============ 分页（每页 50 条） ============
  const totalPages = Math.max(1, Math.ceil(filteredWords.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedWords = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredWords.slice(start, start + PAGE_SIZE)
  }, [filteredWords, safePage])

  // 页码窗口：1 … (current-1..current+1) … total
  const pageNumbers = useMemo<(number | '…')[]>(() => {
    const nums: (number | '…')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) nums.push(i)
      return nums
    }
    const start = Math.max(2, safePage - 1)
    const end = Math.min(totalPages - 1, safePage + 1)
    nums.push(1)
    if (start > 2) nums.push('…')
    for (let i = start; i <= end; i++) nums.push(i)
    if (end < totalPages - 1) nums.push('…')
    nums.push(totalPages)
    return nums
  }, [totalPages, safePage])

  const handleAddWord = async (english: string, chinese: string): Promise<void> => {
    const result = await addWord(english, chinese)
    if (!result.success) throw new Error(result.message || t('word.addFailed'))
  }

  const handleDeleteWord = async (id: string): Promise<void> => {
    const result = await deleteWord(id)
    if (!result.success) throw new Error(result.message || t('word.deleteFailed'))
  }

  const handleUpdateWord = async (id: string, english: string, chinese: string): Promise<void> => {
    const result = await updateWord(id, english, chinese)
    if (!result.success) throw new Error(result.message || t('word.updateFailed'))
  }

  const handleDeduplicate = () => {
    if (overview.duplicateCount === 0) {
      showToast(t('wordbook.noDuplicate'), 'info')
      return
    }
    openConfirmDialog({
      title: t('wordbook.dedupTitle'),
      description: t('wordbook.dedupDesc', {
        count: overview.duplicateCount,
        total: overview.total,
        rate: (overview.duplicateRate * 100).toFixed(1),
      }),
      confirmText: t('wordbook.dedupConfirm'),
      confirmVariant: 'primary',
      onConfirm: async () => {
        const r = await deduplicate()
        showToast(r.message ?? t('wordbook.dedupDone'), r.success ? 'success' : 'error')
      },
    })
  }

  return (
    <div className="word-book-page">
      {/* ============ 内置词书（订阅入口） ============ */}
      <WordbookSection />

      {/* ============ 词库管理（导入 / 导出 / 清空，原 header「管理词库」按钮功能于此页呈现） ============ */}
      <ImportExportPanel onImportComplete={() => void loadWords()} />

      {/* ============ 顶部 Overview 条带 ============ */}
      <section className="wb-overview">
        <div className="wb-overview-left">
          <div className="wb-metric">
            <span className="wb-metric-label">{t('wordbook.totalLabel')}</span>
            <b className="wb-metric-value">{overview.total}</b>
          </div>
          <div className="wb-metric">
            <span className="wb-metric-label">{t('wordbook.uniqueLabel')}</span>
            <b className="wb-metric-value">{overview.uniqueCount}</b>
          </div>
          <div className={`wb-metric ${overview.duplicateCount > 0 ? 'wb-metric-warn' : ''}`}>
            <span className="wb-metric-label">{t('wordbook.duplicateLabel')}</span>
            <b className="wb-metric-value">{overview.duplicateCount}</b>
          </div>
          <div className="wb-metric">
            <span className="wb-metric-label">{t('wordbook.posLabel')}</span>
            <b className="wb-metric-value">{overview.posCount}</b>
          </div>
          <button className="wb-dedup-btn" onClick={handleDeduplicate} disabled={overview.duplicateCount === 0}>
            🧹 {t('wordbook.dedupTitle')} · {overview.duplicateCount === 0 ? t('wordbook.dedupClean') : t('wordbook.dedupSave', { count: overview.duplicateCount })}
          </button>
        </div>
        <div className="wb-overview-right">
          <div className="wb-dist-stack" aria-hidden>
            <span
              className="wb-dist-seg wb-d-0"
              style={{ width: `${(overview.diffBuckets[0] / Math.max(1, overview.total)) * 100}%` }}
              title={t('wordbook.diffTitle0', { count: overview.diffBuckets[0] })}
            />
            <span
              className="wb-dist-seg wb-d-1"
              style={{ width: `${(overview.diffBuckets[1] / Math.max(1, overview.total)) * 100}%` }}
              title={t('wordbook.diffTitle1', { count: overview.diffBuckets[1] })}
            />
            <span
              className="wb-dist-seg wb-d-2"
              style={{ width: `${(overview.diffBuckets[2] / Math.max(1, overview.total)) * 100}%` }}
              title={t('wordbook.diffTitle2', { count: overview.diffBuckets[2] })}
            />
            <span
              className="wb-dist-seg wb-d-3"
              style={{ width: `${(overview.diffBuckets[3] / Math.max(1, overview.total)) * 100}%` }}
              title={t('wordbook.diffTitle3', { count: overview.diffBuckets[3] })}
            />
            <span
              className="wb-dist-seg wb-d-4"
              style={{ width: `${(overview.diffBuckets[4] / Math.max(1, overview.total)) * 100}%` }}
              title={t('wordbook.diffTitle4', { count: overview.diffBuckets[4] })}
            />
            <span
              className="wb-dist-seg wb-d-5"
              style={{ width: `${(overview.diffBuckets[5] / Math.max(1, overview.total)) * 100}%` }}
              title={t('wordbook.diffTitle5', { count: overview.diffBuckets[5] })}
            />
          </div>
          <div className="wb-dist-legend">
            <LegendDot color="#cbd5e1" label={t('wordbook.legendUnmarked', { count: overview.diffBuckets[0] })} />
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
            placeholder={t('wordbook.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            aria-label={t('wordbook.searchAria')}
          />
          <div className="word-book-stats" aria-live="polite">
            {searchTerm
              ? t('wordbook.searchResult', { found: filteredWords.length, total: words.length })
              : t('word.footerCount', { count: words.length }) + (difficulty ? t('wordbook.filteredByDifficulty', { difficulty }) : '')}
          </div>
        </div>

        <div className="wb-filter-row">
          <span className="wb-filter-label">{t('wordbook.difficultyFilter')}</span>
          {([0, 1, 2, 3, 4, 5] as DifficultyFilter[]).map((lv) => (
            <button
              key={lv}
              className={`wb-chip ${difficulty === lv ? 'wb-chip-active' : ''}`}
              onClick={() => setDifficulty(lv)}
              type="button"
            >
              {lv === 0 ? t('wordbook.all') : `${'★'.repeat(lv)}`}
            </button>
          ))}
        </div>

        {posDistribution.length > 0 && (
          <div className="wb-pos-row">
            <span className="wb-filter-label">{t('wordbook.posDistribution')}</span>
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
        words={paginatedWords}
        loading={loading}
        onDelete={handleDeleteWord}
        onUpdate={handleUpdateWord}
      />

      {totalPages > 1 && (
        <div className="wb-pagination" aria-label={t('wordbook.pagination', { page: safePage, pages: totalPages })}>
          <button
            className="wb-pg-btn"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            type="button"
          >
            {t('textbooks.prev')}
          </button>
          {pageNumbers.map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="wb-pg-ellipsis" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={p}
                className={`wb-pg-num ${safePage === p ? 'wb-pg-active' : ''}`}
                onClick={() => setPage(p)}
                type="button"
              >
                {p}
              </button>
            ),
          )}
          <button
            className="wb-pg-btn"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            type="button"
          >
            {t('textbooks.next')}
          </button>
          <span className="wb-pg-info">
            {t('wordbook.pagination', { page: safePage, pages: totalPages })}
          </span>
        </div>
      )}
    </div>
  )
}

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className="wb-legend-dot">
    <i style={{ background: color }} />
    {label}
  </span>
)
