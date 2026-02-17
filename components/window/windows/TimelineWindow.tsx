'use client'

import { timelineEntries } from '@/data/windowContent'

export default function TimelineWindow() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Career Timeline</h1>
        <p className="text-[var(--color-text-secondary)]">
          A chronological journey through my professional evolution.
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[var(--color-border-dark)]" />

        {/* Timeline entries */}
        <div className="space-y-8">
          {timelineEntries.map((entry, index) => (
            <div key={index} className="relative pl-20">
              {/* Timeline dot */}
              <div className="absolute left-6 top-2 w-5 h-5 bg-[var(--color-accent-primary)] border-2 border-white rounded-full shadow" />

              {/* Content */}
              <div className="border-2 border-[var(--color-border-light)] rounded-lg p-5 bg-white hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-[var(--color-text-primary)]">
                    {entry.title}
                  </h3>
                  <span className="text-sm font-semibold text-[var(--color-accent-primary)] whitespace-nowrap ml-4">
                    {entry.year}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  {entry.company}
                </p>
                <p className="text-sm text-[var(--color-text-primary)]">
                  {entry.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-6 bg-[var(--color-paper-dark)] border-2 border-[var(--color-border-light)] rounded-lg">
        <p className="text-sm text-[var(--color-text-primary)] italic">
          💡 <strong>Pattern Recognition:</strong> Each role built on the previous one—from sales to operations
          to product to AI. The common thread? Making complex systems work better for people.
        </p>
      </div>
    </div>
  )
}
