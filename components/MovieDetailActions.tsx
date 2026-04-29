"use client";

import { Eye, EyeOff, Bookmark, BookmarkCheck, Check, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  getMovieStateAction,
  addToWatchlistAction,
  removeFromWatchlistAction,
  toggleSeenAction,
  getCategoriesAction,
  isAuthenticatedAction,
} from "@/app/actions";
import type { WatchlistCategory } from "@/lib/types";
import CategoryAssignControl from "@/components/CategoryAssignControl";
import { MovieRatingForm } from "@/components/MovieRatingForm";
import { emitWatchlistChange } from "@/lib/events";
import Link from "next/link";

interface MovieDetailActionsProps {
  imdbID: string;
  title: string;
  year: string;
  poster: string;
  type: string;
  imdbRating?: string;
}

export function MovieDetailActions({ imdbID, title, year, poster, type }: MovieDetailActionsProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSeen, setIsSeen] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [seenFeedback, setSeenFeedback] = useState(false);
  const [watchlistFeedback, setWatchlistFeedback] = useState(false);
  const [categories, setCategories] = useState<WatchlistCategory[]>([]);

  useEffect(() => {
    async function loadState() {
      const authenticated = await isAuthenticatedAction();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const [movieState, cats] = await Promise.all([
          getMovieStateAction(imdbID),
          getCategoriesAction(),
        ]);

        if (movieState) {
          setIsInWatchlist(movieState.isInWatchlist);
          setIsSeen(movieState.isSeen);
        }
        setCategories(cats);
      }
    }
    loadState();
  }, [imdbID]);

  const refreshCategories = async () => {
    const cats = await getCategoriesAction();
    setCategories(cats);
  };

  const flash = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 1500);
  };

  const toggleSeen = async () => {
    const newSeen = !isSeen;
    const result = await toggleSeenAction(imdbID, newSeen);
    if (result.success) {
      setIsSeen(newSeen);
      flash(setSeenFeedback);
      emitWatchlistChange();
      router.refresh();
    }
  };

  const toggleWatchlist = async () => {
    if (isInWatchlist) {
      const result = await removeFromWatchlistAction(imdbID);
      if (result.success) {
        setIsInWatchlist(false);
        setCategories([]);
        flash(setWatchlistFeedback);
        emitWatchlistChange();
        router.refresh();
      }
    } else {
      const result = await addToWatchlistAction({
        imdbID,
        Title: title,
        Year: year,
        Poster: poster,
        Type: type,
      });
      if (result.success) {
        setIsInWatchlist(true);
        const cats = await getCategoriesAction();
        setCategories(cats);
        flash(setWatchlistFeedback);
        emitWatchlistChange();
        router.refresh();
      }
    }
  };

  // Show loading state
  if (isAuthenticated === null) {
    return (
      <div className="flex gap-3 mt-4">
        <Button variant="secondary" disabled>
          Loading...
        </Button>
      </div>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-3 mt-4">
        <Link href="/auth/login">
          <Button variant="secondary">
            <LogIn className="h-4 w-4" />
            Sign in to save movies
          </Button>
        </Link>
      </div>
    );
  }

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
          {watchlistFeedback ? (
            <Check className="h-4 w-4" />
          ) : isInWatchlist ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          {watchlistFeedback
            ? isInWatchlist
              ? "Added!"
              : "Removed!"
            : isInWatchlist
              ? "In Watchlist"
              : "Add to Watchlist"}
        </Button>

        <Button
          onClick={toggleSeen}
          variant={isSeen ? "default" : "secondary"}
          title={isSeen ? "Mark as unwatched" : "Mark as watched"}
        >
          {seenFeedback ? (
            <Check className="h-4 w-4" />
          ) : isSeen ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          {seenFeedback
            ? isSeen
              ? "Marked!"
              : "Removed!"
            : isSeen
              ? "Watched"
              : "Mark as Watched"}
        </Button>
      </div>
      {isInWatchlist && (
        <CategoryAssignControl
          imdbID={imdbID}
          categories={categories}
          onAssignmentChange={refreshCategories}
        />
      )}
      {isSeen && <MovieRatingForm imdbID={imdbID} />}
    </div>
  );
}
