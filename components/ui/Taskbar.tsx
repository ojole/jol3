'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useWindowStore } from '@/lib/windowStore'

export default function Taskbar() {
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const { windows, openWindow, focusWindow, minimizeWindow } = useWindowStore()

  // Update clock every second for more responsiveness
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

    updateClock() // Initial call
    const interval = setInterval(updateClock, 1000) // Update every second

    return () => clearInterval(interval)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  // Close menu on Escape
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

  const handleContactClick = () => {
    setStartMenuOpen(false)
    window.location.href = 'mailto:jol3@jol3.com'
  }

  const handleTaskButtonClick = (windowId: string) => {
    focusWindow(windowId)
  }

  // Get active window (highest z-index)
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
      {/* Start Button - Soft Retro Style */}
      <button
        onClick={() => setStartMenuOpen(!startMenuOpen)}
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

      {/* Start Menu - Soft Retro Style */}
      {startMenuOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-2 mb-1 w-56 bg-[#f0e5e8] border-[3px] border-t-[#fef4f5] border-l-[#fef4f5] border-b-[#b89fa5] border-r-[#b89fa5] shadow-xl rounded-sm z-50"
        >
          <div className="p-1">
            <button
              onClick={handleContactClick}
              className="w-full px-4 py-2.5 text-left text-[13px] text-[var(--color-text-primary)] hover:bg-[#d5c5ca] hover:text-[#5a3a45] transition-colors flex items-center gap-2.5 rounded-sm font-medium"
              type="button"
            >
              <span>Contact jol3</span>
            </button>
          </div>
        </div>
      )}

      {/* Separator */}
      <div className="w-[3px] h-full bg-gradient-to-r from-[#d5c5ca] to-[#e8dfe0] flex-shrink-0 rounded-full opacity-40"></div>

      {/* Task Buttons (Open Windows) - Soft Retro Style */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto">
        {windows.map((window) => {
          const isActive = window.id === activeWindowId
          // Get icon path based on window type
          const getIconPath = (windowType: string) => {
            switch (windowType) {
              case 'projects': return '/icons/folder.png'
              case 'resume': return '/icons/notepad.png'
              case 'about': return '/icons/notepad.png'
              case 'emcrypted': return '/icons/url-shortcut.png'
              default: return '/icons/notepad.png'
            }
          }

          return (
            <button
              key={window.id}
              onClick={() => handleTaskButtonClick(window.id)}
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
              title={window.title}
              type="button"
            >
              <Image
                src={getIconPath(window.windowType)}
                alt=""
                width={16}
                height={16}
                className="flex-shrink-0 pixelated"
                draggable={false}
              />
              <span className="text-[var(--color-text-primary)] truncate">{window.title}</span>
            </button>
          )
        })}
      </div>

      {/* System Tray Separator */}
      <div className="w-[3px] h-full bg-gradient-to-r from-[#d5c5ca] to-[#e8dfe0] flex-shrink-0 rounded-full opacity-40"></div>

      {/* Clock - Soft Retro Style */}
      <div className="text-[11px] font-mono text-[var(--color-text-primary)] border-[3px] border-t-[#b89fa5] border-l-[#b89fa5] border-b-[#fef4f5] border-r-[#fef4f5] px-3 py-1 bg-[#f0e5e8] flex-shrink-0 min-w-[70px] text-center rounded-sm font-semibold">
        {currentTime}
      </div>
    </div>
  )
}
