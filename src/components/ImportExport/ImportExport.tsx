import { useRef, useState } from 'react'
import { useWordStore } from '../../store/wordStore'
import { exportToJSON, exportToCSV } from '../../utils/helpers'
import './ImportExport.css'

interface ImportExportProps {
  onImportComplete?: () => void
}

export default function ImportExport({ onImportComplete }: ImportExportProps) {
  const { words, importWords, clearAllWords } = useWordStore()
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 导出 JSON
  const handleExportJSON = () => {
    if (words.length === 0) {
      alert('⚠️ 词库为空，没有可导出的数据')
      return
    }
    setIsExporting(true)
    try {
      exportToJSON(words)
      alert(`✅ 成功导出 ${words.length} 个单词`)
    } catch (error) {
      console.error('导出失败:', error)
      alert('❌ 导出失败，请重试')
    } finally {
      setIsExporting(false)
    }
  }

  // 导出 CSV
  const handleExportCSV = () => {
    if (words.length === 0) {
      alert('⚠️ 词库为空，没有可导出的数据')
      return
    }
    setIsExporting(true)
    try {
      exportToCSV(words)
      alert(`✅ 成功导出 ${words.length} 个单词`)
    } catch (error) {
      console.error('导出失败:', error)
      alert('❌ 导出失败，请重试')
    } finally {
      setIsExporting(false)
    }
  }

  // 导入 JSON
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const importedData = JSON.parse(content)

        if (!Array.isArray(importedData)) {
          alert('❌ 无效的 JSON 格式：数据必须是数组')
          return
        }

        const validWords = importedData.filter(item =>
          item.english && typeof item.english === 'string' &&
          item.chinese && typeof item.chinese === 'string'
        )

        if (validWords.length === 0) {
          alert('❌ 没有找到有效的单词数据（需要 english 和 chinese 字段）')
          return
        }

        const result = await importWords(validWords)
        alert(result.message)
        
        if (result.success && onImportComplete) {
          onImportComplete()
        }
      } catch (error) {
        console.error('导入失败:', error)
        alert('❌ 导入失败：请检查 JSON 格式是否正确')
      } finally {
        setIsImporting(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }

    reader.onerror = () => {
      alert('❌ 读取文件失败')
      setIsImporting(false)
    }

    reader.readAsText(file)
  }

  // 导入 CSV
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const lines = content.split('\n').filter(line => line.trim())

        if (lines.length < 2) {
          alert('❌ CSV 文件格式无效：至少需要标题行和一行数据')
          return
        }

        const parseCSVLine = (line: string) => {
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
          if (!matches) return []
          return matches.map(m => m.replace(/^"|"$/g, '').trim())
        }

        const headers = parseCSVLine(lines[0])
        const englishIndex = headers.findIndex(h => h.includes('英文') || h.toLowerCase().includes('english'))
        const chineseIndex = headers.findIndex(h => h.includes('中文') || h.toLowerCase().includes('chinese') || h.includes('释义'))

        if (englishIndex === -1 || chineseIndex === -1) {
          alert('❌ CSV 格式无效：请确保包含 "英文" 和 "中文" 列')
          return
        }

        const wordsToImport: { english: string; chinese: string }[] = []

        for (let i = 1; i < lines.length; i++) {
          const fields = parseCSVLine(lines[i])
          const english = fields[englishIndex]?.trim() || ''
          const chinese = fields[chineseIndex]?.trim() || ''
          if (english && chinese) {
            wordsToImport.push({ english, chinese })
          }
        }

        if (wordsToImport.length === 0) {
          alert('❌ 没有找到有效的单词数据')
          return
        }

        const result = await importWords(wordsToImport)
        alert(result.message)
        
        if (result.success && onImportComplete) {
          onImportComplete()
        }
      } catch (error) {
        console.error('导入失败:', error)
        alert('❌ 导入失败：请检查 CSV 格式是否正确')
      } finally {
        setIsImporting(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }

    reader.onerror = () => {
      alert('❌ 读取文件失败')
      setIsImporting(false)
    }

    reader.readAsText(file, 'UTF-8')
  }

  // 清空所有单词
  const handleClearAll = async () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true)
      return
    }

    if (window.confirm(`⚠️ 确定要删除全部 ${words.length} 个单词吗？此操作不可撤销！`)) {
      const result = await clearAllWords()
      alert(result.success ? '✅ 已清空所有单词' : `❌ ${result.message}`)
      setShowClearConfirm(false)
    } else {
      setShowClearConfirm(false)
    }
  }

  return (
    <div className="import-export">
      <div className="ie-header">
        <span className="ie-title">📦 词库管理</span>
        <span className="ie-count">共 {words.length} 个单词</span>
      </div>

      <div className="ie-actions">
        {/* 导出区域 */}
        <div className="ie-group">
          <span className="ie-label">导出</span>
          <div className="ie-buttons">
            <button 
              onClick={handleExportJSON} 
              disabled={isExporting || words.length === 0}
            >
              📄 JSON
            </button>
            <button 
              onClick={handleExportCSV} 
              disabled={isExporting || words.length === 0}
            >
              📊 CSV
            </button>
          </div>
        </div>

        {/* 导入区域 */}
        <div className="ie-group">
          <span className="ie-label">导入</span>
          <div className="ie-buttons">
            <label className="file-label">
              📄 JSON
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportJSON}
                disabled={isImporting}
                style={{ display: 'none' }}
              />
            </label>
            <label className="file-label">
              📊 CSV
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleImportCSV}
                disabled={isImporting}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* 清空 */}
        <div className="ie-group ie-danger">
          <button 
            onClick={handleClearAll} 
            className="danger-btn"
            disabled={words.length === 0}
          >
            🗑️ {showClearConfirm ? '再次确认清空' : '清空词库'}
          </button>
        </div>
      </div>

      {isImporting && <div className="ie-status">⏳ 导入中...</div>}
      {isExporting && <div className="ie-status">⏳ 导出中...</div>}
    </div>
  )
}