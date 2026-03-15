# Tech Stack

## Framework & Runtime
- **Next.js 16** (App Router) with React 19
- **TypeScript 5** — strict mode enabled
- **pnpm** as the package manager

## Styling
- **Tailwind CSS v4** with `@tailwindcss/postcss`
- **shadcn/ui** component primitives (Radix UI under the hood)
- **class-variance-authority** + **clsx** + **tailwind-merge** for conditional classes
- **framer-motion** for animations
- **lucide-react** for icons

## AI / External APIs
- **OpenAI** (`openai` SDK) — mood-to-movie query generation
- **Google Gemini** (`@google/generative-ai`) — available but secondary
- **OMDb API** — movie search and detail metadata
- **TMDb API** — posters, trailers (YouTube), and watch providers
- **Streaming Availability API** (RapidAPI) — per-country streaming info

## Client Storage
- **IndexedDB** (via custom wrapper in `lib/movie-db.ts`) — persists movies, seen list, and watchlist locally; no auth or backend DB

## Environment Variables
Stored in `.env.local` (pulled from Vercel via `vercel env pull`):
- `OMDB_API_KEY`
- `TMDB_API_KEY`
- `TMDB_READ_ACCESS_TOKEN`
- `STREAMING_AVAILABILITY_API_KEY`
- `OPENAI_API_KEY`

## Common Commands
```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
vercel env pull .env.local --yes --token $VERCEL_TOKEN  # Sync env vars from Vercel
```

## Next.js Config Notes
- `cacheComponents: true` enabled
- Remote image patterns allowed: `m.media-amazon.com`, `image.tmdb.org`
- API routes use `next: { revalidate: 3600 }` for 1-hour ISR caching
- `"use cache"` directive used in some server functions (Next.js 15+ cache API)
