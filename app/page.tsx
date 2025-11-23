"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { SearchBar } from "@/components/SearchBar";
import { Header } from "@/components/Header";

interface Movie {
	Title: string;
	Year: string;
	imdbID: string;
	Type: string;
	Poster: string;
}

export default function Home() {
	const [movies, setMovies] = useState<Movie[]>([]);
	const [loading, setLoading] = useState(false);
	const [seenMovies, setSeenMovies] = useState<string[]>([]);
	const [watchlistMovies, setWatchlistMovies] = useState<string[]>([]);
	const [searchTerms, setSearchTerms] = useState<string[]>([]);
	const [currentQuery, setCurrentQuery] = useState("");

	useEffect(() => {
		const stored = localStorage.getItem("seenMovies");
		if (stored) {
			setSeenMovies(JSON.parse(stored));
		}

		const watchlist = localStorage.getItem("watchlistMovies");
		if (watchlist) {
			setWatchlistMovies(JSON.parse(watchlist));
		}
	}, []);

	const toggleSeen = (id: string) => {
		const newSeen = seenMovies.includes(id)
			? seenMovies.filter((movieId) => movieId !== id)
			: [...seenMovies, id];

		setSeenMovies(newSeen);
		localStorage.setItem("seenMovies", JSON.stringify(newSeen));

		// Also store details for AI context and watched page
		if (!seenMovies.includes(id)) {
			const movie = movies.find((m) => m.imdbID === id);
			if (movie) {
				const storedDetails = localStorage.getItem("seenMoviesDetails");
				const details = storedDetails ? JSON.parse(storedDetails) : {};
				details[id] = {
					title: movie.Title,
					poster: movie.Poster,
					year: movie.Year,
					type: movie.Type
				};
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

		// Store movie details
		if (!watchlistMovies.includes(id)) {
			const movie = movies.find((m) => m.imdbID === id);
			if (movie) {
				const storedDetails = localStorage.getItem("watchlistMoviesDetails");
				const details = storedDetails ? JSON.parse(storedDetails) : {};
				details[id] = {
					title: movie.Title,
					poster: movie.Poster,
					year: movie.Year,
					type: movie.Type
				};
				localStorage.setItem("watchlistMoviesDetails", JSON.stringify(details));
			}
		}
	};

	const handleSearch = async (query: string) => {
		setLoading(true);
		setMovies([]);
		setSearchTerms([]);
		setCurrentQuery(query);

		try {
			const storedDetails = localStorage.getItem("seenMoviesDetails");
			const seenDetails = storedDetails ? JSON.parse(storedDetails) : {};

			// Get titles of seen movies, limited to last 20
			const seenTitles = seenMovies
				.slice(-20)
				.map((id) => seenDetails[id])
				.filter(Boolean);

			const res = await fetch("/api/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query,
					seenMovies: seenTitles,
					seenMovieIds: seenMovies,
				}),
			});

			const data = await res.json();
			if (data.movies) {
				setMovies(data.movies);
				setSearchTerms(data.terms || []);
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
			const seenTitles = seenMovies
				.slice(-20)
				.map((id) => seenDetails[id])
				.filter(Boolean);

			const allSeenIds = [...seenMovies, ...currentIds];

			const res = await fetch("/api/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: currentQuery,
					seenMovies: seenTitles,
					seenMovieIds: allSeenIds,
				}),
			});

			const data = await res.json();
			if (data.movies) {
				setMovies((prev) => [...prev, ...data.movies]);
			}
		} catch (error) {
			console.error("Load more failed:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Header watchlistCount={watchlistMovies.length} watchedCount={seenMovies.length} />

			<main className="min-h-screen bg-background text-foreground overflow-hidden pt-20">
				<div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-background to-blue-900/20 pointer-events-none" />

				<div className="relative z-10 flex flex-col items-center px-6 py-16 md:py-24">
					<motion.div
						className="w-full max-w-5xl flex flex-col items-center gap-12"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<div className="text-center space-y-6">
							<h2 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
								How are you feeling?
							</h2>
							<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
								Describe your mood, and we'll find the perfect movies to match.
							</p>
						</div>

						<div className="w-full max-w-2xl">
							<SearchBar onSearch={handleSearch} isLoading={loading} />
						</div>

						<div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							<AnimatePresence mode="popLayout">
								{movies.map((movie: any) => (
									<div key={movie.imdbID} className="relative group">
										<MovieCard
											movie={movie}
											isSeen={seenMovies.includes(movie.imdbID)}
											onToggleSeen={toggleSeen}
											isInWatchlist={watchlistMovies.includes(movie.imdbID)}
											onToggleWatchlist={toggleWatchlist}
										/>
										{movie.reason && (
											<div className="absolute -bottom-2 left-4 right-4 bg-black/80 backdrop-blur-md text-xs p-2 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
												<span className="text-primary font-bold">Why?</span>{" "}
												{movie.reason}
											</div>
										)}
									</div>
								))}
							</AnimatePresence>
						</div>


						{movies.length > 0 && (
							<button
								onClick={handleLoadMore}
								disabled={loading}
								className="px-6 py-3 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
							>
								{loading ? "Loading..." : "Load More"}
							</button>
						)}

						{!loading && movies.length === 0 && searchTerms.length > 0 && (
							<div className="text-muted-foreground">
								No movies found. Try a different mood.
							</div>
						)}
					</motion.div>
				</div>
			</main>
		</>
	);
}
