// src/hooks/useDictionary.ts
// 字典数据源：加载已订阅词书的全部词条，支持关键词搜索（学习首页顶部字典搜索 + M2-E 详情）
import { useCallback, useEffect, useMemo, useState } from 'react'
import { textbooksApi, type TextbookWord } from '@/api/endpoints/textbooks.api'
import { useTextbookStore } from '@/store/textbookStore'

export interface DictionaryEntry extends TextbookWord {
  bookId: number
  bookName: string
}

export function useDictionary() {
  const { enrolledIds, textbooks } = useTextbookStore()
  const [entries, setEntries] = useState<DictionaryEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (enrolledIds.length === 0) {
        setEntries([])
        setLoading(false)
        return
      }
      setLoading(true)
      const result: DictionaryEntry[] = []
      for (const id of enrolledIds) {
        try {
          const res = await textbooksApi.getWords(id, { page: 1, size: 500 })
          const book = textbooks.find((b) => b.id === id)
          for (const it of res.items) {
            result.push({ ...it, bookId: id, bookName: book?.name ?? '' })
          }
        } catch (e) {
          console.error('加载字典词条失败:', e)
        }
      }
      if (!cancelled) setEntries(result)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [enrolledIds, textbooks])

  const search = useCallback(
    (q: string): DictionaryEntry[] => {
      const query = q.trim().toLowerCase()
      if (!query) return []
      return entries
        .filter(
          (e) => e.word.toLowerCase().includes(query) || e.meaning.toLowerCase().includes(query),
        )
        .slice(0, 12)
    },
    [entries],
  )

  return useMemo(() => ({ entries, loading, search }), [entries, loading, search])
}
