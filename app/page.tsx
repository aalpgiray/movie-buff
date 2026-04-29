"use client";

import { useEffect, useState, useCallback } from "react";
import { MovieCard } from "@/components/MovieCard";
import { SearchBar } from "@/components/SearchBar";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { Movie } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  addToWatchlistAction,
  removeFromWatchlistAction,
  toggleSeenAction,
  getWatchlistAction,
  getSeenMoviesAction,
} from "@/app/actions";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { LogIn } from "lucide-react";

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [seenMovieIds, setSeenMovieIds] = useState<Set<string>>(new Set());
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Load auth state and user data
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);
      if (user) {
        loadUserData();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData();
      } else {
        setSeenMovieIds(new Set());
        setWatchlistIds(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async () => {
    try {
      const [watchlist, seen] = await Promise.all([
        getWatchlistAction(),
        getSeenMoviesAction(),
      ]);
      setWatchlistIds(new Set(watchlist.map((m) => m.imdbID)));
      setSeenMovieIds(new Set(seen.map((m) => m.imdbID)));
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const toggleSeen = useCallback(
    async (id: string) => {
      if (!user) return;

      const isCurrentlySeen = seenMovieIds.has(id);

      try {
        const result = await toggleSeenAction(id, !isCurrentlySeen);
        if (!result.success) {
          console.error("Error toggling seen:", result.error);
          return;
        }

        const newSet = new Set(seenMovieIds);
        if (isCurrentlySeen) {
          newSet.delete(id);
        } else {
          newSet.add(id);
          // If marking as seen and not in watchlist, add to watchlist first
          if (!watchlistIds.has(id)) {
            const movie = movies.find((m) => m.imdbID === id);
            if (movie) {
              const addResult = await addToWatchlistAction(movie);
              if (addResult.success) {
                setWatchlistIds((prev) => new Set([...prev, id]));
              }
            }
          }
        }

        setSeenMovieIds(newSet);
      } catch (error) {
        console.error("Error in toggleSeen:", error);
      }
    },
    [user, seenMovieIds, watchlistIds, movies]
  );

  const toggleWatchlist = useCallback(
    async (id: string) => {
      if (!user) return;

      const isCurrentlyInWatchlist = watchlistIds.has(id);

      try {
        let result;
        if (isCurrentlyInWatchlist) {
          result = await removeFromWatchlistAction(id);
        } else {
          const movie = movies.find((m) => m.imdbID === id);
          if (!movie) return;
          result = await addToWatchlistAction(movie);
        }

        if (!result.success) {
          console.error("Error toggling watchlist:", result.error);
          return;
        }

        const newSet = new Set(watchlistIds);
        if (isCurrentlyInWatchlist) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        setWatchlistIds(newSet);
      } catch (error) {
        console.error("Error in toggleWatchlist:", error);
      }
    },
    [user, watchlistIds, movies]
  );

  const handleSearch = async (query: string) => {
    setLoading(true);
    setMovies([]);
    setSearchTerms([]);
    setCurrentQuery(query);
    setHasSearched(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          seenMovies: [],
          seenMovieIds: Array.from(seenMovieIds),
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
      const allSeenIds = [...Array.from(seenMovieIds), ...currentIds];

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: currentQuery,
          seenMovies: [],
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

  const hasResults = movies.length > 0;
  const isEmpty = !loading && hasResults === false;

  return (
    <>
      <HeaderWrapper />

      <main className="min-h-screen bg-background text-foreground pt-14">
        {/* Hero / Search */}
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-12">
          {!hasSearched && (
            <div className="mb-10">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground text-balance mb-4">
                What are you in
                <br />
                the mood for?
              </h1>
              <p className="text-muted-foreground text-lg">
                Describe a feeling, genre, or vibe and we&apos;ll find the
                perfect film.
              </p>
            </div>
          )}
          <SearchBar
            onSearch={handleSearch}
            onClear={() => {
              setHasSearched(false);
              setMovies([]);
              setSearchTerms([]);
              setCurrentQuery("");
            }}
            isLoading={loading}
            initialQuery={currentQuery}
          />

          {/* Search terms */}
          {searchTerms.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchTerms.map((term) => (
                <Badge key={term} variant="outline">
                  {term}
                </Badge>
              ))}
            </div>
          )}

          {/* Sign in prompt for non-authenticated users */}
          {!authLoading && !user && hasSearched && movies.length > 0 && (
            <div className="mt-6 p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3">
                <LogIn className="h-5 w-5 text-accent" />
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium">
                    Sign in to save movies
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Create a free account to build your watchlist and track
                    watched movies.
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Movie grid */}
        {(hasResults || loading) && (
          <div className="max-w-7xl mx-auto px-6 pb-24">
            {/* Section header */}
            {hasResults && (
              <p className="text-sm text-muted-foreground mb-6">
                {`${movies.length} films for \u201c${currentQuery}\u201d`}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.map((movie: Movie, index: number) => (
                <div key={movie.imdbID} className="relative group/card">
                  <MovieCard
                    movie={movie}
                    isSeen={seenMovieIds.has(movie.imdbID)}
                    onToggleSeen={user ? toggleSeen : undefined}
                    isInWatchlist={watchlistIds.has(movie.imdbID)}
                    onToggleWatchlist={user ? toggleWatchlist : undefined}
                    priority={index < 6}
                  />
                  {movie.reason && (
                    <Card className="absolute -bottom-1 left-0 right-0 mx-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                      <CardContent className="p-2 text-xs">
                        <span className="text-accent font-semibold">Why? </span>
                        <span className="text-card-foreground">
                          {movie.reason}
                        </span>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}

              {/* Loading skeletons */}
              {loading &&
                !hasResults &&
                Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[2/3]" />
                    <CardContent className="p-3 space-y-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Load more — only on search results */}
            {hasSearched && movies.length > 0 && (
              <div className="flex justify-center mt-12">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty state — pre-search */}
        {!hasSearched && isEmpty && (
          <div className="max-w-3xl mx-auto px-6 py-12 text-center">
            <p className="text-muted-foreground">
              Search for a movie to get started.
            </p>
          </div>
        )}

        {/* Empty state — after a search found nothing */}
        {hasSearched && !loading && movies.length === 0 && (
          <div className="max-w-3xl mx-auto px-6 py-12 text-center">
            <p className="text-muted-foreground">
              No films found. Try a different search.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
