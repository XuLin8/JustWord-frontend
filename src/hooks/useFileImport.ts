/**
 * ============================================
 * 文件用途：文件导入功能的自定义 Hook
 * 主要功能：
 *   - 统一处理文件导入流程（验证 → 解码 → 解析）
 *   - 管理导入状态（进行中、进度、错误）
 *   - 支持导入成功/失败回调
 *   - 可自定义验证配置（预设或自定义）
 *   - 返回导入结果供组件使用
 * 依赖关系：
 *   - react（useState, useCallback）
 *   - FileValidator（文件验证）
 *   - FileEncoder（编码解码）
 *   - CSVParser（CSV 解析）
 * 导出内容：
 *   - useFileImport：自定义 Hook
 *   - UseFileImportOptions：配置选项接口
 *   - UseFileImportReturn：返回值接口
 * ============================================
 */

// hooks/useFileImport.ts

import { useState, useCallback } from 'react'
import { FileValidator, FileValidationPresets } from '../utils/file-validator'
import { FileEncoder } from '../utils/file-encoder'
import { CSVParser } from '../utils/csv-parser'

export interface UseFileImportOptions {
    /** 验证配置（使用预设或自定义） */
    validation?: typeof FileValidationPresets.CSV
    /** 是否自动解码 */
    autoDecode?: boolean
    /** 导入完成回调 */
    onSuccess?: (data: any[]) => void
    /** 导入失败回调 */
    onError?: (error: Error) => void
}

export interface UseFileImportReturn {
    /** 是否正在导入 */
    isImporting: boolean
    /** 导入进度 */
    progress: number
    /** 错误信息 */
    error: string | null
    /** 执行导入 */
    importFile: (file: File) => Promise<any>
    /** 重置状态 */
    reset: () => void
}

export function useFileImport(options: UseFileImportOptions = {}): UseFileImportReturn {
    const [isImporting, setIsImporting] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const importFile = useCallback(async (file: File): Promise<any> => {
        setIsImporting(true)
        setProgress(0)
        setError(null)

        try {
            // 1. 验证文件
            const validation = FileValidator.validate(file, options.validation || FileValidationPresets.CSV)
            
            if (!validation.valid) {
                throw new Error(validation.errors.join('\n'))
            }

            setProgress(30)

            // 2. 解码文件
            const { content, encoding } = await FileEncoder.decodeFile(file)
            console.log(`📄 文件编码: ${encoding}`)

            setProgress(60)

            // 3. 解析 CSV
            const result = CSVParser.parse(content)
            
            if (result.data.length === 0) {
                throw new Error('没有找到有效的数据')
            }

            setProgress(90)

            // 4. 触发成功回调
            if (options.onSuccess) {
                options.onSuccess(result.data)
            }

            setProgress(100)
            return result

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '导入失败'
            setError(errorMessage)
            
            if (options.onError) {
                options.onError(error instanceof Error ? error : new Error(errorMessage))
            }
            
            throw error
        } finally {
            setIsImporting(false)
        }
    }, [options])

    const reset = useCallback(() => {
        setIsImporting(false)
        setProgress(0)
        setError(null)
    }, [])

    return {
        isImporting,
        progress,
        error,
        importFile,
        reset
    }
}