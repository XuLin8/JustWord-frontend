/**
 * ============================================
 * 文件用途：TypeScript 类型定义文件
 * 主要功能：
 *   - 定义单词数据结构（Word）
 *   - 定义操作结果类型（OperationResult）
 *   - 定义导入结果类型（ImportResult）
 * 依赖关系：
 *   - 无外部依赖（纯 TypeScript 类型定义）
 * 导出内容：
 *   - Word：单词数据接口（id、英文、中文、创建时间）
 *   - OperationResult：操作结果接口（成功状态、可选消息）
 *   - ImportResult：导入结果接口（继承 OperationResult，增加导入/跳过数量）
 * ============================================
 */

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