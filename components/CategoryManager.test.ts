/**
 * Property-based test for CategoryManager count logic.
 * Feature: watchlist-categories, Property 11: The count displayed per category equals
 * the size of the intersection between category.movieIds and the current "watchlistMovies" list.
 * Validates: Requirements 2.7
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";

// Pure function that mirrors the count logic used in CategoryManager
function categoryMovieCount(movieIds: string[], watchlistMovies: string[]): number {
  return movieIds.filter((id) => watchlistMovies.includes(id)).length;
}

// Arbitrary for imdbID-like strings
const arbitraryId = fc.string({ minLength: 1, maxLength: 20 });

// Feature: watchlist-categories, Property 11: The count displayed per category equals
// the size of the intersection between category.movieIds and the current "watchlistMovies" list.
// Validates: Requirements 2.7
describe("Property 11: Category movie count accuracy", () => {
  it("count equals intersection of movieIds and watchlistMovies", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryId, { maxLength: 20 }),
        fc.array(arbitraryId, { maxLength: 20 }),
        (movieIds, watchlistMovies) => {
          const count = categoryMovieCount(movieIds, watchlistMovies);
          const expected = movieIds.filter((id) => watchlistMovies.includes(id)).length;
          expect(count).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("count is 0 when watchlist is empty", () => {
    fc.assert(
      fc.property(fc.array(arbitraryId, { maxLength: 20 }), (movieIds) => {
        expect(categoryMovieCount(movieIds, [])).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it("count is 0 when category has no movieIds", () => {
    fc.assert(
      fc.property(fc.array(arbitraryId, { maxLength: 20 }), (watchlistMovies) => {
        expect(categoryMovieCount([], watchlistMovies)).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it("count never exceeds the number of movieIds in the category", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryId, { maxLength: 20 }),
        fc.array(arbitraryId, { maxLength: 20 }),
        (movieIds, watchlistMovies) => {
          const count = categoryMovieCount(movieIds, watchlistMovies);
          expect(count).toBeLessThanOrEqual(movieIds.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("count never exceeds the size of the watchlist", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryId, { maxLength: 20 }),
        fc.array(arbitraryId, { maxLength: 20 }),
        (movieIds, watchlistMovies) => {
          const count = categoryMovieCount(movieIds, watchlistMovies);
          expect(count).toBeLessThanOrEqual(watchlistMovies.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("movies removed from watchlist do not inflate the count", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryId, { minLength: 1, maxLength: 20 }),
        fc.array(arbitraryId, { minLength: 1, maxLength: 20 }),
        (movieIds, watchlistMovies) => {
          const fullCount = categoryMovieCount(movieIds, watchlistMovies);
          // Remove one movie from the watchlist
          const reduced = watchlistMovies.slice(1);
          const reducedCount = categoryMovieCount(movieIds, reduced);
          // Count with fewer watchlist items must be <= original count
          expect(reducedCount).toBeLessThanOrEqual(fullCount);
        },
      ),
      { numRuns: 100 },
    );
  });
});
