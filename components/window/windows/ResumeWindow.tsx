'use client'

import { resumeContent } from '@/data/windowContent'

export default function ResumeWindow() {
  return (
    <div className="p-6 font-mono text-sm bg-[var(--color-window-bg)]">
      <pre className="whitespace-pre-wrap leading-relaxed text-[var(--color-text-primary)]">
        {resumeContent.content}
      </pre>
    </div>
  )
}
