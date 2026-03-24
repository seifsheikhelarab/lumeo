import type { Movie, TVShow, MovieSearchResult, TVSearchResult } from "~/types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN;

const headers = {
  accept: "application/json",
  Authorization: `Bearer ${TMDB_TOKEN}`,
};

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiError(401, "Invalid API token. Please check your TMDB token.");
    }
    if (response.status === 404) {
      throw new ApiError(404, "Resource not found.");
    }
    throw new ApiError(response.status, `API request failed with status ${response.status}`);
  }
  return response.json();
}

export async function getMovies(query: string | null, page: number = 1): Promise<MovieSearchResult> {
  const url = query
    ? `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}`
    : `${TMDB_BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=${page}&sort_by=popularity.desc`;

  const res = await fetch(url, { headers });
  return handleResponse(res);
}

export async function getMovie(id: string): Promise<Movie> {
  const res = await fetch(`${TMDB_BASE_URL}/movie/${id}?language=en-US`, { headers });
  return handleResponse(res);
}

export async function getTVShows(query: string | null, page: number = 1): Promise<TVSearchResult> {
  const url = query
    ? `${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}&page=${page}`
    : `${TMDB_BASE_URL}/discover/tv?page=${page}&sort_by=popularity.desc`;

  const res = await fetch(url, { headers });
  return handleResponse(res);
}

export async function getTVShow(id: string): Promise<TVShow> {
  const res = await fetch(`${TMDB_BASE_URL}/tv/${id}?language=en-US`, { headers });
  return handleResponse(res);
}

export function getImageUrl(path: string | null, size: string = "original"): string {
  if (!path) return "/img/noPoster.png";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export const STREAMING_SERVERS = [
  { id: "moviesapi", name: "Server 1", baseUrl: "https://moviesapi.to" },
  { id: "vidfast", name: "Server 2", baseUrl: "https://vidfast.pro" },
  { id: "pstream", name: "Server 3", baseUrl: "https://iframe.pstream.org" },
  { id: "rivestream", name: "Server 4", baseUrl: "https://rivestream.org" },
  { id: "videasy", name: "Server 5", baseUrl: "https://player.videasy.net" },
];

export function getMovieEmbedUrl(id: string, server: string = "moviesapi"): string {
  switch (server) {
    case "moviesapi":
      return `${STREAMING_SERVERS[0].baseUrl}/movie/${id}`;
    case "vidfast":
      return `${STREAMING_SERVERS[1].baseUrl}/movie/${id}`;
    case "pstream":
      return `${STREAMING_SERVERS[2].baseUrl}/embed/tmdb-movie-${id}`;
    case "rivestream":
      return `${STREAMING_SERVERS[3].baseUrl}/embed?type=movie&id=${id}`;
    case "videasy":
      return `${STREAMING_SERVERS[4].baseUrl}/movie/${id}&color=8B5CF6&provider=Poseidon`;
    default:
      return `${STREAMING_SERVERS[0].baseUrl}/movie/${id}`;
  }
}

export function getTVEmbedUrl(id: string, season: string, episode: string, server: string = "moviesapi"): string {
  switch (server) {
    case "moviesapi":
      return `${STREAMING_SERVERS[0].baseUrl}/tv/${id}-${season}-${episode}`;
    case "vidfast":
      return `${STREAMING_SERVERS[1].baseUrl}/tv/${id}/${season}/${episode}`;
    case "pstream":
      return `${STREAMING_SERVERS[2].baseUrl}/embed/tmdb-tv-${id}/${season}/${episode}`;
    case "rivestream":
      return `${STREAMING_SERVERS[3].baseUrl}/embed?type=tv&id=${id}&season=${season}&episode=${episode}`;
    case "videasy":
      return `${STREAMING_SERVERS[4].baseUrl}/tv/${id}/${season}/${episode}?nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&color=8B5CF6&provider=Poseidon`;
    default:
      return `${STREAMING_SERVERS[0].baseUrl}/tv/${id}-${season}-${episode}`;
  }
}
