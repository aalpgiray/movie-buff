import { NextResponse } from "next/server";
import { searchMovies } from "@/lib/omdb";
import { detectMovieName, getSearchQueriesFromMood } from "@/lib/openai";

export async function POST(req: Request) {
	try {
		const { query, seenMovies, seenMovieIds: seenMoviesIds } = await req.json();
		if (!query) {
			return NextResponse.json({ error: "Query is required" }, { status: 400 });
		}

		// Extract titles from seenMovies (handle both string and object formats)
		const seenTitles =
			seenMovies?.map((movie: any) =>
				typeof movie === "string" ? movie : movie.title || movie,
			) || [];

		// First, try direct OMDB search to see if we get good results
		let directMovies: any[] = [];
		try {
			const omdbResult = await searchMovies(query);
			if (omdbResult.Search && omdbResult.Search.length > 0) {
				// If we get 3+ good matches, this is likely a direct movie search
				// Filter out already seen movies
				const unseen = omdbResult.Search.filter(
					(m: any) => !seenMoviesIds?.includes(m.imdbID)
				);
				
				if (unseen.length >= 3) {
					// Return these results directly without calling AI
					return NextResponse.json({
						terms: [query],
						movies: unseen.slice(0, 10).map((m: any) => ({
							...m,
							reason: "Direct search result"
						})),
					});
				} else if (unseen.length > 0) {
					// Store these for later but still call AI for more recommendations
					directMovies = unseen.map((m: any) => ({
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

		if (!Array.isArray(movieRecommendations)) {
			console.error("Expected array from AI but got:", movieRecommendations);
			return NextResponse.json({
				terms: [],
				movies: directMovies.length > 0 ? directMovies : [],
			});
		}

		// Search OMDb for each recommendation
		const moviePromises = movieRecommendations.map(async (rec: any) => {
			const title = rec.title;
			try {
				const data = await searchMovies(title);

				if (data.Search && data.Search.length > 0) {
					const exactMatch = data.Search.find(
						(m: any) => m.Title.toLowerCase() === title.toLowerCase(),
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

		const searchResults = await Promise.all(moviePromises);
		let allMovies = searchResults.filter((m) => m !== null);

		// Filter out movies already seen
		allMovies = allMovies.filter(
			(movie: any) => !seenMoviesIds?.includes(movie.imdbID),
		);

		// If we have direct movie matches from OMDB, add them at the beginning
		if (directMovies.length > 0) {
			// Remove duplicates from allMovies if they exist
			const directIds = directMovies.map((m: any) => m.imdbID);
			allMovies = allMovies.filter((m: any) => !directIds.includes(m.imdbID));
			// Add direct matches at the beginning
			allMovies = [...directMovies, ...allMovies];
		}

		return NextResponse.json({
			terms: movieRecommendations.map((r: any) => r.title),
			movies: allMovies,
		});
	} catch (error) {
		console.error("Search error:", error);
		return NextResponse.json(
			{ error: "Failed to process search" },
			{ status: 500 },
		);
	}
}
