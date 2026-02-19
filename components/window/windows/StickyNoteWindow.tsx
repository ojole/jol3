'use client'

export default function StickyNoteWindow() {
  return (
    <div className="w-full h-full flex flex-col px-5 pb-5 pt-2 font-mono">
      <div className="flex-1 flex flex-col gap-3 text-[13px] text-[#5d4e37]">
        <a
          href="mailto:jol3@jol3.com"
          className="hover:text-[#3a2a17] hover:underline transition-colors"
        >
          jol3@jol3.com
        </a>
        <p className="text-[11px] text-[#8a7a5a] italic leading-relaxed">
          try not to fall in love with me
        </p>
      </div>
    </div>
  )
}
