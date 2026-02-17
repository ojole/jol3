import { DesktopItem } from '@/lib/types'

// Icon mapping utility - using new simplified icons
export const getIconPath = (type: string): string => {
  const iconMap: Record<string, string> = {
    folder: '/icons/folder.png',
    txt: '/icons/notepad.png',
    url: '/icons/url-shortcut.png',
  }
  return iconMap[type] || '/icons/notepad.png'
}

// Top-level desktop items (3 items, left side only)
export const desktopItems: DesktopItem[] = [
  {
    id: 'projects',
    label: 'Projects',
    type: 'folder',
    side: 'left',
    windowType: 'projects',
    iconImage: getIconPath('folder'),
    order: 1,
  },
  {
    id: 'resume',
    label: 'resume.txt',
    type: 'txt',
    side: 'left',
    windowType: 'resume',
    iconImage: getIconPath('txt'),
    order: 2,
  },
  {
    id: 'about',
    label: 'about-me.txt',
    type: 'txt',
    side: 'left',
    windowType: 'about',
    iconImage: getIconPath('txt'),
    order: 3,
  },
]

// Projects folder contents
export const projectsFolderItems: DesktopItem[] = [
  {
    id: 'emcrypted',
    label: 'emcrypted.www',
    type: 'url',
    side: 'left',
    windowType: 'emcrypted',
    iconImage: getIconPath('url'),
    url: 'https://emcrypted.com',
    order: 1,
  },
]

export const leftRailItems = desktopItems
  .filter(item => item.side === 'left')
  .sort((a, b) => a.order - b.order)

export const rightRailItems = desktopItems
  .filter(item => item.side === 'right')
  .sort((a, b) => a.order - b.order)
