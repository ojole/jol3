'use client'

import { useState } from 'react'
import Image from 'next/image'
import { DesktopItem } from '@/lib/types'
import { useWindowStore } from '@/lib/windowStore'

interface DesktopIconProps {
  item: DesktopItem
}

export default function DesktopIcon({ item }: DesktopIconProps) {
  const [isSelected, setIsSelected] = useState(false)
  const openWindow = useWindowStore(state => state.openWindow)

  const handleClick = () => {
    setIsSelected(true)
    openWindow(item.windowType, item.label)
    setTimeout(() => setIsSelected(false), 300)
  }

  return (
    <button
      onClick={handleClick}
      className={`
        desktop-icon
        flex flex-col items-center gap-2
        px-2 py-3 rounded
        cursor-pointer
        focus:outline-none
        ${isSelected ? 'selected' : ''}
      `}
      aria-label={`Open ${item.label}`}
      type="button"
    >
      {/* Icon */}
      <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center relative" style={{ pointerEvents: 'none' }}>
        {item.iconImage ? (
          <Image
            src={item.iconImage}
            alt=""
            width={56}
            height={56}
            className="w-full h-full object-contain pixelated"
            draggable={false}
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          <div className="text-3xl md:text-4xl" style={{ pointerEvents: 'none' }}>
            {item.icon || '📄'}
          </div>
        )}
      </div>

      {/* Label */}
      <span className="text-xs text-center text-[var(--color-text-primary)] font-medium leading-tight whitespace-nowrap px-1" style={{ pointerEvents: 'none' }}>
        {item.label}
      </span>
    </button>
  )
}
