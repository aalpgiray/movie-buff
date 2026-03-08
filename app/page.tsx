"use client";

import { useEffect, useState, useCallback } from "react";
import { MovieCard } from "@/components/MovieCard";
import { SearchBar } from "@/components/SearchBar";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Star } from "lucide-react";
import type { Movie } from "@/lib/types";

interface SeenMovieRating {
	id: string;
	rating: number;
	title?: string;
	poster?: string;
	year?: string;
}

export default function Home() {
	const [movies, setMovies] = useState<Movie[]>([]);
	const [discoverMovies, setDiscoverMovies] = useState<Movie[]>([]);
	const [loading, setLoading] = useState(false);
	const [discoverLoading, setDiscoverLoading] = useState(true);
	const [seenMovies, setSeenMovies] = useState<string[]>([]);
	const [seenMoviesRatings, setSeenMoviesRatings] = useState<SeenMovieRating[]>([]);
	const [watchlistMovies, setWatchlistMovies] = useState<string[]>([]);
	const [searchTerms, setSearchTerms] = useState<string[]>([]);
	const [currentQuery, setCurrentQuery] = useState("");
	const [hasSearched, setHasSearched] = useState(false);

	const fetchDiscoverMovies = useCallback(async (seenIds: string[], ratingsData: SeenMovieRating[]) => {
		setDiscoverLoading(true);
		try {
			const res = await fetch("/api/discover", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					seenMovieIds: seenIds,
					seenMoviesWithRatings: ratingsData,
				}),
			});
			const data = await res.json();
			if (data.movies) {
				setDiscoverMovies(data.movies);
			}
		} catch (error) {
			console.error("Failed to fetch discover movies:", error);
		} finally {
			setDiscoverLoading(false);
		}
	}, []);

	useEffect(() => {
		const stored = localStorage.getItem("seenMovies");
		const seenIds = stored ? JSON.parse(stored) : [];
		if (stored) setSeenMovies(seenIds);

		const watchlist = localStorage.getItem("watchlistMovies");
		if (watchlist) setWatchlistMovies(JSON.parse(watchlist));

		// Load seen movies with ratings
		const ratingsStored = localStorage.getItem("seenMoviesRatings");
		const ratingsData: SeenMovieRating[] = ratingsStored ? JSON.parse(ratingsStored) : [];
		setSeenMoviesRatings(ratingsData);

		const savedQuery = sessionStorage.getItem("lastQuery");
		const savedMovies = sessionStorage.getItem("lastMovies");
		const savedTerms = sessionStorage.getItem("lastTerms");
		if (savedQuery) { setCurrentQuery(savedQuery); setHasSearched(true); }
		if (savedMovies) setMovies(JSON.parse(savedMovies));
		if (savedTerms) setSearchTerms(JSON.parse(savedTerms));

		// Fetch discover movies on initial load
		fetchDiscoverMovies(seenIds, ratingsData);
	}, [fetchDiscoverMovies]);

	const toggleSeen = (id: string) => {
		const newSeen = seenMovies.includes(id)
			? seenMovies.filter((movieId) => movieId !== id)
			: [...seenMovies, id];
		setSeenMovies(newSeen);
		localStorage.setItem("seenMovies", JSON.stringify(newSeen));
		if (!seenMovies.includes(id)) {
			const movie = movies.find((m) => m.imdbID === id);
			if (movie) {
				const storedDetails = localStorage.getItem("seenMoviesDetails");
				const details = storedDetails ? JSON.parse(storedDetails) : {};
				details[id] = { title: movie.Title, poster: movie.Poster, year: movie.Year, type: movie.Type };
				localStorage.setItem("seenMoviesDetails", JSON.stringify(details));
			}
		}
	};

	const toggleWatchlist = (id: string) => {
		const newWatchlist = watchlistMovies.includes(id)
			? watchlistMovies.filter((movieId) => movieId !== id)
			: [...watchlistMovies, id];
		setWatchlistMovies(newWatchlist);
		localStorage.setItem("watchlistMovies", JSON.stringify(newWatchlist));
		if (!watchlistMovies.includes(id)) {
			const movie = movies.find((m) => m.imdbID === id);
			if (movie) {
				const storedDetails = localStorage.getItem("watchlistMoviesDetails");
				const details = storedDetails ? JSON.parse(storedDetails) : {};
				details[id] = { title: movie.Title, poster: movie.Poster, year: movie.Year, type: movie.Type };
				localStorage.setItem("watchlistMoviesDetails", JSON.stringify(details));
			}
		}
	};

	const handleSearch = async (query: string) => {
		setLoading(true);
		setMovies([]);
		setSearchTerms([]);
		setCurrentQuery(query);
		setHasSearched(true);

		try {
			const storedDetails = localStorage.getItem("seenMoviesDetails");
			const seenDetails = storedDetails ? JSON.parse(storedDetails) : {};
			const seenTitles = seenMovies.slice(-20).map((id) => seenDetails[id]).filter(Boolean);

			const res = await fetch("/api/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query, seenMovies: seenTitles, seenMovieIds: seenMovies }),
			});

			const data = await res.json();
			if (data.movies) {
				setMovies(data.movies);
				setSearchTerms(data.terms || []);
				sessionStorage.setItem("lastQuery", query);
				sessionStorage.setItem("lastMovies", JSON.stringify(data.movies));
				sessionStorage.setItem("lastTerms", JSON.stringify(data.terms || []));
			}
		} catch (error) {
			console.error("Search failed:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleLoadMore = async () => {
		if (loading) return;
		setLoading(true);
		try {
			const currentIds = movies.map((m) => m.imdbID);
			const storedDetails = localStorage.getItem("seenMoviesDetails");
			const seenDetails = storedDetails ? JSON.parse(storedDetails) : {};
			const seenTitles = seenMovies.slice(-20).map((id) => seenDetails[id]).filter(Boolean);
			const allSeenIds = [...seenMovies, ...currentIds];

			const res = await fetch("/api/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query: currentQuery, seenMovies: seenTitles, seenMovieIds: allSeenIds }),
			});

			const data = await res.json();
			if (data.movies) setMovies((prev) => [...prev, ...data.movies]);
		} catch (error) {
			console.error("Load more failed:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Header watchlistCount={watchlistMovies.length} watchedCount={seenMovies.length} />

			<main className="min-h-screen bg-background text-foreground pt-14">
				{/* Hero / Search */}
				<div className="max-w-3xl mx-auto px-6 pt-20 pb-12">
					{!hasSearched && (
						<div className="mb-10">
							<h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground text-balance mb-4">
								What are you in<br />the mood for?
							</h1>
							<p className="text-muted-foreground text-lg">
								Describe a feeling, genre, or vibe and we'll find the perfect film.
							</p>
						</div>
					)}
					<SearchBar onSearch={handleSearch} isLoading={loading} initialQuery={currentQuery} />

					{/* Search terms */}
					{searchTerms.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-4">
							{searchTerms.map((term) => (
								<Badge key={term} variant="outline">
									{term}
								</Badge>
							))}
						</div>
					)}
				</div>

				{/* Results */}
				{(movies.length > 0 || loading) && (
					<div className="max-w-7xl mx-auto px-6 pb-24">
						{movies.length > 0 && (
							<p className="text-sm text-muted-foreground mb-6">
								{movies.length} films for &ldquo;{currentQuery}&rdquo;
							</p>
						)}

						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
							{movies.map((movie: Movie, index: number) => (
								<div key={movie.imdbID} className="relative group/card">
									<MovieCard
										movie={movie}
										isSeen={seenMovies.includes(movie.imdbID)}
										onToggleSeen={toggleSeen}
										isInWatchlist={watchlistMovies.includes(movie.imdbID)}
										onToggleWatchlist={toggleWatchlist}
										priority={index < 6}
									/>
									{movie.reason && (
										<Card className="absolute -bottom-1 left-0 right-0 mx-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
											<CardContent className="p-2 text-xs">
												<span className="text-accent font-semibold">Why? </span>
												<span className="text-card-foreground">{movie.reason}</span>
											</CardContent>
										</Card>
									)}
								</div>
							))}

							{/* Loading skeletons */}
							{loading && movies.length === 0 && Array.from({ length: 12 }).map((_, i) => (
								<Card key={i} className="overflow-hidden">
									<Skeleton className="aspect-[2/3]" />
									<CardContent className="p-3 space-y-2">
										<Skeleton className="h-3 w-3/4" />
										<Skeleton className="h-2.5 w-1/3" />
									</CardContent>
								</Card>
							))}
						</div>

						{movies.length > 0 && (
							<div className="flex justify-center mt-12">
								<Button
									variant="outline"
									size="lg"
									onClick={handleLoadMore}
									disabled={loading}
								>
									{loading ? "Loading..." : "Load more"}
								</Button>
							</div>
						)}
					</div>
				)}

				{/* Empty state after search */}
				{!loading && hasSearched && movies.length === 0 && (
					<div className="max-w-3xl mx-auto px-6 py-12 text-center">
						<p className="text-muted-foreground">No films found. Try a different search.</p>
					</div>
				)}
			</main>
		</>
	);
}
