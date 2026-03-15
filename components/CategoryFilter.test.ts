/**
 * Pure logic tests for CategoryFilter filter function.
 *
 * Feature: watchlist-categories, Property 9: For any selected category filter and watchlist,
 * the set of displayed movies equals the intersection of the watchlist and the selected
 * category's movieIds.
 * Validates: Requirements 4.2
 *
 * Feature: watchlist-categories, Property 10: Selecting "Uncategorized" displays exactly
 * the movies whose imdbID does not appear in any category's movieIds.
 * Validates: Requirements 6.1, 6.2
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { WatchlistCategory } from "@/lib/types";

// Pure filter function mirroring the logic used in the watchlist page
function filterMovies(
  watchlist: string[],
  categories: WatchlistCategory[],
  selected: string | null,
): string[] {
  if (selected === null) return watchlist;
  if (selected === "__uncategorized__") {
    const allCategoryIds = new Set(categories.flatMap((c) => c.movieIds));
    return watchlist.filter((id) => !allCategoryIds.has(id));
  }
  const cat = categories.find((c) => c.id === selected);
  if (!cat) return watchlist;
  return watchlist.filter((id) => cat.movieIds.includes(id));
}

// Arbitrary for imdbID-like strings
const arbitraryId = fc.string({ minLength: 1, maxLength: 15 });

// Arbitrary for a WatchlistCategory
const arbitraryCategory = fc.record<WatchlistCategory>({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  movieIds: fc.array(arbitraryId, { maxLength: 10 }),
});

// Feature: watchlist-categories, Property 9: For any selected category filter and watchlist,
// the set of displayed movies equals the intersection of the watchlist and the selected
// category's movieIds.
// Validates: Requirements 4.2
describe("Property 9: Filter correctness", () => {
  it("selecting null (All) returns the full watchlist", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryId, { maxLength: 20 }),
        fc.array(arbitraryCategory, { maxLength: 5 }),
        (watchlist, categories) => {
          const result = filterMovies(watchlist, categories, null);
          expect(result).toEqual(watchlist);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("selecting a category id returns only watchlist movies in that category", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryId, { maxLength: 20 }),
        arbitraryCategory,
        fc.array(arbitraryCategory, { maxLength: 4 }),
        (watchlist, targetCat, otherCats) => {
          const categories = [targetCat, ...otherCats];
          const result = filterMovies(watchlist, categories, targetCat.id);
          // Every returned movie must be in the watchlist AND in the category
          for (const id of result) {
            expect(watchlist).toContain(id);
            expect(targetCat.movieIds).toContain(id);
          }
          // Every watchlist movie that is in the category must appear in result
          const expected = watchlist.filter((id) => targetCat.movieIds.includes(id));
          expect(result).toEqual(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("result is a subset of the watchlist for any named category", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryId, { maxLength: 20 }),
        arbitraryCategory,
        (watchlist, cat) => {
          const result = filterMovies(watchlist, [cat], cat.id);
          for (const id of result) {
            expect(watchlist).toContain(id);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("result is a subset of the category movieIds for any named category", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryId, { maxLength: 20 }),
        arbitraryCategory,
        (watchlist, cat) => {
          const result = filterMovies(watchlist, [cat], cat.id);
          for (const id of result) {
            expect(cat.movieIds).toContain(id);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("selecting an unknown category id falls back to full watchlist", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryId, { maxLength: 20 }),
        fc.array(arbitraryCategory, { maxLength: 5 }),
        fc.uuid(),
        (watchlist, categories, unknownId) => {
          // Ensure unknownId is not in categories
          const safeCategories = categories.filter((c) => c.id !== unknownId);
          const result = filterMovies(watchlist, safeCategories, unknownId);
          expect(result).toEqual(watchlist);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: watchlist-categories, Property 10: Selecting "Uncategorized" displays exactly
// the movies whose imdbID does not appear in any category's movieIds.
// Validates: Requirements 6.1, 6.2
describe("Property 10: Uncategorized filter correctness", () => {
  it("uncategorized returns movies not in any category", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryId, { maxLength: 20 }),
        fc.array(arbitraryCategory, { maxLength: 5 }),
        (watchlist, categories) => {
          const result = filterMovies(watchlist, categories, "__uncategorized__");
          const allCategoryIds = new Set(categories.flatMap((c) => c.movieIds));
          const expected = watchlist.filter((id) => !allCategoryIds.has(id));
          expect(result).toEqual(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("uncategorized result contains no movie that belongs to any category", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryId, { maxLength: 20 }),
        fc.array(arbitraryCategory, { maxLength: 5 }),
        (watchlist, categories) => {
          const result = filterMovies(watchlist, categories, "__uncategorized__");
          const allCategoryIds = new Set(categories.flatMap((c) => c.movieIds));
          for (const id of result) {
            expect(allCategoryIds.has(id)).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("uncategorized result is a subset of the watchlist", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryId, { maxLength: 20 }),
        fc.array(arbitraryCategory, { maxLength: 5 }),
        (watchlist, categories) => {
          const result = filterMovies(watchlist, categories, "__uncategorized__");
          for (const id of result) {
            expect(watchlist).toContain(id);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("with no categories, uncategorized equals the full watchlist", () => {
    fc.assert(
      fc.property(fc.array(arbitraryId, { maxLength: 20 }), (watchlist) => {
        const result = filterMovies(watchlist, [], "__uncategorized__");
        expect(result).toEqual(watchlist);
      }),
      { numRuns: 100 },
    );
  });

  it("union of all category-filtered results and uncategorized covers the full watchlist (no duplicates in watchlist)", () => {
    fc.assert(
      fc.property(
        // Use unique watchlist ids to avoid duplicate-related edge cases
        fc.array(fc.uuid(), { maxLength: 15 }).map((arr) => [...new Set(arr)]),
        fc.array(arbitraryCategory, { maxLength: 4 }),
        (watchlist, categories) => {
          const uncategorized = filterMovies(watchlist, categories, "__uncategorized__");
          const categorized = categories.flatMap((cat) =>
            filterMovies(watchlist, categories, cat.id),
          );
          const union = new Set([...uncategorized, ...categorized]);
          // Every watchlist movie should appear in either uncategorized or at least one category filter
          for (const id of watchlist) {
            expect(union.has(id)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
