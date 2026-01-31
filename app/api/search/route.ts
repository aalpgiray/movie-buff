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

		// Check if this is a direct movie name search
		const detectedMovieName = await detectMovieName(query);

		let directMovie = null;
		if (detectedMovieName) {
			// Search for the specific movie
			try {
				const movieData = await searchMovies(detectedMovieName);
				if (movieData.Search && movieData.Search.length > 0) {
					directMovie = {
						...movieData.Search[0],
						reason: "Direct search result",
					};
				}
			} catch (error) {
				console.error("Error searching for direct movie:", error);
			}
		}

		// Get mood-based recommendations
		const movieRecommendations = await getSearchQueriesFromMood(
			query,
			seenTitles,
		);

		if (!Array.isArray(movieRecommendations)) {
			console.error("Expected array from AI but got:", movieRecommendations);
			return NextResponse.json({
				terms: [],
				movies: directMovie ? [directMovie] : [],
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

		// If we have a direct movie match, put it first (unless already seen)
		if (directMovie && !seenMoviesIds?.includes(directMovie.imdbID)) {
			// Remove from allMovies if it exists there
			allMovies = allMovies.filter((m: any) => m.imdbID !== directMovie.imdbID);
			// Add at the beginning
			allMovies.unshift(directMovie);
		}

		console.log("[v0] Movies being returned:", allMovies.map(m => ({ title: m.Title, poster: m.Poster })));
		
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
