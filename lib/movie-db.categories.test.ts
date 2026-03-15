/**
 * Property-based tests for watchlist category helpers in lib/movie-db.ts
 * Feature: watchlist-categories
 * Testing framework: fast-check + vitest
 */

import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";

// Polyfill IndexedDB with fake-indexeddb before importing the module under test
import "fake-indexeddb/auto";

import {
  getCategories,
  setCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  assignMovieToCategory,
  unassignMovieFromCategory,
  removeMovieFromAllCategories,
  getList,
  setList,
} from "@/lib/movie-db";
import type { WatchlistCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset IDB between tests by re-importing with a fresh fake-indexeddb instance. */
// fake-indexeddb/auto patches the global indexedDB; we reset the DB between
// tests by deleting and re-opening it via the IDBFactory reset helper.
beforeEach(async () => {
  // fake-indexeddb exposes a reset on the global IDBFactory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (indexedDB as any)._databases?.clear?.();
  // Alternatively, wipe by deleting the database
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase("movie-buff");
    req.onsuccess = () => resolve();
    req.onerror = () => resolve(); // ignore errors during cleanup
    req.onblocked = () => resolve();
  });
});

/** Arbitrary for a valid WatchlistCategory */
const arbitraryCategory = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  movieIds: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
});

/** Arbitrary for a non-empty array of categories with unique ids and unique names (case-insensitive) */
const arbitraryUniqueCategories = fc
  .array(arbitraryCategory, { minLength: 0, maxLength: 10 })
  .map((cats) => {
    const seen = new Set<string>();
    const seenNames = new Set<string>();
    return cats.filter((c) => {
      const nameLower = c.name.toLowerCase();
      if (seen.has(c.id) || seenNames.has(nameLower)) return false;
      seen.add(c.id);
      seenNames.add(nameLower);
      return true;
    });
  });

