// 单词类型
export interface Word {
  id: string
  english: string
  chinese: string
  createdAt: number
}

// 操作结果类型
export interface OperationResult {
  success: boolean
  message?: string
}

// 导入结果类型
export interface ImportResult extends OperationResult {
  imported: number
  skipped: number
}