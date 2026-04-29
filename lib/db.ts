/**
 * db.ts
 * Server-side Supabase database layer for the movie-buff app.
 *
 * This replaces the client-side IndexedDB implementation with proper
 * server-side PostgreSQL storage via Supabase.
 *
 * All functions require an authenticated user context.
 */

import { createClient } from "@/lib/supabase/server";
import type { Movie, RatedMovie, WatchlistCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types for database rows
// ---------------------------------------------------------------------------

interface UserMovieRow {
  id: string;
  user_id: string;
  imdb_id: string;
  title: string;
  year: string | null;
  poster: string | null;
  type: string | null;
  reason: string | null;
  rating: number | null;
  comment: string | null;
  is_seen: boolean;
  is_recommendation: boolean;
  created_at: string;
  updated_at: string;
}

interface UserCategoryRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Movie Operations
// ---------------------------------------------------------------------------

/**
 * Get all movies for the current user's watchlist.
 */
export async function getWatchlistMovies(): Promise<Movie[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_movies")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching watchlist:", error);
    return [];
  }

  return (data || []).map(rowToMovie);
}

/**
 * Get all movies the user has marked as seen.
 */
export async function getSeenMovies(): Promise<Movie[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_movies")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_seen", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching seen movies:", error);
    return [];
  }

  return (data || []).map(rowToMovie);
}

/**
 * Get a single movie by IMDB ID for the current user.
 */
export async function getMovieByImdbId(imdbId: string): Promise<Movie | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_movies")
    .select("*")
    .eq("user_id", user.id)
    .eq("imdb_id", imdbId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching movie:", error);
    return null;
  }

  return data ? rowToMovie(data) : null;
}

/**
 * Add a movie to the user's watchlist.
 */
export async function addToWatchlist(movie: Movie): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("user_movies").upsert(
    {
      user_id: user.id,
      imdb_id: movie.imdbID,
      title: movie.Title,
      year: movie.Year || null,
      poster: movie.Poster || null,
      type: movie.Type || "movie",
      reason: movie.reason || null,
      is_recommendation: movie.isRecommendation || false,
    },
    { onConflict: "user_id,imdb_id" }
  );

  if (error) {
    console.error("Error adding to watchlist:", error);
    throw error;
  }
}

/**
 * Remove a movie from the user's watchlist.
 */
export async function removeFromWatchlist(imdbId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_movies")
    .delete()
    .eq("user_id", user.id)
    .eq("imdb_id", imdbId);

  if (error) {
    console.error("Error removing from watchlist:", error);
    throw error;
  }
}

/**
 * Mark a movie as seen/unseen.
 */
export async function toggleSeen(imdbId: string, isSeen: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_movies")
    .update({ is_seen: isSeen, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("imdb_id", imdbId);

  if (error) {
    console.error("Error toggling seen:", error);
    throw error;
  }
}

/**
 * Update a movie's rating and comment.
 */
export async function updateRating(
  imdbId: string,
  rating: number | null,
  comment: string | null
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_movies")
    .update({
      rating,
      comment,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("imdb_id", imdbId);

  if (error) {
    console.error("Error updating rating:", error);
    throw error;
  }
}

/**
 * Get all movies that have been rated by the user (rating > 0).
 */
export async function getRatedMovies(): Promise<RatedMovie[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_movies")
    .select("imdb_id, title, year, rating, comment")
    .eq("user_id", user.id)
    .not("rating", "is", null)
    .gt("rating", 0)
    .order("rating", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching rated movies:", error);
    return [];
  }

  return (data || []).map((row) => ({
    imdbID: row.imdb_id,
    Title: row.title,
    Year: row.year || "",
    rating: row.rating!,
    comment: row.comment || undefined,
  }));
}

/**
 * Get count of recommendations currently in the user's watchlist.
 */
export async function getRecommendationsCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from("user_movies")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_recommendation", true);

  if (error) {
    console.error("Error counting recommendations:", error);
    return 0;
  }

  return count || 0;
}

// ---------------------------------------------------------------------------
// Category Operations
// ---------------------------------------------------------------------------

/**
 * Get all categories for the current user.
 */
export async function getCategories(): Promise<WatchlistCategory[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Get categories
  const { data: categories, error: catError } = await supabase
    .from("user_categories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (catError) {
    console.error("Error fetching categories:", catError);
    return [];
  }

  if (!categories || categories.length === 0) return [];

  // Get all category-movie assignments for these categories
  const categoryIds = categories.map((c) => c.id);
  const { data: assignments, error: assignError } = await supabase
    .from("category_movies")
    .select("category_id, imdb_id")
    .in("category_id", categoryIds);

  if (assignError) {
    console.error("Error fetching category assignments:", assignError);
  }

  // Build category objects with movieIds
  const assignmentMap = new Map<string, string[]>();
  (assignments || []).forEach((a) => {
    const existing = assignmentMap.get(a.category_id) || [];
    existing.push(a.imdb_id);
    assignmentMap.set(a.category_id, existing);
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    movieIds: assignmentMap.get(c.id) || [],
  }));
}

/**
 * Create a new category.
 */
export async function createCategory(name: string): Promise<WatchlistCategory> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Validate name
  if (!name || name.length < 1) {
    throw new Error("Category name must be at least 1 character.");
  }
  if (name.length > 50) {
    throw new Error("Category name must be 50 characters or fewer.");
  }

  const { data, error } = await supabase
    .from("user_categories")
    .insert({ user_id: user.id, name })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(`A category named "${name}" already exists.`);
    }
    console.error("Error creating category:", error);
    throw error;
  }

  return { id: data.id, name: data.name, movieIds: [] };
}

