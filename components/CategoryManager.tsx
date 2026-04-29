"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCategoryAction,
  renameCategoryAction,
  deleteCategoryAction,
  getWatchlistAction,
} from "@/app/actions";
import type { WatchlistCategory, Movie } from "@/lib/types";

interface CategoryManagerProps {
  categories: WatchlistCategory[];
  onCategoriesChange: () => void;
}

export default function CategoryManager({
  categories,
  onCategoriesChange,
}: CategoryManagerProps) {
  const [watchlistMovies, setWatchlistMovies] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoError, setAutoError] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getWatchlistAction().then((movies: Movie[]) => {
      setWatchlistMovies(movies.map((m) => m.imdbID));
    });
  }, []);

  // Focus the rename input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  function movieCount(category: WatchlistCategory): number {
    return category.movieIds.filter((id) => watchlistMovies.includes(id)).length;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const result = await createCategoryAction(newName.trim());
    if (result.success) {
      setNewName("");
      onCategoriesChange();
    } else {
      setCreateError(result.error || "Failed to create category.");
    }
  }

  function startEdit(category: WatchlistCategory) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditError(null);
  }

  async function handleRename(id: string) {
    setEditError(null);
    const result = await renameCategoryAction(id, editName.trim());
    if (result.success) {
      setEditingId(null);
      setEditName("");
      onCategoriesChange();
    } else {
      setEditError(result.error || "Failed to rename category.");
    }
  }

  async function handleDelete(id: string) {
    await deleteCategoryAction(id);
    onCategoriesChange();
  }

  async function handleAutoCategorize() {
    setAutoLoading(true);
    setAutoError(null);
    try {
      const watchlist = await getWatchlistAction();
      const movies = watchlist.map((m) => ({
        imdbID: m.imdbID,
        title: m.Title,
        year: m.Year,
      }));

      if (!movies.length) {
        setAutoError("Add some movies to your watchlist first.");
        return;
      }

      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movies }),
      });
      const data = await res.json();

      if (!data.categories?.length) {
        setAutoError("AI couldn't suggest categories. Try again.");
        return;
      }

      // Create each suggested category
      for (const cat of data.categories) {
        await createCategoryAction(cat.name);
      }

      onCategoriesChange();
    } catch {
      setAutoError("Something went wrong. Try again.");
    } finally {
      setAutoLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Existing categories */}
      {categories.length > 0 && (
        <ul className="flex flex-col gap-1">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2"
            >
              {editingId === cat.id ? (
                <form
                  className="flex flex-1 items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRename(cat.id);
                  }}
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <Input
                      ref={editInputRef}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Escape" && cancelEdit()}
                      className="h-8 text-sm"
                      aria-label="Rename category"
                    />
                    {editError && (
                      <p className="text-xs text-destructive">{editError}</p>
                    )}
                  </div>
                  <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label="Save rename">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={cancelEdit} aria-label="Cancel rename">
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <>
                  <span className="flex-1 text-sm text-foreground">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">{movieCount(cat)}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => startEdit(cat)}
                    aria-label={`Rename ${cat.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(cat.id)}
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Create new category */}
      <form onSubmit={handleCreate} className="flex flex-col gap-1">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setCreateError(null);
            }}
            placeholder="New category name"
            className="h-9 text-sm"
            aria-label="New category name"
          />
          <Button type="submit" size="sm" className="shrink-0" aria-label="Create category">
            <Plus className="h-4 w-4" />
            Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={handleAutoCategorize}
            disabled={autoLoading}
            aria-label="Auto-categorize with AI"
          >
            <Sparkles className="h-4 w-4" />
            {autoLoading ? "Thinking..." : "Auto"}
          </Button>
        </div>
        {createError && (
          <p className="text-xs text-destructive">{createError}</p>
        )}
        {autoError && (
          <p className="text-xs text-destructive">{autoError}</p>
        )}
      </form>
    </div>
  );
}
