const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const BASE_URL = "https://api.themoviedb.org/3";

interface TMDbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export async function searchMovies(query: string) {
	"use cache"
	if (!TMDB_API_KEY) {
		console.warn("TMDB_API_KEY is not set. Returning mock data.");
		return { results: [] }; // Fail gracefully for now
	}
	const res = await fetch(
		`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`,
	);
	if (!res.ok) {
		throw new Error("Failed to fetch from TMDB");
	}
	return res.json();
}

export async function getMovieDetails(id: number) {
	"use cache"
	if (!TMDB_API_KEY) return null;
	const res = await fetch(
		`${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=watch/providers,credits`,
	);
	return res.json();
}

export async function getMovieTrailers(imdbId: string): Promise<TMDbVideo[]> {
  if (!TMDB_READ_ACCESS_TOKEN) {
    console.warn("TMDB_READ_ACCESS_TOKEN is not set.");
    return [];
  }

  try {
    // Create an AbortController with 10-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // First, get TMDb ID from IMDb ID
      const findUrl = `${BASE_URL}/find/${imdbId}?external_source=imdb_id`;
      const findResponse = await fetch(findUrl, {
        headers: {
          Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      if (!findResponse.ok) {
        console.error("TMDb Find API Error:", findResponse.status);
        return [];
      }

      const findData = await findResponse.json();
      const movieResults = findData.movie_results || [];
      
      if (movieResults.length === 0) {
        console.warn("No TMDb movie found for IMDb ID:", imdbId);
        return [];
      }

      const tmdbId = movieResults[0].id;

      // Get videos for this movie
      const videosUrl = `${BASE_URL}/movie/${tmdbId}/videos`;
      const videosResponse = await fetch(videosUrl, {
        headers: {
          Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      if (!videosResponse.ok) {
        console.error("TMDb Videos API Error:", videosResponse.status);
        return [];
      }

      const videosData = await videosResponse.json();
      const videos: TMDbVideo[] = videosData.results || [];

      // Filter for YouTube trailers and teasers, prioritize official
      return videos
        .filter(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))
        .sort((a, b) => {
          // Official trailers first
          if (a.official && !b.official) return -1;
          if (!a.official && b.official) return 1;
          // Then trailers before teasers
          if (a.type === "Trailer" && b.type === "Teaser") return -1;
          if (a.type === "Teaser" && b.type === "Trailer") return 1;
          return 0;
        });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("TMDb request timeout: Request took too long");
    } else {
      console.error("Error fetching TMDb data:", error);
    }
    return [];
  }
}
