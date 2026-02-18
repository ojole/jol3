'use client'

import { useState, useEffect } from 'react'

export default function TopBar() {
  const [nameToggle, setNameToggle] = useState(true)
  const [showBubble, setShowBubble] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setNameToggle(prev => !prev)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Auto-dismiss bubble after 8 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowBubble(false)
    }, 8000)

    return () => clearTimeout(timeout)
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

      {/* Right: Low Battery Icon */}
      <div className="flex items-center relative">
        {/* Notification Bubble */}
        {showBubble && (
          <div
            className="absolute right-0 top-full mt-2 w-56 bg-[#f0e5e8] border-[3px] border-t-[#fef4f5] border-l-[#fef4f5] border-b-[#b89fa5] border-r-[#b89fa5] rounded-sm shadow-xl p-3 z-50"
            style={{ right: '-4px' }}
          >
            {/* Speech bubble arrow */}
            <div
              className="absolute -top-[7px] right-3 w-3 h-3 bg-[#f0e5e8] border-t-[3px] border-l-[3px] border-t-[#fef4f5] border-l-[#fef4f5]"
              style={{ transform: 'rotate(45deg)' }}
            />
            <p className="text-[11px] font-mono text-[var(--color-text-primary)] leading-relaxed">
              Battery low, you should contact jol3 soon. See to the contact.notes file below.
            </p>
            <button
              onClick={() => setShowBubble(false)}
              className="absolute top-1 right-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-[10px] leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Low Battery SVG Icon */}
        <button
          onClick={() => setShowBubble(!showBubble)}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors relative"
          title="Battery low"
          type="button"
        >
          <svg width="18" height="12" viewBox="0 0 24 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Battery body */}
            <rect x="1" y="1" width="18" height="12" rx="1.5" />
            {/* Battery terminal */}
            <rect x="19" y="4" width="3" height="6" rx="0.5" fill="currentColor" stroke="none" />
            {/* Single bar - low battery */}
            <rect x="3.5" y="3.5" width="3" height="7" rx="0.5" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>
    </header>
  )
}
