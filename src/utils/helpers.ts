import type { Word } from '../types'

export const generateId = (): string => {
  return Date.now().toString()
}

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

export const downloadFile = (data: string, filename: string, type: string) => {
  const blob = new Blob([data], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportToJSON = (words: Word[]) => {
  const data = JSON.stringify(words, null, 2)
  const filename = `词库_${new Date().toISOString().slice(0, 10)}.json`
  downloadFile(data, filename, 'application/json')
}

export const exportToCSV = (words: Word[]) => {
  let csv = '英文,中文,创建时间\n'
  words.forEach(word => {
    csv += `"${word.english}","${word.chinese}","${formatDate(word.createdAt)}"\n`
  })
  const filename = `词库_${new Date().toISOString().slice(0, 10)}.csv`
  downloadFile('\uFEFF' + csv, filename, 'text/csv;charset=utf-8;')
}