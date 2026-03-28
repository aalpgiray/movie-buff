import type { OmdbSearchResponse, MovieDetails, Movie } from "@/lib/types";
import { searchMovies as searchTMDB, tmdbToOmdbFormat, type TMDBMovie } from "@/lib/tmdb";

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const BASE_URL = "https://www.omdbapi.com/";

const FETCH_OPTS: RequestInit = { next: { revalidate: 3600 } };

export async function searchMovies(query: string): Promise<OmdbSearchResponse> {
	if (!OMDB_API_KEY) {
		console.warn("OMDB_API_KEY is not set. Falling back to TMDB.");
		return searchMoviesWithTMDBFallback(query);
	}
	const url = `${BASE_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&type=movie`;
	const res = await fetch(url, FETCH_OPTS);
	if (!res.ok) {
		throw new Error(`Failed to fetch from OMDb: ${res.status} ${res.statusText}`);
	}
	const data: OmdbSearchResponse = await res.json();
	
	// If OMDB returns no results, try TMDB as fallback
	if (data.Response === "False" || !data.Search || data.Search.length === 0) {
		console.log("OMDB returned no results, trying TMDB fallback for:", query);
		return searchMoviesWithTMDBFallback(query);
	}
	
	return data;
}

// Fallback to TMDB when OMDB fails or returns no results
async function searchMoviesWithTMDBFallback(query: string): Promise<OmdbSearchResponse> {
	try {
		const tmdbData = await searchTMDB(query);
		if (tmdbData.results && tmdbData.results.length > 0) {
			const movies: Movie[] = tmdbData.results.slice(0, 10).map((m: TMDBMovie) => tmdbToOmdbFormat(m));
			return { Search: movies, Response: "True" };
		}
	} catch (error) {
		console.error("TMDB fallback also failed:", error);
	}
	return { Search: [], Response: "False" };
}

export async function getMovieDetails(imdbID: string): Promise<MovieDetails | null> {
	if (!OMDB_API_KEY) return null;
	const res = await fetch(
		`${BASE_URL}?apikey=${OMDB_API_KEY}&i=${imdbID}&plot=full`,
		FETCH_OPTS,
	);
	const data: MovieDetails = await res.json();
	return data;
}
