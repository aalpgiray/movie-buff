"use client";

import { Eye, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MovieDetailActionsProps {
  imdbID: string;
}

export function MovieDetailActions({ imdbID }: MovieDetailActionsProps) {
  const [isSeen, setIsSeen] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    const seen: string[] = JSON.parse(localStorage.getItem("seenMovies") || "[]");
    const watchlist: string[] = JSON.parse(localStorage.getItem("watchlistMovies") || "[]");
    setIsSeen(seen.includes(imdbID));
    setIsInWatchlist(watchlist.includes(imdbID));
  }, [imdbID]);

  const toggleSeen = () => {
    const seen: string[] = JSON.parse(localStorage.getItem("seenMovies") || "[]");
    const next = seen.includes(imdbID)
      ? seen.filter((id) => id !== imdbID)
      : [...seen, imdbID];
    localStorage.setItem("seenMovies", JSON.stringify(next));
    setIsSeen(next.includes(imdbID));
  };

  const toggleWatchlist = () => {
    const watchlist: string[] = JSON.parse(localStorage.getItem("watchlistMovies") || "[]");
    const next = watchlist.includes(imdbID)
      ? watchlist.filter((id) => id !== imdbID)
      : [...watchlist, imdbID];
    localStorage.setItem("watchlistMovies", JSON.stringify(next));
    setIsInWatchlist(next.includes(imdbID));
  };

  return (
    <div className="flex gap-3 mt-4">
      <button
        onClick={toggleWatchlist}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium",
          isInWatchlist
            ? "bg-amber-500 text-white shadow-lg shadow-amber-500/50 hover:bg-amber-600"
            : "bg-secondary border border-border text-foreground hover:bg-secondary/80"
        )}
        title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      >
        <Bookmark className={cn("h-4 w-4", isInWatchlist && "fill-current")} />
        {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
      </button>

      <button
        onClick={toggleSeen}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium",
          isSeen
            ? "bg-green-500 text-white shadow-lg shadow-green-500/50 hover:bg-green-600"
            : "bg-secondary border border-border text-foreground hover:bg-secondary/80"
        )}
        title={isSeen ? "Mark as unwatched" : "Mark as watched"}
      >
        <Eye className={cn("h-4 w-4", isSeen && "fill-current")} />
        {isSeen ? "Watched" : "Mark as Watched"}
      </button>
    </div>
  );
}
