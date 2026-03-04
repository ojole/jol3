'use client'

import { useEffect, useRef } from 'react'

const CELL_SIZE = 14
const HEAD_RADIUS = 120
const TAIL_RADIUS = 160

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export default function AsciiFieldOverlay() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) {
      return
    }

    const media = window.matchMedia('(min-width: 768px)')
    if (!media.matches) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const pointer = {
      x: -9999,
      y: -9999,
      vx: 0,
      vy: 0,
      speed: 0,
      active: false,
    }
    const smooth = { x: -9999, y: -9999 }

    let width = 0
    let height = 0
    let cols = 0
    let rows = 0
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    let running = true

    const resize = () => {
      const rect = container.getBoundingClientRect()
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      cols = Math.ceil(width / CELL_SIZE)
      rows = Math.ceil(height / CELL_SIZE)
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      context.setTransform(1, 0, 0, 1, 0, 0)
      context.scale(dpr, dpr)
      context.font = '11px "Courier New", ui-monospace, monospace'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
    }

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect()
      const nextX = clientX - rect.left
      const nextY = clientY - rect.top

      if (!pointer.active) {
        pointer.x = nextX
        pointer.y = nextY
        pointer.vx = 0
        pointer.vy = 0
      } else {
        pointer.vx = nextX - pointer.x
        pointer.vy = nextY - pointer.y
      }

      pointer.x = nextX
      pointer.y = nextY
      pointer.speed = Math.min(1, Math.hypot(pointer.vx, pointer.vy) / 22)
      pointer.active = true
    }

    const handleMove = (event: MouseEvent) => {
      updatePointer(event.clientX, event.clientY)
    }

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) {
        return
      }
      updatePointer(touch.clientX, touch.clientY)
    }

    const handleLeave = () => {
      pointer.active = false
      pointer.speed = 0
    }

    const render = (time: number) => {
      if (!running) {
        return
      }

      smooth.x += (pointer.x - smooth.x) * 0.16
      smooth.y += (pointer.y - smooth.y) * 0.16

      context.clearRect(0, 0, width, height)

      const trailX = smooth.x - pointer.vx * 4.5
      const trailY = smooth.y - pointer.vy * 4.5
      const motionBoost = 0.6 + pointer.speed * 0.75
      const tick = time * 0.0018

      for (let row = 0; row < rows; row += 1) {
        const y = row * CELL_SIZE + CELL_SIZE * 0.52
        for (let col = 0; col < cols; col += 1) {
          const x = col * CELL_SIZE + CELL_SIZE * 0.5

          const ripple = Math.sin((x * 0.027) + tick) * 0.22 + Math.cos((y * 0.021) - tick * 1.2) * 0.18
          const ambient = 0.18 + ripple * 0.18

          let headInfluence = 0
          let tailInfluence = 0
          if (pointer.active) {
            const headDistance = Math.hypot(x - smooth.x, y - smooth.y)
            const tailDistance = Math.hypot(x - trailX, y - trailY)
            headInfluence = clamp01(1 - headDistance / HEAD_RADIUS) * motionBoost
            tailInfluence = clamp01(1 - tailDistance / TAIL_RADIUS) * (0.58 + pointer.speed * 0.45)
          }

          let glyph = '_'
          if (headInfluence > 0.48) {
            glyph = '3'
          } else if (tailInfluence > 0.35) {
            glyph = '>'
          }

          const alpha = clamp01(ambient + headInfluence * 0.82 + tailInfluence * 0.52) * 0.9
          if (alpha < 0.08) {
            continue
          }

          context.fillStyle = `rgba(242, 247, 255, ${alpha.toFixed(3)})`
          context.fillText(glyph, x, y)
        }
      }

      rafRef.current = window.requestAnimationFrame(render)
    }

    resize()
    rafRef.current = window.requestAnimationFrame(render)

    const observer = new ResizeObserver(() => resize())
    observer.observe(container)
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('mouseleave', handleLeave, { passive: true })
    window.addEventListener('blur', handleLeave, { passive: true })

    return () => {
      running = false
      observer.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mouseleave', handleLeave)
      window.removeEventListener('blur', handleLeave)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-[1] hidden md:block overflow-hidden">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-ascii-overlay-state="running"
        className="pointer-events-none absolute inset-0"
        style={{
          mixBlendMode: 'difference',
          opacity: 0.7,
        }}
      />
    </div>
  )
}
