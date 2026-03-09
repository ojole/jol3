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
        <div className="absolute inset-0 z-[70] bg-[rgba(8,10,14,0.95)] text-[#efe6c5] backdrop-blur-[1px]">
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
          <div className="max-h-[min(62vh,460px)] overflow-y-auto rounded-md border border-[#7f6838] bg-[rgba(23,18,11,0.94)] px-4 py-4 font-mono text-[12px] leading-6 text-[#f4e8c2] shadow-[0_0_0_1px_rgba(255,224,140,0.14),0_10px_28px_rgba(0,0,0,0.35)]">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#f7d986]">{projectInfo.title}</p>
            <p className="mt-2">{projectInfo.what}</p>
            <p className="mt-2 text-[#e7d49b]">{projectInfo.technical}</p>
            <p className="mt-2 text-[#f0dfac]">{projectInfo.inspiration}</p>
          </div>
        </div>
      )
    }

    if (placement !== 'outside') {
      return null
    }

    const panelWidth = 348
    const panelGap = 24
    const rightSpace = Math.max(0, viewportWidth - (window.x + window.width))
    const leftSpace = Math.max(0, window.x)
    const placeOnRight = rightSpace >= panelWidth + panelGap || rightSpace >= leftSpace

    return (
      <div
        className="absolute top-[56px] z-[65] hidden md:block"
        style={
          placeOnRight
            ? { left: `calc(100% + ${panelGap}px)`, width: `${panelWidth}px` }
            : { right: `calc(100% + ${panelGap}px)`, width: `${panelWidth}px` }
        }
      >
        <div
          className={`pointer-events-none absolute top-6 h-[72px] w-[108px] ${placeOnRight ? '-left-[108px]' : '-right-[108px]'}`}
          style={placeOnRight ? undefined : { transform: 'scaleX(-1)' }}
        >
          <span className="absolute left-0 top-[14px] h-[2px] w-[44px] bg-gradient-to-r from-[#e4c477] to-[#bb9043] opacity-90 animate-pulse" />
          <span
            className="absolute left-[37px] top-[14px] h-[2px] w-[28px] origin-left rotate-[27deg] bg-[#b88a3f] opacity-90 animate-pulse"
            style={{ animationDelay: '110ms' }}
          />
          <span
            className="absolute left-[61px] top-[27px] h-[2px] w-[47px] bg-gradient-to-r from-[#e4c477] to-[#bb9043] opacity-90 animate-pulse"
            style={{ animationDelay: '220ms' }}
          />
          <span className="absolute left-[58px] top-[24px] h-[8px] w-[8px] rounded-full border border-[#d4ad60] bg-[#f6db93] shadow-[0_0_5px_rgba(230,197,118,0.55)]" />
        </div>
        <aside className="max-h-[min(62vh,460px)] overflow-y-auto rounded-md border border-[#7f6838] bg-[rgba(23,18,11,0.94)] px-4 py-4 font-mono text-[12px] leading-6 text-[#f4e8c2] shadow-[0_0_0_1px_rgba(255,224,140,0.14),0_10px_28px_rgba(0,0,0,0.35)]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#f7d986]">{projectInfo.title}</p>
          <p className="mt-2">{projectInfo.what}</p>
          <p className="mt-2 text-[#e7d49b]">{projectInfo.technical}</p>
          <p className="mt-2 text-[#f0dfac]">{projectInfo.inspiration}</p>
        </aside>
      </div>
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
      <div ref={nodeRef} data-ascii-blocker="true" style={{ position: 'absolute', zIndex: window.zIndex }}>
        {windowContent}
        {renderProjectInfoPanel('outside')}
      </div>
    </Draggable>
  )
}
