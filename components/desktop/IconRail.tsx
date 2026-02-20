'use client'

import { DesktopItem } from '@/lib/types'
import DesktopIcon from './DesktopIcon'

interface IconRailProps {
  items: DesktopItem[]
  side: 'left' | 'right'
}

export default function IconRail({ items, side }: IconRailProps) {
  return (
    <aside
      className={`
        w-28 md:w-32
        bg-transparent
        px-4 py-6
        flex flex-col gap-6
        overflow-y-auto
        relative z-10
      `}
    >
      {items.map((item) => (
        <DesktopIcon key={item.id} item={item} />
      ))}
    </aside>
  )
}
