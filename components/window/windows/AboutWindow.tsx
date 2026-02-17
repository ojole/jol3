'use client'

import { aboutMeContent } from '@/data/windowContent'

export default function AboutWindow() {
  return (
    <div className="p-6 font-mono text-sm bg-[var(--color-window-bg)]">
      <pre className="whitespace-pre-wrap leading-relaxed text-[var(--color-text-primary)]">
        {aboutMeContent.content}
      </pre>
    </div>
  )
}
