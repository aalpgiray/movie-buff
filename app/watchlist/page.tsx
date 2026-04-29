"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { MovieCard } from "@/components/MovieCard";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Movie, WatchlistCategory, RatedMovie } from "@/lib/types";
import {
    getList,
    setList,
    getAllMovies,
    getCategories,
    setCategories,
    removeMovieFromAllCategories,
    getRatedMovies,
    getDismissedRecommendations,
    addDismissedRecommendation,
    upsertMovies,
} from "@/lib/movie-db";
import CategoryFilter from "@/components/CategoryFilter";

const MIN_RECOMMENDATIONS = 5;
const SPRINKLE_INTERVAL = 4;

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
        // Silent failure
    }
}

/** Sprinkle recommendations into the user's watchlist */
function sprinkleRecommendations(userMovies: Movie[], recommendations: Movie[]): Movie[] {
    if (!recommendations.length) return userMovies;
    if (!userMovies.length) return recommendations;

    const result: Movie[] = [];
    let recIdx = 0;

    userMovies.forEach((movie, i) => {
        result.push(movie);
        // After every SPRINKLE_INTERVAL user movies, insert a recommendation
        if ((i + 1) % SPRINKLE_INTERVAL === 0 && recIdx < recommendations.length) {
            result.push(recommendations[recIdx++]);
        }
    });

    // Append remaining recommendations at the end
    while (recIdx < recommendations.length) {
        result.push(recommendations[recIdx++]);
    }

    return result;
}

export default function WatchlistPage() {
    const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
    const [categories, setCategoriesState] = useState<WatchlistCategory[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchingRecs, setFetchingRecs] = useState(false);
    const hasFetchedRecs = useRef(false);

    // Fetch recommendations if needed
    const fetchRecommendationsIfNeeded = useCallback(async (
        currentMovies: Movie[],
        watchlistIds: string[],
    ) => {
        if (hasFetchedRecs.current) return;
        
        // Count current recommendations in watchlist
        const recCount = currentMovies.filter((m) => m.isRecommendation).length;
        
        if (recCount >= MIN_RECOMMENDATIONS) return;

        // Get rated movies
        const ratedMovies = await getRatedMovies();
        if (ratedMovies.length < 3) return; // Need 3+ rated movies

        hasFetchedRecs.current = true;
        setFetchingRecs(true);

        try {
            const dismissedIds = await getDismissedRecommendations();
            // Exclude user-added movies (non-recommendations) from suggestions
            const userAddedIds = currentMovies
                .filter((m) => !m.isRecommendation)
                .map((m) => m.imdbID);

            const res = await fetch("/api/recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ratedMovies,
                    dismissedIds,
                    watchlistIds: userAddedIds,
                }),
            });

            const data = await res.json();
            if (!data.movies?.length) {
                setFetchingRecs(false);
                return;
            }

            const newRecs: Movie[] = data.movies.map((m: Movie) => ({
                ...m,
                isRecommendation: true,
            }));

            // Persist recommendations to IDB
            await upsertMovies(newRecs);

            // Add to watchlist
            const newIds = [...watchlistIds, ...newRecs.map((m) => m.imdbID)];
            await setList("watchlistMovies", newIds);

            // Update state - sprinkle new recs into the list
            setWatchlistMovies((prev) => {
                const userMovies = prev.filter((m) => !m.isRecommendation);
                const existingRecs = prev.filter((m) => m.isRecommendation);
                const allRecs = [...existingRecs, ...newRecs];
                return sprinkleRecommendations(userMovies, allRecs);
            });
        } catch (err) {
            console.error("Failed to fetch recommendations:", err);
        } finally {
            setFetchingRecs(false);
        }
    }, []);

    useEffect(() => {
        (async () => {
            const [watchlistIds, cats] = await Promise.all([
                getList("watchlistMovies"),
                getCategories(),
            ]);

            setCategoriesState(cats);

            if (!watchlistIds.length) {
                setLoading(false);
                // Still try to fetch recommendations for empty watchlist
                fetchRecommendationsIfNeeded([], []);
                return;
            }

            const all = await getAllMovies();
            const byId = Object.fromEntries(all.map((m) => [m.imdbID, m]));

            const movies: Movie[] = watchlistIds.map((id) => byId[id] ?? {
                imdbID: id,
                Title: "Unknown Title",
                Year: "",
                Type: "movie",
                Poster: "N/A",
            });

            // Separate user movies and recommendations
            const userMovies = movies.filter((m) => !m.isRecommendation).reverse();
            const recommendations = movies.filter((m) => m.isRecommendation);

            // Sprinkle recommendations into the list
            const orderedMovies = sprinkleRecommendations(userMovies, recommendations);
            setWatchlistMovies(orderedMovies);
            setLoading(false);

            // Check if we need more recommendations
            fetchRecommendationsIfNeeded(orderedMovies, watchlistIds);

            // Auto-categorize any user-added movies not yet in any category
            const categorizedIds = new Set(cats.flatMap((c) => c.movieIds));
            const uncategorized = userMovies.filter((m) => !categorizedIds.has(m.imdbID));
            if (uncategorized.length > 0) {
                autoCategorizeSilently(uncategorized, cats, setCategoriesState);
            }
        })();
    }, [fetchRecommendationsIfNeeded]);

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
        // Check if this is a recommendation being removed
        const movieToRemove = watchlistMovies.find((m) => m.imdbID === id);
        
        const watchlistIds = await getList("watchlistMovies");
        const newIds = watchlistIds.filter((movieId) => movieId !== id);
        await setList("watchlistMovies", newIds);
        await removeMovieFromAllCategories(id);

        // If it was a recommendation, add to dismissed list
        if (movieToRemove?.isRecommendation) {
            await addDismissedRecommendation(id);
        }

        setWatchlistMovies((prev) => prev.filter((m) => m.imdbID !== id));
        window.dispatchEvent(new Event("listsUpdated"));

        // Check if we need to fetch more recommendations
        const remaining = watchlistMovies.filter((m) => m.imdbID !== id);
        const recCount = remaining.filter((m) => m.isRecommendation).length;
        if (recCount < MIN_RECOMMENDATIONS) {
            hasFetchedRecs.current = false; // Allow fetching again
            fetchRecommendationsIfNeeded(remaining, newIds);
        }
    };

    // Count stats
    const userMoviesCount = watchlistMovies.filter((m) => !m.isRecommendation).length;

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
                            ? `${filteredMovies.length} of ${userMoviesCount} ${userMoviesCount === 1 ? "movie" : "movies"}`
                            : `${userMoviesCount} ${userMoviesCount === 1 ? "movie" : "movies"}`
                        } to watch
                        {fetchingRecs && " • Finding recommendations..."}
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
                                    totalCount={userMoviesCount}
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
                                    isRecommendation={movie.isRecommendation}
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
