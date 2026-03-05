"use client";

import { useEffect, useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";
import type { Movie } from "@/lib/types";

export default function WatchlistPage() {
    const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWatchlist = () => {
            const watchlistIds = localStorage.getItem("watchlistMovies");
            const watchlistDetails = localStorage.getItem("watchlistMoviesDetails");

            if (!watchlistIds) {
                setLoading(false);
                return;
            }

            const ids: string[] = JSON.parse(watchlistIds);
            const details = watchlistDetails ? JSON.parse(watchlistDetails) : {};

            // Use stored details
            const movies: Movie[] = ids.map(id => {
                const movieData = details[id];
                if (typeof movieData === 'object' && movieData !== null) {
                    return {
                        Title: movieData.title || "Unknown Title",
                        Year: movieData.year || "",
                        imdbID: id,
                        Type: movieData.type || "movie",
                        Poster: movieData.poster || "N/A",
                    };
                }
                return {
                    Title: typeof movieData === 'string' ? movieData : "Unknown Title",
                    Year: "",
                    imdbID: id,
                    Type: "movie",
                    Poster: "N/A",
                };
            });

            setWatchlistMovies(movies.reverse()); // Most recent first
            setLoading(false);
        };

        loadWatchlist();
    }, []);

    const handleRemoveFromWatchlist = (id: string) => {
        const watchlistIds = localStorage.getItem("watchlistMovies");
        if (!watchlistIds) return;

        const ids: string[] = JSON.parse(watchlistIds);
        const newIds = ids.filter((movieId) => movieId !== id);

        localStorage.setItem("watchlistMovies", JSON.stringify(newIds));
        setWatchlistMovies(watchlistMovies.filter(m => m.imdbID !== id));
    };

    // Dummy function for watched status (not used on watchlist page)
    const handleToggleSeen = () => { };

    return (
        <>
        <HeaderWrapper />
        <main className="min-h-screen bg-background text-foreground p-8 md:p-24 pt-20">
            <div className="max-w-7xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Search
                </Link>

                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Bookmark className="h-8 w-8 text-amber-500" />
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                            My Watchlist
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        {watchlistMovies.length} {watchlistMovies.length === 1 ? "movie" : "movies"} to watch
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="aspect-[2/3] rounded-xl bg-secondary animate-pulse"
                            />
                        ))}
                    </div>
                ) : watchlistMovies.length === 0 ? (
                    <div className="text-center py-20">
                        <Bookmark className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg mb-4">
                            Your watchlist is empty.
                        </p>
                        <p className="text-muted-foreground/70 text-sm mb-6">
                            Bookmark movies you want to watch later!
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all"
                        >
                            Start Searching
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {watchlistMovies.map((movie) => (
                            <MovieCard
                                key={movie.imdbID}
                                movie={movie}
                                isSeen={false}
                                onToggleSeen={handleToggleSeen}
                                onToggleWatchlist={handleRemoveFromWatchlist}
                                isInWatchlist={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
        </>
    );
}
