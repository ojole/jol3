'use client'

import { useEffect, useRef } from 'react'

const CELL_SIZE = 12
const FLOW_TIME_SPEED = 0.00034
const MIN_ACTIVE_SPEED = 0.008
const INJECT_RADIUS_PX = 92
const WAKE_RADIUS_PX = 132
const TAU = Math.PI * 2
const GLYPH_HEAD = 'e'
const GLYPH_WAKE = '>'
const GLYPH_IDLE = '_'

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const sampleBilinear = (
  field: Float32Array,
  cols: number,
  rows: number,
  x: number,
  y: number
) => {
  const sx = clamp(x, 0, cols - 1)
  const sy = clamp(y, 0, rows - 1)
  const x0 = Math.floor(sx)
  const y0 = Math.floor(sy)
  const x1 = Math.min(cols - 1, x0 + 1)
  const y1 = Math.min(rows - 1, y0 + 1)
  const tx = sx - x0
  const ty = sy - y0
  const i00 = y0 * cols + x0
  const i10 = y0 * cols + x1
  const i01 = y1 * cols + x0
  const i11 = y1 * cols + x1
  const top = field[i00] * (1 - tx) + field[i10] * tx
  const bottom = field[i01] * (1 - tx) + field[i11] * tx
  return top * (1 - ty) + bottom * ty
}

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
    let cellCount = 0
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    let running = true
    let lastTimestamp = 0

    let energyA = new Float32Array(0)
    let energyB = new Float32Array(0)
    let velXA = new Float32Array(0)
    let velXB = new Float32Array(0)
    let velYA = new Float32Array(0)
    let velYB = new Float32Array(0)

    const resize = () => {
      const rect = container.getBoundingClientRect()
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      cols = Math.ceil(width / CELL_SIZE)
      rows = Math.ceil(height / CELL_SIZE)
      cellCount = cols * rows
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

      energyA = new Float32Array(cellCount)
      energyB = new Float32Array(cellCount)
      velXA = new Float32Array(cellCount)
      velXB = new Float32Array(cellCount)
      velYA = new Float32Array(cellCount)
      velYB = new Float32Array(cellCount)

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
      context.font =
        '700 12px "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      context.globalCompositeOperation = 'source-over'
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
      pointer.speed = Math.min(1, Math.hypot(pointer.vx, pointer.vy) / 18)
      pointer.active = true
    }

    const handleMove = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY)
    }

    const handleLeave = () => {
      pointer.active = false
      pointer.speed = 0
    }

    const injectPulse = (
      centerX: number,
      centerY: number,
      radiusPx: number,
      velocityX: number,
      velocityY: number,
      strength: number
    ) => {
      if (cols < 2 || rows < 2 || strength <= 0) {
        return
      }

      const cx = centerX / CELL_SIZE
      const cy = centerY / CELL_SIZE
      const radius = Math.max(1.2, radiusPx / CELL_SIZE)
      const radiusSq = radius * radius
      const minX = Math.max(1, Math.floor(cx - radius))
      const maxX = Math.min(cols - 2, Math.ceil(cx + radius))
      const minY = Math.max(1, Math.floor(cy - radius))
      const maxY = Math.min(rows - 2, Math.ceil(cy + radius))
      const velocityMag = Math.hypot(velocityX, velocityY) || 1
      const normX = velocityX / velocityMag
      const normY = velocityY / velocityMag

      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          const dx = x - cx
          const dy = y - cy
          const distSq = dx * dx + dy * dy
          if (distSq > radiusSq) {
            continue
          }
          const dist = Math.sqrt(distSq)
          const falloff = (1 - dist / radius) ** 1.5
          const index = y * cols + x
          energyA[index] = Math.min(1.85, energyA[index] + falloff * strength * 0.92)
          velXA[index] += normX * falloff * strength * 0.84
          velYA[index] += normY * falloff * strength * 0.84
        }
      }
    }

    const stepField = (time: number, dt: number) => {
      if (cellCount === 0) {
        return
      }

      for (let y = 1; y < rows - 1; y += 1) {
        for (let x = 1; x < cols - 1; x += 1) {
          const index = y * cols + x
          const nx = x / cols
          const ny = y / rows

          const phaseA = Math.sin((nx * 5.8 + ny * 2.5 + time * 0.00042) * TAU)
          const phaseB = Math.cos((ny * 4.9 - nx * 2.9 - time * 0.00033) * TAU)
          const globalX = (phaseA + phaseB) * 0.18
          const globalY =
            (Math.sin((ny * 6.2 + time * 0.00028) * TAU) -
              Math.cos((nx * 5.1 - time * 0.00025) * TAU)) *
            0.13

          const vx = velXA[index]
          const vy = velYA[index]
          const advectX = x - (vx * 0.72 + globalX) * dt
          const advectY = y - (vy * 0.72 + globalY) * dt

          const advectedEnergy = sampleBilinear(energyA, cols, rows, advectX, advectY)
          const left = index - 1
          const right = index + 1
          const up = index - cols
          const down = index + cols

          const lapEnergy =
            (energyA[left] + energyA[right] + energyA[up] + energyA[down]) * 0.25 - energyA[index]
          const nextEnergy = (advectedEnergy + lapEnergy * 0.18 * dt) * 0.974
          energyB[index] = clamp(nextEnergy, 0, 1.85)

          const advectedVX = sampleBilinear(velXA, cols, rows, advectX, advectY)
          const advectedVY = sampleBilinear(velYA, cols, rows, advectX, advectY)
          const lapVX = (velXA[left] + velXA[right] + velXA[up] + velXA[down]) * 0.25 - vx
          const lapVY = (velYA[left] + velYA[right] + velYA[up] + velYA[down]) * 0.25 - vy

          velXB[index] = (advectedVX + lapVX * 0.24 * dt + globalX * 0.03) * 0.912
          velYB[index] = (advectedVY + lapVY * 0.24 * dt + globalY * 0.03) * 0.912
        }
      }

      for (let x = 0; x < cols; x += 1) {
        const top = x
        const bottom = (rows - 1) * cols + x
        energyB[top] = energyB[top + cols] * 0.82
        energyB[bottom] = energyB[bottom - cols] * 0.82
        velXB[top] = velXB[top + cols] * 0.65
        velXB[bottom] = velXB[bottom - cols] * 0.65
        velYB[top] = velYB[top + cols] * 0.65
        velYB[bottom] = velYB[bottom - cols] * 0.65
      }
      for (let y = 0; y < rows; y += 1) {
        const left = y * cols
        const right = left + (cols - 1)
        energyB[left] = energyB[left + 1] * 0.82
        energyB[right] = energyB[right - 1] * 0.82
        velXB[left] = velXB[left + 1] * 0.65
        velXB[right] = velXB[right - 1] * 0.65
        velYB[left] = velYB[left + 1] * 0.65
        velYB[right] = velYB[right - 1] * 0.65
      }

      ;[energyA, energyB] = [energyB, energyA]
      ;[velXA, velXB] = [velXB, velXA]
      ;[velYA, velYB] = [velYB, velYA]
    }

    const render = (time: number) => {
      if (!running) {
        return
      }

      if (!lastTimestamp) {
        lastTimestamp = time
      }
      const deltaMs = Math.min(40, Math.max(8, time - lastTimestamp))
      lastTimestamp = time
      const dt = deltaMs / 16.67

      smooth.x += (pointer.x - smooth.x) * 0.14
      smooth.y += (pointer.y - smooth.y) * 0.14
      pointer.vx *= 0.9
      pointer.vy *= 0.9
      pointer.speed *= 0.95

      if (pointer.active && pointer.speed > MIN_ACTIVE_SPEED) {
        const energyBoost = 0.26 + pointer.speed * 1.15
        injectPulse(
          smooth.x,
          smooth.y,
          INJECT_RADIUS_PX,
          pointer.vx,
          pointer.vy,
          energyBoost
        )
        injectPulse(
          smooth.x - pointer.vx * 5.8,
          smooth.y - pointer.vy * 5.8,
          WAKE_RADIUS_PX,
          pointer.vx,
          pointer.vy,
          energyBoost * 0.46
        )
      }

      stepField(time, dt)

      context.clearRect(0, 0, width, height)

      for (let row = 0; row < rows; row += 1) {
        const y = row * CELL_SIZE + CELL_SIZE * 0.52
        for (let col = 0; col < cols; col += 1) {
          const x = col * CELL_SIZE + CELL_SIZE * 0.5
          const index = row * cols + col
          const pulse = energyA[index]
          const velocityMag = Math.hypot(velXA[index], velYA[index])
          const shimmer =
            Math.sin((col * 0.23 + row * 0.17) + time * FLOW_TIME_SPEED * 10.8) * 0.5 + 0.5
          const ambient = 0.16 + shimmer * 0.15
          const signal = ambient + pulse * 0.92 + velocityMag * 0.24

          let glyph = GLYPH_IDLE
          if (signal > 1.02) {
            glyph = GLYPH_HEAD
          } else if (signal > 0.53) {
            glyph = GLYPH_WAKE
          }

          const glyphBoost = glyph === GLYPH_HEAD ? 0.18 : glyph === GLYPH_WAKE ? 0.09 : 0
          const alpha = clamp01(0.05 + ambient * 0.32 + pulse * 0.42 + velocityMag * 0.11 + glyphBoost)
          if (alpha < 0.06) {
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
    window.addEventListener('pointermove', handleMove, { passive: true })
    window.addEventListener('mouseleave', handleLeave, { passive: true })
    window.addEventListener('blur', handleLeave, { passive: true })

    return () => {
      running = false
      observer.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', handleMove)
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
          opacity: 0.8,
        }}
      />
    </div>
  )
}
