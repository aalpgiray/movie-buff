/**
 * movie-db.ts
 * IndexedDB wrapper for the movie-buff app.
 *
 * Database : "movie-buff"  (version 1)
 * Store    : "movies"      (keyPath: "imdbID")
 *
 * Every Movie received from any API call is persisted here so the home page
 * can build its default "Search" list entirely from local data with zero extra
 * network requests.
 *
 * The isSeen and rating fields are treated as user-owned data: existing values
 * are preserved when new search results arrive for the same imdbID.
 */

import type { Movie } from "@/lib/types";

const DB_NAME = "movie-buff";
const DB_VERSION = 2;
const STORE_NAME = "movies";
const LISTS_STORE = "lists";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "imdbID" });
      }
      // v2: general key-value store for user lists (seenMovies, watchlistMovies)
      if (!db.objectStoreNames.contains(LISTS_STORE)) {
        db.createObjectStore(LISTS_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Read a batch of records by imdbID in a single readonly transaction. */
function getByIds(
  store: IDBObjectStore,
  ids: string[],
): Promise<Record<string, Movie>> {
  return new Promise((resolve, reject) => {
    const map: Record<string, Movie> = {};
    let pending = ids.length;

    if (pending === 0) {
      resolve(map);
      return;
    }

    ids.forEach((id) => {
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) map[id] = req.result as Movie;
        if (--pending === 0) resolve(map);
      };
      req.onerror = () => reject(req.error);
    });
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persist a batch of movies (e.g. from a search response).
 * User-owned fields (isSeen, rating) are preserved when a record already exists.
 */
export async function upsertMovies(movies: Movie[]): Promise<void> {
  if (!movies.length) return;

  const db = await openDB();

  // Phase 1 — read existing records so we can preserve user-owned fields.
  const existingMap = await new Promise<Record<string, Movie>>(
    (resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      getByIds(store, movies.map((m) => m.imdbID))
        .then(resolve)
        .catch(reject);
    },
  );

  // Phase 2 — write merged records.
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    movies.forEach((movie) => {
      const existing = existingMap[movie.imdbID];
      const merged: Movie = {
        ...movie,
        // Preserve user-owned fields from any existing record.
        isSeen: existing?.isSeen ?? movie.isSeen,
        rating: existing?.rating ?? movie.rating,
      };
      store.put(merged);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

/**
 * Patch a single movie record (e.g. update isSeen or rating after the user
 * interacts with a movie detail page).  Creates the record if it doesn't exist.
 */
export async function upsertMovie(
  patch: Partial<Movie> & { imdbID: string },
): Promise<void> {
  const db = await openDB();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const getReq = store.get(patch.imdbID);

    getReq.onsuccess = () => {
      const existing: Movie = getReq.result ?? { imdbID: patch.imdbID, Title: "", Year: "", Type: "", Poster: "" };
      store.put({ ...existing, ...patch });
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

/**
 * Return every movie stored in IndexedDB, newest-first (insertion order is
 * preserved because IDB returns records in key order; we reverse so recent
 * searches bubble up).
 */
export async function getAllMovies(): Promise<Movie[]> {
  const db = await openDB();

  const movies = await new Promise<Movie[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as Movie[]) ?? []);
    req.onerror = () => reject(req.error);
  });

  db.close();
  return movies;
}

/**
 * Read a named list (e.g. "seenMovies", "watchlistMovies") from the lists store.
 * Returns an empty array if the key doesn't exist.
 */
export async function getList(key: string): Promise<string[]> {
  const db = await openDB();

  const result = await new Promise<string[]>((resolve, reject) => {
    const tx = db.transaction(LISTS_STORE, "readonly");
    const store = tx.objectStore(LISTS_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve((req.result as string[]) ?? []);
    req.onerror = () => reject(req.error);
  });

  db.close();
  return result;
}

/**
 * Persist a named list to the lists store.
 */
export async function setList(key: string, ids: string[]): Promise<void> {
  const db = await openDB();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(LISTS_STORE, "readwrite");
    const store = tx.objectStore(LISTS_STORE);
    store.put(ids, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

// ---------------------------------------------------------------------------
// Sorting / interleave utility (used by the home page)
// ---------------------------------------------------------------------------

/**
 * Build the ordered default list from all IDB movies.
 *
 * Algorithm:
 *  1. Mark each movie's isSeen based on the current seenIds set.
 *  2. Sort all movies by rating DESC (unrated movies sort to the bottom).
 *  3. Split into unseen and seen sublists (already in rating order).
 *  4. Interleave: every 4 unseen movies, splice in 1 seen movie so that
 *     seen and unseen films of similar quality sit next to each other.
 *  5. Append any remaining seen movies at the end.
 */
export function buildDefaultList(
  allMovies: Movie[],
  seenIds: Set<string>,
): Movie[] {
  if (!allMovies.length) return [];

  // Step 1 — annotate seen status from the authoritative seenIds set.
  const annotated = allMovies.map((m) => ({
    ...m,
    isSeen: seenIds.has(m.imdbID),
  }));

  // Step 2 — sort by rating desc; unrated movies (rating === undefined) sort last.
  annotated.sort((a, b) => {
    const ra = a.rating ?? -1;
    const rb = b.rating ?? -1;
    return rb - ra;
  });

  const unseen = annotated.filter((m) => !m.isSeen);
  const seen = annotated.filter((m) => m.isSeen);

  if (!seen.length) return unseen;
  if (!unseen.length) return seen;

  // Step 3 — interleave: insert 1 seen movie after every 4 unseen movies.
  const result: Movie[] = [];
  let seenIdx = 0;

  unseen.forEach((movie, i) => {
    result.push(movie);
    if ((i + 1) % 4 === 0 && seenIdx < seen.length) {
      result.push(seen[seenIdx++]);
    }
  });

  // Append any seen movies that haven't been placed yet.
  while (seenIdx < seen.length) {
    result.push(seen[seenIdx++]);
  }

  return result;
}
