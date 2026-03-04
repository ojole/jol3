'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface FaivSlideUnlockProps {
  onUnlocked: (iframeUrl: string) => void
}

const UNLOCK_THRESHOLD = 0.92
const TOKEN_ENDPOINT =
  process.env.NEXT_PUBLIC_FAIV_TOKEN_ENDPOINT || 'https://api.faiv.ai/api/faiv-embed-token'
const CHAIN_ASPECT_RATIO = 463 / 744

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

type ChainNode = {
  x: number
  y: number
}

type ChainLink = {
  x: number
  y: number
  rotation: number
  zIndex: number
  width: number
  height: number
}

function solveHangingNodes(start: ChainNode, end: ChainNode, segmentLength: number, linkCount: number): ChainNode[] {
  const nodes: ChainNode[] = Array.from({ length: linkCount + 1 }, (_, index) => {
    const t = index / linkCount
    const x = start.x + (end.x - start.x) * t
    const y = start.y + (end.y - start.y) * t
    return { x, y }
  })

  const midpointSag = segmentLength * linkCount * 0.12
  for (let index = 1; index < nodes.length - 1; index += 1) {
    const t = index / linkCount
    nodes[index].y += Math.sin(Math.PI * t) * midpointSag
  }

  const gravity = segmentLength * 0.14
  for (let iteration = 0; iteration < 28; iteration += 1) {
    for (let index = 1; index < nodes.length - 1; index += 1) {
      nodes[index].y += gravity
    }

    for (let pass = 0; pass < 2; pass += 1) {
      for (let index = 0; index < nodes.length - 1; index += 1) {
        const current = nodes[index]
        const next = nodes[index + 1]
        const dx = next.x - current.x
        const dy = next.y - current.y
        const distance = Math.max(1e-6, Math.hypot(dx, dy))
        const offset = (distance - segmentLength) / distance
        const offsetX = dx * offset
        const offsetY = dy * offset

        if (index === 0) {
          next.x -= offsetX
          next.y -= offsetY
        } else if (index + 1 === nodes.length - 1) {
          current.x += offsetX
          current.y += offsetY
        } else {
          current.x += offsetX * 0.5
          current.y += offsetY * 0.5
          next.x -= offsetX * 0.5
          next.y -= offsetY * 0.5
        }
      }
    }

    nodes[0] = { ...start }
    nodes[nodes.length - 1] = { ...end }
  }

  return nodes
}

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
    const jointY = centerY + ballSize * 0.48
    const anchorJointX = anchorX + ballSize * 0.03
    const dragJointX = dragX - ballSize * 0.03
    const dragEndJointX = dragEndX - ballSize * 0.03
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
      dragEndJointX,
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
    const start = { x: railGeometry.anchorJointX, y: railGeometry.jointY }
    const end = { x: railGeometry.dragJointX, y: railGeometry.jointY }
    const maxDistance = Math.max(10, railGeometry.dragEndJointX - railGeometry.anchorJointX)
    const distance = Math.max(2, Math.hypot(end.x - start.x, end.y - start.y))
    const linkHeight = railGeometry.ballSize * 0.68
    const nominalPitch = Math.max(8, linkHeight * 0.42)
    const linkCount = clamp(Math.round(maxDistance / nominalPitch), 16, 36)
    const slackFactor = 1.14 - progress * 0.12
    const segmentLength = clamp(
      (distance * slackFactor) / linkCount,
      linkHeight * 0.33,
      linkHeight * 0.48
    )
    const nodes = solveHangingNodes(start, end, segmentLength, linkCount)

    const links: ChainLink[] = []
    for (let index = 0; index < linkCount; index += 1) {
      const current = nodes[index]
      const next = nodes[index + 1]
      const midX = (current.x + next.x) * 0.5
      const midY = (current.y + next.y) * 0.5
      const tangentRadians = Math.atan2(next.y - current.y, next.x - current.x)
      const tangent = (tangentRadians * 180) / Math.PI
      const isFront = index % 2 === 0
      const normalX = -Math.sin(tangentRadians)
      const normalY = Math.cos(tangentRadians)
      const depthOffset = (isFront ? -1 : 1) * linkHeight * 0.04
      const x = midX + normalX * depthOffset
      const y = midY + normalY * depthOffset
      const localRoll = isFront ? -2 : 88
      const width = Math.max(14, Math.round(linkHeight * CHAIN_ASPECT_RATIO))
      links.push({
        x,
        y,
        rotation: tangent + localRoll,
        zIndex: isFront ? 10 : 9,
        width,
        height: Math.max(18, Math.round(linkHeight)),
      })
    }
    return links
  }, [
    railGeometry.anchorJointX,
    railGeometry.ballSize,
    railGeometry.dragEndJointX,
    railGeometry.dragJointX,
    railGeometry.jointY,
    progress,
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
              width={link.width}
              height={link.height}
              className="absolute pointer-events-none"
              style={{
                left: `${link.x}px`,
                top: `${link.y}px`,
                transform: `translate(-50%, -50%) rotate(${link.rotation}deg)`,
                zIndex: link.zIndex,
                opacity: 0.98,
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
