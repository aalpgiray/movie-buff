import { redirect } from "next/navigation";
import { getCurrentUser, getSeenMovies } from "@/lib/db";
import { WatchedClient } from "./WatchedClient";

export default async function WatchedMoviesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  const movies = await getSeenMovies();

  return <WatchedClient initialMovies={movies} />;
}
