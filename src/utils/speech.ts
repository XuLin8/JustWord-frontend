// src/utils/speech.ts
// TTS 发音工具（Web Speech API · 无需后端/外部音源）
// 若浏览器不支持 speechSynthesis，静默降级为不发声。

let cachedVoice: SpeechSynthesisVoice | null = null

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  cachedVoice =
    voices.find((v) => /^en[-_]US/i.test(v.lang) && /google/i.test(v.name)) ??
    voices.find((v) => /^en[-_]US/i.test(v.lang)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    null
  return cachedVoice
}

// 预加载语音列表（部分浏览器异步加载 voices）
export function warmupSpeech(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null
    pickVoice()
  }
}

/** 朗读英文单词/短语 */
export function speakWord(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  const voice = pickVoice()
  if (voice) utter.voice = voice
  utter.lang = 'en-US'
  utter.rate = 0.92
  utter.pitch = 1
  window.speechSynthesis.speak(utter)
}
