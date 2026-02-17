'use client'

interface IframeWindowProps {
  url: string
  title: string
}

export default function IframeWindow({ url, title }: IframeWindowProps) {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      <iframe
        src={url}
        title={title}
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  )
}
