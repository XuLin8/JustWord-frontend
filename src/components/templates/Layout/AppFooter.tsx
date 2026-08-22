// src/components/templates/Layout/AppFooter.tsx
import React from 'react'
import { useWordStore } from '../../../store/wordStore'

export const AppFooter: React.FC = () => {
  const { words } = useWordStore()
  return <footer className="app-footer">共 {words.length} 个单词</footer>
}