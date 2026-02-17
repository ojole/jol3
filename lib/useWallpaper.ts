import { useState, useEffect } from 'react'

interface WallpaperState {
  url: string
  isAI: boolean
  isLoading: boolean
}

const FALLBACK_GRADIENT = 'linear-gradient(135deg, #e8e4d8 0%, #d4cfbf 50%, #c9c4b4 100%)'
const SESSION_KEY = 'jol3_wallpaper'
const TIMEOUT_MS = 5000 // 5 second timeout

export function useWallpaper(): WallpaperState {
  const [wallpaper, setWallpaper] = useState<WallpaperState>({
    url: FALLBACK_GRADIENT,
    isAI: false,
    isLoading: true,
  })

  useEffect(() => {
    // Check sessionStorage for cached wallpaper
    const cached = sessionStorage.getItem(SESSION_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setWallpaper({
          url: parsed.url,
          isAI: parsed.isAI,
          isLoading: false,
        })
        return
      } catch {
        // Invalid cache, continue to fetch
      }
    }

    // Fetch AI wallpaper with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    fetch('/api/wallpaper', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeoutId)

        if (data.success && data.url) {
          const newWallpaper = {
            url: `url(${data.url})`,
            isAI: true,
            isLoading: false,
          }
          setWallpaper(newWallpaper)

          // Cache in sessionStorage
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(newWallpaper))
        } else {
          // Fallback on error
          setWallpaper({
            url: FALLBACK_GRADIENT,
            isAI: false,
            isLoading: false,
          })
        }
      })
      .catch(err => {
        clearTimeout(timeoutId)
        console.log('Wallpaper fetch failed or timed out, using fallback:', err.message)

        setWallpaper({
          url: FALLBACK_GRADIENT,
          isAI: false,
          isLoading: false,
        })
      })

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  return wallpaper
}
