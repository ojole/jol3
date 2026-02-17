'use client'

import { useWindowStore } from '@/lib/windowStore'
import WindowFrame from './WindowFrame'
import AboutWindow from './windows/AboutWindow'
import ResumeWindow from './windows/ResumeWindow'
import ProjectsWindow from './windows/ProjectsWindow'
import ContactWindow from './windows/ContactWindow'
import IframeWindow from './windows/IframeWindow'
import { WindowType } from '@/lib/types'
import { projectsFolderItems } from '@/data/desktopItems'

export default function WindowManager() {
  const windows = useWindowStore(state => state.windows)

  const getWindowContent = (windowType: WindowType) => {
    switch (windowType) {
      case 'about':
        return <AboutWindow />
      case 'resume':
        return <ResumeWindow />
      case 'projects':
        return <ProjectsWindow />
      case 'contact':
        return <ContactWindow />
      case 'emcrypted': {
        const emcryptedItem = projectsFolderItems.find(item => item.id === 'emcrypted')
        return <IframeWindow url={emcryptedItem?.url || 'https://emcrypted.com'} title="emcrypted" />
      }
      default:
        return (
          <div className="p-6">
            <p>Content not found for window type: {windowType}</p>
          </div>
        )
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {windows.map((window) => (
        <WindowFrame key={window.id} window={window}>
          {getWindowContent(window.windowType)}
        </WindowFrame>
      ))}
    </div>
  )
}
