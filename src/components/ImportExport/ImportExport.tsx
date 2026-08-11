/**
 * ============================================
 * 文件用途：词库导入/导出 UI 组件
 * 主要功能：
 *   - 导出词库为 JSON 格式文件
 *   - 导出词库为 CSV 格式文件（含 BOM 头，兼容 Excel）
 *   - 导入 JSON 格式词库文件
 *   - 导入 CSV 格式词库文件（自动检测 GBK/UTF-8 编码）
 *   - 清空所有单词（二次确认防误删）
 *   - 显示当前单词总数
 *   - 导入/导出状态反馈
 * 依赖关系：
 *   - react（useRef, useState）
 *   - useWordStore（单词状态管理）
 *   - exportToJSON / exportToCSV（导出工具函数）
 * 导出内容：
 *   - ImportExport：默认导出组件
 * 特殊处理：
 *   - CSV 使用 ArrayBuffer + GBK 解码，解决中文乱码问题
 *   - JSON 自动验证数据结构是否合法
 *   - 清空需要两步确认（先点击"清空词库"，再点"再次确认清空"）
 * ============================================
 */

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
        // ✅ 改动1：读取为 ArrayBuffer（而不是直接读成字符串）
        const buffer = e.target?.result as ArrayBuffer
        
        // ✅ 改动2：尝试用 GBK 解码（中文 Windows 默认编码）
        let content = ''
        try {
          // 先用 GBK 解码
          content = new TextDecoder('GBK').decode(buffer)
          console.log('✅ 使用 GBK 编码解码')
        } catch {
          // 如果 GBK 失败，降级到 UTF-8
          content = new TextDecoder('UTF-8').decode(buffer)
          console.log('✅ 使用 UTF-8 编码解码')
        }

        // 如果还是乱码，试试这个（移除 BOM 头）
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1)
        }

        console.log('📄 解码后的内容前100字符:', content.substring(0, 100))

        const lines = content.split('\n').filter(line => line.trim())

        if (lines.length < 2) {
          alert('❌ CSV 文件格式无效：至少需要标题行和一行数据')
          return
        }

        // ✅支持含空格的单词
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++
              } else {
                inQuotes = !inQuotes
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          
          if (current || result.length > 0) {
            result.push(current.trim())
          }
          
          return result
        }

        const headers = parseCSVLine(lines[0])
        console.log('📋 原始标题行:', lines[0])
        console.log('📋 解析后的 headers:', headers)
        console.log('📋 headers 长度:', headers.length)
        const englishIndex = headers.findIndex(h => h.includes('英文') || h.toLowerCase().includes('english'))
        const chineseIndex = headers.findIndex(h => h.includes('中文') || h.toLowerCase().includes('chinese') || h.includes('释义'))
        
        console.log('englishIndex:', englishIndex, 'chineseIndex:', chineseIndex) 

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

    // ✅ 改动3：改为 readAsArrayBuffer
    reader.readAsArrayBuffer(file)
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