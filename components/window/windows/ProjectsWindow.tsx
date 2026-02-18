'use client'

import Image from 'next/image'
import { projectsFolderItems } from '@/data/desktopItems'
import { useWindowStore } from '@/lib/windowStore'

export default function ProjectsWindow() {
  const openWindow = useWindowStore(state => state.openWindow)

  const handleItemClick = (item: typeof projectsFolderItems[0]) => {
    if (item.windowType) {
      openWindow(item.windowType, item.label)
    }
  }

  return (
    <div className="p-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {projectsFolderItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="flex flex-col items-center gap-2 p-3 rounded hover:bg-[var(--color-icon-hover)] transition-colors cursor-pointer"
          >
            {item.iconImage && (
              <div className="w-16 h-16 flex items-center justify-center relative">
                <Image
                  src={item.iconImage}
                  alt=""
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
                {/* Shortcut arrow overlay */}
                <Image
                  src="/icons/arrow.png"
                  alt=""
                  width={20}
                  height={20}
                  className="absolute bottom-0 left-0 pixelated"
                  draggable={false}
                />
              </div>
            )}
            <span className="text-xs text-center text-[var(--color-text-primary)] font-medium leading-tight">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
