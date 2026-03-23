import { NextResponse } from "next/server";
import { searchMovies } from "@/lib/omdb";
import { getSearchQueriesFromMood } from "@/lib/ai";
import type { Movie, MovieRecommendation } from "@/lib/types";

interface RequestBody {
	query: string;
	seenMovies?: Array<string | { title?: string }>;
	seenMovieIds?: string[];
}

/**
 * POST /api/search
 * 
 * Search for movies based on a query or mood.
 * 
 * This endpoint implements a two-tier search strategy:
 * 1. Direct search: Attempts to find exact matches in OMDB
 * 2. AI-powered fallback: Uses AI to generate mood-based search terms if direct search yields fewer than 3 results
 * 
 * @param req - Request containing { query, seenMovies?, seenMovieIds? }
 * @returns Object with { terms: string[], movies: Movie[] } containing search results
 */
export async function POST(req: Request) {
	try {
		const { query, seenMovies, seenMovieIds: seenMoviesIds } = (await req.json()) as RequestBody;
		if (!query) {
			return NextResponse.json({ error: "Query is required" }, { status: 400 });
		}

		// Extract titles from seenMovies (handle both string and object formats)
		const seenTitles =
			seenMovies?.map((movie: string | { title?: string }) =>
				typeof movie === "string" ? movie : movie.title || "",
			).filter(Boolean) || [];

		// First, try direct OMDB search to see if we get good results
		let directMovies: Array<Movie & { reason: string }> = [];
		try {
			const omdbResult = await searchMovies(query);
			if (omdbResult.Search && omdbResult.Search.length > 0) {
				// If we get 3+ good matches, this is likely a direct movie search
				// Filter out already seen movies
				const unseen = omdbResult.Search.filter(
					(m: Movie) => !seenMoviesIds?.includes(m.imdbID)
				);
				
				if (unseen.length >= 3) {
					// Return these results directly without calling AI
					return NextResponse.json({
						terms: [query],
						movies: unseen.slice(0, 10).map((m: Movie) => ({
							...m,
							reason: "Direct search result"
						})),
					});
				} else if (unseen.length > 0) {
					// Store these for later but still call AI for more recommendations
					directMovies = unseen.map((m: Movie) => ({
						...m,
						reason: "Direct search result"
					}));
				}
			}
		} catch (error) {
			console.error("Error in direct OMDB search:", error);
		}

		// If we didn't get enough direct matches, use AI for mood-based recommendations
		const movieRecommendations = await getSearchQueriesFromMood(
			query,
			seenTitles,
		);

		if (!Array.isArray(movieRecommendations) || movieRecommendations.length === 0) {
			console.error("Expected array from AI but got:", movieRecommendations);
			return NextResponse.json({
				terms: [],
				movies: directMovies.length > 0 ? directMovies : [],
			});
		}

		// Search OMDb for each recommendation in parallel
		const moviePromises = movieRecommendations.map(async (rec: MovieRecommendation) => {
			const title = rec.title;
			try {
				const data = await searchMovies(title);

				if (data.Search && data.Search.length > 0) {
					const exactMatch = data.Search.find(
						(m: Movie) => m.Title.toLowerCase() === title.toLowerCase(),
					);
					const movie = exactMatch || data.Search[0];
					return { ...movie, reason: rec.reason };
				}
				return null;
			} catch (error) {
				console.error(`Error searching for title: ${title}`, error);
				return null;
			}
		});

		const searchResults = await Promise.allSettled(moviePromises);
		let allMovies: Array<Movie & { reason: string }> = searchResults
			.filter((r): r is PromiseFulfilledResult<Movie & { reason: string }> => r.status === 'fulfilled')
			.map(r => r.value);

		// Filter out movies already seen
		allMovies = allMovies.filter(
			(movie: Movie) => !seenMoviesIds?.includes(movie.imdbID),
		);

		// If we have direct movie matches from OMDB, add them at the beginning
		if (directMovies.length > 0) {
			// Remove duplicates from allMovies if they exist
			const directIds = directMovies.map((m: Movie) => m.imdbID);
			allMovies = allMovies.filter((m: Movie) => !directIds.includes(m.imdbID));
			// Add direct matches at the beginning
			allMovies = [...directMovies, ...allMovies];
		}

		// Return up to 20 movies
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
