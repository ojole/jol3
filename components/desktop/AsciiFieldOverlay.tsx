'use client'

import { useEffect, useRef } from 'react'

const CELL_SIZE = 13
const HEAD_RADIUS = 110
const WAKE_RADIUS = 165
const FIELD_RADIUS = 240
const FLOW_TIME_SPEED = 0.00035

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

      if (smooth.x < -1000 || smooth.y < -1000) {
        smooth.x = width * 0.5
        smooth.y = height * 0.5
      }

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      context.setTransform(1, 0, 0, 1, 0, 0)
      context.scale(dpr, dpr)
      context.font = '10px "Courier New", ui-monospace, monospace'
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

      smooth.x += (pointer.x - smooth.x) * 0.14
      smooth.y += (pointer.y - smooth.y) * 0.14
      pointer.vx *= 0.91
      pointer.vy *= 0.91
      pointer.speed *= 0.96

      context.clearRect(0, 0, width, height)

      const trailX = smooth.x - pointer.vx * 5.7
      const trailY = smooth.y - pointer.vy * 5.7
      const motionBoost = 0.1 + pointer.speed * 1.25
      const t = time * FLOW_TIME_SPEED
      const motionActive = pointer.active && pointer.speed > 0.015

      for (let row = 0; row < rows; row += 1) {
        const y = row * CELL_SIZE + CELL_SIZE * 0.52
        for (let col = 0; col < cols; col += 1) {
          const x = col * CELL_SIZE + CELL_SIZE * 0.5

          const nx = x / width
          const ny = y / height

          const warpX =
            nx +
            Math.sin((ny * 5.2 + t * 1.9) * Math.PI * 2) * 0.115 +
            Math.cos((ny * 2.6 - t * 1.2) * Math.PI * 2) * 0.052
          const warpY =
            ny +
            Math.cos((nx * 4.4 - t * 1.35) * Math.PI * 2) * 0.102 +
            Math.sin((nx * 2.1 + t * 0.86) * Math.PI * 2) * 0.044

          const flowA =
            Math.sin((warpX * 7.4 + t * 1.5) * Math.PI * 2 + Math.cos((warpY * 4.8 - t * 1.1) * Math.PI * 2) * 0.62)
          const flowB =
            Math.cos((warpY * 8.2 - t * 1.35) * Math.PI * 2 + Math.sin((warpX * 4.1 + t * 0.7) * Math.PI * 2) * 0.48)
          const flowC = Math.sin(((warpX + warpY) * 5.2 - t * 1.75) * Math.PI * 2)
          const stream = flowA * 0.5 + flowB * 0.34 + flowC * 0.16

          let headInfluence = 0
          let wakeInfluence = 0
          let rippleInfluence = 0
          let fieldInfluence = 0
          if (motionActive) {
            const headDistance = Math.hypot(x - smooth.x, y - smooth.y)
            const tailDistance = Math.hypot(x - trailX, y - trailY)
            headInfluence = clamp01(1 - headDistance / HEAD_RADIUS) * motionBoost
            wakeInfluence = clamp01(1 - tailDistance / WAKE_RADIUS) * (0.68 + pointer.speed * 0.55)
            fieldInfluence =
              clamp01(1 - headDistance / FIELD_RADIUS) * (0.35 + pointer.speed * 0.65)
            rippleInfluence =
              Math.sin(headDistance * 0.085 - time * 0.014) *
              clamp01(1 - headDistance / 260) *
              (0.34 + pointer.speed * 0.6)
          }

          const directedMotion =
            ((x - smooth.x) * pointer.vx + (y - smooth.y) * pointer.vy) /
            (Math.max(18, Math.hypot(x - smooth.x, y - smooth.y)) * 22)

          const streamStrength = motionActive ? 0.08 + fieldInfluence * 0.76 : 0.03
          const energy =
            stream * streamStrength +
            headInfluence * 1.02 +
            wakeInfluence * 0.55 +
            rippleInfluence +
            directedMotion * 0.58

          let glyph = '_'
          if (energy > 0.68) {
            glyph = 'e'
          } else if (energy > 0.24) {
            glyph = '>'
          }

          const idleShimmer = clamp01(Math.sin((col * 0.24) + (row * 0.19) + t * 7.2) * 0.5 + 0.5)
          const baseAlpha = motionActive
            ? 0.016 + fieldInfluence * 0.19 + idleShimmer * 0.03
            : 0.007 + idleShimmer * 0.014
          const alpha = clamp01(
            baseAlpha +
              headInfluence * 0.39 +
              wakeInfluence * 0.26 +
              Math.abs(rippleInfluence) * 0.16
          )
          const alphaThreshold = motionActive ? 0.055 : 0.035
          if (alpha < alphaThreshold) {
            continue
          }

          context.fillStyle = `rgba(246, 250, 255, ${alpha.toFixed(3)})`
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
          opacity: 0.58,
        }}
      />
    </div>
  )
}
