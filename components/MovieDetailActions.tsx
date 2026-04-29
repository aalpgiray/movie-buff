"use client";

import { Eye, EyeOff, Bookmark, BookmarkCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { upsertMovie, getList, setList, getCategories } from "@/lib/movie-db";
import type { WatchlistCategory } from "@/lib/types";
import CategoryAssignControl from "@/components/CategoryAssignControl";
import { MovieRatingForm } from "@/components/MovieRatingForm";

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
  const [categories, setCategories] = useState<WatchlistCategory[]>([]);

  useEffect(() => {
    Promise.all([getList("seenMovies"), getList("watchlistMovies"), getCategories()]).then(
      ([seen, watchlist, cats]) => {
        setIsSeen(seen.includes(imdbID));
        const inWatchlist = watchlist.includes(imdbID);
        setIsInWatchlist(inWatchlist);
        if (inWatchlist) setCategories(cats);
      }
    );
  }, [imdbID]);

  const refreshCategories = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  const flash = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 1500);
  };

  const toggleSeen = async () => {
    const seen = await getList("seenMovies");
    const adding = !seen.includes(imdbID);
    const next = adding ? [...seen, imdbID] : seen.filter((id) => id !== imdbID);
    await setList("seenMovies", next);

    // Persist full movie details + seen state + rating into the movies store.
    const ratingNum = imdbRating ? parseFloat(imdbRating) : undefined;
    await upsertMovie({
      imdbID,
      Title: title,
      Year: year,
      Poster: poster,
      Type: type,
      isSeen: adding,
      ...(adding && ratingNum !== undefined && !isNaN(ratingNum) ? { rating: ratingNum } : {}),
    });

    setIsSeen(adding);
    flash(setSeenFeedback);
    window.dispatchEvent(new Event("listsUpdated"));
  };

  const toggleWatchlist = async () => {
    const watchlist = await getList("watchlistMovies");
    const adding = !watchlist.includes(imdbID);
    const next = adding ? [...watchlist, imdbID] : watchlist.filter((id) => id !== imdbID);
    await setList("watchlistMovies", next);

    // Persist full movie details into the movies store so watchlist page can display them.
    await upsertMovie({ imdbID, Title: title, Year: year, Poster: poster, Type: type });

    setIsInWatchlist(adding);
    flash(setWatchlistFeedback);
    if (adding) {
      const cats = await getCategories();
      setCategories(cats);
    } else {
      setCategories([]);
    }
    window.dispatchEvent(new Event("listsUpdated"));
  };

  return (
    <div className="flex flex-col gap-3 mt-4">
      <div className="flex gap-3">
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
      {isInWatchlist && (
        <CategoryAssignControl
          imdbID={imdbID}
          categories={categories}
          onAssignmentChange={refreshCategories}
        />
      )}
      {console.log("[v0] isSeen state:", isSeen, "for movie:", imdbID)}
      {isSeen && <MovieRatingForm imdbID={imdbID} />}
    </div>
  );
}
