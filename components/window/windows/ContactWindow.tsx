'use client'

export default function ContactWindow() {
  return (
    <div className="p-8 max-w-md mx-auto flex flex-col items-center justify-center min-h-[200px]">
      <div className="text-6xl mb-6">📧</div>
      <h2 className="text-xl font-bold mb-4 text-[var(--color-text-primary)]">
        Contact jol3
      </h2>
      <a
        href="mailto:jol3@jol3.com"
        className="text-lg font-mono text-[var(--color-accent-primary)] hover:text-[var(--color-accent-hover)] hover:underline transition-colors"
      >
        jol3@jol3.com
      </a>
    </div>
  )
}
