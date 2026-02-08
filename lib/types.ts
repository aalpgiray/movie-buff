export interface Movie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
  reason?: string;
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
