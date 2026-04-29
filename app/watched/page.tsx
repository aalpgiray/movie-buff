import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getSeenMovies } from "@/lib/db";
import { WatchedClient } from "./WatchedClient";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye } from "lucide-react";

function WatchedSkeleton() {
  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen bg-background text-foreground p-8 md:p-24 pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-8 w-8 text-accent" />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                Watched Movies
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

async function WatchedContent() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  const movies = await getSeenMovies();

  return <WatchedClient initialMovies={movies} />;
}

export default function WatchedMoviesPage() {
  return (
    <Suspense fallback={<WatchedSkeleton />}>
      <WatchedContent />
    </Suspense>
  );
}
