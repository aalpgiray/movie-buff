import { searchMovies } from "@/lib/omdb";
import { getSimilarMovies } from "@/lib/ai";
import { SimilarMoviesList } from "@/components/SimilarMoviesList";
import type { Movie } from "@/lib/types";

interface SimilarMoviesSectionProps {
  movieTitle: string;
  genre: string;
  rating: string;
  plot: string;
}

export async function SimilarMoviesSection({
  movieTitle,
  genre,
  rating,
  plot,
}: SimilarMoviesSectionProps) {
  // Fetch similar movie recommendations
  let similarMovies: Array<Movie & { reason: string }> = [];
  
  try {
    if (genre && rating && plot) {
      const recommendations = await getSimilarMovies(
        movieTitle,
        genre,
        rating,
        plot
      );

      // Search OMDB for each recommendation
      const moviePromises = recommendations.map(async (rec) => {
        try {
          const data = await searchMovies(rec.title);
          if (data.Search && data.Search.length > 0) {
            const foundMovie = data.Search[0];
            return { ...foundMovie, reason: rec.reason };
          }
          return null;
        } catch (error) {
          console.error(`Error searching for ${rec.title}:`, error);
          return null;
        }
      });

      const results = await Promise.all(moviePromises);
      similarMovies = results.filter((m): m is (Movie & { reason: string }) => m !== null);
    }
  } catch (error) {
    console.error("Failed to fetch similar movies:", error);
  }

  return <SimilarMoviesList movies={similarMovies} />;
}
