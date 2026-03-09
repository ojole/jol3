'use client'

import { useEffect } from 'react'
import TopBar from './TopBar'
import IconRail from './IconRail'
import AsciiFieldOverlay from './AsciiFieldOverlay'
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

  // iOS Safari sometimes keeps a zoomed/shifted viewport after text-field focus in embedded apps.
  // Keep the parent desktop pinned to the top-left layout origin.
  useEffect(() => {
    let keyboardLikelyOpen = false

    const snapViewport = () => {
      if (globalThis.window?.scrollX !== 0 || globalThis.window?.scrollY !== 0) {
        globalThis.window?.scrollTo(0, 0)
      }
    }

    const scheduleSnap = (delays: number[]) => {
      delays.forEach((delay) => {
        globalThis.window?.setTimeout(snapViewport, delay)
      })
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        return
      }
      const isInputTarget =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      if (!isInputTarget) {
        return
      }
      keyboardLikelyOpen = true
    }

    const handleFocusOut = () => {
      const vv = globalThis.window?.visualViewport
      const viewportDelta = vv ? globalThis.window.innerHeight - vv.height : 0
      if (viewportDelta < 80) {
        keyboardLikelyOpen = false
        scheduleSnap([120, 260, 480])
      }
    }

    const handleViewportShift = () => {
      const vv = globalThis.window?.visualViewport
      if (!vv) {
        return
      }
      const viewportDelta = globalThis.window.innerHeight - vv.height
      const keyboardOpenNow = viewportDelta > 130

      if (keyboardOpenNow) {
        keyboardLikelyOpen = true
        return
      }

      if (keyboardLikelyOpen) {
        keyboardLikelyOpen = false
        scheduleSnap([120, 260, 460])
      }
    }

    const handleOrientationChange = () => {
      scheduleSnap([120, 360])
    }

    const handleSubmitIntent = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') {
        return
      }
      scheduleSnap([160, 320, 540])
    }

    globalThis.window?.addEventListener('focusin', handleFocusIn, true)
    globalThis.window?.addEventListener('focusout', handleFocusOut, true)
    globalThis.window?.addEventListener('keydown', handleSubmitIntent, true)
    globalThis.window?.addEventListener('orientationchange', handleOrientationChange)
    globalThis.window?.visualViewport?.addEventListener('resize', handleViewportShift, { passive: true })
    globalThis.window?.visualViewport?.addEventListener('scroll', handleViewportShift, { passive: true })

    return () => {
      globalThis.window?.removeEventListener('focusin', handleFocusIn, true)
      globalThis.window?.removeEventListener('focusout', handleFocusOut, true)
      globalThis.window?.removeEventListener('keydown', handleSubmitIntent, true)
      globalThis.window?.removeEventListener('orientationchange', handleOrientationChange)
      globalThis.window?.visualViewport?.removeEventListener('resize', handleViewportShift)
      globalThis.window?.visualViewport?.removeEventListener('scroll', handleViewportShift)
    }
  }, [])

  return (
    <>
      <DynamicFavicon />
      <div
        className="w-full flex flex-col relative scanlines"
        style={{
          height: '100dvh',
          paddingTop: 'var(--safe-top)',
          background: 'linear-gradient(135deg, #d8cfd0 0%, #c9c0c1 50%, #bab1b2 100%)',
        }}
      >
        {/* Top Bar */}
        <TopBar />

        {/* Main Desktop Area */}
        <div
          className="flex-1 flex relative overflow-hidden"
          data-ascii-surface="true"
          style={{
            paddingBottom: 'calc(var(--taskbar-height-mobile) + var(--safe-bottom))',
          }}
        >
          <AsciiFieldOverlay />

          {/* Left Icon Rail (Desktop Items) */}
          <IconRail items={leftRailItems} side="left" />

          {/* Center Workspace (Windows) */}
          <div className="flex-1 relative z-10" data-ascii-surface="true">
            <WindowManager />
          </div>
        </div>

        {/* Bottom Taskbar */}
        <Taskbar />
      </div>
    </>
  )
}
