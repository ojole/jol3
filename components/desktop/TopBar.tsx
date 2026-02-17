'use client'

import { useState, useEffect } from 'react'

export default function TopBar() {
  const [nameToggle, setNameToggle] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setNameToggle(prev => !prev)
    }, 2000) // Toggle every 2 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-[var(--color-paper-dark)]/90 backdrop-blur-sm border-b border-[var(--color-border-dark)] px-3 py-1 flex items-center justify-between relative z-50">
      {/* Left: Brand */}
      <div className="flex items-center">
        <span className="text-sm font-mono font-semibold text-[var(--color-text-primary)] select-none">
          {nameToggle ? 'jol3' : 'jole'}
        </span>
      </div>

      {/* Center: Empty Spacer */}
      <div className="flex-1"></div>

      {/* Right: Optional Status */}
      <div className="text-[10px] text-[var(--color-text-secondary)] opacity-70">
        {/* Optional: Add time/date here */}
      </div>
    </header>
  )
}