// ---------------------------------------------------------------------------
// Property 1: Category persistence round-trip
// Feature: watchlist-categories, Property 1: For any array of WatchlistCategory objects
// written via setCategories, getCategories immediately after returns a structurally equivalent array.
// Validates: Requirements 1.1, 1.2, 1.4
// ---------------------------------------------------------------------------
describe("Property 1: Category persistence round-trip", () => {
  it("setCategories then getCategories returns equivalent array", async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryUniqueCategories, async (categories) => {
        await setCategories(categories);
        const result = await getCategories();
        expect(result).toEqual(categories);
      }),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Default empty categories
// Feature: watchlist-categories, Property 2: For a fresh IDB state where
// "watchlistCategories" has never been written, getCategories returns [].
// Validates: Requirements 1.4
// ---------------------------------------------------------------------------
describe("Property 2: Default empty categories", () => {
  it("getCategories returns [] on fresh IDB", async () => {
    const result = await getCategories();
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Property 3: Movie removal cleans all categories
// Feature: watchlist-categories, Property 3: For any set of categories where a given
// imdbID appears in one or more movieIds arrays, calling removeMovieFromAllCategories(imdbID)
// results in no category containing that imdbID.
// Validates: Requirements 1.5
// ---------------------------------------------------------------------------
describe("Property 3: Movie removal cleans all categories", () => {
  it("removeMovieFromAllCategories removes imdbID from every category", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryUniqueCategories,
        fc.string({ minLength: 1, maxLength: 20 }),
        async (categories, imdbID) => {
          // Seed the imdbID into some categories
          const seeded: WatchlistCategory[] = categories.map((c, i) =>
            i % 2 === 0 ? { ...c, movieIds: [...c.movieIds, imdbID] } : c,
          );
          await setCategories(seeded);
          await removeMovieFromAllCategories(imdbID);
          const result = await getCategories();
          for (const cat of result) {
            expect(cat.movieIds).not.toContain(imdbID);
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Category name uniqueness
// Feature: watchlist-categories, Property 4: Attempting to create or rename a category
// to a name matching an existing name (case-insensitively) is rejected and leaves the
// category list unchanged.
// Validates: Requirements 2.2, 2.3, 2.4
// ---------------------------------------------------------------------------
describe("Property 4: Category name uniqueness", () => {
  it("createCategory rejects duplicate names (case-insensitive)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .array(
            fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
            { minLength: 1, maxLength: 5 },
          )
          .filter((names) => {
            const lower = names.map((n) => n.toLowerCase());
            return new Set(lower).size === names.length;
          }),
        async (names) => {
          await setCategories([]);
          // Create all categories
          for (const name of names) {
            await createCategory(name);
          }
          const before = await getCategories();
          // Try to create a duplicate (same name, different casing)
          const existingName = names[0];
          const duplicate = existingName.toUpperCase() === existingName
            ? existingName.toLowerCase()
            : existingName.toUpperCase();
          await expect(createCategory(duplicate)).rejects.toThrow();
          const after = await getCategories();
          expect(after).toEqual(before);
        },
      ),
      { numRuns: 30 },
    );
  });

  it("renameCategory rejects duplicate names (case-insensitive)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .array(
            fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
            { minLength: 2, maxLength: 5 },
          )
          .filter((names) => {
            const lower = names.map((n) => n.toLowerCase());
            return new Set(lower).size === names.length;
          }),
        async (names) => {
          await setCategories([]);
          for (const name of names) {
            await createCategory(name);
          }
          const before = await getCategories();
          // Try to rename the second category to the first category's name
          const targetId = before[1].id;
          const conflictName = before[0].name;
          await expect(renameCategory(targetId, conflictName)).rejects.toThrow();
          const after = await getCategories();
          expect(after).toEqual(before);
        },
      ),
      { numRuns: 30 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Category name length validation
// Feature: watchlist-categories, Property 5: Any string that is empty or longer than
// 50 characters is rejected by createCategory/renameCategory and leaves the category
// list unchanged.
// Validates: Requirements 2.1, 2.2, 2.4
// ---------------------------------------------------------------------------
describe("Property 5: Category name length validation", () => {
  it("createCategory rejects empty or >50 char names", async () => {
    const invalidName = fc.oneof(
      fc.constant(""),
      fc.string({ minLength: 51, maxLength: 100 }),
    );
    await fc.assert(
      fc.asyncProperty(invalidName, async (name) => {
        await setCategories([]);
        await expect(createCategory(name)).rejects.toThrow();
        const after = await getCategories();
        expect(after).toEqual([]);
      }),
      { numRuns: 50 },
    );
  });

  it("renameCategory rejects empty or >50 char names", async () => {
    const invalidName = fc.oneof(
      fc.constant(""),
      fc.string({ minLength: 51, maxLength: 100 }),
    );
    await fc.assert(
      fc.asyncProperty(invalidName, async (name) => {
        await setCategories([]);
        const cat = await createCategory("ValidName");
        const before = await getCategories();
        await expect(renameCategory(cat.id, name)).rejects.toThrow();
        const after = await getCategories();
        expect(after).toEqual(before);
      }),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Delete does not remove watchlist movies
// Feature: watchlist-categories, Property 6: Deleting a category leaves the
// "watchlistMovies" list in IDB unchanged.
// Validates: Requirements 2.5, 2.6
// ---------------------------------------------------------------------------
describe("Property 6: Delete does not remove watchlist movies", () => {
  it("deleteCategory leaves watchlistMovies intact", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryUniqueCategories.filter((cats) => cats.length > 0),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
        async (categories, watchlistMovies) => {
          await setCategories(categories);
          await setList("watchlistMovies", watchlistMovies);
          // Delete the first category
          await deleteCategory(categories[0].id);
          const remainingWatchlist = await getList("watchlistMovies");
          expect(remainingWatchlist).toEqual(watchlistMovies);
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Assign is idempotent
// Feature: watchlist-categories, Property 7: Assigning the same movie to the same
// category multiple times results in the imdbID appearing exactly once in that
// category's movieIds.
// Validates: Requirements 3.2
// ---------------------------------------------------------------------------
describe("Property 7: Assign is idempotent", () => {
  it("assignMovieToCategory results in exactly one entry", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 2, max: 5 }),
        async (categoryId, imdbID, times) => {
          const category: WatchlistCategory = { id: categoryId, name: "Test", movieIds: [] };
          await setCategories([category]);
          for (let i = 0; i < times; i++) {
            await assignMovieToCategory(imdbID, categoryId);
          }
          const result = await getCategories();
          const cat = result.find((c) => c.id === categoryId)!;
          const count = cat.movieIds.filter((id) => id === imdbID).length;
          expect(count).toBe(1);
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Unassign removes movie from category
// Feature: watchlist-categories, Property 8: For any category containing a given
// imdbID, calling unassignMovieFromCategory results in that imdbID no longer
// appearing in the category's movieIds.
// Validates: Requirements 3.3
// ---------------------------------------------------------------------------
describe("Property 8: Unassign removes movie from category", () => {
  it("unassignMovieFromCategory removes the imdbID", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 20 }),
        async (categoryId, imdbID) => {
          const category: WatchlistCategory = { id: categoryId, name: "Test", movieIds: [imdbID] };
          await setCategories([category]);
          await unassignMovieFromCategory(imdbID, categoryId);
          const result = await getCategories();
          const cat = result.find((c) => c.id === categoryId)!;
          expect(cat.movieIds).not.toContain(imdbID);
        },
      ),
      { numRuns: 50 },
    );
  });
});
