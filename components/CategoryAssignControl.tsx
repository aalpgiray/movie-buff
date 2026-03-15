"use client";

import { useState, useRef, useEffect } from "react";
import { Tag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assignMovieToCategory, unassignMovieFromCategory } from "@/lib/movie-db";
import type { WatchlistCategory } from "@/lib/types";

interface CategoryAssignControlProps {
  imdbID: string;
  categories: WatchlistCategory[];
  onAssignmentChange: () => void;
}

export default function CategoryAssignControl({
  imdbID,
  categories,
  onAssignmentChange,
}: CategoryAssignControlProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleToggle(categoryId: string, isChecked: boolean) {
    if (isChecked) {
      await unassignMovieFromCategory(imdbID, categoryId);
    } else {
      await assignMovieToCategory(imdbID, categoryId);
    }
    onAssignmentChange();
  }

  if (categories.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Create a category first
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Tag className="h-4 w-4" />
        Categories
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-md border border-input bg-popover p-1 shadow-md">
          <ul role="listbox" className="flex flex-col gap-0.5">
            {categories.map((cat) => {
              const isChecked = cat.movieIds.includes(imdbID);
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isChecked}
                    onClick={() => handleToggle(cat.id, isChecked)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input bg-background">
                      {isChecked && <Check className="h-3 w-3" />}
                    </span>
                    {cat.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
