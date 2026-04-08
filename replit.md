# MovieBuff

A movie discovery and management web app. Search for movies, view details, watch trailers, check streaming availability, and manage personal Watchlist/Watched collections. AI-powered similar movie recommendations.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with TypeScript
- **Styling:** Tailwind CSS 4 + Framer Motion
- **UI:** Radix UI, Lucide React icons
- **AI:** Google Gemini (`@google/generative-ai`) for similar movie recommendations
- **Data:** OMDb API (metadata), TMDb API (posters + trailers), Streaming Availability API

## Required Environment Variables

- `OMDB_API_KEY` — OMDb API key for movie metadata
- `TMDB_API_KEY` — TMDb API key (legacy, used by `searchMovies` and `getMovieDetails`)
- `TMDB_READ_ACCESS_TOKEN` — TMDb v4 bearer token (used by `getTMDbPoster` and `getMovieTrailers`)
- `STREAMING_AVAILABILITY_API_KEY` — Streaming Availability API key
- `GEMINI_API_KEY` or `OPENAI_API_KEY` — for AI-generated similar movies

## Key Files

- `app/movie/[id]/page.tsx` — Movie details page
- `components/MovieContent.tsx` — Orchestrates all movie detail sections (Suspense boundaries)
- `components/MovieDetail.tsx` — Hero section with poster, title, metadata, actions
- `components/TrailerSection.tsx` — Server component: fetches all trailers via TMDb, renders gallery
- `components/TrailerGallery.tsx` — Client component: featured player + scrollable thumbnail strip
- `components/SimilarMoviesSection.tsx` — AI-generated recommendations
- `components/StreamingInfo.tsx` — Streaming platform availability
- `lib/tmdb.ts` — TMDb API utilities (`getMovieTrailers`, `getTMDbPoster`, `TMDbVideo` type)
- `lib/omdb.ts` — OMDb API utilities

## Trailer Feature

The trailer section on movie details pages shows a **Trailer Gallery**:
- Featured embedded YouTube player (16:9 aspect ratio)
- Scrollable horizontal strip of thumbnail cards with real YouTube thumbnails
- Active/selected state with red glow border
- Click any thumbnail to switch the main player
- Gracefully hidden when no trailers are available or TMDb token is not set

Trailers are fetched via TMDb's `/find/{imdbId}` + `/movie/{tmdbId}/videos` endpoints. Only YouTube trailers and teasers are shown, sorted with official trailers first.
