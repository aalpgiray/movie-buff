import { NextResponse } from "next/server";
import { getPopularMovies, getTopRatedMovies, getTrendingMovies, getMovieExternalIds } from "@/lib/tmdb";
import type { Movie } from "@/lib/types";

interface TMDbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
}

interface SeenMovieWithRating {
  id: string;
  rating?: number;
  title?: string;
  poster?: string;
  year?: string;
}

interface RequestBody {
  seenMovieIds?: string[];
  seenMoviesWithRatings?: SeenMovieWithRating[];
}

async function convertTMDbToMovie(tmdbMovie: TMDbMovie): Promise<Movie | null> {
  const externalIds = await getMovieExternalIds(tmdbMovie.id);
  if (!externalIds.imdb_id) return null;

  return {
    Title: tmdbMovie.title,
    Year: tmdbMovie.release_date ? tmdbMovie.release_date.split("-")[0] : "",
    imdbID: externalIds.imdb_id,
    Type: "movie",
    Poster: tmdbMovie.poster_path
      ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
      : "N/A",
    rating: tmdbMovie.vote_average,
  };
}

function interleaveMoviesWithRatings(
  unseenMovies: (Movie & { rating?: number })[],
  seenMoviesWithRatings: SeenMovieWithRating[]
): Movie[] {
  // Sort unseen movies by rating (descending)
  const sortedUnseen = [...unseenMovies].sort((a, b) => (b.rating || 0) - (a.rating || 0));

  // Get seen movies with their ratings, sorted by rating (descending)
  const seenWithDetails = seenMoviesWithRatings
    .filter((m) => m.rating !== undefined && m.rating > 0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 6); // Limit to top 6 seen movies

  if (seenWithDetails.length === 0) {
    return sortedUnseen;
  }

  // Convert seen movies to Movie format
  const seenAsMovies: Movie[] = seenWithDetails.map((seen) => ({
    Title: seen.title || "Unknown",
    Year: seen.year || "",
    imdbID: seen.id,
    Type: "movie",
    Poster: seen.poster || "N/A",
    rating: seen.rating,
    isSeen: true,
  }));

  // Interleave: place seen movies near unseen movies with similar ratings
  const result: Movie[] = [];
  let seenIndex = 0;

  for (let i = 0; i < sortedUnseen.length; i++) {
    const currentMovie = sortedUnseen[i];
    result.push(currentMovie);

    // After every 3-4 unseen movies, try to insert a seen movie with similar rating
    if ((i + 1) % 4 === 0 && seenIndex < seenAsMovies.length) {
      const seenMovie = seenAsMovies[seenIndex];
      // Only insert if the seen movie's rating is somewhat close to current batch
      const avgRatingInBatch =
        sortedUnseen.slice(Math.max(0, i - 3), i + 1).reduce((sum, m) => sum + (m.rating || 0), 0) / 4;

      if (seenMovie.rating && Math.abs(seenMovie.rating - avgRatingInBatch) <= 2) {
        result.push(seenMovie);
        seenIndex++;
      }
    }
  }

  // Add remaining seen movies at the end
  while (seenIndex < seenAsMovies.length) {
    result.push(seenAsMovies[seenIndex]);
    seenIndex++;
  }

  return result;
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { seenMovieIds = [], seenMoviesWithRatings = [] } = body;

    // Fetch popular, trending, and top-rated movies in parallel
    const [popularData, trendingData, topRatedData] = await Promise.all([
      getPopularMovies(),
      getTrendingMovies(),
      getTopRatedMovies(),
    ]);

    // Combine all movies, removing duplicates based on TMDb ID
    const allTmdbMovies = new Map<number, TMDbMovie>();

    // Prioritize trending, then popular, then top-rated
    [...trendingData.results, ...popularData.results, ...topRatedData.results].forEach((movie) => {
      if (!allTmdbMovies.has(movie.id)) {
        allTmdbMovies.set(movie.id, movie);
      }
    });

    // Convert to our Movie format with IMDb IDs
    const moviePromises = Array.from(allTmdbMovies.values())
      .slice(0, 30) // Limit to 30 to avoid too many API calls
      .map(convertTMDbToMovie);

    const movies = (await Promise.all(moviePromises)).filter(
      (m): m is Movie & { rating?: number } => m !== null
    );

    // Filter out already seen movies from the main list
    const unseenMovies = movies.filter((m) => !seenMovieIds.includes(m.imdbID));

    // Interleave seen movies with ratings if provided
    const finalMovies =
      seenMoviesWithRatings.length > 0
        ? interleaveMoviesWithRatings(unseenMovies, seenMoviesWithRatings)
        : unseenMovies;

    return NextResponse.json({
      movies: finalMovies,
      category: "Discover",
    });
  } catch (error) {
    console.error("Discover API error:", error);
    return NextResponse.json({ error: "Failed to fetch discover movies" }, { status: 500 });
  }
}
