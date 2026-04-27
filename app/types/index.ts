export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  runtime: number;
  tagline: string;
  genres: Genre[];
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  tagline: string;
  genres: Genre[];
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: Season[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  poster_path: string | null;
  overview: string;
  episode_count: number;
}

export interface MovieSearchResult {
  results: Movie[];
  page: number;
  total_pages: number;
}

export interface TVSearchResult {
  results: TVShow[];
  page: number;
  total_pages: number;
}

export interface Episode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date: string;
  vote_average: number;
  still_path: string | null;
  runtime: number;
}

export interface SeasonDetails {
  id: number;
  name: string;
  season_number: number;
  overview: string;
  air_date: string;
  poster_path: string | null;
  episodes: Episode[];
}
