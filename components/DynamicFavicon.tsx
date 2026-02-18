'use client'

import { useEffect } from 'react'

export default function DynamicFavicon() {
  useEffect(() => {
    const updateFavicon = () => {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = '/icons/computer.png'
    }

    updateFavicon()
  }, [])

  return null
}
