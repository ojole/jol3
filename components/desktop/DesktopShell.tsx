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
    let rafId: number | null = null
    let suppressSnapUntil = 0
    let lastSnapAt = 0
    let scheduledTimers: number[] = []
    let stableViewportHeight =
      globalThis.window?.visualViewport?.height || globalThis.window?.innerHeight || 0

    const nowMs = () => globalThis.performance?.now?.() || Date.now()

    const blockSnap = (durationMs: number) => {
      suppressSnapUntil = Math.max(suppressSnapUntil, nowMs() + Math.max(0, durationMs))
    }

    const isSnapSuppressed = () => nowMs() < suppressSnapUntil

    const clearScheduledSnap = () => {
      scheduledTimers.forEach((timerId) => globalThis.window?.clearTimeout(timerId))
      scheduledTimers = []
    }

    const resyncHitTesting = () => {
      const shellRoot = globalThis.document?.getElementById('desktop-shell-root')
      if (!(shellRoot instanceof HTMLElement)) {
        return
      }
      shellRoot.style.willChange = 'transform'
      shellRoot.style.transform = 'translateZ(0)'
      const clearNudge = () => {
        shellRoot.style.transform = ''
        shellRoot.style.willChange = ''
      }
      globalThis.window?.requestAnimationFrame(() => {
        globalThis.window?.requestAnimationFrame(clearNudge)
      })
    }

    const snapViewport = (soft = false) => {
      const now = nowMs()
      if (now - lastSnapAt < 120) {
        return
      }
      const wasOffset =
        (globalThis.window?.scrollX || 0) !== 0 ||
        (globalThis.window?.scrollY || 0) !== 0 ||
        hasTopBarDrift()

      if (globalThis.window?.scrollX !== 0 || globalThis.window?.scrollY !== 0 || !soft) {
        globalThis.window?.scrollTo(0, 0)
      }
      globalThis.window?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      globalThis.document?.scrollingElement?.scrollTo(0, 0)
      if (globalThis.document?.documentElement) {
        globalThis.document.documentElement.scrollTop = 0
      }
      if (globalThis.document?.body) {
        globalThis.document.body.scrollTop = 0
      }
      lastSnapAt = now
      if (wasOffset) {
        resyncHitTesting()
      }
    }

    const hasTopBarDrift = () => {
      const topBar = globalThis.document?.getElementById('desktop-top-bar')
      if (!topBar) {
        return false
      }
      return topBar.getBoundingClientRect().top < -0.5
    }

    const hasViewportDrift = () => {
      const vv = globalThis.window?.visualViewport
      if (!vv) {
        return false
      }
      return Math.abs(vv.scale - 1) > 0.002 || vv.offsetTop > 2
    }

    const hasDesktopDrift = () => {
      return (globalThis.window?.scrollY || 0) > 0 || hasViewportDrift() || hasTopBarDrift()
    }

    const isKeyboardViewportCompressed = () => {
      const vv = globalThis.window?.visualViewport
      if (!vv) {
        return false
      }
      const baseline = Math.max(1, stableViewportHeight)
      const delta = baseline - vv.height
      return delta > 42 || vv.offsetTop > 8
    }

    const canSnapViewport = () => {
      return !keyboardLikelyOpen && !isKeyboardViewportCompressed() && !isSnapSuppressed()
    }

    const scheduleSnap = (delays: number[], suppressMs = 260) => {
      clearScheduledSnap()
      blockSnap(suppressMs)
      delays.forEach((delay) => {
        const timerId = globalThis.window?.setTimeout(() => {
          if (canSnapViewport()) {
            snapViewport(true)
          }
        }, delay)
        if (typeof timerId === 'number') {
          scheduledTimers.push(timerId)
        }
      })
    }

    const isEditableElement = (node: Element | null) => {
      if (!(node instanceof HTMLElement)) {
        return false
      }
      return (
        node.tagName === 'INPUT' ||
        node.tagName === 'TEXTAREA' ||
        node.tagName === 'SELECT' ||
        node.isContentEditable
      )
    }

    const readKeyboardState = () => {
      const vv = globalThis.window?.visualViewport
      if (!vv) {
        return { open: keyboardLikelyOpen, justClosed: false }
      }
      const expandedHeight = vv.height + vv.offsetTop
      if (!keyboardLikelyOpen && expandedHeight > stableViewportHeight) {
        stableViewportHeight = expandedHeight
      }
      const baseline = Math.max(1, stableViewportHeight)
      const delta = baseline - vv.height
      const open = delta > 90 || vv.offsetTop > 55
      const justClosed = keyboardLikelyOpen && !open
      keyboardLikelyOpen = open
      return { open, justClosed }
    }

    const handleViewportShift = () => {
      if (rafId !== null) {
        return
      }
      rafId = globalThis.window?.requestAnimationFrame(() => {
        rafId = null
        const { open, justClosed } = readKeyboardState()
        if (open) {
          clearScheduledSnap()
          return
        }
        if (justClosed) {
          scheduleSnap([90, 200, 360, 560], 260)
          return
        }
        if (canSnapViewport() && hasDesktopDrift()) {
          snapViewport(true)
        }
      }) ?? null
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target
      if (target instanceof HTMLIFrameElement) {
        keyboardLikelyOpen = true
        blockSnap(1200)
        clearScheduledSnap()
        return
      }
      if (!isEditableElement(target as Element | null)) {
        return
      }
      keyboardLikelyOpen = true
      blockSnap(1200)
      clearScheduledSnap()
    }

    const handleInteractionIntent = () => {
      blockSnap(640)
      clearScheduledSnap()
    }

    const handleFocusOut = () => {
      globalThis.window?.setTimeout(() => {
        if (isEditableElement(globalThis.document?.activeElement || null)) {
          return
        }
        const { open } = readKeyboardState()
        if (!open) {
          scheduleSnap([90, 190, 340, 540], 320)
        }
      }, 120)
    }

    const handleSubmitIntent = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') {
        return
      }
      if (!isEditableElement(event.target as Element | null)) {
        return
      }
      scheduleSnap([120, 220, 380, 580], 520)
    }

    const handleFormSubmit = () => {
      scheduleSnap([120, 220, 380, 580], 520)
    }

    const handleOrientationChange = () => {
      stableViewportHeight =
        globalThis.window?.visualViewport?.height || globalThis.window?.innerHeight || stableViewportHeight
      keyboardLikelyOpen = false
      scheduleSnap([140, 320, 540], 320)
    }

    globalThis.window?.addEventListener('focusin', handleFocusIn, true)
    globalThis.window?.addEventListener('focusout', handleFocusOut, true)
    globalThis.window?.addEventListener('keydown', handleSubmitIntent, true)
    globalThis.window?.addEventListener('submit', handleFormSubmit, true)
    globalThis.window?.addEventListener('pointerdown', handleInteractionIntent, true)
    globalThis.window?.addEventListener('touchstart', handleInteractionIntent, {
      passive: true,
      capture: true,
    })
    globalThis.window?.addEventListener('scroll', handleViewportShift, { passive: true })
    globalThis.window?.addEventListener('resize', handleViewportShift, { passive: true })
    globalThis.window?.addEventListener('orientationchange', handleOrientationChange)
    globalThis.window?.visualViewport?.addEventListener('resize', handleViewportShift, { passive: true })
    globalThis.window?.visualViewport?.addEventListener('scroll', handleViewportShift, { passive: true })
    handleViewportShift()

    return () => {
      if (rafId !== null) {
        globalThis.window?.cancelAnimationFrame(rafId)
      }
      clearScheduledSnap()
      globalThis.window?.removeEventListener('focusin', handleFocusIn, true)
      globalThis.window?.removeEventListener('focusout', handleFocusOut, true)
      globalThis.window?.removeEventListener('keydown', handleSubmitIntent, true)
      globalThis.window?.removeEventListener('submit', handleFormSubmit, true)
      globalThis.window?.removeEventListener('pointerdown', handleInteractionIntent, true)
      globalThis.window?.removeEventListener('touchstart', handleInteractionIntent, true)
      globalThis.window?.removeEventListener('scroll', handleViewportShift)
      globalThis.window?.removeEventListener('resize', handleViewportShift)
      globalThis.window?.removeEventListener('orientationchange', handleOrientationChange)
      globalThis.window?.visualViewport?.removeEventListener('resize', handleViewportShift)
      globalThis.window?.visualViewport?.removeEventListener('scroll', handleViewportShift)
    }
  }, [])

  return (
    <>
      <DynamicFavicon />
      <div
        id="desktop-shell-root"
        className="w-full flex flex-col relative scanlines"
        style={{
          position: 'fixed',
          inset: 0,
          height: '100dvh',
          paddingTop: 'var(--safe-top)',
          background: 'linear-gradient(135deg, #d8cfd0 0%, #c9c0c1 50%, #bab1b2 100%)',
          overflow: 'hidden',
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
