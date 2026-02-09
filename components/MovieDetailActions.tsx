"use client";

import { Eye, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface MovieDetailActionsProps {
  imdbID: string;
  isSeen: boolean;
  isInWatchlist: boolean;
  onToggleSeen: (id: string) => void;
  onToggleWatchlist: (id: string) => void;
}

export function MovieDetailActions({
  imdbID,
  isSeen,
  isInWatchlist,
  onToggleSeen,
  onToggleWatchlist,
}: MovieDetailActionsProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => onToggleWatchlist(imdbID)}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium",
          isInWatchlist
            ? "bg-amber-500 text-white shadow-lg shadow-amber-500/50 hover:bg-amber-600"
            : "bg-secondary border border-border text-foreground hover:bg-secondary/80"
        )}
        title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      >
        <Bookmark
          className={cn("h-4 w-4", isInWatchlist && "fill-current")}
        />
        {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
      </button>

      <button
        onClick={() => onToggleSeen(imdbID)}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium",
          isSeen
            ? "bg-green-500 text-white shadow-lg shadow-green-500/50 hover:bg-green-600"
            : "bg-secondary border border-border text-foreground hover:bg-secondary/80"
        )}
        title={isSeen ? "Mark as unwatched" : "Mark as watched"}
      >
        <Eye
          className={cn("h-4 w-4", isSeen && "fill-current")}
        />
        {isSeen ? "Watched" : "Mark as Watched"}
      </button>
    </div>
  );
}
