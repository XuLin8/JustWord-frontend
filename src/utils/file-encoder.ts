/**
 * ============================================
 * 文件用途：文件编码检测与解码工具类，解决乱码问题
 * 主要功能：
 *   - 智能检测文件编码（UTF-8、GBK、GB2312、GB18030、Big5、Shift-JIS 等）
 *   - 自动检测并移除 BOM（Byte Order Mark）
 *   - 多编码尝试解码，自动选择最合适的编码
 *   - 验证解码后的文本是否有效（包含中英文等合理字符）
 *   - 提供编码检测方法（仅检测不解码）
 *   - 降级策略：解码失败时回退到 UTF-8
 * 依赖关系：
 *   - 无外部依赖（使用 Web API：FileReader、TextDecoder）
 * 导出内容：
 *   - FileEncoder：编码工具类（静态方法）
 *   - DecodeResult：解码结果接口（包含内容、编码、BOM 状态）
 * ============================================
 */


// utils/file-encoder.ts

export interface DecodeResult {
    content: string
    encoding: string
    bomRemoved: boolean
}

export class FileEncoder {
    private static readonly ENCODINGS = ['UTF-8', 'GBK', 'GB2312', 'GB18030', 'Big5', 'Shift-JIS']

    /**
     * 读取文件并智能解码
     */
    static async decodeFile(file: File): Promise<DecodeResult> {
        const buffer = await this.readFileAsBuffer(file)
        return this.decodeBuffer(buffer)
    }

    /**
     * 读取文件为 ArrayBuffer
     */
    static readFileAsBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result
                if (result instanceof ArrayBuffer) {
                    resolve(result)
                } else {
                    reject(new Error('读取文件失败'))
                }
            }
            reader.onerror = () => reject(new Error('读取文件失败'))
            reader.readAsArrayBuffer(file)
        })
    }

    /**
     * 解码 ArrayBuffer
     */
    static decodeBuffer(buffer: ArrayBuffer): DecodeResult {
        const uint8Array = new Uint8Array(buffer)

        // 1. 检测并移除 BOM
        let bomRemoved = false
        let data = buffer

        if (uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
            data = buffer.slice(3)
            bomRemoved = true
        }

        // 2. 尝试各种编码
        for (const encoding of this.ENCODINGS) {
            try {
                const decoder = new TextDecoder(encoding, { fatal: true })
                const content = decoder.decode(data)
                
                if (this.isValidText(content)) {
                    return { content, encoding, bomRemoved }
                }
            } catch {
                continue
            }
        }

        // 3. 降级到 UTF-8
        const content = new TextDecoder('UTF-8', { fatal: false }).decode(data)
        return { content, encoding: 'UTF-8 (降级)', bomRemoved }
    }

    /**
     * 验证文本是否有效
     */
    private static isValidText(text: string): boolean {
        if (!text || text.length === 0) return false
        if (text.includes('\uFFFD')) return false
        
        // 检查是否包含合理字符
        return /[\u4e00-\u9fa5]|[a-zA-Z]|\d/.test(text)
    }

    /**
     * 检测文件编码（仅检测，不解码）
     */
    static detectEncoding(buffer: ArrayBuffer): string {
        const uint8Array = new Uint8Array(buffer)

        // BOM 检测
        if (uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
            return 'UTF-8-BOM'
        }
        if (uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
            return 'UTF-16BE'
        }
        if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
            return 'UTF-16LE'
        }

        // 统计检测
        let asciiCount = 0
        let highByteCount = 0

        for (let i = 0; i < Math.min(uint8Array.length, 1000); i++) {
            if (uint8Array[i] < 0x80) {
                asciiCount++
            } else {
                highByteCount++
            }
        }

        const ratio = highByteCount / (asciiCount + highByteCount)
        return ratio > 0.3 ? 'GBK' : 'UTF-8'
    }
}