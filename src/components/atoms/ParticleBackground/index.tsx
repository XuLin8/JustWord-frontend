import React, { useEffect, useRef } from 'react'
import './ParticleBackground.css'

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  hue: number
  opacity: number
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animIdRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let particleCount = 80

    // ============================================================
    // 初始化粒子
    // ============================================================
    const initParticles = () => {
      const particles: Particle[] = []
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 2 + Math.random() * 4,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          hue: 200 + Math.random() * 80,
          opacity: 0.4 + Math.random() * 0.6,
        })
      }
      particlesRef.current = particles
    }

    // ============================================================
    // 自适应
    // ============================================================
    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      initParticles()
    }

    // ============================================================
    // 绘制
    // ============================================================
    const draw = () => {
      // 透明背景，让内容透过
      ctx.clearRect(0, 0, width, height)

      const particles = particlesRef.current
      const mouse = mouseRef.current

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // 鼠标交互
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150
          p.x += dx * force * 0.04
          p.y += dy * force * 0.04
        }

        p.x += p.speedX
        p.y += p.speedY

        if (p.x < 0 || p.x > width) p.speedX *= -1
        if (p.y < 0 || p.y > height) p.speedY *= -1

        // 绘制光晕
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size * 3
        )
        const alpha = p.opacity * (0.6 + 0.4 * Math.sin(Date.now() * 0.001 + i))
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 85%, ${alpha})`)
        gradient.addColorStop(0.3, `hsla(${p.hue + 20}, 85%, 70%, ${alpha * 0.5})`)
        gradient.addColorStop(1, `hsla(${p.hue + 40}, 90%, 50%, 0)`)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      // 连线
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.25
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            const hue = (p1.hue + p2.hue) / 2
            ctx.strokeStyle = `hsla(${hue}, 70%, 70%, ${opacity})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      animIdRef.current = requestAnimationFrame(draw)
    }

    // ============================================================
    // 事件
    // ============================================================
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) {
        mouseRef.current.x = touch.clientX
        mouseRef.current.y = touch.clientY
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000
      mouseRef.current.y = -1000
    }

    // ============================================================
    // 启动
    // ============================================================
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    resize()
    draw()

    // ============================================================
    // 清理
    // ============================================================
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="particle-background" />
}