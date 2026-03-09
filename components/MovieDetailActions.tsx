"use client";

import { Eye, EyeOff, Bookmark, BookmarkCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { upsertMovie } from "@/lib/movie-db";

interface MovieDetailActionsProps {
  imdbID: string;
  title: string;
  year: string;
  poster: string;
  type: string;
  /** OMDB imdbRating string, e.g. "8.5". Stored in IDB when user marks as watched. */
  imdbRating?: string;
}

export function MovieDetailActions({ imdbID, title, year, poster, type, imdbRating }: MovieDetailActionsProps) {
  const [isSeen, setIsSeen] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [seenFeedback, setSeenFeedback] = useState(false);
  const [watchlistFeedback, setWatchlistFeedback] = useState(false);

  useEffect(() => {
    const seen: string[] = JSON.parse(localStorage.getItem("seenMovies") || "[]");
    const watchlist: string[] = JSON.parse(localStorage.getItem("watchlistMovies") || "[]");
    setIsSeen(seen.includes(imdbID));
    setIsInWatchlist(watchlist.includes(imdbID));
  }, [imdbID]);

  const flash = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 1500);
  };

  const saveDetails = (detailsKey: string) => {
    const details = JSON.parse(localStorage.getItem(detailsKey) || "{}");
    details[imdbID] = { title, year, poster, type };
    localStorage.setItem(detailsKey, JSON.stringify(details));
  };

  const toggleSeen = () => {
    const seen: string[] = JSON.parse(localStorage.getItem("seenMovies") || "[]");
    const adding = !seen.includes(imdbID);
    const next = adding ? [...seen, imdbID] : seen.filter((id) => id !== imdbID);
    localStorage.setItem("seenMovies", JSON.stringify(next));
    if (adding) saveDetails("seenMoviesDetails");
    setIsSeen(adding);
    flash(setSeenFeedback);
    window.dispatchEvent(new Event("listsUpdated"));

    // Persist seen state and IMDB rating into IndexedDB so the default list
    // can sort seen movies by quality when the user returns to the home page.
    const ratingNum = imdbRating ? parseFloat(imdbRating) : undefined;
    upsertMovie({
      imdbID,
      isSeen: adding,
      ...(adding && ratingNum !== undefined && !isNaN(ratingNum) ? { rating: ratingNum } : {}),
    }).catch(() => {/* IDB unavailable — silent fail */});
  };

  const toggleWatchlist = () => {
    const watchlist: string[] = JSON.parse(localStorage.getItem("watchlistMovies") || "[]");
    const adding = !watchlist.includes(imdbID);
    const next = adding ? [...watchlist, imdbID] : watchlist.filter((id) => id !== imdbID);
    localStorage.setItem("watchlistMovies", JSON.stringify(next));
    if (adding) saveDetails("watchlistMoviesDetails");
    setIsInWatchlist(adding);
    flash(setWatchlistFeedback);
    window.dispatchEvent(new Event("listsUpdated"));
  };

  return (
    <div className="flex gap-3 mt-4">
      <Button
        onClick={toggleWatchlist}
        variant={isInWatchlist ? "default" : "secondary"}
        className={cn(
          isInWatchlist && "bg-accent text-accent-foreground hover:bg-accent/90"
        )}
        title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      >
        {watchlistFeedback
          ? <Check className="h-4 w-4" />
          : isInWatchlist 
            ? <BookmarkCheck className="h-4 w-4" />
            : <Bookmark className="h-4 w-4" />
        }
        {watchlistFeedback
          ? (isInWatchlist ? "Added!" : "Removed!")
          : (isInWatchlist ? "In Watchlist" : "Add to Watchlist")
        }
      </Button>

      <Button
        onClick={toggleSeen}
        variant={isSeen ? "default" : "secondary"}
        title={isSeen ? "Mark as unwatched" : "Mark as watched"}
      >
        {seenFeedback
          ? <Check className="h-4 w-4" />
          : isSeen 
            ? <EyeOff className="h-4 w-4" />
            : <Eye className="h-4 w-4" />
        }
        {seenFeedback
          ? (isSeen ? "Marked!" : "Removed!")
          : (isSeen ? "Watched" : "Mark as Watched")
        }
      </Button>
    </div>
  );
}
