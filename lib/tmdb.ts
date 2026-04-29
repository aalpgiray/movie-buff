const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const BASE_URL = "https://api.themoviedb.org/3";

const CACHE_OPTS: RequestInit = { next: { revalidate: 3600 } };

export interface TMDbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

function bearerHeaders() {
  return {
    Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function searchMovies(query: string) {
  if (!TMDB_API_KEY) {
    console.warn("TMDB_API_KEY is not set. Returning mock data.");
    return { results: [] };
  }
  const res = await fetch(
    `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`,
    CACHE_OPTS,
  );
  if (!res.ok) throw new Error("Failed to fetch from TMDB");
  return res.json();
}

export async function getMovieDetails(id: number) {
  if (!TMDB_API_KEY) return null;
  const res = await fetch(
    `${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=watch/providers,credits`,
    CACHE_OPTS,
  );
  return res.json();
}

export async function getTMDbPoster(imdbId: string): Promise<string | null> {
  if (!TMDB_READ_ACCESS_TOKEN) return null;
  try {
    const res = await fetch(
      `${BASE_URL}/find/${imdbId}?external_source=imdb_id`,
      { headers: bearerHeaders(), ...CACHE_OPTS },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const movie = (data.movie_results || [])[0];
    if (!movie?.poster_path) return null;
    return `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  } catch {
    return null;
  }
}

/**
 * Get similar movies from TMDB based on an IMDB ID.
 * Returns movies similar to the given movie.
 */
export async function getSimilarMoviesFromTMDB(imdbId: string): Promise<{ imdbId: string; title: string; year: string; poster: string | null }[]> {
  if (!TMDB_READ_ACCESS_TOKEN) {
    console.warn("TMDB_READ_ACCESS_TOKEN is not set.");
    return [];
  }

  try {
    // First, find the TMDB ID from IMDB ID
    const findRes = await fetch(
      `${BASE_URL}/find/${imdbId}?external_source=imdb_id`,
      { headers: bearerHeaders(), ...CACHE_OPTS },
    );
    if (!findRes.ok) return [];
    
    const findData = await findRes.json();
    const movieResults = findData.movie_results || [];
    if (movieResults.length === 0) return [];

    const tmdbId = movieResults[0].id;

    // Get similar movies
    const similarRes = await fetch(
      `${BASE_URL}/movie/${tmdbId}/similar`,
      { headers: bearerHeaders(), ...CACHE_OPTS },
    );
    if (!similarRes.ok) return [];

    const similarData = await similarRes.json();
    const results = similarData.results || [];

    // For each similar movie, we need to get its IMDB ID
    const moviesWithIds = await Promise.all(
      results.slice(0, 8).map(async (movie: { id: number; title: string; release_date?: string; poster_path?: string }) => {
        try {
          const detailsRes = await fetch(
            `${BASE_URL}/movie/${movie.id}/external_ids`,
            { headers: bearerHeaders(), ...CACHE_OPTS },
          );
          if (!detailsRes.ok) return null;
          const details = await detailsRes.json();
          if (!details.imdb_id) return null;
          
          return {
            imdbId: details.imdb_id,
            title: movie.title,
            year: movie.release_date?.slice(0, 4) || "",
            poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          };
        } catch {
          return null;
        }
      })
    );

    return moviesWithIds.filter((m): m is NonNullable<typeof m> => m !== null);
  } catch (error) {
    console.error("Error fetching similar movies from TMDB:", error);
    return [];
  }
}

export async function getMovieTrailers(imdbId: string): Promise<TMDbVideo[]> {
  if (!TMDB_READ_ACCESS_TOKEN) {
    console.warn("TMDB_READ_ACCESS_TOKEN is not set.");
    return [];
  }

  try {
    const findRes = await fetch(
      `${BASE_URL}/find/${imdbId}?external_source=imdb_id`,
      { headers: bearerHeaders(), ...CACHE_OPTS },
    );
    if (!findRes.ok) {
      console.error("TMDb Find API Error:", findRes.status);
      return [];
    }
    const findData = await findRes.json();
    const movieResults = findData.movie_results || [];
    if (movieResults.length === 0) {
      console.warn("No TMDb movie found for IMDb ID:", imdbId);
      return [];
    }

    const tmdbId = movieResults[0].id;
    const videosRes = await fetch(
      `${BASE_URL}/movie/${tmdbId}/videos`,
      { headers: bearerHeaders(), ...CACHE_OPTS },
    );
    if (!videosRes.ok) {
      console.error("TMDb Videos API Error:", videosRes.status);
      return [];
    }

    const videosData = await videosRes.json();
    const videos: TMDbVideo[] = videosData.results || [];

    return videos
      .filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))
      .sort((a, b) => {
        if (a.official && !b.official) return -1;
        if (!a.official && b.official) return 1;
        if (a.type === "Trailer" && b.type === "Teaser") return -1;
        if (a.type === "Teaser" && b.type === "Trailer") return 1;
        return 0;
      });
  } catch (error) {
    console.error("Error fetching TMDb data:", error);
    return [];
  }
}
