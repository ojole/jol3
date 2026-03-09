'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import Draggable from 'react-draggable'
import { WindowState } from '@/lib/types'
import { useWindowStore } from '@/lib/windowStore'
import { projectsFolderItems } from '@/data/desktopItems'

interface WindowFrameProps {
  window: WindowState
  children: React.ReactNode
}

const FAIV_TOKEN_ENDPOINT =
  process.env.NEXT_PUBLIC_FAIV_TOKEN_ENDPOINT || 'https://api.faiv.ai/api/faiv-embed-token'
const projectWindowTypeSet = new Set(projectsFolderItems.map((item) => item.windowType))
const titleBarControlSizeClass = 'w-7 h-7 md:w-5 md:h-5'
const titleBarControlBaseClass =
  `${titleBarControlSizeClass} rounded-sm transition-colors flex items-center justify-center touch-manipulation`
const titleBarControlNeutralClass =
  `${titleBarControlBaseClass} bg-[#4a4a4a] hover:bg-[#5a5a5a] active:bg-[#6a6a6a] border-[2px] border-t-[#6a6a6a] border-l-[#6a6a6a] border-b-[#2a2a2a] border-r-[#2a2a2a] text-white`
const titleBarControlCloseClass =
  `${titleBarControlBaseClass} bg-[#8a4a4a] hover:bg-[#9a5a5a] active:bg-[#aa6a6a] border-[2px] border-t-[#aa6a6a] border-l-[#aa6a6a] border-b-[#6a2a2a] border-r-[#6a2a2a] text-white`
const projectInfoWindowTypeSet = new Set(['emcrypted', 'faiv'])
const projectInfoMap = {
  emcrypted: {
    title: 'EMCRYPTED.COM',
    what: 'emcrypted.com is an emoji-first movie puzzle app. The game parses puzzle rows from a compiled movie library, maps each symbol to Fluent assets, and tracks hint and guess state from active play through the final breakdown screen.',
    technical:
      'Stack: React, responsive layout logic for direct and embedded windows, emoji asset mapping, and structured game-state transitions for home, game, decrypted, and game-over flows.',
    inspiration:
      'This started as a prompt experiment I played with friends and family. The trivia format felt novel right away, so I built it into a full app. It was my first project and it proved to me that I can build what I imagine if I stay focused.',
  },
  faiv: {
    title: 'FAIV.AI',
    what: 'faiv.ai is a council deliberation console where five perspectives debate before producing a final response. Each prompt runs through the same framework so users can inspect the reasoning and reply directly to individual council members.',
    technical:
      'Stack: FastAPI backend with session handling, deliberation parsing, secure embed token flow for jol3 access, and a retro React console client with threaded re-deliberation interactions.',
    inspiration:
      "My dad taught me that life works best when you keep balance across every lane, not just one. I built FAIV as a framework around that philosophy so people can work through decisions with a more grounded and balanced output.",
  },
} as const

