// src/components/organisms/ImportExportPanel/index.tsx
import React, { useRef, useState } from 'react'
import { useWordStore } from '../../../store/wordStore'
import { useUIStore } from '../../../store/uiStore'
import { exportToJSON, exportToCSV } from '../../../utils/helpers'
import { Button } from '../../atoms/Button'
import './ImportExportPanel.css'

interface ImportExportPanelProps {
  onImportComplete?: () => void
}

export const ImportExportPanel: React.FC<ImportExportPanelProps> = ({
  onImportComplete,
}) => {
  const { words, importWords, clearAllWords } = useWordStore()
  const { showToast, openConfirmDialog } = useUIStore()
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // 导出 JSON
  const handleExportJSON = () => {
    if (words.length === 0) {
      showToast('词库为空，没有可导出的数据', 'warning')
      return
    }
    setIsExporting(true)
    try {
      exportToJSON(words)
      showToast(`成功导出 ${words.length} 个单词`, 'success')
    } catch (error) {
      console.error('导出失败:', error)
      showToast('导出失败，请重试', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  // 导出 CSV
  const handleExportCSV = () => {
    if (words.length === 0) {
      showToast('词库为空，没有可导出的数据', 'warning')
      return
    }
    setIsExporting(true)
    try {
      exportToCSV(words)
      showToast(`成功导出 ${words.length} 个单词`, 'success')
    } catch (error) {
      console.error('导出失败:', error)
      showToast('导出失败，请重试', 'error')
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
          showToast('无效的 JSON 格式：数据必须是数组', 'error')
          return
        }

        const validWords = importedData.filter(item =>
          item.english && typeof item.english === 'string' &&
          item.chinese && typeof item.chinese === 'string'
        )

        if (validWords.length === 0) {
          showToast('没有找到有效的单词数据（需要 english 和 chinese 字段）', 'error')
          return
        }

        const result = await importWords(validWords)
        if (result.success) {
          showToast(result.message, 'success')
          if (onImportComplete) onImportComplete()
        } else {
          showToast(result.message, 'warning')
        }
      } catch (error) {
        console.error('导入失败:', error)
        showToast('导入失败：请检查 JSON 格式是否正确', 'error')
      } finally {
        setIsImporting(false)
        if (jsonInputRef.current) {
          jsonInputRef.current.value = ''
        }
      }
    }

    reader.onerror = () => {
      showToast('读取文件失败', 'error')
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
        const buffer = e.target?.result as ArrayBuffer
        let content = ''
        try {
          content = new TextDecoder('GBK').decode(buffer)
        } catch {
          content = new TextDecoder('UTF-8').decode(buffer)
        }

        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1)
        }

        const lines = content.split('\n').filter(line => line.trim())

        if (lines.length < 2) {
          showToast('CSV 文件格式无效：至少需要标题行和一行数据', 'error')
          return
        }

        const parseCSVLine = (line: string) => {
          const result: string[] = []
          let current = ''
          let inQuotes = false
          let i = 0

          while (i < line.length) {
            const char = line[i]
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i += 2
              } else {
                inQuotes = !inQuotes
                i++
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim())
              current = ''
              i++
            } else {
              current += char
              i++
            }
          }

          if (current || result.length > 0) {
            result.push(current.trim())
          }
          return result
        }

        const headers = parseCSVLine(lines[0])
        const englishIndex = headers.findIndex(h =>
          h.includes('英文') || h.toLowerCase().includes('english')
        )
        const chineseIndex = headers.findIndex(h =>
          h.includes('中文') || h.toLowerCase().includes('chinese') || h.includes('释义')
        )

        if (englishIndex === -1 || chineseIndex === -1) {
          showToast('CSV 格式无效：请确保包含 "英文" 和 "中文" 列', 'error')
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
          showToast('没有找到有效的单词数据', 'error')
          return
        }

        const result = await importWords(wordsToImport)
        if (result.success) {
          showToast(result.message, 'success')
          if (onImportComplete) onImportComplete()
        } else {
          showToast(result.message, 'warning')
        }
      } catch (error) {
        console.error('导入失败:', error)
        showToast('导入失败：请检查 CSV 格式是否正确', 'error')
      } finally {
        setIsImporting(false)
        if (csvInputRef.current) {
          csvInputRef.current.value = ''
        }
      }
    }

    reader.onerror = () => {
      showToast('读取文件失败', 'error')
      setIsImporting(false)
    }

    reader.readAsArrayBuffer(file)
  }

  const handleClearAll = () => {
    openConfirmDialog({
      title: '清空词库',
      description: `确定要删除全部 ${words.length} 个单词吗？此操作不可撤销！`,
      confirmText: '全部删除',
      cancelText: '取消',
      confirmVariant: 'danger',
      onConfirm: async () => {
        const result = await clearAllWords()
        if (result.success) {
          showToast('已清空所有单词', 'success')
        } else {
          showToast(result.message, 'error')
        }
      },
    })
  }

  return (
    <div className="import-export-panel">
      <div className="ie-header">
        <span className="ie-title">📦 词库管理</span>
        <span className="ie-count">共 {words.length} 个单词</span>
      </div>

      <div className="ie-actions">
        {/* 导出 */}
        <div className="ie-group">
          <span className="ie-label">导出</span>
          <div className="ie-buttons">
            <Button size="sm" variant="secondary" onClick={handleExportJSON} disabled={isExporting || words.length === 0}>
              📄 JSON
            </Button>
            <Button size="sm" variant="secondary" onClick={handleExportCSV} disabled={isExporting || words.length === 0}>
              📊 CSV
            </Button>
          </div>
        </div>

        {/* 导入 */}
        <div className="ie-group">
          <span className="ie-label">导入</span>
          <div className="ie-buttons">
            <label className="file-label">
              📄 JSON
              <input
                type="file"
                ref={jsonInputRef}
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
                ref={csvInputRef}
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
          <Button variant="danger" size="sm" onClick={handleClearAll} disabled={words.length === 0}>
            🗑️ 清空词库
          </Button>
        </div>
      </div>

      {isImporting && <div className="ie-status">⏳ 导入中...</div>}
      {isExporting && <div className="ie-status">⏳ 导出中...</div>}
    </div>
  )
}
