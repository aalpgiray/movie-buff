"use client";

import { useState, useEffect, useCallback } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMovieStateAction, updateRatingAction } from "@/app/actions";

interface MovieRatingFormProps {
  imdbID: string;
}

export function MovieRatingForm({ imdbID }: MovieRatingFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  // Load existing rating and comment from Supabase
  useEffect(() => {
    getMovieStateAction(imdbID).then((state) => {
      if (state) {
        if (state.rating !== null) setRating(state.rating);
        if (state.comment) setComment(state.comment);
      }
    });
  }, [imdbID]);

  // Save function
  const saveData = useCallback(
    async (newRating: number | null, newComment: string) => {
      const result = await updateRatingAction(imdbID, newRating, newComment || null);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    },
    [imdbID]
  );

  const handleRatingClick = (value: number) => {
    const newRating = rating === value ? null : value;
    setRating(newRating);
    saveData(newRating, comment);
  };

  // Debounce comment changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (rating !== null || comment) {
        saveData(rating, comment);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment]);

  const getRatingLabel = (value: number) => {
    if (value <= 2) return "Poor";
    if (value <= 4) return "Below Average";
    if (value <= 5) return "Average";
    if (value <= 7) return "Good";
    if (value <= 9) return "Excellent";
    return "Masterpiece";
  };

  const displayRating = hoveredRating ?? rating;

  return (
    <div className="mt-6 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Your Rating</h3>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-accent">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>

      {/* 10-point rating scale */}
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleRatingClick(value)}
            onMouseEnter={() => setHoveredRating(value)}
            onMouseLeave={() => setHoveredRating(null)}
            className={cn(
              "w-8 h-8 rounded-md text-sm font-medium transition-all",
              "border border-border hover:border-accent",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1",
              rating !== null && value <= rating
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-secondary text-secondary-foreground",
              hoveredRating !== null &&
                value <= hoveredRating &&
                rating !== null &&
                value > rating &&
                "bg-accent/50"
            )}
            aria-label={`Rate ${value} out of 10`}
          >
            {value}
          </button>
        ))}
      </div>

      {/* Rating label */}
      <p className="text-xs text-muted-foreground mb-4 h-4">
        {displayRating !== null && (
          <>
            <span className="text-foreground font-medium">{displayRating}/10</span>
            {" - "}
            {getRatingLabel(displayRating)}
          </>
        )}
      </p>

      {/* Comment textarea */}
      <div>
        <label
          htmlFor={`comment-${imdbID}`}
          className="block text-sm font-medium text-foreground mb-2"
        >
          Your Thoughts{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id={`comment-${imdbID}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you think about this movie?"
          maxLength={500}
          className={cn(
            "w-full min-h-[80px] resize-none rounded-md px-3 py-2",
            "bg-secondary text-foreground placeholder:text-muted-foreground",
            "border border-border focus:border-accent",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1",
            "text-sm"
          )}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {comment.length}/500
        </p>
      </div>
    </div>
  );
}
