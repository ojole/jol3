import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'crt-green': '#00ff41',
        'crt-bg': '#0a0e0a',
        'crt-text': '#c5f5c5',
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      },
      animation: {
        'flicker': 'flicker 0.15s infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.97' },
        }
      }
    },
  },
  plugins: [],
}

export default config
