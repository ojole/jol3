# JOL3.COM — Retro Desktop Portfolio

A retro desktop OS-inspired portfolio website built with Next.js, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand (for window management)
- **Font:** System fonts with monospace fallbacks

## Project Structure

```
jol3/
├── app/                  # Next.js app directory
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles & design tokens
├── components/
│   ├── desktop/         # Desktop shell & icons
│   │   ├── DesktopShell.tsx
│   │   ├── TopBar.tsx
│   │   ├── IconRail.tsx
│   │   └── DesktopIcon.tsx
│   ├── window/          # Window system
│   │   ├── WindowManager.tsx
│   │   ├── WindowFrame.tsx
│   │   └── windows/     # Content windows
│   └── ui/              # Reusable UI components
├── data/                # Content & configuration
│   ├── desktopItems.ts  # Desktop icon definitions
│   └── windowContent.ts # Window content data
├── lib/                 # Utilities & types
│   ├── types.ts         # TypeScript definitions
│   └── windowStore.ts   # Zustand state management
└── public/              # Static assets
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Features

### Desktop Interface
- Retro OS-inspired design with warm beige/paper aesthetic
- Left and right icon rails for navigation
- Subtle scanline and texture effects
- Professional, recruiter-friendly layout

### Window System
- Click icons to open content windows
- Multiple windows can be open simultaneously
- Z-index management for window focus
- Close and maximize buttons
- Escape key closes active window

### Accessibility
- Keyboard navigation support (Tab + Enter)
- Focus states on all interactive elements
- Semantic HTML structure
- ARIA labels for icons

### Content Windows
- **About:** Professional summary
- **Resume:** Full resume with download option
- **Projects:** Portfolio showcasing key projects
- **Contact:** Contact information and links
- **Timeline:** Career chronology
- **Additional:** Why-Jole, Changelog, Demo, Work-With-Me

## Design Tokens

```css
--color-paper-bg: #f4f1e8      /* Main background */
--color-accent-primary: #c85a3d /* Primary CTA color */
--color-window-bg: #ffffff      /* Window background */
--color-text-primary: #2a2520   /* Main text */
```

## Customization

To update content:
1. Edit `/data/windowContent.ts` for text content
2. Edit `/data/desktopItems.ts` for icon configuration
3. Edit `/app/globals.css` for design tokens

## License

Private portfolio project © 2024 Jole Barron
