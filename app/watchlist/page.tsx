"use client";

import { useEffect, useState, useMemo } from "react";
import { MovieCard } from "@/components/MovieCard";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Movie, WatchlistCategory } from "@/lib/types";
import { getList, setList, getAllMovies, getCategories, setCategories, removeMovieFromAllCategories } from "@/lib/movie-db";
import CategoryFilter from "@/components/CategoryFilter";

/** Silently call the AI to categorize uncategorized movies and merge results into IDB. */
async function autoCategorizeSilently(
    movies: Movie[],
    existingCats: WatchlistCategory[],
    onDone: (cats: WatchlistCategory[]) => void,
) {
    try {
        const res = await fetch("/api/categorize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                movies: movies.map((m) => ({ imdbID: m.imdbID, title: m.Title, year: m.Year })),
            }),
        });
        const data = await res.json();
        if (!data.categories?.length) return;

        const existingNames = new Set(existingCats.map((c) => c.name.toLowerCase()));
        const merged = [...existingCats];

        for (const suggested of data.categories as { name: string; movieIds: string[] }[]) {
            const lower = suggested.name.toLowerCase();
            const existing = merged.find((c) => c.name.toLowerCase() === lower);
            if (existing) {
                // Merge movie ids into existing category (idempotent)
                const newIds = suggested.movieIds.filter((id) => !existing.movieIds.includes(id));
                existing.movieIds = [...existing.movieIds, ...newIds];
            } else if (!existingNames.has(lower)) {
                merged.push({ id: crypto.randomUUID(), name: suggested.name, movieIds: suggested.movieIds });
                existingNames.add(lower);
            }
        }

        await setCategories(merged);
        onDone([...merged]);
    } catch {
        // Silent failure — user can always use the Auto button manually
    }
}

export default function WatchlistPage() {
    const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
    const [categories, setCategories] = useState<WatchlistCategory[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const [watchlistIds, cats] = await Promise.all([
                getList("watchlistMovies"),
                getCategories(),
            ]);

            setCategories(cats);

            if (!watchlistIds.length) { setLoading(false); return; }

            const all = await getAllMovies();
            const byId = Object.fromEntries(all.map((m) => [m.imdbID, m]));

            const movies: Movie[] = watchlistIds.map((id) => byId[id] ?? {
                imdbID: id,
                Title: "Unknown Title",
                Year: "",
                Type: "movie",
                Poster: "N/A",
            });

            const orderedMovies = movies.reverse();
            setWatchlistMovies(orderedMovies);
            setLoading(false);

            // Auto-categorize any movies not yet in any category
            const categorizedIds = new Set(cats.flatMap((c) => c.movieIds));
            const uncategorized = orderedMovies.filter((m) => !categorizedIds.has(m.imdbID));
            if (uncategorized.length > 0) {
                autoCategorizeSilently(uncategorized, cats, setCategories);
            }
        })();
    }, []);

    const filteredMovies = useMemo(() => {
        if (selectedFilter === null) return watchlistMovies;
        if (selectedFilter === "__uncategorized__") {
            const allIds = new Set(categories.flatMap((c) => c.movieIds));
            return watchlistMovies.filter((m) => !allIds.has(m.imdbID));
        }
        const cat = categories.find((c) => c.id === selectedFilter);
        if (!cat) return watchlistMovies;
        return watchlistMovies.filter((m) => cat.movieIds.includes(m.imdbID));
    }, [watchlistMovies, categories, selectedFilter]);

    const handleRemoveFromWatchlist = async (id: string) => {
        const watchlistIds = await getList("watchlistMovies");
        const newIds = watchlistIds.filter((movieId) => movieId !== id);
        await setList("watchlistMovies", newIds);
        await removeMovieFromAllCategories(id);
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
                        {selectedFilter !== null
                            ? `${filteredMovies.length} of ${watchlistMovies.length} ${watchlistMovies.length === 1 ? "movie" : "movies"}`
                            : `${watchlistMovies.length} ${watchlistMovies.length === 1 ? "movie" : "movies"}`
                        } to watch
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
                    <>
                        {categories.length > 0 && (
                            <div className="mb-6">
                                <CategoryFilter
                                    categories={categories}
                                    selected={selectedFilter}
                                    onSelect={setSelectedFilter}
                                    totalCount={watchlistMovies.length}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredMovies.map((movie) => (
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
                    </>
                )}
            </div>
        </main>
        </>
    );
}