/**
 * Rename a category.
 */
export async function renameCategory(id: string, newName: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  if (!newName || newName.length < 1) {
    throw new Error("Category name must be at least 1 character.");
  }
  if (newName.length > 50) {
    throw new Error("Category name must be 50 characters or fewer.");
  }

  const { error } = await supabase
    .from("user_categories")
    .update({ name: newName })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") {
      throw new Error(`A category named "${newName}" already exists.`);
    }
    console.error("Error renaming category:", error);
    throw error;
  }
}

/**
 * Delete a category.
 */
export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
}

/**
 * Assign a movie to a category.
 */
export async function assignMovieToCategory(
  imdbId: string,
  categoryId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("category_movies")
    .upsert({ category_id: categoryId, imdb_id: imdbId }, { onConflict: "category_id,imdb_id" });

  if (error) {
    console.error("Error assigning movie to category:", error);
    throw error;
  }
}

/**
 * Unassign a movie from a category.
 */
export async function unassignMovieFromCategory(
  imdbId: string,
  categoryId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("category_movies")
    .delete()
    .eq("category_id", categoryId)
    .eq("imdb_id", imdbId);

  if (error) {
    console.error("Error unassigning movie from category:", error);
    throw error;
  }
}

/**
 * Remove a movie from all categories.
 */
export async function removeMovieFromAllCategories(imdbId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Get user's category IDs first
  const { data: categories } = await supabase
    .from("user_categories")
    .select("id")
    .eq("user_id", user.id);

  if (!categories || categories.length === 0) return;

  const categoryIds = categories.map((c) => c.id);

  const { error } = await supabase
    .from("category_movies")
    .delete()
    .eq("imdb_id", imdbId)
    .in("category_id", categoryIds);

  if (error) {
    console.error("Error removing movie from categories:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Dismissed Recommendations
// ---------------------------------------------------------------------------

/**
 * Get list of dismissed recommendation IMDB IDs.
 */
export async function getDismissedRecommendations(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("dismissed_recommendations")
    .select("imdb_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching dismissed recommendations:", error);
    return [];
  }

  return (data || []).map((row) => row.imdb_id);
}

/**
 * Add a movie to dismissed recommendations.
 */
export async function addDismissedRecommendation(imdbId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("dismissed_recommendations")
    .upsert({ user_id: user.id, imdb_id: imdbId }, { onConflict: "user_id,imdb_id" });

  if (error) {
    console.error("Error adding dismissed recommendation:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function rowToMovie(row: UserMovieRow): Movie {
  return {
    imdbID: row.imdb_id,
    Title: row.title,
    Year: row.year || "",
    Poster: row.poster || "N/A",
    Type: row.type || "movie",
    reason: row.reason || undefined,
    rating: row.rating || undefined,
    comment: row.comment || undefined,
    isSeen: row.is_seen,
    isRecommendation: row.is_recommendation,
  };
}

// ---------------------------------------------------------------------------
// User check helper
// ---------------------------------------------------------------------------

/**
 * Get the current authenticated user, or null if not logged in.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
