// src/pages/WordBookPage/index.tsx
import React, { useMemo } from 'react'
import { useWordStore } from '../../store/wordStore'
import { WordForm } from '../../components/organisms/WordForm'
import { WordList } from '../../components/organisms/WordList'
import { Input } from '../../components/atoms/Input'
import './WordBookPage.css'

export const WordBookPage: React.FC = () => {
  const { words, loading, searchTerm, setSearchTerm, addWord, deleteWord, updateWord } = useWordStore()

  const filteredWords = useMemo(() => {
    if (!searchTerm.trim()) return words
    const query = searchTerm.trim().toLowerCase()
    return words.filter(
      (w) =>
        w.english.toLowerCase().includes(query) ||
        w.chinese.toLowerCase().includes(query)
    )
  }, [words, searchTerm])

  const handleAddWord = async (english: string, chinese: string): Promise<void> => {
    const result = await addWord(english, chinese)
    if (!result.success) {
      throw new Error(result.message || '添加失败')
    }
  }

  const handleDeleteWord = async (id: string): Promise<void> => {
    const result = await deleteWord(id)
    if (!result.success) {
      throw new Error(result.message || '删除失败')
    }
  }

  const handleUpdateWord = async (id: string, english: string, chinese: string): Promise<void> => {
    const result = await updateWord(id, english, chinese)
    if (!result.success) {
      throw new Error(result.message || '更新失败')
    }
  }

  return (
    <div className="word-book-page">
      <WordForm onSubmit={handleAddWord} />

      <div className="word-book-toolbar">
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
            : `共 ${words.length} 个单词`}
        </div>
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