import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/db";
import { getWatchlistMovies, getCategories } from "@/lib/db";
import { WatchlistClient } from "./WatchlistClient";

export default async function WatchlistPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  const [movies, categories] = await Promise.all([
    getWatchlistMovies(),
    getCategories(),
  ]);

  return <WatchlistClient initialMovies={movies} initialCategories={categories} />;
}
