"use client";

import { useEffect, useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Movie } from "@/lib/types";

export default function WatchedMoviesPage() {
    const [watchedMovies, setWatchedMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWatchedMovies = async () => {
            const seenIds = localStorage.getItem("seenMovies");
            const seenDetails = localStorage.getItem("seenMoviesDetails");

            if (!seenIds) {
                setLoading(false);
                return;
            }

            const ids: string[] = JSON.parse(seenIds);
            const details = seenDetails ? JSON.parse(seenDetails) : {};

            // Use stored details directly - they're saved when movies are marked as seen
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
                // Fallback for old format (just title string)
                return {
                    Title: typeof movieData === 'string' ? movieData : "Unknown Title",
                    Year: "",
                    imdbID: id,
                    Type: "movie",
                    Poster: "N/A",
                };
            });

            setWatchedMovies(movies.reverse()); // Most recent first
            setLoading(false);
        };

        loadWatchedMovies();
    }, []);

    const handleToggleSeen = (id: string) => {
        const seenIds = localStorage.getItem("seenMovies");
        if (!seenIds) return;

        const ids: string[] = JSON.parse(seenIds);
        const newIds = ids.filter((movieId) => movieId !== id);

        localStorage.setItem("seenMovies", JSON.stringify(newIds));
        setWatchedMovies(watchedMovies.filter(m => m.imdbID !== id));
    };

    return (
        <main className="min-h-screen bg-background text-foreground p-8 md:p-24">
            <div className="max-w-7xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Search
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Watched Movies
                    </h1>
                    <p className="text-muted-foreground">
                        {watchedMovies.length} {watchedMovies.length === 1 ? "movie" : "movies"} in your watch history
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
                ) : watchedMovies.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground text-lg mb-4">
                            You haven&apos;t marked any movies as watched yet.
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
                        {watchedMovies.map((movie) => (
                            <MovieCard
                                key={movie.imdbID}
                                movie={movie}
                                isSeen={true}
                                onToggleSeen={handleToggleSeen}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
