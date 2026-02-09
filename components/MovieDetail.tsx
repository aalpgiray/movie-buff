import { Star } from "lucide-react";
import Image from "next/image";
import { getMovieDetails } from "@/lib/omdb";
import { getSimilarMovies } from "@/lib/openai";
import { SimilarMovies } from "@/components/SimilarMovies";

export async function MovieDetail({ imdbID }: { imdbID: string }) {
  const movie = await getMovieDetails(imdbID);

  if (!movie) {
    return <div className="text-center text-muted-foreground">Movie details not found.</div>;
  }

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-8 animate-in fade-in duration-500">
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl border border-border">
        {movie.Poster !== "N/A" && (
          <Image
            src={movie.Poster}
            alt={movie.Title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 300px"
          />
        )}
      </div>

      <div className="space-y-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-foreground">
            {movie.Title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="px-2 py-1 rounded-md bg-secondary border border-border text-secondary-foreground">{movie.Year}</span>
            <span className="px-2 py-1 rounded-md bg-secondary border border-border text-secondary-foreground">{movie.Rated}</span>
            <span className="px-2 py-1 rounded-md bg-secondary border border-border text-secondary-foreground">{movie.Runtime}</span>
            <span className="px-2 py-1 rounded-md bg-secondary border border-border text-secondary-foreground">{movie.Genre}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          <span className="text-2xl font-bold text-foreground">
            {movie.imdbRating || "N/A"}
          </span>
          <span className="text-muted-foreground text-lg">/ 10</span>
        </div>

        <p className="text-lg leading-relaxed text-foreground max-w-2xl">
          {movie.Plot}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm border-t border-border pt-6">
          <div>
            <span className="text-muted-foreground block mb-1 uppercase tracking-wider text-xs">Director</span>
            <span className="font-medium text-foreground text-lg">{movie.Director}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1 uppercase tracking-wider text-xs">Cast</span>
            <span className="font-medium text-foreground text-lg">{movie.Actors}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
