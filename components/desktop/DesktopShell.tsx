'use client'

import { useEffect } from 'react'
import TopBar from './TopBar'
import IconRail from './IconRail'
import Taskbar from '../ui/Taskbar'
import WindowManager from '@/components/window/WindowManager'
import DynamicFavicon from '@/components/DynamicFavicon'
import { leftRailItems } from '@/data/desktopItems'
import { useWindowStore } from '@/lib/windowStore'

export default function DesktopShell() {
  const { windows, closeWindow } = useWindowStore()

  // Global escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && windows.length > 0) {
        // Close the topmost window
        const topWindow = [...windows].sort((a, b) => b.zIndex - a.zIndex)[0]
        if (topWindow) {
          closeWindow(topWindow.id)
        }
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [windows, closeWindow])

  return (
    <>
      <DynamicFavicon />
      <div
        className="w-full flex flex-col relative scanlines"
        style={{
          height: '100dvh',
          background: 'linear-gradient(135deg, #d8cfd0 0%, #c9c0c1 50%, #bab1b2 100%)',
        }}
      >
        {/* Top Bar */}
        <TopBar />

        {/* Main Desktop Area */}
        <div
          className="flex-1 flex relative overflow-hidden"
          style={{
            paddingBottom: 'calc(var(--taskbar-height-mobile) + var(--safe-bottom))',
          }}
        >
          {/* Left Icon Rail (Desktop Items) */}
          <IconRail items={leftRailItems} side="left" />

          {/* Center Workspace (Windows) */}
          <div className="flex-1 relative">
            <WindowManager />
          </div>
        </div>

        {/* Bottom Taskbar */}
        <Taskbar />
      </div>
    </>
  )
}
