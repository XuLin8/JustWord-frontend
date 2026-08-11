// utils/wordMatcher.ts

export interface WordDiff {
  word1: string
  word2: string
  similarity: number
  usage1: string
  usage2: string
  suggestion: string
}

// 近义词数据库（可扩展）
export const SYNONYM_DB: Record<string, WordDiff[]> = {
  'run': [
    {
      word1: 'run',
      word2: 'jog',
      similarity: 0.75,
      usage1: 'run 一般速度，可用于各种语境',
      usage2: 'jog 慢跑，休闲/锻炼',
      suggestion: '如果你想表达"跑步锻炼"，用 jog;如果是"逃跑"或"运行程序"，用 run'
    },
    {
      word1: 'run',
      word2: 'sprint',
      similarity: 0.65,
      usage1: 'run 通用词',
      usage2: 'sprint 短距离冲刺',
      suggestion: '短跑比赛用 sprint,日常跑步用 run'
    }
  ],
  'big': [
    {
      word1: 'big',
      word2: 'large',
      similarity: 0.85,
      usage1: 'big 口语化，日常使用',
      usage2: 'large 正式，书面语',
      suggestion: '日常对话用 big,写作或正式场合用 large'
    },
    {
      word1: 'big',
      word2: 'huge',
      similarity: 0.7,
      usage1: 'big 一般大',
      usage2: 'huge 非常大',
      suggestion: '强调"巨大"时用 huge,一般大用 big'
    }
  ],
  'good': [
    {
      word1: 'good',
      word2: 'great',
      similarity: 0.8,
      usage1: 'good 一般好',
      usage2: 'great 非常好',
      suggestion: '好到超出预期时用 great,普通好就用 good'
    }
  ]
}

// 查找近义词
export function findSynonyms(word: string): WordDiff[] {
  const lower = word.toLowerCase().trim()
  const results: WordDiff[] = []
  
  // 直接匹配
  if (SYNONYM_DB[lower]) {
    results.push(...SYNONYM_DB[lower])
  }
  
  // 反向匹配（可能是近义词表中的 word2）
  for (const [_, diffs] of Object.entries(SYNONYM_DB)) {
    diffs.forEach(diff => {
      if (diff.word2 === lower) {
        results.push({
          ...diff,
          word1: diff.word2,
          word2: diff.word1
        })
      }
    })
  }
  
  return results
}