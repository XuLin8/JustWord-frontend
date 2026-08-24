// src/components/atoms/TodoItem/index.tsx
// 学习任务待办条目（数量徽标 + 标题 + 可选说明）。样式类沿用 Dashboard 视觉。
import React from 'react'

export type TaskTone = 'primary' | 'success' | 'warning' | 'violet'

interface TodoItemProps {
  title: string
  count: number
  tone: TaskTone
  suffix?: string
}

export const TodoItem: React.FC<TodoItemProps> = ({ title, count, tone, suffix }) => (
  <div className={`todo-item todo-${tone}`}>
    <div className="todo-badge">{count}</div>
    <div className="todo-body">
      <span className="todo-title">{title}</span>
      {suffix && <small className="todo-suffix">{suffix}</small>}
    </div>
  </div>
)