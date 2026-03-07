"use client";

import { useEffect, useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { SearchBar } from "@/components/SearchBar";
import { Header } from "@/components/Header";
import type { Movie } from "@/lib/types";

export default function Home() {
	const [movies, setMovies] = useState<Movie[]>([]);
	const [loading, setLoading] = useState(false);
	const [seenMovies, setSeenMovies] = useState<string[]>([]);
	const [watchlistMovies, setWatchlistMovies] = useState<string[]>([]);
	const [searchTerms, setSearchTerms] = useState<string[]>([]);
	const [currentQuery, setCurrentQuery] = useState("");
	const [hasSearched, setHasSearched] = useState(false);

	useEffect(() => {
		const stored = localStorage.getItem("seenMovies");
		if (stored) setSeenMovies(JSON.parse(stored));

		const watchlist = localStorage.getItem("watchlistMovies");
		if (watchlist) setWatchlistMovies(JSON.parse(watchlist));

		const savedQuery = sessionStorage.getItem("lastQuery");
		const savedMovies = sessionStorage.getItem("lastMovies");
		const savedTerms = sessionStorage.getItem("lastTerms");
		if (savedQuery) { setCurrentQuery(savedQuery); setHasSearched(true); }
		if (savedMovies) setMovies(JSON.parse(savedMovies));
		if (savedTerms) setSearchTerms(JSON.parse(savedTerms));
	}, []);

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
								<span key={term} className="px-2.5 py-1 text-xs rounded-full border border-border text-muted-foreground bg-secondary">
									{term}
								</span>
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
										<div className="absolute -bottom-1 left-0 right-0 mx-1 bg-card border border-border text-xs p-2 rounded-lg shadow-lg opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
											<span className="text-accent font-semibold">Why? </span>
											<span className="text-card-foreground">{movie.reason}</span>
										</div>
									)}
								</div>
							))}

							{/* Loading skeletons */}
							{loading && movies.length === 0 && Array.from({ length: 12 }).map((_, i) => (
								<div key={i} className="rounded-xl overflow-hidden border border-border bg-card animate-pulse">
									<div className="aspect-[2/3] bg-muted" />
									<div className="p-3 space-y-2">
										<div className="h-3 bg-muted rounded w-3/4" />
										<div className="h-2.5 bg-muted rounded w-1/3" />
									</div>
								</div>
							))}
						</div>

						{movies.length > 0 && (
							<div className="flex justify-center mt-12">
								<button
									onClick={handleLoadMore}
									disabled={loading}
									className="px-8 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
								>
									{loading ? "Loading..." : "Load more"}
								</button>
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
