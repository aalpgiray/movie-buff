# Project Structure

```
app/                        # Next.js App Router
  api/
    search/route.ts         # POST — mood/title search, calls OpenAI + OMDb
    movie/[id]/route.ts     # GET  — movie details + streaming availability
  movie/[id]/page.tsx       # Movie detail page (SSR)
  watched/page.tsx          # Watched list page (client)
  watchlist/page.tsx        # Watchlist page (client)
  page.tsx                  # Home page — search + default feed (client)
  layout.tsx                # Root layout, theme flash prevention, PWA meta
  globals.css               # Global Tailwind styles

components/                 # React components
  ui/                       # shadcn/ui primitives (button, card, badge, etc.)
  Header.tsx                # Fixed nav with watchlist/watched counts + theme toggle
  HeaderWrapper.tsx         # Client wrapper for Header (used in server layouts)
  MovieCard.tsx             # Grid card with hover actions (seen/watchlist toggle)
  MovieDetail.tsx           # Full detail view (metadata, trailer, streaming)
  MovieDetailModal.tsx      # Modal wrapper for MovieDetail
  MovieDetailActions.tsx    # Seen/watchlist action buttons on detail view
  MovieDetailSkeleton.tsx   # Loading skeleton for detail view
  MovieContent.tsx          # Inner content layout for movie detail
  SearchBar.tsx             # Controlled search input with clear/loading state
  SimilarMoviesSection.tsx  # AI-generated similar movie suggestions
  SimilarMoviesList.tsx     # List renderer for similar movies
  StreamingInfo.tsx         # Per-country streaming options display
  AvailabilityMatrix.tsx    # Country × service availability grid
  TrailerSection.tsx        # Trailer embed section
  TrailerPlayer.tsx         # YouTube iframe player
  ThemeProvider.tsx         # Context + localStorage theme management

lib/                        # Shared utilities and API clients
  types.ts                  # Shared TypeScript interfaces (Movie, MovieDetails, etc.)
  movie-db.ts               # IndexedDB wrapper — upsert, getAll, lists, buildDefaultList
  omdb.ts                   # OMDb API client (search + detail)
  tmdb.ts                   # TMDb API client (search, posters, trailers)
  streaming.ts              # RapidAPI streaming availability client
  openai.ts                 # OpenAI client — mood → movie recommendations
  gemini.ts                 # Gemini client (secondary AI)
  utils.ts                  # cn() helper (clsx + tailwind-merge)

public/                     # Static assets + PWA manifest
```

## Key Conventions

- `@/*` path alias maps to the project root — use it for all imports
- Pages that read from IndexedDB must be `"use client"` — IDB is browser-only
- API routes are thin orchestrators: validate input, call lib functions, return JSON
- External API calls in `lib/` use `next: { revalidate: 3600 }` on fetch for caching
- User state (seen, watchlist) lives entirely in IndexedDB — no server-side persistence
- Components in `components/ui/` are shadcn primitives — prefer extending over modifying
- Theme is managed via `ThemeProvider` + `localStorage`; a blocking inline script in `layout.tsx` prevents flash
