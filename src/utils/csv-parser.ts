// utils/csv-parser.ts

export interface CSVParseResult<T = any> {
    headers: string[]
    data: T[]
    errors: CSVParseError[]
    statistics: {
        totalRows: number
        validRows: number
        skippedRows: number
    }
}

export interface CSVParseError {
    row: number
    column?: number
    message: string
    raw: string
}

export interface CSVParserOptions {
    delimiter?: string
    trimFields?: boolean
    skipEmptyLines?: boolean
    headerMapping?: Record<string, string>
}

export class CSVParser {
    /**
     * 解析 CSV 内容
     */
    static parse<T = any>(
        content: string,
        options: CSVParserOptions = {}
    ): CSVParseResult<T> {
        const {
            delimiter = ',',
            trimFields = true,
            skipEmptyLines = true
        } = options

        const lines = content.split('\n')
            .filter(line => !skipEmptyLines || line.trim())

        if (lines.length === 0) {
            return {
                headers: [],
                data: [],
                errors: [],
                statistics: { totalRows: 0, validRows: 0, skippedRows: 0 }
            }
        }

        // 解析标题
        const headers = this.parseLine(lines[0], delimiter, trimFields)
        const errors: CSVParseError[] = []
        const data: T[] = []

        // 解析数据
        for (let i = 1; i < lines.length; i++) {
            const fields = this.parseLine(lines[i], delimiter, trimFields)
            
            if (fields.length === 0) {
                errors.push({
                    row: i + 1,
                    message: '空行',
                    raw: lines[i]
                })
                continue
            }

            if (fields.length < headers.length) {
                errors.push({
                    row: i + 1,
                    message: `字段数量不足（${fields.length} 个，需要 ${headers.length} 个）`,
                    raw: lines[i]
                })
                continue
            }

            const row: any = {}
            for (let j = 0; j < headers.length; j++) {
                row[headers[j]] = fields[j] || ''
            }
            data.push(row as T)
        }

        return {
            headers,
            data,
            errors,
            statistics: {
                totalRows: lines.length - 1,
                validRows: data.length,
                skippedRows: errors.length
            }
        }
    }

    /**
     * 解析单行 CSV
     */
    static parseLine(line: string, delimiter: string = ',', trim: boolean = true): string[] {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        let i = 0

        while (i < line.length) {
            const char = line[i]

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // 转义双引号
                    current += '"'
                    i += 2
                } else {
                    inQuotes = !inQuotes
                    i++
                }
            } else if (char === delimiter && !inQuotes) {
                result.push(trim ? current.trim() : current)
                current = ''
                i++
            } else {
                current += char
                i++
            }
        }

        if (current || result.length > 0) {
            result.push(trim ? current.trim() : current)
        }

        return result
    }

    /**
     * 智能查找列索引
     */
    static findColumnIndex(headers: string[], keywords: string[]): number {
        return headers.findIndex(h => {
            const normalized = h.toLowerCase().trim()
            return keywords.some(keyword => 
                normalized.includes(keyword.toLowerCase()) ||
                keyword.toLowerCase().includes(normalized)
            )
        })
    }
}