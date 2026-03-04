'use client'

import { useCallback, useEffect, useState } from 'react'

import FaivSlideUnlock from '@/components/window/FaivSlideUnlock'

const ASCII_FRAME_MS = 260
const LOADER_TICK_MS = 80
const LOADER_MIN_DURATION_MS = 1600

const asciiFAIVFrames = [
  [
    '███████╗ █████╗ ██╗██╗   ██╗',
    '██╔════╝██╔══██╗██║██║   ██║',
    '█████╗  ███████║██║██║   ██║',
    '██╔══╝  ██╔══██║██║╚██╗ ██╔╝',
    '██║     ██║  ██║██║ ╚████╔╝ ',
    '╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝  ',
  ],
  [
    ' ██████╗ █████╗ ██╗██╗   ██╗',
    '██╔════╝██╔══██╗██║██║   ██║',
    '█████╗  ███████║██║██║   ██║',
    '██╔══╝  ██╔══██║██║╚██╗ ██╔╝',
    '██║     ██║  ██║██║ ╚████╔╝ ',
    '╚═╝     ██╔═╝  ╚═╝╚═╝  ╚═══╝ ',
  ],
  [
    '  ██████╗ █████╗ ██╗██╗   ██╗',
    ' ██╔════╝██╔══██╗██║██║   ██║',
    ' █████╗  ███████║██║██║   ██║',
    ' ██╔══╝  ██╔══██║██║╚██╗ ██╔╝',
    ' ██║     ██║  ██║██║ ╚████╔╝ ',
    ' ╚═╝     ██╔═╝  ╚═╝╚═╝  ╚═══╝ ',
  ],
]

export default function FaivWindow() {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  const [asciiFrameIndex, setAsciiFrameIndex] = useState(0)
  const [loaderProgress, setLoaderProgress] = useState(0)
  const [minimumLoaderDone, setMinimumLoaderDone] = useState(false)

  const handleUnlocked = useCallback((launchUrl: string) => {
    setIframeUrl(launchUrl)
    setIframeLoaded(false)
    setShowLoader(true)
    setAsciiFrameIndex(0)
    setLoaderProgress(0)
    setMinimumLoaderDone(false)
  }, [])

  useEffect(() => {
    if (!showLoader) {
      return
    }
    const timer = window.setInterval(() => {
      setAsciiFrameIndex((current) => (current + 1) % asciiFAIVFrames.length)
    }, ASCII_FRAME_MS)
    return () => window.clearInterval(timer)
  }, [showLoader])

  useEffect(() => {
    if (!showLoader) {
      return
    }
    const timer = window.setInterval(() => {
      setLoaderProgress((previous) => {
        if (iframeLoaded) {
          return Math.min(100, previous + 7.5)
        }
        if (previous < 58) {
          return previous + 3.3
        }
        if (previous < 82) {
          return previous + 1.8
        }
        return Math.min(93, previous + 0.45)
      })
    }, LOADER_TICK_MS)
    return () => window.clearInterval(timer)
  }, [showLoader, iframeLoaded])

  useEffect(() => {
    if (!showLoader) {
      return
    }
    const timer = window.setTimeout(() => {
      setMinimumLoaderDone(true)
    }, LOADER_MIN_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [showLoader])

  useEffect(() => {
    if (!showLoader || !iframeLoaded || !minimumLoaderDone || loaderProgress < 100) {
      return
    }
    const timer = window.setTimeout(() => {
      setShowLoader(false)
    }, 140)
    return () => window.clearTimeout(timer)
  }, [showLoader, iframeLoaded, minimumLoaderDone, loaderProgress])

  if (!iframeUrl) {
    return <FaivSlideUnlock onUnlocked={handleUnlocked} />
  }

  return (
    <div className="relative h-full w-full bg-[#d9c185]">
      {showLoader ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#d9c185]">
          <div className="w-full max-w-[640px] px-4 flex flex-col items-center gap-4 md:gap-5 pointer-events-none">
            <pre
              className="m-0 text-center leading-[1.04] tracking-[0.01em] whitespace-pre"
              style={{
                color: '#6f4f22',
                fontSize: 'clamp(9px, 1.55vw, 13px)',
                textShadow: '0 0 10px rgba(111,79,34,0.2)',
              }}
            >
              {asciiFAIVFrames[asciiFrameIndex].join('\n')}
            </pre>

            <div className="w-full max-w-[460px]">
              <div className="h-2 w-full border border-[#9f7c3d] bg-[#efdeaf]">
                <div
                  className="h-full bg-[#7e5a24] shadow-[0_0_10px_rgba(116,84,36,0.28)] transition-[width] duration-75 ease-linear"
                  style={{ width: `${Math.max(0, Math.min(100, loaderProgress))}%` }}
                />
              </div>
              <p className="mt-2 text-center text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-[#6f4f22]">
                Loading FAIV session... {Math.floor(loaderProgress)}%
              </p>
            </div>
          </div>
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
