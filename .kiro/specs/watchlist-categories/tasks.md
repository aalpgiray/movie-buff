# Implementation Plan: Watchlist Categories

## Overview

Add a category/label system to the MovieBuff watchlist. Implementation proceeds in layers: data model and IDB helpers first, then UI components, then integration into existing pages.

## Tasks

- [x] 1. Add `WatchlistCategory` type and category helper functions
  - Add `WatchlistCategory` interface to `lib/types.ts` with fields `id: string`, `name: string`, `movieIds: string[]`
  - Add `getCategories()`, `setCategories()`, `createCategory()`, `renameCategory()`, `deleteCategory()`, `assignMovieToCategory()`, `unassignMovieFromCategory()`, and `removeMovieFromAllCategories()` to `lib/movie-db.ts`
  - All write helpers must read current array, mutate, and call `setCategories` atomically
  - `getCategories` must return `[]` when the key is absent (default value)
  - Name validation (1–50 chars, case-insensitive uniqueness) must be enforced inside `createCategory` and `renameCategory` — throw a descriptive `Error` on violation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

  - [x] 1.1 Write property test — Property 1: Category persistence round-trip
    - **Property 1: For any array of WatchlistCategory objects written via `setCategories`, `getCategories` immediately after returns a structurally equivalent array**
    - **Validates: Requirements 1.1, 1.2, 1.4**

  - [x] 1.2 Write property test — Property 2: Default empty categories
    - **Property 2: For a fresh IDB state where `"watchlistCategories"` has never been written, `getCategories` returns `[]`**
    - **Validates: Requirements 1.4**

  - [x] 1.3 Write property test — Property 3: Movie removal cleans all categories
    - **Property 3: For any set of categories where a given `imdbID` appears in one or more `movieIds` arrays, calling `removeMovieFromAllCategories(imdbID)` results in no category containing that `imdbID`**
    - **Validates: Requirements 1.5**

  - [x] 1.4 Write property test — Property 4: Category name uniqueness
    - **Property 4: Attempting to create or rename a category to a name matching an existing name (case-insensitively) is rejected and leaves the category list unchanged**
    - **Validates: Requirements 2.2, 2.3, 2.4**

  - [x] 1.5 Write property test — Property 5: Category name length validation
    - **Property 5: Any string that is empty or longer than 50 characters is rejected by `createCategory`/`renameCategory` and leaves the category list unchanged**
    - **Validates: Requirements 2.1, 2.2, 2.4**

  - [x] 1.6 Write property test — Property 6: Delete does not remove watchlist movies
    - **Property 6: Deleting a category leaves the `"watchlistMovies"` list in IDB unchanged**
    - **Validates: Requirements 2.5, 2.6**

  - [x] 1.7 Write property test — Property 7: Assign is idempotent
    - **Property 7: Assigning the same movie to the same category multiple times results in the `imdbID` appearing exactly once in that category's `movieIds`**
    - **Validates: Requirements 3.2**

  - [x] 1.8 Write property test — Property 8: Unassign removes movie from category
    - **Property 8: For any category containing a given `imdbID`, calling `unassignMovieFromCategory` results in that `imdbID` no longer appearing in the category's `movieIds`**
    - **Validates: Requirements 3.3**

- [x] 2. Checkpoint — Ensure all data-layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Build `CategoryManager` component
  - Create `components/CategoryManager.tsx` with props `categories: WatchlistCategory[]` and `onCategoriesChange: () => void`
  - Render a list of existing categories, each showing name and movie count (intersection of `movieIds` with current watchlist)
  - Provide an inline form to create a new category (input + submit button)
  - Show inline validation errors for empty name, name > 50 chars, and duplicate name (case-insensitive)
  - Provide rename (inline edit) and delete controls per category row
  - Call `onCategoriesChange` after any successful create/rename/delete so the parent re-fetches
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.1 Write property test — Property 11: Category movie count accuracy
    - **Property 11: The count displayed per category equals the size of the intersection between `category.movieIds` and the current `"watchlistMovies"` list**
    - **Validates: Requirements 2.7**

- [x] 4. Build `CategoryFilter` component
  - Create `components/CategoryFilter.tsx` with props `categories`, `selected`, `onSelect`, and `totalCount`
  - Render "All" option (shows `totalCount`), "Uncategorized" option, and one button/tab per named category with its count
  - Highlight the active selection; call `onSelect` with `null` for "All", `"__uncategorized__"` for Uncategorized, or the category `id` for named categories
  - _Requirements: 4.1, 4.3, 6.1_

  - [x] 4.1 Write property test — Property 9: Filter correctness
    - **Property 9: For any selected category filter and watchlist, the set of displayed movies equals the intersection of the watchlist and the selected category's `movieIds`**
    - **Validates: Requirements 4.2**

  - [x] 4.2 Write property test — Property 10: Uncategorized filter correctness
    - **Property 10: Selecting "Uncategorized" displays exactly the movies whose `imdbID` does not appear in any category's `movieIds`**
    - **Validates: Requirements 6.1, 6.2**

- [x] 5. Build `CategoryAssignControl` component
  - Create `components/CategoryAssignControl.tsx` with props `imdbID: string`, `categories: WatchlistCategory[]`, and `onAssignmentChange: () => void`
  - Render a popover/dropdown listing all categories with checkboxes; checked state reflects whether `imdbID` is in each category's `movieIds`
  - On checkbox toggle call `assignMovieToCategory` or `unassignMovieFromCategory`, then call `onAssignmentChange`
  - When `categories` is empty, render a prompt telling the user to create a category first
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Integrate categories into `app/watchlist/page.tsx`
  - Load categories from IDB on mount alongside watchlist movies (parallel `Promise.all`)
  - Add `categories` and `selectedFilter` state (`string | null`, default `null`)
  - Render `CategoryManager` and `CategoryFilter` above the movie grid; pass `onCategoriesChange` callback that re-fetches categories
  - Derive `filteredMovies` from `watchlistMovies` based on `selectedFilter`: `null` → all, `"__uncategorized__"` → movies not in any category, else → intersection with selected category's `movieIds`
  - Pass `categories` and an `onAssignmentChange` callback down to each `CategoryAssignControl` rendered alongside each `MovieCard`
  - In `handleRemoveFromWatchlist`, call `removeMovieFromAllCategories(id)` before updating the watchlist list
  - After category deletion detected (category id no longer in updated list), reset `selectedFilter` to `null`
  - Update the movie count display to reflect the current filter
  - _Requirements: 1.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.1, 6.2_

- [x] 7. Integrate `CategoryAssignControl` into `MovieDetailActions`
  - In `components/MovieDetailActions.tsx`, load categories from IDB when `isInWatchlist` becomes `true`
  - Render `<CategoryAssignControl>` below the existing action buttons only when `isInWatchlist === true`
  - Pass an `onAssignmentChange` callback that re-fetches categories so the control stays in sync
  - Do not render the control when the movie is not in the watchlist
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use **fast-check** with Vitest; each test file should mock the IDB layer
- Each property test must include a comment: `// Feature: watchlist-categories, Property N: <text>`
- `"__uncategorized__"` is the sentinel value for the uncategorized filter (avoids collision with real category ids)
- `removeMovieFromAllCategories` is defensive — safe to call even if the movie is in no categories
