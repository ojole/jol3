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
  const [stickyResizing, setStickyResizing] = useState(false)

  // Focus on mount
  useEffect(() => {
    if (frameRef.current) {
      frameRef.current.focus()
    }
  }, [])

  const handleMouseDown = () => {
    focusWindow(window.id)
  }

  const handleDragStop = (_e: any, data: any) => {
    updateWindowPosition(window.id, data.x, data.y)
  }

  if (window.isMinimized) {
    return null
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
  const showOpenInNewTab = projectWindowTypeSet.has(window.windowType)

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

  const windowContent = isStickyNote ? (
    <div
      ref={frameRef}
      className="absolute pointer-events-auto flex flex-col"
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
      {/* Sticky Note Header */}
      <div
        className="window-titlebar flex items-center justify-end px-1 select-none cursor-move"
        style={{
          background: '#efe37f',
          minHeight: '30px',
          borderBottom: '1px solid #d4c56a',
          flexShrink: 0,
        }}
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
          className={`${titleBarControlSizeClass} flex items-center justify-center touch-manipulation`}
          style={{ touchAction: 'manipulation', color: '#c9b84a', lineHeight: 1 }}
          aria-label="Close window"
          onMouseEnter={(e) => { e.currentTarget.style.color = '#8a7a2a' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#c9b84a' }}
        >
          <span className="text-xs md:text-[10px] leading-none font-bold pointer-events-none">×</span>
        </button>
      </div>

      {/* Sticky Note Content */}
      <div className="flex-1 overflow-auto bg-[#f7ef9a]">
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
          className="hidden md:flex absolute right-0 bottom-0 h-5 w-5 items-end justify-end cursor-se-resize"
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
    </div>
  )

  // If maximized, don't make it draggable
  if (window.isMaximized) {
    return windowContent
  }

  // If not maximized, wrap in Draggable
  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".window-titlebar"
      position={{ x: window.x, y: window.y }}
      onStop={handleDragStop}
    >
      <div ref={nodeRef} style={{ position: 'absolute', zIndex: window.zIndex }}>
        {windowContent}
      </div>
    </Draggable>
  )
}
