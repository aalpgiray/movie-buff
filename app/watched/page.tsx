"use client";

import { useEffect, useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Movie } from "@/lib/types";
import { getList, setList, getAllMovies, upsertMovie } from "@/lib/movie-db";

export default function WatchedMoviesPage() {
    const [watchedMovies, setWatchedMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const seenIds = await getList("seenMovies");
            if (!seenIds.length) { setLoading(false); return; }

            // Pull full movie data from the movies store.
            const all = await getAllMovies();
            const byId = Object.fromEntries(all.map((m) => [m.imdbID, m]));

            const movies: Movie[] = seenIds.map((id) => byId[id] ?? {
                imdbID: id,
                Title: "Unknown Title",
                Year: "",
                Type: "movie",
                Poster: "N/A",
            });

            setWatchedMovies(movies.reverse());
            setLoading(false);
        })();
    }, []);

    const handleToggleSeen = async (id: string) => {
        const seenIds = await getList("seenMovies");
        const newIds = seenIds.filter((movieId) => movieId !== id);
        await setList("seenMovies", newIds);
        await upsertMovie({ imdbID: id, isSeen: false });
        setWatchedMovies((prev) => prev.filter((m) => m.imdbID !== id));
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
                        <Eye className="h-8 w-8 text-accent" />
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                            Watched Movies
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        {watchedMovies.length} {watchedMovies.length === 1 ? "movie" : "movies"} in your watch history
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
                        ))}
                    </div>
                ) : watchedMovies.length === 0 ? (
                    <div className="text-center py-20">
                        <Eye className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg mb-4">
                            You haven&apos;t marked any movies as watched yet.
                        </p>
                        <Button asChild>
                            <Link href="/">Start Searching</Link>
                        </Button>
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
        </>
    );
}
