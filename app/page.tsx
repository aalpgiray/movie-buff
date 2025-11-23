"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { MovieDetailModal } from "@/components/MovieDetailModal";
import { SearchBar } from "@/components/SearchBar";

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
	const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState("");

	useEffect(() => {
		const stored = localStorage.getItem("seenMovies");
		if (stored) {
			setSeenMovies(JSON.parse(stored));
		}
	}, []);

	const toggleSeen = (id: string) => {
		const newSeen = seenMovies.includes(id)
			? seenMovies.filter((movieId) => movieId !== id)
			: [...seenMovies, id];

		setSeenMovies(newSeen);
		localStorage.setItem("seenMovies", JSON.stringify(newSeen));

    // Also store details for AI context
    if (!seenMovies.includes(id)) {
        const movie = movies.find(m => m.imdbID === id);
        if (movie) {
            const storedDetails = localStorage.getItem("seenMoviesDetails");
            const details = storedDetails ? JSON.parse(storedDetails) : {};
            details[id] = movie.Title;
            localStorage.setItem("seenMoviesDetails", JSON.stringify(details));
        }
    }
  };

	const handleSearch = async (query: string) => {
		setLoading(true);
		setMovies([]);
		setSearchTerms([]);
    setCurrentQuery(query);

		try {
      // Get movie titles for the seen IDs to send to AI
      // In a real app, we'd probably store titles with IDs or fetch them
      // For now, we'll rely on the fact that we might not have titles for all IDs if we only store IDs
      // But wait, we only store IDs in local storage.
      // To make this work effectively without fetching everything, we should probably store {id, title} in local storage
      // OR just send the IDs and let the backend/AI deal with it? AI doesn't know IMDB IDs well.
      // Let's update the local storage to store objects or just filter from the current 'movies' state if available?
      // Actually, the prompt expects titles. 
      // Let's update the toggleSeen to store titles too, or just send what we have.
      // For this iteration, let's assume we only have IDs and maybe we can't easily get titles for *old* seen movies without fetching.
      // IMPROVEMENT: Let's update seenMovies to store objects {id, title}.
      
      // Wait, I can't easily change the data structure of 'seenMovies' state without breaking the 'includes' checks everywhere.
      // Let's stick to IDs for state, but maybe we can find the titles from the 'movies' array if they are there?
      // No, that only has current search results.
      
      // Alternative: The user said "movies I marked as seen".
      // Let's just send the IDs? No, AI needs titles.
      // Let's fetch the titles for the seen IDs? Too many requests.
      
      // Let's change the 'seenMovies' to store objects in localStorage, but keep the state as IDs for easy checking?
      // Or just a separate 'seenMoviesDetails' in localStorage.
      
      // Let's try to get titles from localStorage if we saved them.
      // Since we haven't saved titles yet, this feature will only work for *newly* marked movies if we change logic now.
      // Let's update toggleSeen to save title.
      
      const storedDetails = localStorage.getItem("seenMoviesDetails");
      const seenDetails = storedDetails ? JSON.parse(storedDetails) : {};
      
      // Get titles of seen movies, limited to last 20
      const seenTitles = seenMovies
        .slice(-20)
        .map(id => seenDetails[id])
        .filter(Boolean);

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query,
          seenMovies: seenTitles,
          seenMovieIds: seenMovies
        }),
      });

			const data = await res.json();
			if (data.movies) {
				setMovies(data.movies);
				setSearchTerms(data.terms || []);
        // We need to save the query for "Load More" but we don't have a state for it yet.
        // Ideally we should refactor to have 'currentQuery' state.
        // For now, let's just use the first term as a proxy in handleLoadMore or better, add the state.
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
		
		// We need to request more movies from AI, excluding current ones
		// But our current API just takes a query.
		// We should probably update the API to accept 'exclude' list or just rely on 'seenMovies' if we want to exclude seen ones.
		// But here we want to exclude *currently displayed* movies too.
		
		try {
			const currentIds = movies.map(m => m.imdbID);
			// We can pass currentIds as 'seenMovies' to the API for this request to avoid duplicates
			// But we also need to include the actual seen movies.
			
			const storedDetails = localStorage.getItem("seenMoviesDetails");
			const seenDetails = storedDetails ? JSON.parse(storedDetails) : {};
			const seenTitles = seenMovies.slice(-20).map(id => seenDetails[id]).filter(Boolean);
			
			// Combine actual seen movies + current results to avoid duplicates
			// We pass IDs for filtering in backend, and titles for AI context if possible
			// For now, let's just pass the IDs of current movies as 'seenMovieIds' to filter them out
			
			const allSeenIds = [...seenMovies, ...currentIds];

			const res = await fetch("/api/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					query: currentQuery, 
					seenMovies: seenTitles,
					seenMovieIds: allSeenIds
				}),
			});

			const data = await res.json();
			if (data.movies) {
				setMovies(prev => [...prev, ...data.movies]);
				// We don't update searchTerms here as it might confuse the user, or maybe we append?
				// Let's keep original terms.
			}
		} catch (error) {
			console.error("Load more failed:", error);
		} finally {
			setLoading(false);
		}
	};

	const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

	return (
		<main className="min-h-screen bg-background flex flex-col items-center p-8 md:p-24">
			<div className="w-full max-w-5xl flex flex-col items-center gap-12">
				<div className="text-center space-y-4">
					<h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
						Mood Movie Search
					</h1>
					<p className="text-xl text-muted-foreground max-w-lg mx-auto">
						Discover your next favorite movie based on how you feel.
					</p>
				</div>

				<div className="w-full z-10">
					<SearchBar onSearch={handleSearch} isLoading={loading} />
				</div>

				{searchTerms.length > 0 && (
					<div className="flex flex-wrap gap-2 justify-center">
						<span className="text-sm text-muted-foreground mr-2">
							AI searched for:
						</span>
						{searchTerms.map((term, i) => (
							<span
								key={i}
								className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20"
							>
								{term}
							</span>
						))}
					</div>
				)}

				<div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<AnimatePresence mode="popLayout">
						{movies.map((movie: any) => (
              <button 
                type="button"
                key={movie.imdbID} 
                onClick={() => setSelectedMovie(movie)} 
                className="text-left transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary rounded-xl group relative"
              >
                <MovieCard
                  movie={movie}
                  isSeen={seenMovies.includes(movie.imdbID)}
                  onToggleSeen={toggleSeen}
                />
                {movie.reason && (
                  <div className="absolute -bottom-2 left-4 right-4 bg-black/80 backdrop-blur-md text-xs p-2 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <span className="text-primary font-bold">Why?</span> {movie.reason}
                  </div>
                )}
              </button>
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
			</div>

			<MovieDetailModal
				isOpen={!!selectedMovie}
				onClose={() => setSelectedMovie(null)}
				movie={selectedMovie}
			/>
		</main>
	);
}
