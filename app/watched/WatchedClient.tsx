"use client";

import { useState, useTransition } from "react";
import { MovieCard } from "@/components/MovieCard";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Movie } from "@/lib/types";
import { toggleSeenAction } from "@/app/actions";

interface WatchedClientProps {
  initialMovies: Movie[];
}

export function WatchedClient({ initialMovies }: WatchedClientProps) {
  const [watchedMovies, setWatchedMovies] = useState<Movie[]>(initialMovies);
  const [isPending, startTransition] = useTransition();

  const handleToggleSeen = async (id: string) => {
    startTransition(async () => {
      await toggleSeenAction(id, false);
      setWatchedMovies((prev) => prev.filter((m) => m.imdbID !== id));
    });
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
              {watchedMovies.length}{" "}
              {watchedMovies.length === 1 ? "movie" : "movies"} in your watch
              history
            </p>
          </div>

          {isPending ? (
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
