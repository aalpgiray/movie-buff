"use server";

import {
  getWatchlistMovies,
  getSeenMovies,
  getMovieByImdbId,
  addToWatchlist,
  removeFromWatchlist,
  toggleSeen,
  updateRating,
  getRatedMovies,
  getRecommendationsCount,
  getCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  assignMovieToCategory,
  unassignMovieFromCategory,
  removeMovieFromAllCategories,
  getDismissedRecommendations,
  addDismissedRecommendation,
  getCurrentUser,
} from "@/lib/db";
import type { Movie, WatchlistCategory, RatedMovie } from "@/lib/types";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Movie Actions
// ---------------------------------------------------------------------------

export async function getWatchlistAction(): Promise<Movie[]> {
  return getWatchlistMovies();
}

export async function getSeenMoviesAction(): Promise<Movie[]> {
  return getSeenMovies();
}

export async function getMovieStateAction(imdbId: string): Promise<{
  isInWatchlist: boolean;
  isSeen: boolean;
  rating: number | null;
  comment: string | null;
} | null> {
  const movie = await getMovieByImdbId(imdbId);
  if (!movie) return null;
  return {
    isInWatchlist: true,
    isSeen: movie.isSeen || false,
    rating: movie.rating || null,
    comment: movie.comment || null,
  };
}

export async function addToWatchlistAction(movie: Movie): Promise<{ success: boolean; error?: string }> {
  try {
    await addToWatchlist(movie);
    revalidatePath("/watchlist", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function removeFromWatchlistAction(imdbId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await removeFromWatchlist(imdbId);
    revalidatePath("/watchlist", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function toggleSeenAction(imdbId: string, isSeen: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    await toggleSeen(imdbId, isSeen);
    revalidatePath("/watched", "page");
    revalidatePath("/watchlist", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateRatingAction(
  imdbId: string,
  rating: number | null,
  comment: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateRating(imdbId, rating, comment);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getRatedMoviesAction(): Promise<RatedMovie[]> {
  return getRatedMovies();
}

export async function getRecommendationsCountAction(): Promise<number> {
  return getRecommendationsCount();
}

// ---------------------------------------------------------------------------
// Category Actions
// ---------------------------------------------------------------------------

export async function getCategoriesAction(): Promise<WatchlistCategory[]> {
  return getCategories();
}

export async function createCategoryAction(name: string): Promise<{ success: boolean; category?: WatchlistCategory; error?: string }> {
  try {
    const category = await createCategory(name);
    revalidatePath("/watchlist", "page");
    return { success: true, category };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function renameCategoryAction(id: string, newName: string): Promise<{ success: boolean; error?: string }> {
  try {
    await renameCategory(id, newName);
    revalidatePath("/watchlist", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteCategoryAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteCategory(id);
    revalidatePath("/watchlist", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function assignMovieToCategoryAction(imdbId: string, categoryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await assignMovieToCategory(imdbId, categoryId);
    revalidatePath("/watchlist", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function unassignMovieFromCategoryAction(imdbId: string, categoryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await unassignMovieFromCategory(imdbId, categoryId);
    revalidatePath("/watchlist", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function removeMovieFromAllCategoriesAction(imdbId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await removeMovieFromAllCategories(imdbId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ---------------------------------------------------------------------------
// Dismissed Recommendations Actions
// ---------------------------------------------------------------------------

export async function getDismissedRecommendationsAction(): Promise<string[]> {
  return getDismissedRecommendations();
}

export async function addDismissedRecommendationAction(imdbId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await addDismissedRecommendation(imdbId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ---------------------------------------------------------------------------
// Auth Actions
// ---------------------------------------------------------------------------

export async function isAuthenticatedAction(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

export async function signOutAction(): Promise<void> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
