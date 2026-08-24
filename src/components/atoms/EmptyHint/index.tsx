// src/components/atoms/EmptyHint/index.tsx
// 空状态占位提示组件。样式沿用 Dashboard 视觉（类名待迁移）。
import React from 'react'

interface EmptyHintProps {
  text: string
}

export const EmptyHint: React.FC<EmptyHintProps> = ({ text }) => (
  <div className="empty-hint">
    <span className="empty-emoji" aria-hidden>🌱</span>
    <p>{text}</p>
  </div>
)