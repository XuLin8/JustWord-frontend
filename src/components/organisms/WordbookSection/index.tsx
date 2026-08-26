// src/components/organisms/WordbookSection/index.tsx
// 词库页「内置词书」区块（M2-B）：词书列表 / 订阅 / 取消订阅 / 词条分页 + 关键词搜索
// 词书列表以 typeahead 呈现：输入即时过滤 + 下拉建议，适配未来词书数量增长
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Check, Info, Loader2, Search, X } from 'lucide-react'
import { textbooksApi, type Textbook, type TextbookWord } from '@/api/endpoints/textbooks.api'
import { useTextbookStore } from '@/store/textbookStore'
import { useUIStore } from '@/store/uiStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import './WordbookSection.css'

const PAGE_SIZE = 20

interface WordbookSectionProps {
  /** 订阅成功回调（通知学习首页等） */
  onEnrolled?: (id: number) => void
}

export const WordbookSection: React.FC<WordbookSectionProps> = ({ onEnrolled }) => {
  const { t } = useTranslation()
  const { textbooks, loading, loadTextbooks, enroll, unsubscribe, isEnrolled, enrolledIds } =
    useTextbookStore()
  const { showToast } = useUIStore()
  const [subscribingId, setSubscribingId] = useState<number | null>(null)
  const [browseBook, setBrowseBook] = useState<Textbook | null>(null)

  // ============ typeahead 状态 ============
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [pulseId, setPulseId] = useState<number | null>(null)
  const typeaheadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void loadTextbooks()
  }, [loadTextbooks])

  // 输入即时过滤：名称 / 描述 / 标签
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return textbooks
    return textbooks.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q) ||
        (b.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
    )
  }, [textbooks, query])

  // 点击外部关闭下拉
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (typeaheadRef.current && !typeaheadRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // 选中建议：收窄列表并滚动到对应词书卡片
  const handlePick = (book: Textbook) => {
    setQuery(book.name)
    setFocused(false)
    setPulseId(book.id)
    requestAnimationFrame(() => {
      document
        .getElementById(`wordbook-card-${book.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    window.setTimeout(() => setPulseId(null), 1600)
  }

  const handleEnroll = async (book: Textbook) => {
    setSubscribingId(book.id)
    try {
      const ok = await enroll(book.id)
      if (ok) {
        showToast(t('textbooks.subscribedSuccess', { name: book.name }), 'success')
        onEnrolled?.(book.id)
      }
    } finally {
      setSubscribingId(null)
    }
  }

  const handleUnsubscribe = async (book: Textbook) => {
    await unsubscribe(book.id)
    showToast(t('textbooks.unsubscribedSuccess', { name: book.name }), 'info')
  }

  return (
    <section className="wordbook-section" aria-label={t('textbooks.title')}>
      <div className="wordbook-section-header">
        <div className="wordbook-section-heading">
          <BookOpen className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('textbooks.title')}</h2>
          {enrolledIds.length > 0 && (
            <Badge variant="secondary">{t('textbooks.enrolledBadge', { count: enrolledIds.length })}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t('textbooks.subtitle')}</p>
      </div>

      {/* typeahead：输入即时过滤 + 下拉建议 */}
      <div className="wordbook-typeahead" ref={typeaheadRef}>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 pr-9"
            value={query}
            placeholder={t('textbooks.searchPlaceholder')}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            aria-label={t('textbooks.searchPlaceholder')}
          />
          {query && (
            <button
              type="button"
              className="wordbook-clear"
              onClick={() => setQuery('')}
              aria-label={t('common.clear')}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {focused && query.trim() && filtered.length > 0 && (
          <ul className="wordbook-suggest" role="listbox">
            {filtered.slice(0, 8).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="wordbook-suggest-item"
                  role="option"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handlePick(s)
                  }}
                >
                  <span className="wordbook-suggest-name">{s.name}</span>
                  {s.tags && s.tags.length > 0 && (
                    <span className="wordbook-suggest-tags">
                      {s.tags.map((tg) => `#${tg}`).join(' ')}
                    </span>
                  )}
                  <span className="wordbook-suggest-count">{s.word_count}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 订阅逻辑说明条：订阅 → 入词库 → 首页背诵（对标墨墨「选词」的引导） */}
      <div className="wordbook-how">
        <Info className="size-4 shrink-0 text-primary" aria-hidden />
        <div className="wordbook-how-body">
          <p className="wordbook-how-title">{t('textbooks.howTitle')}</p>
          <ol className="wordbook-how-steps">
            <li>{t('textbooks.howStep1')}</li>
            <li>{t('textbooks.howStep2')}</li>
            <li>{t('textbooks.howStep3')}</li>
          </ol>
        </div>
      </div>

      {loading && textbooks.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>{t('word.loading')}</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {query.trim() ? t('textbooks.noMatch') : t('textbooks.empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="wordbook-list">
          <div className="wordbook-list-head">
            <span className="wordbook-list-col-name">{t('textbooks.colName')}</span>
            <span className="wordbook-list-col-count">{t('textbooks.colCount')}</span>
            <span className="wordbook-list-col-status">{t('textbooks.colStatus')}</span>
            <span className="wordbook-list-col-action">{t('textbooks.colAction')}</span>
          </div>
          <div className="wordbook-list-body">
            {filtered.map((book) => {
              const enrolled = isEnrolled(book.id)
              return (
                <div
                  key={book.id}
                  id={`wordbook-card-${book.id}`}
                  className={`wordbook-list-row ${enrolled ? 'wordbook-list-row-enrolled' : ''} ${pulseId === book.id ? 'wordbook-card-pulse' : ''}`}
                >
                  <div className="wordbook-list-col-name">
                    <span className="wordbook-list-title">{book.name}</span>
                    {book.tags && book.tags.length > 0 && (
                      <span className="wordbook-list-tags">
                        {book.tags.map((tg) => (
                          <span key={tg} className="wordbook-list-tag">
                            #{tg}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                  <span className="wordbook-list-col-count wordbook-list-count">
                    {t('textbooks.wordsCount', { count: book.word_count })}
                  </span>
                  <span className="wordbook-list-col-status">
                    <Badge variant={enrolled ? 'default' : 'outline'}>
                      {enrolled ? t('textbooks.learning') : t('textbooks.notSubscribed')}
                    </Badge>
                  </span>
                  <div className="wordbook-list-col-action wordbook-list-actions">
                    <Button variant="outline" size="sm" onClick={() => setBrowseBook(book)}>
                      {t('textbooks.browse')}
                    </Button>
                    {enrolled ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void handleUnsubscribe(book)}
                      >
                        <Check className="size-4" />
                        {t('textbooks.subscribed')}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={subscribingId === book.id}
                        onClick={() => void handleEnroll(book)}
                      >
                        {subscribingId === book.id ? <Loader2 className="size-4 animate-spin" /> : null}
                        {t('textbooks.subscribe')}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {browseBook && (
        <BrowseWordsDialog book={browseBook} onOpenChange={(open) => !open && setBrowseBook(null)} />
      )}
    </section>
  )
}

// ============ 词条浏览对话框（分页 + 关键词搜索） ============
interface BrowseWordsDialogProps {
  book: Textbook
  onOpenChange: (open: boolean) => void
}

const BrowseWordsDialog: React.FC<BrowseWordsDialogProps> = ({ book, onOpenChange }) => {
  const { t } = useTranslation()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<TextbookWord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (pageNum: number, kw: string) => {
    setLoading(true)
    try {
      const res = await textbooksApi.getWords(book.id, { page: pageNum, size: PAGE_SIZE, keyword: kw || undefined })
      setItems(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [book.id])

  useEffect(() => {
    setPage(1)
    void load(1, keyword)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, book.id])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const goPage = (next: number) => {
    const clamped = Math.min(totalPages, Math.max(1, next))
    if (clamped === page) return
    setPage(clamped)
    void load(clamped, keyword)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('textbooks.browseTitle', { name: book.name })}</DialogTitle>
          <DialogDescription>{t('textbooks.browseSubtitle', { count: book.word_count })}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('textbooks.browseSearchPlaceholder')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            aria-label={t('textbooks.browseSearchPlaceholder')}
          />
        </div>

        <div className="max-h-[50vh] space-y-1.5 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>{t('word.loading')}</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{t('textbooks.browseEmpty')}</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="wordbook-browse-row">
                <div className="min-w-0">
                  <span className="font-medium">{it.word}</span>
                  {it.phonetic ? (
                    <span className="ml-2 text-sm text-muted-foreground">{it.phonetic}</span>
                  ) : null}
                </div>
                <div className="wordbook-browse-right">
                  <span className="text-right text-sm text-muted-foreground">{it.meaning}</span>
                  {it.tags && it.tags.length > 0 && (
                    <span className="wordbook-browse-tags">
                      {it.tags.map((tg) => (
                        <span key={tg} className="wordbook-browse-tag">
                          #{tg}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t('textbooks.browseResult', { total, page, pages: totalPages })}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>
              {t('textbooks.prev')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goPage(page + 1)}
            >
              {t('textbooks.next')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
