import { create } from 'zustand'
import { WindowState, WindowType } from './types'

interface WindowStore {
  windows: WindowState[]
  highestZIndex: number
  openWindow: (windowType: WindowType, title: string) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  toggleMaximize: (id: string) => void
  updateWindowPosition: (id: string, x: number, y: number) => void
}

let windowCounter = 0

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  highestZIndex: 100,

  openWindow: (windowType: WindowType, title: string) => {
    const { windows, highestZIndex } = get()

    // Check if window of this type is already open
    const existing = windows.find(w => w.windowType === windowType)
    if (existing) {
      get().focusWindow(existing.id)
      return
    }

    // Get viewport dimensions
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768
    const isMobile = viewportWidth < 768

    // Calculate responsive window dimensions
    let width = 600
    let height = 500
    let x = 100 + (windows.length * 30)
    let y = 80 + (windows.length * 30)
    let isMaximized = false

    // Sticky note gets smaller dimensions
    const isStickyNote = windowType === 'contact'

    if (isMobile && !isStickyNote) {
      // On mobile, maximize windows by default (except sticky notes)
      isMaximized = true
      width = viewportWidth
      height = viewportHeight
      x = 0
      y = 0
    } else if (isStickyNote) {
      width = isMobile ? Math.min(280, viewportWidth - 40) : 260
      height = 200
      x = isMobile ? 20 : Math.min(200 + (windows.length * 30), viewportWidth - width - 50)
      y = isMobile ? 100 : Math.min(120 + (windows.length * 30), viewportHeight - height - 100)
    } else {
      // On desktop, ensure window fits in viewport
      const maxWidth = Math.min(800, viewportWidth - 100)
      const maxHeight = Math.min(600, viewportHeight - 150)

      width = Math.min(600, maxWidth)
      height = Math.min(500, maxHeight)

      // Ensure window position doesn't go off-screen
      x = Math.min(x, viewportWidth - width - 50)
      y = Math.min(y, viewportHeight - height - 100)
      x = Math.max(20, x)
      y = Math.max(60, y)
    }

    const newWindow: WindowState = {
      id: `window-${windowCounter++}`,
      windowType,
      title,
      isMinimized: false,
      isMaximized,
      zIndex: highestZIndex + 1,
      x,
      y,
      width,
      height,
    }

    set({
      windows: [...windows, newWindow],
      highestZIndex: highestZIndex + 1,
    })
  },

  closeWindow: (id: string) => {
    set(state => ({
      windows: state.windows.filter(w => w.id !== id),
    }))
  },

  focusWindow: (id: string) => {
    const { windows, highestZIndex } = get()
    const window = windows.find(w => w.id === id)

    if (!window) {
      return
    }

    // Always bring window to front, even if already on top
    set({
      windows: windows.map(w =>
        w.id === id ? { ...w, zIndex: highestZIndex + 1, isMinimized: false } : w
      ),
      highestZIndex: highestZIndex + 1,
    })
  },

  minimizeWindow: (id: string) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
      ),
    }))
  },

  toggleMaximize: (id: string) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    }))
  },

  updateWindowPosition: (id: string, x: number, y: number) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, x, y } : w
      ),
    }))
  },
}))
