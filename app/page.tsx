"use client";

import { useEffect, useState, useRef } from "react";
import { MovieCard } from "@/components/MovieCard";
import { SearchBar } from "@/components/SearchBar";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { Movie } from "@/lib/types";
import { upsertMovies, getAllMovies, buildDefaultList } from "@/lib/movie-db";

export default function Home() {
	const [movies, setMovies] = useState<Movie[]>([]);
	const [defaultList, setDefaultList] = useState<Movie[]>([]);
	const [loading, setLoading] = useState(false);
	const [defaultLoading, setDefaultLoading] = useState(true);
	const [seenMovies, setSeenMovies] = useState<string[]>([]);
	const [watchlistMovies, setWatchlistMovies] = useState<string[]>([]);
	const [searchTerms, setSearchTerms] = useState<string[]>([]);
	const [currentQuery, setCurrentQuery] = useState("");
	const [hasSearched, setHasSearched] = useState(false);

	/** Rebuild and update the default list from IDB each time seenMovies changes. */
	const rebuildDefaultList = async (seenIds: string[]) => {
		try {
			const all = await getAllMovies();
			const list = buildDefaultList(all, new Set(seenIds));
			setDefaultList(list);
		} catch {
			// IDB not available (e.g. SSR / private mode)
		} finally {
			setDefaultLoading(false);
		}
	};

	// Mount: hydrate seen/watchlist from localStorage and build initial default list.
	useEffect(() => {
		const storedSeen: string[] = JSON.parse(localStorage.getItem("seenMovies") || "[]");
		const storedWatchlist: string[] = JSON.parse(localStorage.getItem("watchlistMovies") || "[]");
		setSeenMovies(storedSeen);
		setWatchlistMovies(storedWatchlist);

		// Always start fresh on the default (IDB) list — never restore a
		// previous search so results are never "stuck" on screen at load.
		rebuildDefaultList(storedSeen);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Rebuild default list whenever seen status changes (e.g. user toggles seen on home page).
	const isFirstRender = useRef(true);
	useEffect(() => {
		if (isFirstRender.current) { isFirstRender.current = false; return; }
		rebuildDefaultList(seenMovies);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [seenMovies]);

	const toggleSeen = (id: string) => {
		const newSeen = seenMovies.includes(id)
			? seenMovies.filter((movieId) => movieId !== id)
			: [...seenMovies, id];
		setSeenMovies(newSeen);
		localStorage.setItem("seenMovies", JSON.stringify(newSeen));

		if (!seenMovies.includes(id)) {
			const movie =
				movies.find((m) => m.imdbID === id) ??
				defaultList.find((m) => m.imdbID === id);
			if (movie) {
				const details = JSON.parse(localStorage.getItem("seenMoviesDetails") || "{}");
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
			const movie =
				movies.find((m) => m.imdbID === id) ??
				defaultList.find((m) => m.imdbID === id);
			if (movie) {
				const details = JSON.parse(localStorage.getItem("watchlistMoviesDetails") || "{}");
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

				// Persist new movies to IDB and refresh the default list.
				await upsertMovies(data.movies);
				rebuildDefaultList(seenMovies);
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
			if (data.movies) {
				setMovies((prev) => [...prev, ...data.movies]);

				// Persist new movies to IDB and refresh the default list.
				await upsertMovies(data.movies);
				rebuildDefaultList(seenMovies);
			}
		} catch (error) {
			console.error("Load more failed:", error);
		} finally {
			setLoading(false);
		}
	};

	// Which list is currently visible?
	const activeMovies = hasSearched ? movies : defaultList;
	const activeLoading = hasSearched ? loading : defaultLoading;
	const hasResults = activeMovies.length > 0;
	const isEmpty = !activeLoading && hasResults === false;

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
								Describe a feeling, genre, or vibe and we&apos;ll find the perfect film.
							</p>
						</div>
					)}
					<SearchBar onSearch={handleSearch} isLoading={loading} initialQuery={currentQuery} />

					{/* Search terms */}
					{searchTerms.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-4">
							{searchTerms.map((term) => (
								<Badge key={term} variant="outline">{term}</Badge>
							))}
						</div>
					)}
				</div>

				{/* Movie grid */}
				{(hasResults || activeLoading) && (
					<div className="max-w-7xl mx-auto px-6 pb-24">
						{/* Section header */}
						{hasResults && (
							<p className="text-sm text-muted-foreground mb-6">
								{hasSearched
									? `${movies.length} films for \u201c${currentQuery}\u201d`
									: `${defaultList.length} films from your searches`}
							</p>
						)}

						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
							{activeMovies.map((movie: Movie, index: number) => (
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
							{activeLoading && !hasResults && Array.from({ length: 12 }).map((_, i) => (
								<Card key={i} className="overflow-hidden">
									<Skeleton className="aspect-[2/3]" />
									<CardContent className="p-3 space-y-2">
										<Skeleton className="h-3 w-3/4" />
										<Skeleton className="h-2.5 w-1/3" />
									</CardContent>
								</Card>
							))}
						</div>

						{/* Load more — only on search results */}
						{hasSearched && movies.length > 0 && (
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

				{/* Empty state — pre-search with no IDB data yet */}
				{!hasSearched && isEmpty && (
					<div className="max-w-3xl mx-auto px-6 py-12 text-center">
						<p className="text-muted-foreground">
							Search for a movie to get started. Your history will appear here.
						</p>
					</div>
				)}

				{/* Empty state — after a search found nothing */}
				{hasSearched && !loading && movies.length === 0 && (
					<div className="max-w-3xl mx-auto px-6 py-12 text-center">
						<p className="text-muted-foreground">No films found. Try a different search.</p>
					</div>
				)}
			</main>
		</>
	);
}
