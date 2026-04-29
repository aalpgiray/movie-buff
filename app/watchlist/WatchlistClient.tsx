"use client";

import { useState, useMemo, useCallback, useRef, useTransition, useEffect } from "react";
import { MovieCard } from "@/components/MovieCard";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Movie, WatchlistCategory } from "@/lib/types";
import {
  removeFromWatchlistAction,
  removeMovieFromAllCategoriesAction,
  addDismissedRecommendationAction,
  getRatedMoviesAction,
  getDismissedRecommendationsAction,
  addToWatchlistAction,
  getCategoriesAction,
} from "@/app/actions";
import CategoryFilter from "@/components/CategoryFilter";

const MIN_RECOMMENDATIONS = 5;
const SPRINKLE_INTERVAL = 4;

interface WatchlistClientProps {
  initialMovies: Movie[];
  initialCategories: WatchlistCategory[];
}

/** Silently call the AI to categorize uncategorized movies and merge results. */
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

    // Refresh categories from server after API might have created new ones
    const refreshedCats = await getCategoriesAction();
    onDone(refreshedCats);
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

export function WatchlistClient({ initialMovies, initialCategories }: WatchlistClientProps) {
  // Separate user movies and recommendations, then sprinkle
  const userMoviesInit = initialMovies.filter((m) => !m.isRecommendation).reverse();
  const recommendationsInit = initialMovies.filter((m) => m.isRecommendation);
  const orderedInit = sprinkleRecommendations(userMoviesInit, recommendationsInit);

  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>(orderedInit);
  const [categories, setCategoriesState] = useState<WatchlistCategory[]>(initialCategories);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [fetchingRecs, setFetchingRecs] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasFetchedRecs = useRef(false);

  // Fetch recommendations if needed
  const fetchRecommendationsIfNeeded = useCallback(async (currentMovies: Movie[]) => {
    if (hasFetchedRecs.current) return;

    // Count current recommendations in watchlist
    const recCount = currentMovies.filter((m) => m.isRecommendation).length;

    if (recCount >= MIN_RECOMMENDATIONS) return;

    // Get rated movies
    const ratedMovies = await getRatedMoviesAction();
    if (ratedMovies.length < 3) return; // Need 3+ rated movies

    hasFetchedRecs.current = true;
    setFetchingRecs(true);

    try {
      const dismissedIds = await getDismissedRecommendationsAction();
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

      // Add recommendations to watchlist in database
      for (const rec of newRecs) {
        await addToWatchlistAction(rec);
      }

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

  // Check if we need recommendations on mount
  useEffect(() => {
    fetchRecommendationsIfNeeded(watchlistMovies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-categorize on mount
  useEffect(() => {
    const categorizedIds = new Set(categories.flatMap((c) => c.movieIds));
    const uncategorized = watchlistMovies.filter(
      (m) => !m.isRecommendation && !categorizedIds.has(m.imdbID)
    );
    if (uncategorized.length > 0) {
      autoCategorizeSilently(uncategorized, categories, setCategoriesState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Check if this is a recommendation being removed
    const movieToRemove = watchlistMovies.find((m) => m.imdbID === id);

    startTransition(async () => {
      await removeFromWatchlistAction(id);
      await removeMovieFromAllCategoriesAction(id);

      // If it was a recommendation, add to dismissed list
      if (movieToRemove?.isRecommendation) {
        await addDismissedRecommendationAction(id);
      }

      setWatchlistMovies((prev) => prev.filter((m) => m.imdbID !== id));

      // Check if we need to fetch more recommendations
      const remaining = watchlistMovies.filter((m) => m.imdbID !== id);
      const recCount = remaining.filter((m) => m.isRecommendation).length;
      if (recCount < MIN_RECOMMENDATIONS) {
        hasFetchedRecs.current = false; // Allow fetching again
        fetchRecommendationsIfNeeded(remaining);
      }
    });
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
                : `${userMoviesCount} ${userMoviesCount === 1 ? "movie" : "movies"}`}{" "}
              to watch
              {fetchingRecs && " • Finding recommendations..."}
            </p>
          </div>

          {isPending ? (
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
