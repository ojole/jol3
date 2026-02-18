'use client'

export default function StickyNoteWindow() {
  return (
    <div
      className="w-full h-full flex flex-col p-5 font-mono"
      style={{
        background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 50%, #fff176 100%)',
      }}
    >
      <div className="flex-1 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-[#5d4e37] uppercase tracking-wide border-b border-[#e6d88a] pb-2">
          contact.notes
        </h2>
        <div className="flex flex-col gap-3 text-[13px] text-[#5d4e37]">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#8a7a5a]">email</span>
            <br />
            <a
              href="mailto:jol3@jol3.com"
              className="hover:text-[#3a2a17] hover:underline transition-colors"
            >
              jol3@jol3.com
            </a>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#8a7a5a]">phone</span>
            <br />
            <a
              href="tel:7137033656"
              className="hover:text-[#3a2a17] hover:underline transition-colors"
            >
              713-703-3656
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
