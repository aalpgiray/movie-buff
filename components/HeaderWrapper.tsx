"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { onWatchlistChange } from "@/lib/events";
import type { User } from "@supabase/supabase-js";

export function HeaderWrapper() {
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [watchedCount, setWatchedCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const [watchlistRes, watchedRes] = await Promise.all([
        supabase
          .from("user_movies")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_recommendation", false),
        supabase
          .from("user_movies")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_seen", true),
      ]);

      setWatchlistCount(watchlistRes.count ?? 0);
      setWatchedCount(watchedRes.count ?? 0);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Get initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (user) {
        fetchCounts();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCounts();
      } else {
        setWatchlistCount(0);
        setWatchedCount(0);
      }
    });

    // Listen for watchlist changes from other components
    const unsubscribe = onWatchlistChange(() => {
      fetchCounts();
    });

    return () => {
      subscription.unsubscribe();
      unsubscribe();
    };
  }, [fetchCounts]);

  return (
    <Header
      watchlistCount={watchlistCount}
      watchedCount={watchedCount}
      user={user}
      loading={loading}
    />
  );
}
