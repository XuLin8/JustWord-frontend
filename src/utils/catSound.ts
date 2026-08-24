// src/utils/catSound.ts
// 云养猫音效：Web Audio 合成「喵声 / 哈气音 / 咕噜声」，无需外部音频资源。
// 浏览器不支持 Web Audio 时静默降级。

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  // 浏览器自动暂停策略：需要时恢复
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** 平滑音量包络：渐入渐出 */
function envelope(gainNode: GainNode, peak: number, attack: number, release: number, startAt: number): void {
  const g = gainNode.gain
  g.setValueAtTime(0.0001, startAt)
  g.linearRampToValueAtTime(peak, startAt + attack)
  g.linearRampToValueAtTime(0.0001, startAt + attack + release)
}

/** 甜美喵声（频率上滑再下滑的 "nya~"） */
export function playMeow(): void {
  const ac = getCtx()
  if (!ac) return
  const t0 = ac.currentTime + 0.01
  const dur = 0.42

  const master = ac.createGain()
  envelope(master, 0.22, 0.05, dur, t0)
  master.connect(ac.destination)

  const osc = ac.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(520, t0)
  osc.frequency.exponentialRampToValueAtTime(940, t0 + 0.12)   // 上滑
  osc.frequency.exponentialRampToValueAtTime(600, t0 + dur)    // 下滑收尾
  osc.connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)

  // 泛音层：让声音更"甜"
  const osc2 = ac.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(1040, t0)
  osc2.frequency.exponentialRampToValueAtTime(1880, t0 + 0.12)
  osc2.frequency.exponentialRampToValueAtTime(1200, t0 + dur)
  const g2 = ac.createGain()
  envelope(g2, 0.07, 0.05, dur, t0)
  osc2.connect(g2)
  g2.connect(ac.destination)
  osc2.start(t0)
  osc2.stop(t0 + dur + 0.02)
}

/** 生气哈气音（白噪声 + 带通滤波，低通扫频） */
export function playHiss(): void {
  const ac = getCtx()
  if (!ac) return
  const t0 = ac.currentTime + 0.01
  const dur = 0.5

  const master = ac.createGain()
  envelope(master, 0.16, 0.04, dur, t0)
  master.connect(ac.destination)

  // 白噪声缓冲
  const len = Math.floor(ac.sampleRate * dur)
  const buffer = ac.createBuffer(1, len, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1

  const noise = ac.createBufferSource()
  noise.buffer = buffer

  const bp = ac.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.setValueAtTime(2400, t0)
  bp.frequency.exponentialRampToValueAtTime(900, t0 + dur)
  bp.Q.value = 0.8

  noise.connect(bp)
  bp.connect(master)
  noise.start(t0)
  noise.stop(t0 + dur + 0.02)
}

/** 咕噜声（低频锯齿脉冲，抚摸/进食反馈） */
export function playPurr(): void {
  const ac = getCtx()
  if (!ac) return
  const t0 = ac.currentTime + 0.01
  const dur = 0.8

  const master = ac.createGain()
  envelope(master, 0.12, 0.1, dur, t0)
  master.connect(ac.destination)

  const osc = ac.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = 30
  const g = ac.createGain()
  g.gain.value = 0.5
  osc.connect(g)
  g.connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}