export default function WindowFrame({ window, children }: WindowFrameProps) {
  const { closeWindow, focusWindow, toggleMaximize, minimizeWindow, updateWindowPosition, updateWindowSize } = useWindowStore()
  const frameRef = useRef<HTMLDivElement>(null)
  const nodeRef = useRef<HTMLDivElement>(null)
  const stickyResizeRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)
  const hasAutoOpenedInfoRef = useRef(false)
  const [stickyResizing, setStickyResizing] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(0)

  // Focus on mount
  useEffect(() => {
    if (frameRef.current) {
      frameRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const media = globalThis.window?.matchMedia('(max-width: 767px)')
    if (!media) {
      return
    }

    const syncViewport = () => setIsMobileViewport(media.matches)
    syncViewport()
    media.addEventListener('change', syncViewport)
    return () => media.removeEventListener('change', syncViewport)
  }, [])

  useEffect(() => {
    const syncWidth = () => setViewportWidth(globalThis.window?.innerWidth || 0)
    syncWidth()
    globalThis.window?.addEventListener('resize', syncWidth)
    return () => globalThis.window?.removeEventListener('resize', syncWidth)
  }, [])

  const handleMouseDown = () => {
    focusWindow(window.id)
  }

  const handleDragStop = (_e: any, data: any) => {
    updateWindowPosition(window.id, data.x, data.y)
  }

  // Get icon path based on window type
  const getIconPath = (windowType: string) => {
    switch (windowType) {
      case 'projects': return '/icons/folder.png'
      case 'resume': return '/icons/notepad.png'
      case 'about': return '/icons/notepad.png'
      case 'emcrypted': return '/icons/emcrypted.png'
      case 'faiv': return '/icons/faiv.png'
      case 'contact': return '/icons/sticky.png'
      case 'snake': return '/icons/snake.png'
      default: return '/icons/notepad.png'
    }
  }

  const style: React.CSSProperties = window.isMaximized
    ? {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
      }
    : {
        width: window.width,
        height: window.height,
      }

  const isStickyNote = window.windowType === 'contact'
  const supportsInfoPanel = projectInfoWindowTypeSet.has(window.windowType)
  const projectInfo =
    window.windowType === 'emcrypted' || window.windowType === 'faiv'
      ? projectInfoMap[window.windowType]
      : null
  const showOpenInNewTab = projectWindowTypeSet.has(window.windowType)

  useEffect(() => {
    if (!supportsInfoPanel || isMobileViewport || hasAutoOpenedInfoRef.current) {
      return
    }
    setShowInfoPanel(true)
    hasAutoOpenedInfoRef.current = true
  }, [supportsInfoPanel, isMobileViewport])

  if (window.isMinimized) {
    return null
  }

  const openFaivInNewTab = async () => {
    const newTab = globalThis.window?.open('about:blank', '_blank')
    if (!newTab) {
      return
    }

    try {
      newTab.opener = null
      newTab.document.title = 'Launching FAIV...'

      const response = await fetch(FAIV_TOKEN_ENDPOINT, {
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
      newTab.location.replace(launchUrl)
    } catch (error) {
      console.error('Failed to launch FAIV in new tab', error)
      newTab.location.replace('https://faiv.ai')
    }
  }

  const openProjectAppInNewTab = async () => {
    if (window.windowType === 'faiv') {
      await openFaivInNewTab()
      return
    }

    const projectItem = projectsFolderItems.find((item) => item.windowType === window.windowType)
    if (!projectItem?.url) {
      return
    }
    globalThis.window?.open(projectItem.url, '_blank', 'noopener,noreferrer')
  }

  const beginStickyResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (window.isMaximized) {
      return
    }
    event.stopPropagation()
    event.preventDefault()
    stickyResizeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: window.width,
      startHeight: window.height,
    }
    setStickyResizing(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveStickyResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = stickyResizeRef.current
    if (!state || state.pointerId !== event.pointerId) {
      return
    }
    event.stopPropagation()
    const deltaX = event.clientX - state.startX
    const deltaY = event.clientY - state.startY
    const nextWidth = Math.round(Math.max(220, Math.min(560, state.startWidth + deltaX)))
    const nextHeight = Math.round(Math.max(170, Math.min(480, state.startHeight + deltaY)))
    updateWindowSize(window.id, nextWidth, nextHeight)
  }

  const endStickyResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = stickyResizeRef.current
    if (!state || state.pointerId !== event.pointerId) {
      return
    }
    stickyResizeRef.current = null
    setStickyResizing(false)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // no-op
    }
  }

  const handleToggleInfoPanel = (event?: React.SyntheticEvent) => {
    event?.stopPropagation()
    setShowInfoPanel((previous) => !previous)
    hasAutoOpenedInfoRef.current = true
  }

  const handleCloseInfoPanel = (event?: React.SyntheticEvent) => {
    event?.stopPropagation()
    setShowInfoPanel(false)
    hasAutoOpenedInfoRef.current = true
  }

  const renderProjectInfoPanel = (placement: 'inside' | 'outside') => {
    if (!projectInfo || !showInfoPanel) {
      return null
    }

    if (isMobileViewport) {
      if (placement !== 'inside') {
        return null
      }
      return (
        <div className="absolute inset-0 z-[70] bg-[rgba(8,10,14,0.95)] text-[#efe6c5] backdrop-blur-[1px] pointer-events-auto">
          <div className="h-full overflow-y-auto p-4">
            <div className="rounded-md border border-[#7d6736] bg-[rgba(22,18,10,0.9)] shadow-[0_0_0_1px_rgba(255,220,130,0.15)]">
              <div className="flex items-center justify-between border-b border-[#6a5427] px-3 py-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#f8df8c]">Project Info</p>
                <button
                  className="h-7 w-7 rounded-sm border border-[#7c6431] bg-[rgba(44,33,14,0.85)] text-[#f0d78a]"
                  aria-label="Close project info"
                  onClick={handleCloseInfoPanel}
                >
                  ×
                </button>
              </div>
              <div className="space-y-4 px-4 py-4 font-mono text-[12px] leading-6 text-[#f6eecf]">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#f7d986]">What It Is</p>
                  <p className="mt-1">{projectInfo.what}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#f7d986]">Technical View</p>
                  <p className="mt-1">{projectInfo.technical}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#f7d986]">Inspiration</p>
                  <p className="mt-1">{projectInfo.inspiration}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (window.isMaximized) {
      if (placement !== 'inside') {
        return null
      }
      return (
        <div className="absolute right-5 top-[66px] z-[65] w-[348px] max-w-[44vw]">
          <div
            className="project-info-scroll pointer-events-auto overscroll-contain max-h-[min(62vh,460px)] overflow-y-auto rounded-md border border-[#7f6838] bg-[rgba(23,18,11,0.94)] px-4 py-4 font-mono text-[12px] leading-6 text-[#f4e8c2] shadow-[0_0_0_1px_rgba(255,224,140,0.14),0_10px_28px_rgba(0,0,0,0.35)]"
            onWheel={(event) => event.stopPropagation()}
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#f7d986]">{projectInfo.title}</p>
            <p className="mt-2">{projectInfo.what}</p>
            <p className="mt-2 text-[#e7d49b]">{projectInfo.technical}</p>
            <p className="mt-2 text-[#f0dfac]">{projectInfo.inspiration}</p>
          </div>
        </div>
      )
    }

    const panelMaxWidth = 348
    const panelGap = 24
    const panelMinWidth = 236
    const edgePadding = 12
    const overlapGap = 10
    const viewportWidthResolved = viewportWidth || globalThis.window?.innerWidth || 0
    const windowLeft = window.x
    const windowRight = window.x + window.width
    const leftCapacity = Math.max(0, windowLeft - panelGap - edgePadding)
    const rightCapacity = Math.max(0, viewportWidthResolved - windowRight - panelGap - edgePadding)

    type PlacementCandidate = {
      side: 'left' | 'right'
      width: number
      localLeft: number
      nonOverlapping: boolean
      score: number
    }

    const buildCandidate = (side: 'left' | 'right'): PlacementCandidate | null => {
      const capacity = side === 'right' ? rightCapacity : leftCapacity
      if (capacity < panelMinWidth) {
        return null
      }
      const width = Math.min(panelMaxWidth, capacity)
      const rawGlobalLeft = side === 'right' ? windowRight + panelGap : windowLeft - panelGap - width
      const clampedGlobalLeft = Math.max(
        edgePadding,
        Math.min(rawGlobalLeft, Math.max(edgePadding, viewportWidthResolved - width - edgePadding))
      )
      const clampedGlobalRight = clampedGlobalLeft + width
      const nonOverlapping =
        clampedGlobalRight <= windowLeft - overlapGap || clampedGlobalLeft >= windowRight + overlapGap
      return {
        side,
        width,
        localLeft: clampedGlobalLeft - window.x,
        nonOverlapping,
        score: capacity + (nonOverlapping ? 10000 : 0),
      }
    }

    const candidates = [buildCandidate('right'), buildCandidate('left')]
      .filter((candidate): candidate is PlacementCandidate => Boolean(candidate))
      .sort((a, b) => b.score - a.score)
    const preferredPlacement = candidates[0] || null
    const shouldUseInsideFallback = !preferredPlacement || !preferredPlacement.nonOverlapping
    const outsideWidth = preferredPlacement?.width || panelMinWidth
    const panelLocalLeft = preferredPlacement?.localLeft || 0
    const connectorFromRightSide = preferredPlacement?.side === 'right'
    const connectorWidth = 112
    const connectorLocalLeft = connectorFromRightSide
      ? panelLocalLeft - connectorWidth
      : panelLocalLeft + outsideWidth

    if (shouldUseInsideFallback && placement === 'inside') {
      return (
        <div className="absolute right-4 top-[64px] z-[65] w-[280px] max-w-[min(40vw,348px)]">
          <div
            className="project-info-scroll pointer-events-auto overscroll-contain max-h-[min(56vh,420px)] overflow-y-auto rounded-md border border-[#7f6838] bg-[rgba(23,18,11,0.94)] px-4 py-4 font-mono text-[12px] leading-6 text-[#f4e8c2] shadow-[0_0_0_1px_rgba(255,224,140,0.14),0_10px_28px_rgba(0,0,0,0.35)]"
            onWheel={(event) => event.stopPropagation()}
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#f7d986]">{projectInfo.title}</p>
            <p className="mt-2">{projectInfo.what}</p>
            <p className="mt-2 text-[#e7d49b]">{projectInfo.technical}</p>
            <p className="mt-2 text-[#f0dfac]">{projectInfo.inspiration}</p>
          </div>
        </div>
      )
    }

    if (placement !== 'outside' || shouldUseInsideFallback) {
      return null
    }

    return (
      <>
        <div
          className="absolute top-[86px] hidden md:block pointer-events-none"
          style={{
            left: `${connectorLocalLeft}px`,
            width: `${connectorWidth}px`,
            zIndex: Math.max(1, window.zIndex - 1),
          }}
        >
          <span
            className="absolute left-0 top-[1px] h-[2px] rounded-full bg-gradient-to-r from-[#e3c173] to-[#b98d43] opacity-90"
            style={{
              width: `${connectorWidth - 10}px`,
              transform: connectorFromRightSide ? undefined : 'scaleX(-1)',
              transformOrigin: connectorFromRightSide ? 'left center' : 'right center',
            }}
          />
          <span
            className="absolute top-[-2px] h-[8px] w-[8px] rounded-full border border-[#d0a95f] bg-[#f6da94] shadow-[0_0_5px_rgba(230,197,118,0.4)]"
            style={{ left: connectorFromRightSide ? `${connectorWidth - 13}px` : '2px' }}
          />
        </div>
        <div
          className="absolute top-[56px] hidden md:block pointer-events-auto"
          style={{ left: `${panelLocalLeft}px`, width: `${outsideWidth}px`, zIndex: window.zIndex + 4 }}
        >
          <aside
            className="project-info-scroll pointer-events-auto overscroll-contain max-h-[min(62vh,460px)] overflow-y-auto rounded-md border border-[#7f6838] bg-[rgba(23,18,11,0.94)] px-4 py-4 font-mono text-[12px] leading-6 text-[#f4e8c2] shadow-[0_0_0_1px_rgba(255,224,140,0.14),0_10px_28px_rgba(0,0,0,0.35)]"
            onWheel={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            style={{ touchAction: 'pan-y' }}
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#f7d986]">{projectInfo.title}</p>
            <p className="mt-2">{projectInfo.what}</p>
            <p className="mt-2 text-[#e7d49b]">{projectInfo.technical}</p>
            <p className="mt-2 text-[#f0dfac]">{projectInfo.inspiration}</p>
          </aside>
        </div>
      </>
    )
  }

  const windowContent = isStickyNote ? (
    <div
      ref={frameRef}
      data-ascii-blocker="true"
      className="sticky-note-handle absolute pointer-events-auto flex flex-col"
      style={{
        ...style,
        zIndex: window.zIndex,
        background: '#f7ef9a',
        border: '1px solid #d4c56a',
        boxShadow: window.isMaximized ? 'none' : '1px 1px 0 rgba(102, 88, 30, 0.25)',
      }}
      onMouseDown={handleMouseDown}
      tabIndex={-1}
      role="dialog"
      aria-label={window.title}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          closeWindow(window.id)
        }}
        onTouchEnd={(e) => {
          e.stopPropagation()
          e.preventDefault()
          closeWindow(window.id)
        }}
        className="sticky-note-close absolute top-1 right-1 z-20 h-6 w-6 md:h-5 md:w-5 flex items-center justify-center touch-manipulation"
        style={{ touchAction: 'manipulation', color: '#b8aa4b', lineHeight: 1 }}
        aria-label="Close window"
        onMouseEnter={(e) => { e.currentTarget.style.color = '#8a7a2a' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#b8aa4b' }}
      >
        <span className="text-xs leading-none font-bold pointer-events-none">×</span>
      </button>

      {/* Sticky Note Content */}
      <div className="flex-1 overflow-auto bg-[#f7ef9a] pt-4">
        {children}
      </div>

      {/* Folded corner */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '0 0 16px 16px',
          borderColor: 'transparent transparent #e1d47a transparent',
          filter: 'drop-shadow(-1px -1px 1px rgba(0,0,0,0.06))',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '0 0 14px 14px',
          borderColor: 'transparent transparent #f9f2b0 transparent',
          pointerEvents: 'none',
        }}
      />

      {!window.isMaximized ? (
        <div
          className="sticky-note-resize hidden md:flex absolute right-0 bottom-0 h-5 w-5 items-end justify-end cursor-se-resize"
          onPointerDown={beginStickyResize}
          onPointerMove={moveStickyResize}
          onPointerUp={endStickyResize}
          onPointerCancel={endStickyResize}
          style={{ touchAction: 'none' }}
          aria-label="Resize contact note"
          role="button"
          tabIndex={-1}
        >
          <div
            className="h-[10px] w-[10px]"
            style={{
              background:
                'linear-gradient(135deg, transparent 0 30%, rgba(133,120,54,0.2) 30% 36%, transparent 36% 56%, rgba(133,120,54,0.24) 56% 62%, transparent 62% 100%)',
              opacity: stickyResizing ? 1 : 0.72,
            }}
          />
        </div>
      ) : null}
    </div>
  ) : (
    <div
      ref={frameRef}
      data-ascii-blocker="true"
      className="absolute pointer-events-auto bg-white rounded-md overflow-hidden flex flex-col shadow-2xl"
      style={{
        ...style,
        zIndex: window.zIndex,
        border: '4px solid transparent',
        borderImage: 'linear-gradient(135deg, #fef4f5 0%, #fef4f5 40%, #b89fa5 60%, #b89fa5 100%)',
        borderImageSlice: 1,
      }}
      onMouseDown={handleMouseDown}
      tabIndex={-1}
      role="dialog"
      aria-label={window.title}
    >
      {/* Title Bar - Soft Retro Style */}
      <div
        className="window-titlebar border-b-[3px] border-b-[#4a4a4a] px-2 py-1 md:px-3 flex items-center justify-between select-none cursor-move relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #2a2a2a 100%)',
          backgroundSize: '400% 400%',
          minHeight: '48px',
        }}
      >
        {/* Pixelated wave pattern overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.1) 2px,
              rgba(255,255,255,0.1) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.05) 2px,
              rgba(255,255,255,0.05) 4px
            )`,
            backgroundSize: '4px 4px',
          }}
        />
        <div className="flex items-center gap-2 flex-1 relative z-10">
          <Image
            src={getIconPath(window.windowType)}
            alt=""
            width={14}
            height={14}
            className="flex-shrink-0 pixelated"
            draggable={false}
          />
          <h3 className="text-[11px] font-semibold text-white tracking-tight pointer-events-none uppercase">
            {window.title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 md:gap-1 relative z-10">
          {showOpenInNewTab ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                void openProjectAppInNewTab()
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                e.preventDefault()
                void openProjectAppInNewTab()
              }}
              className={titleBarControlNeutralClass}
              style={{ touchAction: 'manipulation' }}
              aria-label="Open app in new tab"
              title="Open app in new tab"
            >
              <span className="text-xs md:text-[10px] leading-none pointer-events-none">↗</span>
            </button>
          ) : null}

          {supportsInfoPanel ? (
            <button
              onClick={(event) => handleToggleInfoPanel(event)}
              onTouchEnd={(event) => {
                event.stopPropagation()
                event.preventDefault()
                handleToggleInfoPanel()
              }}
              className={titleBarControlNeutralClass}
              style={{ touchAction: 'manipulation' }}
              aria-label={showInfoPanel ? 'Hide app info' : 'Show app info'}
              title={showInfoPanel ? 'Hide app info' : 'Show app info'}
            >
              <span className="text-xs md:text-[10px] leading-none pointer-events-none">i</span>
            </button>
          ) : null}

          {/* Minimize Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              minimizeWindow(window.id)
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              e.preventDefault()
              minimizeWindow(window.id)
            }}
            className={`${titleBarControlNeutralClass} font-bold`}
            style={{ touchAction: 'manipulation' }}
            aria-label="Minimize window"
          >
            <span className="text-sm md:text-xs leading-none mb-[1px] pointer-events-none">−</span>
          </button>

          {/* Maximize Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleMaximize(window.id)
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              e.preventDefault()
              toggleMaximize(window.id)
            }}
            className={`${titleBarControlNeutralClass} font-bold`}
            style={{ touchAction: 'manipulation' }}
            aria-label={window.isMaximized ? 'Restore window' : 'Maximize window'}
          >
            <span className="text-sm md:text-xs leading-none pointer-events-none">□</span>
          </button>

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              closeWindow(window.id)
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              e.preventDefault()
              closeWindow(window.id)
            }}
            className={`${titleBarControlCloseClass} font-bold`}
            style={{ touchAction: 'manipulation' }}
            aria-label="Close window"
          >
            <span className="text-sm md:text-xs leading-none pointer-events-none">×</span>
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-auto bg-white">
        {children}
      </div>
      {renderProjectInfoPanel('inside')}
    </div>
  )

  // If maximized, don't make it draggable
  if (window.isMaximized) {
    return (
      <div data-ascii-blocker="true" style={{ position: 'absolute', inset: 0, zIndex: window.zIndex }}>
        {windowContent}
      </div>
    )
  }

  // If not maximized, wrap in Draggable
  const dragHandleSelector = isStickyNote ? '.sticky-note-handle' : '.window-titlebar'
  const dragCancelSelector = isStickyNote ? '.sticky-note-close, .sticky-note-resize, a, button' : 'button, a'

  return (
    <Draggable
      nodeRef={nodeRef}
      handle={dragHandleSelector}
      cancel={dragCancelSelector}
      position={{ x: window.x, y: window.y }}
      onStop={handleDragStop}
    >
      <div
        ref={nodeRef}
        data-ascii-blocker="true"
        style={{ position: 'absolute', zIndex: window.zIndex, width: window.width, height: window.height }}
      >
        {windowContent}
        {renderProjectInfoPanel('outside')}
      </div>
    </Draggable>
  )
}
