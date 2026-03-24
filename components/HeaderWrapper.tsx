"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { getList } from "@/lib/movie-db";

export function HeaderWrapper() {
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [watchedCount, setWatchedCount] = useState(0);

  const read = async () => {
    const [seen, watchlist] = await Promise.all([
      getList("seenMovies"),
      getList("watchlistMovies"),
    ]);
    setWatchedCount(seen.length);
    setWatchlistCount(watchlist.length);
  };

  useEffect(() => {
    read();

    // Keep counts in sync when detail page toggles lists
    window.addEventListener("listsUpdated", read);
    return () => window.removeEventListener("listsUpdated", read);
  }, []);

  return <Header watchlistCount={watchlistCount} watchedCount={watchedCount} />;
}
