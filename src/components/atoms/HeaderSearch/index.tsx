// src/components/atoms/HeaderSearch/index.tsx
// P0-2 全局字典搜索：置于 header，精简缺省文案（无放大镜图标），Ctrl+K 唤起，结果浮层 + 详情弹窗
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDictionary, type DictionaryEntry } from '@/hooks/useDictionary'
import './HeaderSearch.css'

export const HeaderSearch: React.FC = () => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<DictionaryEntry | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { search } = useDictionary()

  const results = query.trim() ? search(query) : []

  // Ctrl+K 唤起全局字典搜索
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openDetail = (entry: DictionaryEntry) => {
    setQuery('')
    setDetail(entry)
  }

  return (
    <div className="hs" role="search">
      <input
        ref={inputRef}
        className="hs-input"
        placeholder={t('learningHome.searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={t('learningHome.searchAria')}
      />

      {results.length > 0 && (
        <div className="hs-results">
          {results.map((it) => (
            <button key={it.id} className="hs-item" onClick={() => openDetail(it)}>
              <span className="hs-item-word">{it.word}</span>
              <span className="hs-item-mean">{it.meaning}</span>
            </button>
          ))}
        </div>
      )}

      {detail && (
        <Dialog open onOpenChange={(open) => !open && setDetail(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{detail.word}</DialogTitle>
              <DialogDescription>{detail.meaning}</DialogDescription>
            </DialogHeader>
            {detail.phonetic && <p>{t('learningHome.detailPhonetic')}：{detail.phonetic}</p>}
            {detail.example && <p>{t('learningHome.detailExample')}：{detail.example}</p>}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}