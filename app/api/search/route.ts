import { NextResponse } from "next/server";
import { searchMovies } from "@/lib/omdb";
import { getSearchQueriesFromMood } from "@/lib/ai";
import type { Movie, MovieRecommendation } from "@/lib/types";

interface RequestBody {
	query: string;
	seenMovies?: Array<string | { title?: string }>;
	seenMovieIds?: string[];
}

async function fetchMovieForTitle(
	title: string,
	reason: string,
): Promise<(Movie & { reason: string }) | null> {
	try {
		const data = await searchMovies(title);

		if (data.Search && data.Search.length > 0) {
			// Prefer exact title match (case-insensitive), fall back to first result
			const titleLower = title.toLowerCase();
			const exactMatch = data.Search.find(
				(m: Movie) => m.Title.toLowerCase() === titleLower,
			);
			// Also try starts-with match if no exact match
			const startsWithMatch =
				exactMatch ||
				data.Search.find((m: Movie) =>
					m.Title.toLowerCase().startsWith(titleLower),
				);
			const movie = startsWithMatch || data.Search[0];
			return { ...movie, reason };
		}

		// If not found, try a shorter version of the title (drop articles like "The", "A")
		const stripped = title.replace(/^(the|a|an)\s+/i, "").trim();
		if (stripped !== title) {
			const retry = await searchMovies(stripped);
			if (retry.Search && retry.Search.length > 0) {
				return { ...retry.Search[0], reason };
			}
		}

		return null;
	} catch (error) {
		console.error(`Error searching OMDb for "${title}":`, error);
		return null;
	}
}

export async function POST(req: Request) {
	try {
		const { query, seenMovies, seenMovieIds: seenMoviesIds } =
			(await req.json()) as RequestBody;

		if (!query) {
			return NextResponse.json({ error: "Query is required" }, { status: 400 });
		}

		// Extract titles from seenMovies (handle both string and object formats)
		const seenTitles =
			seenMovies
				?.map((movie: string | { title?: string }) =>
					typeof movie === "string" ? movie : movie.title || "",
				)
				.filter(Boolean) || [];

		// First, try direct OMDb search to see if we get good results
		let directMovies: Array<Movie & { reason: string }> = [];
		try {
			const omdbResult = await searchMovies(query);
			if (omdbResult.Search && omdbResult.Search.length > 0) {
				const unseen = omdbResult.Search.filter(
					(m: Movie) => m?.imdbID && !seenMoviesIds?.includes(m.imdbID),
				);

				if (unseen.length >= 3) {
					// Good direct match — return immediately without calling AI
					return NextResponse.json({
						terms: [query],
						movies: unseen.slice(0, 10).map((m: Movie) => ({
							...m,
							reason: "Direct search result",
						})),
					});
				} else if (unseen.length > 0) {
					directMovies = unseen.map((m: Movie) => ({
						...m,
						reason: "Direct search result",
					}));
				}
			}
		} catch (error) {
			console.error("Error in direct OMDb search:", error);
		}

		// Use AI for mood-based recommendations
		const movieRecommendations = await getSearchQueriesFromMood(query, seenTitles);

		if (!Array.isArray(movieRecommendations) || movieRecommendations.length === 0) {
			console.error("Expected array from AI but got:", movieRecommendations);
			return NextResponse.json({
				terms: [],
				movies: directMovies,
			});
		}

		// Search OMDb for each recommendation in parallel
		const moviePromises = movieRecommendations.map((rec: MovieRecommendation) =>
			fetchMovieForTitle(rec.title, rec.reason),
		);

		const searchResults = await Promise.allSettled(moviePromises);

		let allMovies: Array<Movie & { reason: string }> = searchResults
			.filter(
				(r): r is PromiseFulfilledResult<Movie & { reason: string }> =>
					r.status === "fulfilled" && r.value !== null,
			)
			.map((r) => r.value as Movie & { reason: string });

		// Filter out movies already seen
		allMovies = allMovies.filter(
			(movie) => movie?.imdbID && !seenMoviesIds?.includes(movie.imdbID),
		);

		// Merge direct matches, deduplicating by imdbID
		if (directMovies.length > 0) {
			const directIds = new Set(directMovies.map((m) => m.imdbID));
			allMovies = allMovies.filter((m) => !directIds.has(m.imdbID));
			allMovies = [...directMovies, ...allMovies];
		}

		// Deduplicate by imdbID in case AI returned overlapping titles
		const seen = new Set<string>();
		allMovies = allMovies.filter((m) => {
			if (!m?.imdbID || seen.has(m.imdbID)) return false;
			seen.add(m.imdbID);
			return true;
		});

		return NextResponse.json({
			terms: movieRecommendations.map((r: MovieRecommendation) => r.title),
			movies: allMovies.slice(0, 20),
		});
	} catch (error) {
		console.error("Search error:", error);
		return NextResponse.json(
			{ error: "Failed to process search" },
			{ status: 500 },
		);
	}
}
