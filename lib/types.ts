export interface Movie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
  reason?: string;
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
