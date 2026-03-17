export interface Movie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
  reason?: string;
  rating?: number;
  imdbRating?: string;
  isSeen?: boolean;
}

export interface MovieDetails extends Movie {
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  Language?: string;
  Country?: string;
  Awards?: string;
  imdbRating?: string;
  imdbVotes?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  Response?: string;
  Error?: string;
}

export interface OmdbSearchResponse {
  Search: Movie[];
  Response: string;
  totalResults?: string;
  Error?: string;
}

export interface MovieRecommendation {
  title: string;
  reason: string;
}

export interface StreamingOption {
  service: { id: string; name: string };
  link: string;
  type: string; // 'subscription' | 'rent' | 'buy' | 'free' | 'addon'
}

export interface CountryMetadata {
  countryCode: string;
  name: string;
  flagEmoji: string;
}

export interface WatchlistCategory {
  id: string;
  name: string;
  movieIds: string[];
}
