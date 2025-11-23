const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export async function searchMovies(query: string) {
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
	if (!TMDB_API_KEY) return null;
	const res = await fetch(
		`${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=watch/providers,credits`,
	);
	return res.json();
}
