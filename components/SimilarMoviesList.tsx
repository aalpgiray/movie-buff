"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Movie } from "@/lib/types";

interface SimilarMoviesListProps {
  movies: Array<Movie & { reason: string }>;
}

export function SimilarMoviesList({ movies }: SimilarMoviesListProps) {
  if (movies.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h2 className="text-2xl font-bold mb-6 text-foreground">
        Similar Movies
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {movies.map((movie, index) => (
          <motion.div
            key={movie.imdbID}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-xl bg-card border border-border/50 shadow-lg transition-all hover:shadow-2xl"
          >
            <Link
              href={`/movie/${movie.imdbID}`}
              className="block h-full"
              prefetch={true}
            >
              <div className="aspect-[2/3] relative overflow-hidden">
                {movie.Poster !== "N/A" ? (
                  <Image
                    src={movie.Poster}
                    alt={movie.Title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Star className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-xs text-white line-clamp-2 font-medium">
                    {movie.reason}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-card/95 backdrop-blur-sm">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1 text-card-foreground">
                  {movie.Title}
                </h3>
                <p className="text-xs text-muted-foreground">{movie.Year}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
