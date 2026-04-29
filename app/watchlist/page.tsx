import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/db";
import { getWatchlistMovies, getCategories } from "@/lib/db";
import { WatchlistClient } from "./WatchlistClient";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark } from "lucide-react";

function WatchlistSkeleton() {
  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen bg-background text-foreground p-8 md:p-24 pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Bookmark className="h-8 w-8 text-accent" />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                My Watchlist
              </h1>
            </div>
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

async function WatchlistContent() {
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

export default function WatchlistPage() {
  return (
    <Suspense fallback={<WatchlistSkeleton />}>
      <WatchlistContent />
    </Suspense>
  );
}
