/**
 * ============================================
 * 文件用途：文件验证工具类，用于校验上传文件的类型、大小、扩展名等
 * 主要功能：
 *   - 验证文件是否存在、是否为空
 *   - 验证文件 MIME 类型（支持通配符，如 image/*）
 *   - 验证文件扩展名
 *   - 验证文件大小（最小/最大限制）
 *   - 提供文件大小友好显示
 *   - 预设常用文件类型的验证配置（CSV、图片、JSON、Excel）
 * 依赖关系：
 *   - 无外部依赖（纯 TypeScript）
 * 导出内容：
 *   - FileValidator：验证类（静态方法）
 *   - FileValidationOptions：验证选项接口
 *   - FileValidationResult：验证结果接口
 *   - FileValidationPresets：预设配置对象
 * ============================================
 */

// utils/file-validator.ts

export interface FileValidationOptions {
    /** 允许的 MIME 类型 */
    allowedTypes?: string[]
    /** 允许的文件扩展名 */
    allowedExtensions?: string[]
    /** 最大文件大小（字节） */
    maxSize?: number
    /** 最小文件大小（字节） */
    minSize?: number
    /** 是否允许空文件 */
    allowEmpty?: boolean
}

export interface FileValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
}

export class FileValidator {
    /**
     * 验证文件
     */
    static validate(file: File, options: FileValidationOptions = {}): FileValidationResult {
        const errors: string[] = []
        const warnings: string[] = []

        // 1. 检查文件是否存在
        if (!file) {
            errors.push('文件不存在')
            return { valid: false, errors, warnings }
        }

        // 2. 验证文件类型
        if (options.allowedTypes || options.allowedExtensions) {
            const typeValid = this.validateFileType(file, {
                allowedTypes: options.allowedTypes,
                allowedExtensions: options.allowedExtensions
            })
            
            if (!typeValid.valid) {
                errors.push(...typeValid.errors)
            }
            if (typeValid.warnings) {
                warnings.push(...typeValid.warnings)
            }
        }

        // 3. 验证文件大小
        if (options.maxSize !== undefined && file.size > options.maxSize) {
            const sizeInMB = (file.size / 1024 / 1024).toFixed(1)
            const maxInMB = (options.maxSize / 1024 / 1024).toFixed(1)
            errors.push(`文件过大（${sizeInMB}MB），请上传小于 ${maxInMB}MB 的文件`)
        }

        if (options.minSize !== undefined && file.size < options.minSize) {
            const sizeInKB = (file.size / 1024).toFixed(1)
            const minInKB = (options.minSize / 1024).toFixed(1)
            errors.push(`文件过小（${sizeInKB}KB），请上传大于 ${minInKB}KB 的文件`)
        }

        // 4. 检查是否为空文件
        if (!options.allowEmpty && file.size === 0) {
            errors.push('文件为空')
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        }
    }

    /**
     * 验证文件类型
     */
    private static validateFileType(
        file: File,
        options: { allowedTypes?: string[]; allowedExtensions?: string[] }
    ): { valid: boolean; errors: string[]; warnings?: string[] } {
        const errors: string[] = []
        const warnings: string[] = []

        if (options.allowedTypes && options.allowedTypes.length > 0) {
            const isTypeValid = options.allowedTypes.some(type => {
                if (type.includes('/*')) {
                    // 通配符匹配：例如 image/* 匹配所有图片类型
                    const baseType = type.split('/')[0]
                    return file.type.startsWith(baseType + '/')
                }
                return file.type === type
            })

            if (!isTypeValid) {
                const allowedTypesStr = options.allowedTypes.join(', ')
                errors.push(`不支持的文件类型（${file.type || '未知'}），支持的类型：${allowedTypesStr}`)
            }
        }

        if (options.allowedExtensions && options.allowedExtensions.length > 0) {
            const ext = file.name.split('.').pop()?.toLowerCase()
            const isExtValid = options.allowedExtensions.some(e => e.toLowerCase() === ext)

            if (!isExtValid) {
                const allowedExtStr = options.allowedExtensions.join(', ')
                warnings.push(`文件扩展名 "${ext}" 不在允许列表中（${allowedExtStr}）`)
                
                // 如果 MIME 类型验证通过但扩展名不匹配，仅警告
                if (errors.length === 0) {
                    warnings.push('建议使用正确的文件扩展名')
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings: warnings.length > 0 ? warnings : undefined
        }
    }

    /**
     * 获取文件的友好大小描述
     */
    static getFileSizeDescription(bytes: number): string {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
    }
}

/**
 * 预定义的验证配置
 */
export const FileValidationPresets = {
    /** CSV 文件 */
    CSV: {
        allowedTypes: ['text/csv', 'application/vnd.ms-excel'],
        allowedExtensions: ['csv'],
        maxSize: 10 * 1024 * 1024, // 10MB
        minSize: 1, // 至少 1 字节
        allowEmpty: false
    },

    /** 图片文件 */
    IMAGE: {
        allowedTypes: ['image/*'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        maxSize: 5 * 1024 * 1024, // 5MB
        allowEmpty: false
    },

    /** JSON 文件 */
    JSON: {
        allowedTypes: ['application/json'],
        allowedExtensions: ['json'],
        maxSize: 5 * 1024 * 1024, // 5MB
        allowEmpty: false
    },

    /** Excel 文件 */
    EXCEL: {
        allowedTypes: [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ],
        allowedExtensions: ['xls', 'xlsx'],
        maxSize: 20 * 1024 * 1024, // 20MB
        allowEmpty: false
    }
}