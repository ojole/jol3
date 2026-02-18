'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import Draggable from 'react-draggable'
import { WindowState } from '@/lib/types'
import { useWindowStore } from '@/lib/windowStore'

interface WindowFrameProps {
  window: WindowState
  children: React.ReactNode
}

export default function WindowFrame({ window, children }: WindowFrameProps) {
  const { closeWindow, focusWindow, toggleMaximize, minimizeWindow, updateWindowPosition } = useWindowStore()
  const frameRef = useRef<HTMLDivElement>(null)
  const nodeRef = useRef<HTMLDivElement>(null)

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

  const windowContent = isStickyNote ? (
    <div
      ref={frameRef}
      className="absolute pointer-events-auto rounded-sm overflow-hidden flex flex-col"
      style={{
        ...style,
        zIndex: window.zIndex,
        background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 50%, #fff176 100%)',
        border: '2px solid #e6d88a',
        boxShadow: '0 4px 16px rgba(120, 100, 40, 0.2), 0 1px 3px rgba(120, 100, 40, 0.15)',
      }}
      onMouseDown={handleMouseDown}
      tabIndex={-1}
      role="dialog"
      aria-label={window.title}
    >
      {/* Sticky Note Header - minimal, just a close X */}
      <div
        className="window-titlebar flex items-center justify-end px-2 py-1 select-none cursor-move"
        style={{ minHeight: '28px' }}
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
          className="w-7 h-7 md:w-5 md:h-5 flex items-center justify-center text-[#8a7a5a] hover:text-[#5d4e37] transition-colors touch-manipulation rounded-sm hover:bg-[#f0e68c]"
          style={{ touchAction: 'manipulation' }}
          aria-label="Close window"
        >
          <span className="text-sm leading-none font-bold pointer-events-none">×</span>
        </button>
      </div>

      {/* Sticky Note Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
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
            className="w-9 h-9 md:w-6 md:h-6 bg-[#4a4a4a] hover:bg-[#5a5a5a] active:bg-[#6a6a6a] border-[2px] border-t-[#6a6a6a] border-l-[#6a6a6a] border-b-[#2a2a2a] border-r-[#2a2a2a] rounded-sm transition-colors flex items-center justify-center font-bold text-white touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            aria-label="Minimize window"
          >
            <span className="text-base leading-none mb-1 pointer-events-none">−</span>
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
            className="w-9 h-9 md:w-6 md:h-6 bg-[#4a4a4a] hover:bg-[#5a5a5a] active:bg-[#6a6a6a] border-[2px] border-t-[#6a6a6a] border-l-[#6a6a6a] border-b-[#2a2a2a] border-r-[#2a2a2a] rounded-sm transition-colors flex items-center justify-center font-bold text-white touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            aria-label={window.isMaximized ? 'Restore window' : 'Maximize window'}
          >
            <span className="text-base leading-none pointer-events-none">□</span>
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
            className="w-9 h-9 md:w-6 md:h-6 bg-[#8a4a4a] hover:bg-[#9a5a5a] active:bg-[#aa6a6a] border-[2px] border-t-[#aa6a6a] border-l-[#aa6a6a] border-b-[#6a2a2a] border-r-[#6a2a2a] rounded-sm transition-colors flex items-center justify-center text-white font-bold touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            aria-label="Close window"
          >
            <span className="text-base leading-none pointer-events-none">×</span>
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
