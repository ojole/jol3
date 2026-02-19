'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const GRID_SIZE = 20
const CELL_SIZE = 16
const TICK_MS = 120

const COLORS = {
  bg: '#0a1628',
  grid: '#0f1d35',
  snake: '#ff8c42',
  snakeHead: '#ffad73',
  food: '#ff6b1a',
  foodGlow: 'rgba(255, 108, 26, 0.3)',
  text: '#ff8c42',
  textDim: '#3a4a6a',
  border: '#1a2a4a',
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Point = { x: number; y: number }

function randomFood(snake: Point[]): Point {
  let pos: Point
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
  } while (snake.some(s => s.x === pos.x && s.y === pos.y))
  return pos
}

export default function SnakeWindow() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle')
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Point>({ x: 15, y: 10 })
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

  const dirRef = useRef<Direction>('RIGHT')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Touch handling
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const startGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }]
    setSnake(initialSnake)
    setFood(randomFood(initialSnake))
    setDirection('RIGHT')
    dirRef.current = 'RIGHT'
    setScore(0)
    setGameState('playing')
  }, [])

  // Key handling
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameState === 'idle' || gameState === 'dead') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          startGame()
          return
        }
      }

      if (gameState !== 'playing') return

      const dir = dirRef.current
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          if (dir !== 'DOWN') { dirRef.current = 'UP'; setDirection('UP') }
          e.preventDefault()
          break
        case 'ArrowDown': case 's': case 'S':
          if (dir !== 'UP') { dirRef.current = 'DOWN'; setDirection('DOWN') }
          e.preventDefault()
          break
        case 'ArrowLeft': case 'a': case 'A':
          if (dir !== 'RIGHT') { dirRef.current = 'LEFT'; setDirection('LEFT') }
          e.preventDefault()
          break
        case 'ArrowRight': case 'd': case 'D':
          if (dir !== 'LEFT') { dirRef.current = 'RIGHT'; setDirection('RIGHT') }
          e.preventDefault()
          break
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [gameState, startGame])

  // Touch swipe handling
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return
      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchStartRef.current.x
      const dy = touch.clientY - touchStartRef.current.y
      touchStartRef.current = null

      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return // too small

      const dir = dirRef.current
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && dir !== 'LEFT') { dirRef.current = 'RIGHT'; setDirection('RIGHT') }
        else if (dx < 0 && dir !== 'RIGHT') { dirRef.current = 'LEFT'; setDirection('LEFT') }
      } else {
        if (dy > 0 && dir !== 'UP') { dirRef.current = 'DOWN'; setDirection('DOWN') }
        else if (dy < 0 && dir !== 'DOWN') { dirRef.current = 'UP'; setDirection('UP') }
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    const interval = setInterval(() => {
      setSnake(prev => {
        const head = { ...prev[0] }
        const dir = dirRef.current

        switch (dir) {
          case 'UP': head.y -= 1; break
          case 'DOWN': head.y += 1; break
          case 'LEFT': head.x -= 1; break
          case 'RIGHT': head.x += 1; break
        }

        // Wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameState('dead')
          setScore(s => {
            setHighScore(h => Math.max(h, s))
            return s
          })
          return prev
        }

        // Self collision
        if (prev.some(s => s.x === head.x && s.y === head.y)) {
          setGameState('dead')
          setScore(s => {
            setHighScore(h => Math.max(h, s))
            return s
          })
          return prev
        }

        const newSnake = [head, ...prev]

        // Food collision
        setFood(f => {
          if (head.x === f.x && head.y === f.y) {
            setScore(s => s + 1)
            const nextFood = randomFood(newSnake)
            setFood(nextFood)
            return nextFood
          }
          newSnake.pop()
          return f
        })

        return newSnake
      })
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [gameState])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = GRID_SIZE * CELL_SIZE

    // Background
    ctx.fillStyle = COLORS.bg
    ctx.fillRect(0, 0, size, size)

    // Grid lines (subtle)
    ctx.strokeStyle = COLORS.grid
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, size)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(size, i * CELL_SIZE)
      ctx.stroke()
    }

    // Food glow
    ctx.fillStyle = COLORS.foodGlow
    ctx.fillRect(
      food.x * CELL_SIZE - 2,
      food.y * CELL_SIZE - 2,
      CELL_SIZE + 4,
      CELL_SIZE + 4
    )

    // Food
    ctx.fillStyle = COLORS.food
    ctx.fillRect(
      food.x * CELL_SIZE + 1,
      food.y * CELL_SIZE + 1,
      CELL_SIZE - 2,
      CELL_SIZE - 2
    )

    // Snake
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snake
      ctx.fillRect(
        seg.x * CELL_SIZE + 1,
        seg.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      )
    })
  }, [snake, food])

  const canvasSize = GRID_SIZE * CELL_SIZE

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center select-none"
      style={{ background: COLORS.bg }}
      tabIndex={0}
    >
      {/* Score bar */}
      <div
        className="w-full flex items-center justify-between px-3 py-1.5 font-mono text-xs"
        style={{ color: COLORS.text, borderBottom: `1px solid ${COLORS.border}` }}
      >
        <span>SCORE: {score}</span>
        {highScore > 0 && <span style={{ color: COLORS.textDim }}>BEST: {highScore}</span>}
      </div>

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center relative p-2">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{
            border: `1px solid ${COLORS.border}`,
            maxWidth: '100%',
            maxHeight: '100%',
            imageRendering: 'pixelated',
          }}
        />

        {/* Overlay for idle/dead states */}
        {gameState !== 'playing' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center font-mono"
            style={{ background: 'rgba(10, 22, 40, 0.85)' }}
          >
            {gameState === 'dead' && (
              <div className="text-center mb-4" style={{ color: COLORS.text }}>
                <div className="text-lg font-bold mb-1">GAME OVER</div>
                <div className="text-sm">Score: {score}</div>
              </div>
            )}
            <button
              onClick={startGame}
              className="px-6 py-2 font-mono font-bold text-sm transition-colors"
              style={{
                background: COLORS.snake,
                color: COLORS.bg,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {gameState === 'dead' ? 'PLAY AGAIN' : 'START'}
            </button>
            <div className="mt-3 text-[10px]" style={{ color: COLORS.textDim }}>
              Arrow keys or swipe to move
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
