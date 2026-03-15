# Requirements Document

## Introduction

This feature adds category support to the MovieBuff watchlist. Users can organize their watchlisted movies into named categories (e.g., "Action", "Date Night", "Watch Soon") including custom labels they define themselves. Categories are stored entirely client-side in IndexedDB alongside the existing watchlist data. The watchlist page gains a category management UI: create, rename, and delete categories, assign movies to one or more categories, and filter the watchlist view by category.

## Glossary

- **Watchlist**: The user's saved list of movies they intend to watch, persisted in IndexedDB under the key `"watchlistMovies"`.
- **Category**: A named label that a user creates to group watchlist movies. Stored in IndexedDB.
- **Category_Store**: The IndexedDB store (or list key) that persists category definitions and their movie assignments.
- **Watchlist_Page**: The page rendered at `/watchlist` (`app/watchlist/page.tsx`).
- **Category_Manager**: The UI component responsible for creating, renaming, and deleting categories.
- **Category_Filter**: The UI control on the Watchlist_Page that filters the displayed movies by a selected category.
- **MovieDetailActions**: The existing component (`components/MovieDetailActions.tsx`) that renders watchlist/seen action buttons on the movie detail view.
- **MovieCard**: The existing component (`components/MovieCard.tsx`) that renders a movie in the grid.
- **IDB**: IndexedDB — the browser-local storage layer used by `lib/movie-db.ts`.

---

## Requirements

### Requirement 1: Category Data Model and Persistence

**User Story:** As a user, I want my categories to be saved in my browser so that they persist across sessions without requiring a server.

#### Acceptance Criteria

1. THE Category_Store SHALL persist an array of category objects, each containing a unique `id` (string), a `name` (string), and an array of `movieIds` (string[]) referencing watchlisted movies by `imdbID`.
2. WHEN the app initializes the IDB schema, THE Category_Store SHALL be created as a named key in the existing `lists` IDB object store under the key `"watchlistCategories"`.
3. WHEN a category is created, renamed, deleted, or its movie assignments change, THE Category_Store SHALL be updated atomically so that no partial state is written.
4. IF the `"watchlistCategories"` key does not exist in IDB, THEN THE Category_Store SHALL return an empty array as the default value.
5. WHEN a movie is removed from the watchlist, THE Category_Store SHALL remove that movie's `imdbID` from all categories it belongs to.

---

### Requirement 2: Create and Manage Categories

**User Story:** As a user, I want to create, rename, and delete categories so that I can organize my watchlist the way I like.

#### Acceptance Criteria

1. THE Category_Manager SHALL allow the user to create a new category by providing a name of 1–50 characters.
2. WHEN the user submits a new category name that is empty or exceeds 50 characters, THE Category_Manager SHALL display an inline validation error and SHALL NOT create the category.
3. WHEN the user creates a category with a name that already exists (case-insensitive), THE Category_Manager SHALL display an inline error indicating the name is already taken and SHALL NOT create a duplicate.
4. THE Category_Manager SHALL allow the user to rename an existing category, subject to the same 1–50 character and uniqueness constraints.
5. THE Category_Manager SHALL allow the user to delete a category.
6. WHEN the user deletes a category, THE Category_Manager SHALL remove the category definition from the Category_Store without removing the associated movies from the watchlist.
7. THE Category_Manager SHALL display all existing categories in a list, each showing the category name and the count of movies assigned to it.

---

### Requirement 3: Assign Movies to Categories

**User Story:** As a user, I want to assign a watchlisted movie to one or more categories so that I can find it later by browsing a specific category.

#### Acceptance Criteria

1. THE Watchlist_Page SHALL provide a per-movie category assignment control that allows the user to assign or unassign the movie to any existing category.
2. WHEN the user assigns a movie to a category, THE Category_Store SHALL add the movie's `imdbID` to that category's `movieIds` array if it is not already present.
3. WHEN the user unassigns a movie from a category, THE Category_Store SHALL remove the movie's `imdbID` from that category's `movieIds` array.
4. THE category assignment control SHALL display which categories the movie is currently assigned to.
5. WHILE no categories exist, THE category assignment control SHALL prompt the user to create a category first.

---

### Requirement 4: Filter Watchlist by Category

**User Story:** As a user, I want to filter my watchlist by category so that I can focus on a specific group of movies.

#### Acceptance Criteria

1. THE Category_Filter SHALL display a selectable list of all existing categories plus an "All" option that shows the full unfiltered watchlist.
2. WHEN the user selects a category in the Category_Filter, THE Watchlist_Page SHALL display only the movies assigned to that category.
3. WHEN the user selects "All" in the Category_Filter, THE Watchlist_Page SHALL display all watchlisted movies regardless of category assignment.
4. WHEN a category is selected and a movie is removed from the watchlist, THE Watchlist_Page SHALL update the filtered view to exclude the removed movie.
5. WHEN a category is selected and that category is subsequently deleted, THE Category_Filter SHALL reset to "All" and THE Watchlist_Page SHALL display all watchlisted movies.
6. THE Watchlist_Page SHALL display the count of movies matching the current filter selection.

---

### Requirement 5: Category Assignment from Movie Detail View

**User Story:** As a user, I want to assign a watchlisted movie to a category directly from the movie detail view so that I can categorize it without navigating to the watchlist page.

#### Acceptance Criteria

1. WHILE a movie is in the watchlist, THE MovieDetailActions SHALL display a category assignment control showing the movie's current category assignments.
2. WHEN the user assigns or unassigns a category from the MovieDetailActions control, THE Category_Store SHALL be updated immediately.
3. WHILE a movie is not in the watchlist, THE MovieDetailActions SHALL NOT display the category assignment control.

---

### Requirement 6: Uncategorized Movies

**User Story:** As a user, I want to see which movies in my watchlist have not been assigned to any category so that I can organize them.

#### Acceptance Criteria

1. THE Category_Filter SHALL include an "Uncategorized" option in addition to "All" and the named categories.
2. WHEN the user selects "Uncategorized", THE Watchlist_Page SHALL display only the movies that are not assigned to any category.
