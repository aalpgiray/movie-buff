"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";

export function HeaderWrapper() {
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [watchedCount, setWatchedCount] = useState(0);

  useEffect(() => {
    const read = () => {
      const seen: string[] = JSON.parse(localStorage.getItem("seenMovies") || "[]");
      const watchlist: string[] = JSON.parse(localStorage.getItem("watchlistMovies") || "[]");
      setWatchedCount(seen.length);
      setWatchlistCount(watchlist.length);
    };

    read();

    // Keep counts in sync when detail page toggles lists
    window.addEventListener("storage", read);
    window.addEventListener("listsUpdated", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("listsUpdated", read);
    };
  }, []);

  return <Header watchlistCount={watchlistCount} watchedCount={watchedCount} />;
}
