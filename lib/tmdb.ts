const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const BASE_URL = "https://api.themoviedb.org/3";

const CACHE_OPTS: RequestInit = { next: { revalidate: 3600 } };

interface TMDbVideo {
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
