// src/components/organisms/ImportExportPanel/index.tsx
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWordStore } from '../../../store/wordStore'
import { useUIStore } from '../../../store/uiStore'
import { exportToJSON, exportToCSV } from '../../../utils/helpers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileJson, FileSpreadsheet, Package, Trash2, Upload } from 'lucide-react'

interface ImportExportPanelProps {
  onImportComplete?: () => void
}

export const ImportExportPanel: React.FC<ImportExportPanelProps> = ({
  onImportComplete,
}) => {
  const { t } = useTranslation()
  const { words, importWords, clearAllWords } = useWordStore()
  const { showToast, openConfirmDialog } = useUIStore()
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // 导出 JSON
  const handleExportJSON = () => {
    if (words.length === 0) {
      showToast(t('importExport.emptyWarning'), 'warning')
      return
    }
    setIsExporting(true)
    try {
      exportToJSON(words)
      showToast(t('importExport.exportSuccess', { count: words.length }), 'success')
    } catch (error) {
      console.error('导出失败:', error)
      showToast(t('importExport.exportFailed'), 'error')
    } finally {
      setIsExporting(false)
    }
  }

  // 导出 CSV
  const handleExportCSV = () => {
    if (words.length === 0) {
      showToast(t('importExport.emptyWarning'), 'warning')
      return
    }
    setIsExporting(true)
    try {
      exportToCSV(words)
      showToast(t('importExport.exportSuccess', { count: words.length }), 'success')
    } catch (error) {
      console.error('导出失败:', error)
      showToast(t('importExport.exportFailed'), 'error')
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
          showToast(t('importExport.invalidJson'), 'error')
          return
        }

        const validWords = importedData.filter(item =>
          item.english && typeof item.english === 'string' &&
          item.chinese && typeof item.chinese === 'string'
        )

        if (validWords.length === 0) {
          showToast(t('importExport.noValidWordsJson'), 'error')
          return
        }

        const result = await importWords(validWords)
        if (result.success) {
          showToast(result.message ?? t('importExport.importSuccess'), 'success')
          if (onImportComplete) onImportComplete()
        } else {
          showToast(result.message ?? t('importExport.importFailed'), 'warning')
        }
      } catch (error) {
        console.error('导入失败:', error)
        showToast(t('importExport.importJsonError'), 'error')
      } finally {
        setIsImporting(false)
        if (jsonInputRef.current) {
          jsonInputRef.current.value = ''
        }
      }
    }

    reader.onerror = () => {
      showToast(t('importExport.readFileFailed'), 'error')
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
          showToast(t('importExport.invalidCsv'), 'error')
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
          showToast(t('importExport.invalidCsvColumns'), 'error')
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
          showToast(t('importExport.noValidWordsCsv'), 'error')
          return
        }

        const result = await importWords(wordsToImport)
        if (result.success) {
          showToast(result.message ?? t('importExport.importSuccess'), 'success')
          if (onImportComplete) onImportComplete()
        } else {
          showToast(result.message ?? t('importExport.importFailed'), 'warning')
        }
      } catch (error) {
        console.error('导入失败:', error)
        showToast(t('importExport.importCsvError'), 'error')
      } finally {
        setIsImporting(false)
        if (csvInputRef.current) {
          csvInputRef.current.value = ''
        }
      }
    }

    reader.onerror = () => {
      showToast(t('importExport.readFileFailed'), 'error')
      setIsImporting(false)
    }

    reader.readAsArrayBuffer(file)
  }

  const handleClearAll = () => {
    openConfirmDialog({
      title: t('importExport.clearTitle'),
      description: t('importExport.clearDesc', { count: words.length }),
      confirmText: t('importExport.clearConfirm'),
      cancelText: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        const result = await clearAllWords()
        if (result.success) {
          showToast(t('importExport.clearSuccess'), 'success')
        } else {
          showToast(result.message ?? t('importExport.importFailed'), 'error')
        }
      },
    })
  }

  return (
    <Card className="import-export-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="size-4 text-primary" />
          {t('importExport.title')}
        </CardTitle>
        <CardDescription>
          {t('word.footerCount', { count: words.length })} · {t('importExport.subtitle')}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-4">
        {/* 导出 */}
        <div className="flex items-center gap-2">
          <span className="w-10 text-sm font-medium text-muted-foreground">{t('importExport.export')}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportJSON} disabled={isExporting || words.length === 0}>
              <FileJson className="size-4" />
              JSON
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportCSV} disabled={isExporting || words.length === 0}>
              <FileSpreadsheet className="size-4" />
              CSV
            </Button>
          </div>
        </div>

        {/* 导入 */}
        <div className="flex items-center gap-2">
          <span className="w-10 text-sm font-medium text-muted-foreground">{t('importExport.import')}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild disabled={isImporting}>
              <label className="cursor-pointer">
                <Upload className="size-4" />
                JSON
                <input
                  type="file"
                  ref={jsonInputRef}
                  accept=".json"
                  onChange={handleImportJSON}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
            </Button>
            <Button size="sm" variant="outline" asChild disabled={isImporting}>
              <label className="cursor-pointer">
                <Upload className="size-4" />
                CSV
                <input
                  type="file"
                  ref={csvInputRef}
                  accept=".csv"
                  onChange={handleImportCSV}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
            </Button>
          </div>
        </div>

        {/* 清空 */}
        <div className="ml-auto">
          <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={words.length === 0}>
            <Trash2 className="size-4" />
            {t('importExport.clearAll')}
          </Button>
        </div>

        {isImporting && (
          <span className="w-full text-center text-sm text-muted-foreground">{t('importExport.importing')}</span>
        )}
        {isExporting && (
          <span className="w-full text-center text-sm text-muted-foreground">{t('importExport.exporting')}</span>
        )}
      </CardContent>
    </Card>
  )
}