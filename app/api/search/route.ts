import { NextResponse } from "next/server";
import { searchMovies } from "@/lib/omdb";
import { getSearchQueriesFromMood } from "@/lib/openai";

export async function POST(req: Request) {
	try {
		const { query, seenMovies, seenMovieIds: seenMoviesIds } = await req.json();
		if (!query) {
			return NextResponse.json({ error: "Query is required" }, { status: 400 });
		}

		// 1. Get movie recommendations from AI
		console.log("Processing query:", query);
		console.log("Seen context:", seenMovies?.length || 0, "movies");

		const movieRecommendations = await getSearchQueriesFromMood(
			query,
			seenMovies,
		);
		console.log(
			"AI Recommended Titles:",
			movieRecommendations.map((r: any) => r.title),
		);

		if (!Array.isArray(movieRecommendations)) {
			console.error("Expected array from AI but got:", movieRecommendations);
			return NextResponse.json({ terms: [], movies: [] });
		}

		// 2. Search OMDb for each title
		// We process all recommendations to ensure we have enough after filtering
		const moviePromises = movieRecommendations.map(async (rec: any) => {
			const title = rec.title;
			try {
				console.log("Searching OMDb for title:", title);
				// OMDb search by 's' returns a list, we want the best match
				const data = await searchMovies(title);

				if (data.Search && data.Search.length > 0) {
					// Find exact match or first result
					const exactMatch = data.Search.find(
						(m: any) => m.Title.toLowerCase() === title.toLowerCase(),
					);
					const movie = exactMatch || data.Search[0];
					// Attach the AI reasoning to the movie object
					return { ...movie, reason: rec.reason };
				}
				return null;
			} catch (e) {
				console.error("Error searching for title:", title, e);
				return null;
			}
		});

		const results = await Promise.all(moviePromises);

		// 3. Filter valid results and deduplicate
		const validMovies = results.filter((m) => m !== null);
		const uniqueMovies = Array.from(
			new Map(validMovies.map((m: any) => [m.imdbID, m])).values(),
		);

		// 4. Filter out seen movies by ID
		const seenIdsSet = new Set(seenMoviesIds || []);
		const filteredMovies = uniqueMovies.filter(
			(m: any) => !seenIdsSet.has(m.imdbID),
		);

		// 5. Return top 5
		const finalMovies = filteredMovies.slice(0, 5);

		return NextResponse.json({
			terms: movieRecommendations.map((r: any) => r.title),
			movies: finalMovies,
		});
	} catch (error) {
		console.error("Search API Error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
