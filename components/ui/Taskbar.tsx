'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useWindowStore } from '@/lib/windowStore'

export default function Taskbar() {
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const startBtnRef = useRef<HTMLButtonElement>(null)
  const { windows, openWindow, focusWindow } = useWindowStore()

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const time = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      setCurrentTime(time)
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  // Close menu when clicking outside (but not the start button itself)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        startBtnRef.current && !startBtnRef.current.contains(event.target as Node)
      ) {
        setStartMenuOpen(false)
      }
    }

    if (startMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [startMenuOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && startMenuOpen) {
        setStartMenuOpen(false)
      }
    }

    if (startMenuOpen) {
      window.addEventListener('keydown', handleEscape)
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [startMenuOpen])

  const handleSnakeClick = () => {
    setStartMenuOpen(false)
    openWindow('snake', 'Snake')
  }

  const handleTaskButtonClick = (windowId: string) => {
    focusWindow(windowId)
  }

  const activeWindowId = windows.length > 0
    ? [...windows].sort((a, b) => b.zIndex - a.zIndex)[0]?.id
    : null

  return (
    <div
      className="fixed left-0 right-0 bottom-0 bg-[#e8dfe0] border-t-[3px] border-t-[#fef4f5] px-2 flex items-center gap-2 z-50 shadow-sm md:relative"
      style={{
        paddingTop: '0.5rem',
        paddingBottom: 'calc(0.5rem + var(--safe-bottom))',
        minHeight: 'calc(var(--taskbar-height-mobile) + var(--safe-bottom))',
      }}
    >
      {/* Start Button - Toggle open/close */}
      <button
        ref={startBtnRef}
        onClick={() => setStartMenuOpen(prev => !prev)}
        className={`
          px-4 py-1.5 text-[13px] font-bold
          flex items-center gap-2
          flex-shrink-0
          transition-none
          rounded-sm
          ${startMenuOpen
            ? 'border-[3px] border-t-[#b89fa5] border-l-[#b89fa5] border-b-[#fef4f5] border-r-[#fef4f5] bg-[#d5c5ca]'
            : 'border-[3px] border-t-[#fef4f5] border-l-[#fef4f5] border-b-[#b89fa5] border-r-[#b89fa5] bg-[#f0e5e8] hover:bg-[#f5eaed]'
          }
        `}
        type="button"
        style={{ imageRendering: 'pixelated' }}
      >
        <span className="text-[var(--color-text-primary)]">Start</span>
      </button>

      {/* Start Menu */}
      {startMenuOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-2 mb-1 w-56 bg-[#f0e5e8] border-[3px] border-t-[#fef4f5] border-l-[#fef4f5] border-b-[#b89fa5] border-r-[#b89fa5] shadow-xl rounded-sm z-50"
        >
          <div className="p-1">
            <button
              onClick={handleSnakeClick}
              className="w-full px-4 py-2.5 text-left text-[13px] text-[var(--color-text-primary)] hover:bg-[#d5c5ca] hover:text-[#5a3a45] transition-colors flex items-center gap-2.5 rounded-sm font-medium"
              type="button"
            >
              <Image
                src="/icons/snake.png"
                alt=""
                width={16}
                height={16}
                className="flex-shrink-0 pixelated"
                draggable={false}
              />
              <span>Snake</span>
            </button>
          </div>
        </div>
      )}

      {/* Separator */}
      <div className="w-[3px] h-full bg-gradient-to-r from-[#d5c5ca] to-[#e8dfe0] flex-shrink-0 rounded-full opacity-40"></div>

      {/* Task Buttons (Open Windows) */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto">
        {windows.map((win) => {
          const isActive = win.id === activeWindowId
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

          return (
            <button
              key={win.id}
              onClick={() => handleTaskButtonClick(win.id)}
              className={`
                px-3 py-1 text-[12px] font-medium
                flex items-center gap-2
                transition-none
                truncate max-w-[180px]
                flex-shrink-0
                rounded-sm
                ${isActive
                  ? 'border-[3px] border-t-[#b89fa5] border-l-[#b89fa5] border-b-[#fef4f5] border-r-[#fef4f5] bg-[#d5c5ca]'
                  : 'border-[3px] border-t-[#fef4f5] border-l-[#fef4f5] border-b-[#b89fa5] border-r-[#b89fa5] bg-[#f0e5e8] hover:bg-[#f5eaed]'
                }
              `}
              title={win.title}
              type="button"
            >
              <Image
                src={getIconPath(win.windowType)}
                alt=""
                width={16}
                height={16}
                className="flex-shrink-0 pixelated"
                draggable={false}
              />
              <span className="text-[var(--color-text-primary)] truncate">{win.title}</span>
            </button>
          )
        })}
      </div>

      {/* System Tray Separator */}
      <div className="w-[3px] h-full bg-gradient-to-r from-[#d5c5ca] to-[#e8dfe0] flex-shrink-0 rounded-full opacity-40"></div>

      {/* Clock */}
      <div className="text-[11px] font-mono text-[var(--color-text-primary)] border-[3px] border-t-[#b89fa5] border-l-[#b89fa5] border-b-[#fef4f5] border-r-[#fef4f5] px-3 py-1 bg-[#f0e5e8] flex-shrink-0 min-w-[70px] text-center rounded-sm font-semibold">
        {currentTime}
      </div>
    </div>
  )
}
