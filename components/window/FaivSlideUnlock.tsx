'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface FaivSlideUnlockProps {
  onUnlocked: (iframeUrl: string) => void
}

const UNLOCK_THRESHOLD = 0.92
const TOKEN_ENDPOINT =
  process.env.NEXT_PUBLIC_FAIV_TOKEN_ENDPOINT || 'https://api.faiv.ai/api/faiv-embed-token'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export default function FaivSlideUnlock({ onUnlocked }: FaivSlideUnlockProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const dragBallRef = useRef<HTMLButtonElement>(null)
  const pointerIdRef = useRef<number | null>(null)

  const [railWidth, setRailWidth] = useState(620)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const node = railRef.current
    if (!node || typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }
      setRailWidth(Math.max(320, Math.floor(entry.contentRect.width)))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const railGeometry = useMemo(() => {
    const ballSize = clamp(Math.round(railWidth * 0.09), 34, 54)
    const railHeight = Math.round(ballSize * 2.8)
    const centerY = railHeight * 0.53
    const slotLeft = railWidth * 0.235
    const slotRight = railWidth * 0.815
    const anchorX = slotLeft - ballSize * 0.85
    const dragStartX = slotLeft + ballSize * 0.58
    const dragEndX = slotRight - ballSize * 0.58
    const travelDistance = Math.max(1, dragEndX - dragStartX)
    const dragX = dragStartX + progress * travelDistance
    const jointY = centerY + ballSize * 0.32
    const anchorJointX = anchorX + ballSize * 0.36
    const dragJointX = dragX - ballSize * 0.36
    return {
      ballSize,
      anchorX,
      dragStartX,
      dragX,
      travelDistance,
      centerY,
      railHeight,
      jointY,
      anchorJointX,
      dragJointX,
    }
  }, [progress, railWidth])

  const updateProgressFromPointer = useCallback(
    (clientX: number) => {
      const rail = railRef.current
      if (!rail) {
        return
      }
      const rect = rail.getBoundingClientRect()
      const localX = clientX - rect.left
      const nextProgress = (localX - railGeometry.dragStartX) / railGeometry.travelDistance
      setProgress(clamp(nextProgress, 0, 1))
    },
    [railGeometry.dragStartX, railGeometry.travelDistance]
  )

  const requestUnlock = useCallback(async () => {
    setUnlocking(true)
    setError(null)

    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
      })
      const payload = (await response.json().catch(() => ({}))) as {
        token?: string
        embedBaseUrl?: string
        error?: string
      }

      if (!response.ok || !payload.token) {
        throw new Error(payload.error || 'Token request failed.')
      }

      const baseUrl = (payload.embedBaseUrl || 'https://faiv.ai').replace(/\/+$/, '')
      const launchUrl = `${baseUrl}/embed?token=${encodeURIComponent(payload.token)}`
      onUnlocked(launchUrl)
    } catch (unlockError) {
      console.error('FAIV unlock failed', unlockError)
      setError('Unlock handshake failed. Drag again.')
      setProgress(0)
    } finally {
      setUnlocking(false)
    }
  }, [onUnlocked])

  const handleDragEnd = useCallback(() => {
    if (unlocking) {
      return
    }
    if (progress >= UNLOCK_THRESHOLD) {
      setProgress(1)
      void requestUnlock()
      return
    }
    setProgress(0)
  }, [progress, requestUnlock, unlocking])

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (unlocking) {
      return
    }
    pointerIdRef.current = event.pointerId
    setDragging(true)
    setError(null)
    event.currentTarget.setPointerCapture(event.pointerId)
    updateProgressFromPointer(event.clientX)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging || pointerIdRef.current !== event.pointerId) {
      return
    }
    updateProgressFromPointer(event.clientX)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return
    }
    setDragging(false)
    pointerIdRef.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // no-op
    }
    handleDragEnd()
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return
    }
    setDragging(false)
    pointerIdRef.current = null
    setProgress(0)
  }

  const chainLinks = useMemo(() => {
    const span = Math.max(0, railGeometry.dragJointX - railGeometry.anchorJointX)
    const baseSpacing = Math.max(12, railGeometry.ballSize * 0.42)
    const count = clamp(Math.round(span / baseSpacing), 8, 22)
    const sagAmplitude = railGeometry.ballSize * 0.2 + span * 0.11
    const links = []
    const pointAt = (t: number) => {
      const x = railGeometry.anchorJointX + span * t
      const y = railGeometry.jointY + Math.sin(Math.PI * t) * sagAmplitude
      return { x, y }
    }
    for (let i = 0; i < count; i += 1) {
      const t = (i + 1) / (count + 1)
      const { x, y } = pointAt(t)
      const prev = pointAt(Math.max(0, t - 0.03))
      const next = pointAt(Math.min(1, t + 0.03))
      links.push({
        x,
        y,
        rotation: (Math.atan2(next.y - prev.y, next.x - prev.x) * 180) / Math.PI,
      })
    }
    return links
  }, [
    railGeometry.anchorJointX,
    railGeometry.ballSize,
    railGeometry.dragJointX,
    railGeometry.jointY,
  ])

  return (
    <div className="h-full w-full bg-[#090909] text-[#d7ffe1] p-4 md:p-5 font-mono flex flex-col">
      <div className="border border-[#3a3a3a] bg-[#121212] p-3 md:p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#9cebb5]">FAIV secure embed</p>
        <p className="mt-1 text-xs text-[#bfe7c8]">Slide to unlock FAIV inside this window.</p>
      </div>

      <div className="mt-4 flex-1 border border-[#2a2a2a] bg-[#0b0b0b] p-3 md:p-5 flex flex-col justify-center">
        <div
          ref={railRef}
          className="relative w-full max-w-[700px] mx-auto select-none"
          style={{ height: `${railGeometry.railHeight}px` }}
        >
          <Image
            src="/icons/slidebracket.png"
            alt="Slide rail"
            fill
            sizes="(max-width: 768px) 95vw, 700px"
            className="object-contain pointer-events-none"
            priority
          />

          {chainLinks.map((link, index) => (
            <Image
              key={`link-${index}`}
              src="/icons/chain.png"
              alt=""
              width={Math.max(16, Math.round(railGeometry.ballSize * 0.44))}
              height={Math.max(16, Math.round(railGeometry.ballSize * 0.44))}
              className="absolute pointer-events-none"
              style={{
                left: `${link.x}px`,
                top: `${link.y}px`,
                transform: `translate(-50%, -50%) rotate(${link.rotation}deg)`,
                opacity: 0.95,
              }}
            />
          ))}

          <Image
            src="/icons/ball.png"
            alt="Anchor ball"
            width={railGeometry.ballSize}
            height={railGeometry.ballSize}
            className="absolute pointer-events-none"
            style={{
              left: `${railGeometry.anchorX}px`,
              top: `${railGeometry.centerY}px`,
              transform: 'translate(-50%, -50%)',
              filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.45))',
            }}
          />

          <button
            ref={dragBallRef}
            type="button"
            aria-label="Slide to unlock FAIV"
            disabled={unlocking}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className="absolute rounded-full touch-none disabled:cursor-wait"
            style={{
              left: `${railGeometry.dragX}px`,
              top: `${railGeometry.centerY}px`,
              width: `${railGeometry.ballSize}px`,
              height: `${railGeometry.ballSize}px`,
              transform: 'translate(-50%, -50%)',
              cursor: dragging ? 'grabbing' : 'grab',
              filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.45))',
            }}
          >
            <Image src="/icons/ball.png" alt="" fill sizes="56px" className="pointer-events-none object-contain" />
          </button>
        </div>

        {error ? (
          <div className="mt-3 text-[11px] text-[#ff9ea3] border border-[#642e33] bg-[#261316] px-2 py-1">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  )
}
