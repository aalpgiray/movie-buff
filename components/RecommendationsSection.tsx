"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, RefreshCw, Bookmark, BookmarkCheck, Film } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRatedMovies, getList, setList, upsertMovie } from "@/lib/movie-db";
import type { Movie, RatedMovie } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecommendationsSectionProps {
  watchlistMovies: string[];
  onWatchlistChange: (newWatchlist: string[]) => void;
}

export function RecommendationsSection({
  watchlistMovies,
  onWatchlistChange,
}: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasEnoughRatings, setHasEnoughRatings] = useState(false);
  const [ratedCount, setRatedCount] = useState(0);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const ratedMovies: RatedMovie[] = await getRatedMovies();
      console.log("[v0] Rated movies count:", ratedMovies.length, "Movies:", ratedMovies);
      setRatedCount(ratedMovies.length);

      if (ratedMovies.length < 3) {
        console.log("[v0] Not enough ratings, need 3, have:", ratedMovies.length);
        setHasEnoughRatings(false);
        setLoading(false);
        return;
      }

      setHasEnoughRatings(true);

      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratedMovies }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await res.json();
      setRecommendations(data.movies || []);
    } catch (err) {
      console.error("Recommendations error:", err);
      setError("Could not load recommendations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Listen for list updates (e.g., when user rates a movie on detail page)
  useEffect(() => {
    const handleListsUpdated = () => {
      fetchRecommendations();
    };
    window.addEventListener("listsUpdated", handleListsUpdated);
    return () => window.removeEventListener("listsUpdated", handleListsUpdated);
  }, [fetchRecommendations]);

  const toggleWatchlist = async (movie: Movie) => {
    const adding = !watchlistMovies.includes(movie.imdbID);
    const newWatchlist = adding
      ? [...watchlistMovies, movie.imdbID]
      : watchlistMovies.filter((id) => id !== movie.imdbID);

    onWatchlistChange(newWatchlist);
    await setList("watchlistMovies", newWatchlist);

    if (adding) {
      await upsertMovie({
        imdbID: movie.imdbID,
        Title: movie.Title,
        Year: movie.Year,
        Poster: movie.Poster,
        Type: movie.Type,
      });
    }
  };

  // Don't render if user doesn't have enough ratings
  if (!loading && !hasEnoughRatings) {
    if (ratedCount === 0) return null;
    
    return (
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="border border-border rounded-lg p-6 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">
              Personalized Recommendations
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Rate {3 - ratedCount} more movie{3 - ratedCount !== 1 ? "s" : ""} to unlock AI-powered recommendations based on your taste.
          </p>
        </div>
      </div>
    );
  }

  if (error) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 pb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">
            Recommended For You
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRecommendations}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Based on your {ratedCount} rated movie{ratedCount !== 1 ? "s" : ""}
      </p>

      {/* Horizontal scroll container */}
      <div className="overflow-x-auto-only pb-2 -mx-6 px-6">
        <div className="flex gap-4" style={{ width: "max-content" }}>
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="w-40 flex-shrink-0 overflow-hidden">
                <Skeleton className="aspect-[2/3]" />
                <CardContent className="p-3 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </CardContent>
              </Card>
            ))}

          {!loading &&
            recommendations.map((movie) => (
              <Card
                key={movie.imdbID}
                className="w-40 flex-shrink-0 group relative overflow-hidden transition-all hover:border-foreground/20"
              >
                <Link href={`/movie/${movie.imdbID}`} prefetch className="block">
                  <div className="aspect-[2/3] relative bg-muted">
                    {movie.Poster !== "N/A" ? (
                      <Image
                        src={movie.Poster}
                        alt={movie.Title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="160px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm leading-snug line-clamp-2 text-card-foreground">
                      {movie.Title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {movie.Year}
                    </p>
                    {movie.reason && (
                      <p className="text-xs text-accent mt-1 line-clamp-2">
                        {movie.reason}
                      </p>
                    )}
                  </CardContent>
                </Link>

                {/* Add to watchlist button */}
                <Button
                  variant={watchlistMovies.includes(movie.imdbID) ? "default" : "secondary"}
                  size="icon"
                  className={cn(
                    "absolute top-2 right-2 h-7 w-7 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10",
                    watchlistMovies.includes(movie.imdbID)
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "bg-background/80 text-foreground hover:bg-background"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWatchlist(movie);
                  }}
                  title={
                    watchlistMovies.includes(movie.imdbID)
                      ? "Remove from watchlist"
                      : "Add to watchlist"
                  }
                >
                  {watchlistMovies.includes(movie.imdbID) ? (
                    <BookmarkCheck className="h-3.5 w-3.5" />
                  ) : (
                    <Bookmark className="h-3.5 w-3.5" />
                  )}
                </Button>
              </Card>
            ))}
        </div>
      </div>

      {!loading && recommendations.length === 0 && hasEnoughRatings && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No recommendations available. Try refreshing or rate more movies.
        </p>
      )}
    </div>
  );
}
