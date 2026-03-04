'use client'

import { useCallback, useState } from 'react'

import FaivSlideUnlock from '@/components/window/FaivSlideUnlock'

export default function FaivWindow() {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const handleUnlocked = useCallback((launchUrl: string) => {
    setIframeUrl(launchUrl)
    setIframeLoaded(false)
  }, [])

  if (!iframeUrl) {
    return <FaivSlideUnlock onUnlocked={handleUnlocked} />
  }

  return (
    <div className="relative h-full w-full bg-white">
      {!iframeLoaded ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a] text-[#d6ffe2] font-mono text-xs uppercase tracking-[0.12em]">
          Loading FAIV session...
        </div>
      ) : null}
      <iframe
        src={iframeUrl}
        title="faiv"
        className="h-full w-full border-0"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        allow="clipboard-read; clipboard-write"
        referrerPolicy="no-referrer"
        onLoad={() => setIframeLoaded(true)}
      />
    </div>
  )
}

