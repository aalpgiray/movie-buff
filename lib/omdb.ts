import type { OmdbSearchResponse, MovieDetails } from "@/lib/types";

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const BASE_URL = "http://www.omdbapi.com/";

export async function searchMovies(query: string): Promise<OmdbSearchResponse> {
	"use cache";
	if (!OMDB_API_KEY) {
		console.warn("OMDB_API_KEY is not set.");
		return { Search: [], Response: "False" };
	}
	// OMDb search is by 's' parameter
	const url = `${BASE_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&type=movie`;

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(
			`Failed to fetch from OMDb: ${res.status} ${res.statusText}`,
		);
	}
	const data: OmdbSearchResponse = await res.json();
	if (data.Error) {
		console.warn("OMDb API Error:", data.Error);
	}
	return data;
}

export async function getMovieDetails(imdbID: string): Promise<MovieDetails | null> {
	"use cache";
	if (!OMDB_API_KEY) return null;
	const res = await fetch(
		`${BASE_URL}?apikey=${OMDB_API_KEY}&i=${imdbID}&plot=full`,
	);
	const data: MovieDetails = await res.json();
	return data;
}
