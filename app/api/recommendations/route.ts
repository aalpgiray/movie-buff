import { NextResponse } from "next/server";
import { getPersonalizedRecommendations } from "@/lib/ai";
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

    // Get AI recommendations
    const aiRecommendations = await getPersonalizedRecommendations(ratedMovies);

    if (aiRecommendations.length === 0) {
      return NextResponse.json({ movies: [] });
    }

    // Build exclusion set: rated + dismissed + already in watchlist (non-recommendations)
    const excludeIds = new Set([
      ...ratedMovies.map((m) => m.imdbID),
      ...dismissedIds,
      ...watchlistIds,
    ]);

    // Search OMDB for each recommended movie
    const moviePromises = aiRecommendations.map(async (rec) => {
      const searchResult = await searchMovies(rec.title);
      if (searchResult.Search && searchResult.Search.length > 0) {
        // Find the best match (exact title match or first result)
        const exactMatch = searchResult.Search.find(
          (m) => m.Title.toLowerCase() === rec.title.toLowerCase()
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

    // Filter out excluded movies
    const filteredMovies = movies.filter((m) => !excludeIds.has(m.imdbID));

    // Remove duplicates by imdbID
    const uniqueMovies = filteredMovies.filter(
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
