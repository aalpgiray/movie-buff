import { NextResponse } from "next/server";
import { getSimilarMoviesFromTMDB } from "@/lib/tmdb";
import { searchMovies } from "@/lib/omdb";
import type { RatedMovie, Movie } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ratedMovies: RatedMovie[] = body.ratedMovies || [];
    const dismissedIds: string[] = body.dismissedIds || [];
    const watchlistIds: string[] = body.watchlistIds || [];

    if (ratedMovies.length < 3) {
      return NextResponse.json(
        { error: "Need at least 3 rated movies for recommendations" },
        { status: 400 }
      );
    }

    // Build exclusion set: rated + dismissed + already in watchlist
    const excludeIds = new Set([
      ...ratedMovies.map((m) => m.imdbID),
      ...dismissedIds,
      ...watchlistIds,
    ]);

    // Get top-rated movies (8+) to base recommendations on
    const topRated = ratedMovies
      .filter((m) => m.rating >= 8)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    // If no highly-rated movies, use top 3 by rating
    const seedMovies = topRated.length > 0 
      ? topRated 
      : ratedMovies.sort((a, b) => b.rating - a.rating).slice(0, 3);

    // Fetch similar movies from TMDB for each seed movie
    const similarPromises = seedMovies.map(async (seed) => {
      const similar = await getSimilarMoviesFromTMDB(seed.imdbID);
      return similar.map((s) => ({
        ...s,
        reason: `Similar to "${seed.Title}" which you rated ${seed.rating}/10`,
        seedRating: seed.rating,
      }));
    });

    const allSimilar = (await Promise.all(similarPromises)).flat();

    // Filter out excluded movies
    const filtered = allSimilar.filter((m) => !excludeIds.has(m.imdbId));

    // Remove duplicates, keeping the one from the highest-rated seed
    const uniqueMap = new Map<string, typeof filtered[0]>();
    for (const movie of filtered) {
      const existing = uniqueMap.get(movie.imdbId);
      if (!existing || movie.seedRating > existing.seedRating) {
        uniqueMap.set(movie.imdbId, movie);
      }
    }
    const unique = Array.from(uniqueMap.values());

    // Shuffle to add variety
    const shuffled = unique.sort(() => Math.random() - 0.5);

    // Convert to Movie format by fetching from OMDB
    const moviePromises = shuffled.slice(0, 15).map(async (rec) => {
      // Try searching by IMDB ID first for exact match
      const searchResult = await searchMovies(rec.title);
      if (searchResult.Search && searchResult.Search.length > 0) {
        // Find exact match by imdbId or title
        const exactMatch = searchResult.Search.find(
          (m) => m.imdbID === rec.imdbId || m.Title.toLowerCase() === rec.title.toLowerCase()
        );
        const movie = exactMatch || searchResult.Search[0];
        return {
          ...movie,
          reason: rec.reason,
          isRecommendation: true,
        } as Movie;
      }
      return null;
    });

    const results = await Promise.all(moviePromises);
    const movies = results.filter((m): m is Movie => m !== null);

    // Final filter to ensure no excluded movies slipped through
    const finalMovies = movies.filter((m) => !excludeIds.has(m.imdbID));

    // Remove any final duplicates
    const uniqueMovies = finalMovies.filter(
      (movie, index, self) =>
        index === self.findIndex((m) => m.imdbID === movie.imdbID)
    );

    return NextResponse.json({ movies: uniqueMovies.slice(0, 10) });
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
