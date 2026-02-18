export type IconType = 'doc' | 'folder' | 'pdf' | 'media' | 'link' | 'txt' | 'url' | 'app'

export type WindowType =
  | 'about'
  | 'resume'
  | 'projects'
  | 'contact'
  | 'timeline'
  | 'why'
  | 'changelog'
  | 'demo'
  | 'work-with-me'
  | 'emcrypted'
  | 'faiv'
  | 'sora'
  | 'fishbowl-hypothesis'
  | 'dark-planet-hypothesis'
  | 'lidar-emoji-mapping'

export type IconSide = 'left' | 'right'

export interface DesktopItem {
  id: string
  label: string
  type: IconType
  side: IconSide
  windowType: WindowType
  icon?: string // Legacy emoji support
  iconImage?: string // Path to PNG icon
  order: number
  url?: string // For URL shortcuts and iframes
}

export interface WindowState {
  id: string
  windowType: WindowType
  title: string
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  x: number
  y: number
  width: number
  height: number
}

export interface Project {
  id: string
  title: string
  problem: string
  solution: string
  role: string
  impact: string
  stack: string[]
  links?: {
    repo?: string
    demo?: string
  }
}

export interface TimelineEntry {
  year: string
  title: string
  company: string
  description: string
}
