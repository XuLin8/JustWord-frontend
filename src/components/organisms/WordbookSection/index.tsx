// src/components/organisms/WordbookSection/index.tsx
// 词库页「内置词书」区块（M2-B）：词书列表 / 订阅 / 取消订阅 / 词条分页 + 关键词搜索
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Check, Loader2, Search } from 'lucide-react'
import { textbooksApi, type Textbook, type TextbookWord } from '@/api/endpoints/textbooks.api'
import { useTextbookStore } from '@/store/textbookStore'
import { useUIStore } from '@/store/uiStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

const PAGE_SIZE = 20

interface WordbookSectionProps {
  /** 订阅成功回调（通知学习首页等） */
  onEnrolled?: (id: number) => void
}

export const WordbookSection: React.FC<WordbookSectionProps> = ({ onEnrolled }) => {
  const { t } = useTranslation()
  const { textbooks, loading, loadTextbooks, enroll, unsubscribe, isEnrolled } = useTextbookStore()
  const { showToast } = useUIStore()
  const [subscribingId, setSubscribingId] = useState<number | null>(null)
  const [browseBook, setBrowseBook] = useState<Textbook | null>(null)

  useEffect(() => {
    void loadTextbooks()
  }, [loadTextbooks])

  const levelLabel = (level: string): string => {
    const key = `textbooks.level.${level}`
    const label = t(key)
    return label === key ? level : label
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
        </div>
        <p className="text-sm text-muted-foreground">{t('textbooks.subtitle')}</p>
      </div>

      {loading && textbooks.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>{t('word.loading')}</span>
        </div>
      ) : textbooks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t('textbooks.empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {textbooks.map((book) => {
            const enrolled = isEnrolled(book.id)
            return (
              <Card key={book.id} className="gap-3">
                <CardHeader className="gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{book.name}</CardTitle>
                    <Badge variant={enrolled ? 'secondary' : 'outline'}>
                      {levelLabel(book.level)}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{book.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t('textbooks.wordsCount', { count: book.word_count })}
                  </span>
                  <div className="flex items-center gap-2">
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
                        {subscribingId === book.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        {t('textbooks.subscribe')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
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

        <div className="max-h-[50vh] space-y-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>{t('word.loading')}</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{t('textbooks.browseEmpty')}</div>
          ) : (
            items.map((it) => (
              <div
                key={it.id}
                className="flex items-baseline justify-between gap-4 rounded-md border px-3 py-2"
              >
                <div className="min-w-0">
                  <span className="font-medium">{it.word}</span>
                  {it.phonetic ? (
                    <span className="ml-2 text-sm text-muted-foreground">{it.phonetic}</span>
                  ) : null}
                </div>
                <div className="text-right text-sm text-muted-foreground">{it.meaning}</div>
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
