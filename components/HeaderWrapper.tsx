"use client";

import { useEffect, useSyncExternalStore, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { getList } from "@/lib/movie-db";

// Store for list counts
let listCounts = { watchlist: 0, watched: 0 };
let listeners: Array<() => void> = [];

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function getSnapshot() {
  return listCounts;
}

function getServerSnapshot() {
  return { watchlist: 0, watched: 0 };
}

async function fetchAndUpdateCounts() {
  const [seen, watchlist] = await Promise.all([
    getList("seenMovies"),
    getList("watchlistMovies"),
  ]);
  listCounts = { watchlist: watchlist.length, watched: seen.length };
  listeners.forEach((l) => l());
}

export function HeaderWrapper() {
  const counts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hasFetched = useRef(false);

  const handleListsUpdated = useCallback(() => {
    fetchAndUpdateCounts();
  }, []);

  useEffect(() => {
    // Fetch on mount (only once)
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAndUpdateCounts();
    }

    // Keep counts in sync when detail page toggles lists
    window.addEventListener("listsUpdated", handleListsUpdated);
    return () => window.removeEventListener("listsUpdated", handleListsUpdated);
  }, [handleListsUpdated]);

  return <Header watchlistCount={counts.watchlist} watchedCount={counts.watched} />;
}
