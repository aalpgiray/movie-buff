"use client";

import { Eye, Bookmark, Film } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Movie } from "@/lib/types";

interface MovieCardProps {
  movie: Movie;
  onToggleSeen: (id: string) => void;
  isSeen: boolean;
  onToggleWatchlist?: (id: string) => void;
  isInWatchlist?: boolean;
}

export function MovieCard({ movie, onToggleSeen, isSeen, onToggleWatchlist, isInWatchlist }: MovieCardProps) {
  return (
    <div className={cn(
      "group relative rounded-xl overflow-hidden bg-card border border-border transition-all hover:border-foreground/20 hover:shadow-xl",
      isSeen && "opacity-60"
    )}>
      <Link href={`/movie/${movie.imdbID}`} prefetch className="block">
        <div className="aspect-[2/3] relative bg-muted">
          {movie.Poster !== "N/A" ? (
            <Image
              src={movie.Poster}
              alt={movie.Title}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-3">
          <h3 className="font-medium text-sm leading-snug line-clamp-2 text-card-foreground">
            {movie.Title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{movie.Year}</p>
        </div>
      </Link>

      {/* Action buttons — appear on hover */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        {onToggleWatchlist && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWatchlist(movie.imdbID); }}
            className={cn(
              "p-1.5 rounded-lg backdrop-blur-md transition-all",
              isInWatchlist ? "bg-accent text-accent-foreground" : "bg-black/50 text-white hover:bg-black/70"
            )}
            title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Bookmark className={cn("h-3.5 w-3.5", isInWatchlist && "fill-current")} />
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSeen(movie.imdbID); }}
          className={cn(
            "p-1.5 rounded-lg backdrop-blur-md transition-all",
            isSeen ? "bg-foreground text-background" : "bg-black/50 text-white hover:bg-black/70"
          )}
          title={isSeen ? "Mark as unwatched" : "Mark as watched"}
        >
          <Eye className={cn("h-3.5 w-3.5", isSeen && "fill-current")} />
        </button>
      </div>

      {/* Seen indicator */}
      {isSeen && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-1.5 py-0.5 text-xs font-medium bg-foreground/90 text-background rounded">
            Seen
          </span>
        </div>
      )}
    </div>
  );
}
