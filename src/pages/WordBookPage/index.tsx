// src/pages/WordBookPage/index.tsx
import React from 'react'
import { useWordStore } from '../../store/wordStore'
import { WordForm } from '../../components/organisms/WordForm'
import { WordList } from '../../components/organisms/WordList'
import './WordBookPage.css'

export const WordBookPage: React.FC = () => {
  const { words, loading, addWord, deleteWord, updateWord } = useWordStore()

  // ✅ 适配器：将 addWord 包装成 WordForm 需要的类型
  const handleAddWord = async (english: string, chinese: string): Promise<void> => {
    const result = await addWord(english, chinese)
    if (!result.success) {
      // 把错误抛出去，让 WordForm 的 catch 或错误状态处理
      throw new Error(result.message || '添加失败')
    }
  }
  // ✅ 适配 WordList：deleteWord → Promise<void>
  const handleDeleteWord = async (id: string): Promise<void> => {
    const result = await deleteWord(id)
    if (!result.success) {
      throw new Error(result.message || '删除失败')
    }
  }

  // ✅ 适配 WordList：updateWord → Promise<void>
  const handleUpdateWord = async (id: string, english: string, chinese: string): Promise<void> => {
    const result = await updateWord(id, english, chinese)
    if (!result.success) {
      throw new Error(result.message || '更新失败')
    }
  }
  return (
    <div className="word-book-page">
      <WordForm onSubmit={handleAddWord} />
      <WordList
        words={words}
        loading={loading}
        onDelete={handleDeleteWord}
        onUpdate={handleUpdateWord}
      />
    </div>
  )
}