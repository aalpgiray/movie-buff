"use client";

import { useEffect, useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Movie } from "@/lib/types";
import { getList, setList, getAllMovies } from "@/lib/movie-db";

export default function WatchlistPage() {
    const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const watchlistIds = await getList("watchlistMovies");
            if (!watchlistIds.length) { setLoading(false); return; }

            // Pull full movie data from the movies store.
            const all = await getAllMovies();
            const byId = Object.fromEntries(all.map((m) => [m.imdbID, m]));

            const movies: Movie[] = watchlistIds.map((id) => byId[id] ?? {
                imdbID: id,
                Title: "Unknown Title",
                Year: "",
                Type: "movie",
                Poster: "N/A",
            });

            setWatchlistMovies(movies.reverse());
            setLoading(false);
        })();
    }, []);

    const handleRemoveFromWatchlist = async (id: string) => {
        const watchlistIds = await getList("watchlistMovies");
        const newIds = watchlistIds.filter((movieId) => movieId !== id);
        await setList("watchlistMovies", newIds);
        setWatchlistMovies((prev) => prev.filter((m) => m.imdbID !== id));
        window.dispatchEvent(new Event("listsUpdated"));
    };

    return (
        <>
        <HeaderWrapper />
        <main className="min-h-screen bg-background text-foreground p-8 md:p-24 pt-20">
            <div className="max-w-7xl mx-auto">
                <Button variant="ghost" asChild className="mb-8 group">
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Search
                    </Link>
                </Button>

                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Bookmark className="h-8 w-8 text-accent" />
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
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
                            <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
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
                        <Button asChild>
                            <Link href="/">Start Searching</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {watchlistMovies.map((movie) => (
                            <MovieCard
                                key={movie.imdbID}
                                movie={movie}
                                isSeen={false}
                                onToggleSeen={() => {}}
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
