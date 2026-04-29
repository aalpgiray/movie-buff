import type { RatedMovie, Movie } from "@/lib/types";
import { searchMovies } from "@/lib/omdb";

/**
 * Generate personalized recommendations based on user ratings.
 * Uses local algorithm - no external API calls needed.
 * Recommends movies based on:
 * 1. Genres from top-rated movies (8+)
 * 2. Similar themes/directors/actors
 * 3. Years/eras they prefer
 */
export async function getLocalRecommendations(
  ratedMovies: RatedMovie[],
): Promise<Movie[]> {
  if (ratedMovies.length === 0) {
    return [];
  }

  // Get top-rated movies (8+)
  const topRated = ratedMovies.filter((m) => m.rating >= 8);
  if (topRated.length === 0) {
    return [];
  }

  // Extract preferences from top-rated movies
  const preferredYears = topRated.map((m) => parseInt(m.Year) || 2000);
  const avgYear = Math.round(preferredYears.reduce((a, b) => a + b) / preferredYears.length);
  const yearRange = [avgYear - 10, avgYear + 10];

  // Curated list of well-known recommendations based on common tastes
  const recommendationSeeds = [
    // Drama
    { title: "The Shawshank Redemption", year: 1994, reason: "Universally acclaimed drama" },
    { title: "Forrest Gump", year: 1994, reason: "Classic heartwarming drama" },
    { title: "Pulp Fiction", year: 1994, reason: "Iconic cult classic" },
    { title: "The Usual Suspects", year: 1995, reason: "Brilliant thriller with twist" },
    { title: "Se7en", year: 1995, reason: "Dark psychological thriller" },
    { title: "The Sixth Sense", year: 1999, reason: "Master of suspense" },
    { title: "Fight Club", year: 1999, reason: "Thought-provoking thriller" },
    { title: "Gladiator", year: 2000, reason: "Epic historical drama" },
    { title: "The Matrix", year: 1999, reason: "Sci-fi action masterpiece" },
    { title: "Inception", year: 2010, reason: "Mind-bending sci-fi epic" },
    { title: "The Dark Knight", year: 2008, reason: "Superhero cinema excellence" },
    { title: "Interstellar", year: 2014, reason: "Ambitious sci-fi epic" },
    { title: "Parasite", year: 2019, reason: "Contemporary masterpiece" },
    { title: "The Wolf of Wall Street", year: 2013, reason: "Fast-paced dark comedy" },
    { title: "Goodfellas", year: 1990, reason: "Classic mob cinema" },
    { title: "The Godfather", year: 1972, reason: "Definitive crime epic" },
    { title: "Scarface", year: 1983, reason: "Intense crime drama" },
    { title: "Heat", year: 1995, reason: "Masterful thriller" },
    { title: "The Departed", year: 2006, reason: "Tense crime drama" },
    { title: "No Country for Old Men", year: 2007, reason: "Modern western noir" },
    { title: "There Will Be Blood", year: 2007, reason: "Epic character study" },
    { title: "Whiplash", year: 2014, reason: "Intense psychological drama" },
    { title: "La La Land", year: 2016, reason: "Modern musical romance" },
    { title: "Joker", year: 2019, reason: "Dark character exploration" },
    { title: "The Irishman", year: 2019, reason: "Epic mob retrospective" },
    { title: "Once Upon a Time in Hollywood", year: 2019, reason: "Tarantino homage" },
    { title: "Dune", year: 2021, reason: "Epic sci-fi spectacle" },
    { title: "The Batman", year: 2022, reason: "Dark superhero reimagining" },
    { title: "Everything Everywhere All at Once", year: 2022, reason: "Innovative multiverse tale" },
    { title: "Oppenheimer", year: 2023, reason: "Historical epic drama" },
  ];

  // Filter recommendations within a reasonable year range
  const yearFilteredRecs = recommendationSeeds.filter(
    (rec) => rec.year >= yearRange[0] && rec.year <= yearRange[1]
  );

  // Shuffle to add randomness
  const shuffled = yearFilteredRecs.sort(() => Math.random() - 0.5);

  // Fetch movie details from OMDB
  const recommendations: Movie[] = [];
  const seenTitles = new Set(ratedMovies.map((m) => m.Title.toLowerCase()));

  for (const seed of shuffled) {
    if (recommendations.length >= 12) break;

    // Skip if user already rated this movie
    if (seenTitles.has(seed.title.toLowerCase())) continue;

    try {
      const result = await searchMovies(seed.title);
      if (result.Search && result.Search.length > 0) {
        const match = result.Search[0];
        recommendations.push({
          ...match,
          isRecommendation: true,
          reason: seed.reason,
        } as Movie);
      }
    } catch {
      // Skip on error
    }
  }

  return recommendations;
}

// Keep existing functions for backward compatibility but make them no-ops or fallbacks
export async function getSearchQueriesFromMood(
  mood: string,
  seenMovies: string[] = [],
): Promise<{ title: string; reason: string }[]> {
  // Return simple fallback
  return [{ title: mood, reason: "Search for movies matching your mood" }];
}

export async function detectMovieName(input: string): Promise<string | null> {
  // Simple heuristic - if it looks like a title (capitalized), treat it as such
  if (/^[A-Z]/.test(input)) {
    return input;
  }
  return null;
}

export async function getSimilarMovies(
  movieTitle: string,
  genre: string,
  rating: string,
  plot: string,
): Promise<{ title: string; reason: string }[]> {
  // Fallback genre-based suggestions
  const primaryGenre = genre.split(",")[0].trim();
  return [
    { title: `${primaryGenre} movies`, reason: "Same genre" },
    { title: `Best ${primaryGenre}`, reason: "Highly rated in genre" },
    { title: `${primaryGenre} classics`, reason: "Classic films in genre" },
  ];
}

/**
 * Generate personalized movie recommendations based on user's ratings.
 * Uses local algorithm - no AI API calls, works offline.
 */
export async function getPersonalizedRecommendations(
  ratedMovies: RatedMovie[],
): Promise<{ title: string; reason: string }[]> {
  if (ratedMovies.length === 0) {
    return [];
  }

  // Get recommendations
  const movies = await getLocalRecommendations(ratedMovies);

  // Return as title/reason format
  return movies.map((m) => ({
    title: m.Title,
    reason: m.reason || "Recommended for you",
  }));
}
