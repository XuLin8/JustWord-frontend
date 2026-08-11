/**
 * ============================================
 * 文件用途：应用主入口组件（根组件）
 * 主要功能：
 *   - 页面整体布局（头部、表单、列表、统计）
 *   - 单词添加表单（实时输入过滤、提交验证）
 *   - 单词列表渲染（显示所有单词）
 *   - 单词编辑功能（行内编辑模式）
 *   - 单词删除功能（带确认弹窗）
 *   - 词库导入/导出面板（可切换显示）
 *   - 应用启动时自动加载已保存数据
 *   - 全局加载状态显示
 *   - 防抖 Alert（500ms 内不重复弹窗）
 * 依赖关系：
 *   - react（useState, useEffect）
 *   - useWordStore（状态管理）
 *   - ImportExport 组件（导入导出面板）
 *   - 验证工具函数（isValidEnglish, isValidChinese）
 *   - App.css（样式文件）
 * 导出内容：
 *   - App：默认导出根组件
 * 交互流程：
 *   1. 加载时自动读取 IndexedDB 数据
 *   2. 用户通过表单添加单词（实时过滤非法字符）
 *   3. 点击编辑进入行内编辑模式
 *   4. 点击删除确认后删除
 *   5. 点击"管理词库"切换导入导出面板
 * ============================================
 */

import { useState, useEffect } from 'react'
import { useWordStore } from './store/wordStore'
import ImportExport from './components/ImportExport/ImportExport'
import { isValidEnglish, isValidChinese } from './utils/validation'
import './App.css'

function App() {
  const { words, loading, addWord, deleteWord, updateWord, loadWords } = useWordStore()
  const [english, setEnglish] = useState('')
  const [chinese, setChinese] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editEnglish, setEditEnglish] = useState('')
  const [editChinese, setEditChinese] = useState('')
  const [showImportExport, setShowImportExport] = useState(false)
  const [lastAlertTime, setLastAlertTime] = useState(0)

  useEffect(() => {
    loadWords()
  }, [loadWords])

  const showAlert = (message: string) => {
    const now = Date.now()
    if (now - lastAlertTime > 500) {
      alert(message)
      setLastAlertTime(now)
    }
  }

  // ✅ 添加单词 - 表单提交处理
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmedEnglish = english.trim()
    const trimmedChinese = chinese.trim()

    // 验证
    if (!trimmedEnglish) {
      showAlert('⚠️ 请输入英文单词')
      return
    }
    if (!trimmedChinese) {
      showAlert('⚠️ 请输入中文释义')
      return
    }
    if (!isValidEnglish(trimmedEnglish)) {
      showAlert('⚠️ 英文只能包含字母、空格、连字符和撇号')
      return
    }
    if (!isValidChinese(trimmedChinese)) {
      showAlert('⚠️ 请输入中文释义')
      return
    }

    const result = await addWord(trimmedEnglish, trimmedChinese)
    
    if (result.success) {
      setEnglish('')
      setChinese('')
      showAlert('✅ 添加成功！')
    } else {
      showAlert(`❌ ${result.message || '添加失败，请重试'}`)
    }
  }

  // 英文输入
  const handleEnglishChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const filtered = value.replace(/[^a-zA-Z\s\-']/g, '')
    setEnglish(filtered)
  }

  // 中文输入
  const handleChineseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChinese(e.target.value)
  }

  // 开始编辑
  const handleStartEdit = (word: { id: string; english: string; chinese: string }) => {
    setEditingId(word.id)
    setEditEnglish(word.english)
    setEditChinese(word.chinese)
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditEnglish('')
    setEditChinese('')
  }

  // ✅ 保存编辑
  const handleSaveEdit = async (id: string) => {
    const trimmedEnglish = editEnglish.trim()
    const trimmedChinese = editChinese.trim()

    if (!trimmedEnglish) {
      showAlert('⚠️ 英文单词不能为空')
      return
    }
    if (!trimmedChinese) {
      showAlert('⚠️ 中文释义不能为空')
      return
    }
    if (!isValidEnglish(trimmedEnglish)) {
      showAlert('⚠️ 英文只能包含字母、空格、连字符和撇号')
      return
    }
    if (!isValidChinese(trimmedChinese)) {
      showAlert('⚠️ 请输入中文释义')
      return
    }

    const result = await updateWord(id, trimmedEnglish, trimmedChinese)
    
    if (result.success) {
      setEditingId(null)
      setEditEnglish('')
      setEditChinese('')
      showAlert('✅ 更新成功！')
    } else {
      showAlert(`❌ ${result.message || '更新失败，请重试'}`)
    }
  }

  // 编辑英文输入
  const handleEditEnglishChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const filtered = value.replace(/[^a-zA-Z\s\-']/g, '')
    setEditEnglish(filtered)
  }

  // 编辑中文输入
  const handleEditChineseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditChinese(e.target.value)
  }

  // ✅ 删除单词
  const handleDeleteWord = async (id: string) => {
    if (window.confirm('🗑️ 确定要删除这个单词吗？')) {
      const result = await deleteWord(id)
      if (!result.success) {
        showAlert(`❌ ${result.message || '删除失败，请重试'}`)
      } else {
        showAlert('✅ 删除成功！')
      }
    }
  }

  // 导入完成后刷新
  const handleImportComplete = () => {
    loadWords()
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>📚 Just Word</h1>
        <button 
          className="toggle-ie-btn"
          onClick={() => setShowImportExport(!showImportExport)}
        >
          {showImportExport ? '✕ 关闭' : '📦 管理词库'}
        </button>
      </div>

      {/* 导入导出面板 */}
      {showImportExport && (
        <ImportExport onImportComplete={handleImportComplete} />
      )}

      {/* ✅ 添加表单 - onSubmit 绑定 handleSubmit */}
      <form onSubmit={handleSubmit} className="add-form">
        <input
          type="text"
          placeholder="英文单词 (仅字母)"
          value={english}
          onChange={handleEnglishChange}
        />
        <input
          type="text"
          placeholder="中文释义"
          value={chinese}
          onChange={handleChineseChange}
        />
        <button type="submit">添加</button>
      </form>

      {/* 单词列表 */}
      {loading ? (
        <p>加载中...</p>
      ) : words.length === 0 ? (
        <p className="empty">还没有单词，添加一个吧！</p>
      ) : (
        <ul className="word-list">
          {words.map((word) => (
            <li key={word.id}>
              {editingId === word.id ? (
                <div className="edit-mode">
                  <input
                    type="text"
                    value={editEnglish}
                    onChange={handleEditEnglishChange}
                    placeholder="英文"
                  />
                  <input
                    type="text"
                    value={editChinese}
                    onChange={handleEditChineseChange}
                    placeholder="中文"
                  />
                  <button onClick={() => handleSaveEdit(word.id)}>保存</button>
                  <button onClick={handleCancelEdit}>取消</button>
                </div>
              ) : (
                <>
                  <div>
                    <strong>{word.english}</strong>
                    <span> - </span>
                    <span>{word.chinese}</span>
                  </div>
                  <div className="word-actions">
                    <button onClick={() => handleStartEdit(word)}>编辑</button>
                    <button onClick={() => handleDeleteWord(word.id)}>删除</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      
      <div className="stats">
        共 {words.length} 个单词
      </div>
    </div>
  )
}

export default App