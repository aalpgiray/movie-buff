# MovieBuff

A mood-based movie discovery app. Users describe a feeling, genre, or vibe and the app returns AI-curated film recommendations. Users can track what they've watched and maintain a watchlist.

## Core Features
- Natural language / mood-based movie search powered by OpenAI
- Direct title search via OMDb as a fallback
- Movie detail pages with full metadata, trailers (TMDb), and streaming availability (RapidAPI)
- Watched list and watchlist — persisted client-side in IndexedDB
- Default home feed built from the user's local search history, sorted by rating with seen/unseen interleaving
- Dark/light/auto theme with no flash on load (blocking inline script)
- PWA-ready (manifest, apple-web-app meta)
