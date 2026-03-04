import type { NextConfig } from 'next'

const isStaticExport = process.env.NEXT_STATIC_EXPORT === '1'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isStaticExport ? { output: 'export' as const } : {}),
  images: {
    unoptimized: true,
  },
}

export default nextConfig
