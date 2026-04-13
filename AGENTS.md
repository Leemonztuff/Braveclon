# Braveclon Agent Instructions

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build   # Production build
npm run lint    # Run ESLint
npm run clean   # Clear Next.js cache
```

## Required Setup

Create `.env.local` with:
```
GEMINI_API_KEY=your_key_here
```

Get API key from [Google AI Studio](https://ai.google.dev/).

## Quirks

- **Tailwind CSS v4** - Uses `@tailwindcss/postcss` 4.1.11 (different config than v3)
- **HMR disabled** - Set `DISABLE_HMR=true` to prevent flickering in AI Studio
- **No tests** - Project has no test suite
- **Strict TypeScript** - `strict: true` in tsconfig.json
- **Build ignores ESLint warnings** - `eslint.ignoreDuringBuilds: true` in next.config.ts

## Architecture

- Single-page Next.js app with screen components in `components/`
- Game state managed via `lib/gameState.ts` hook → persists to localStorage
- Screens: Home, Units, Summon, Quest, Battle, QRHunt, Fusion

## Entry Point

`app/page.tsx` → renders main game component