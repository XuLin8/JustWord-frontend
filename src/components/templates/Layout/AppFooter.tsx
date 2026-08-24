// src/components/templates/Layout/AppFooter.tsx
import React from 'react'

interface AppFooterProps {
  wordCount: number
}

export const AppFooter: React.FC<AppFooterProps> = ({ wordCount }) => {
  return <footer className="app-footer">共 {wordCount} 个单词</footer>
}