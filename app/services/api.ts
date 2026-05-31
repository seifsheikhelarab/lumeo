import type { Movie, TVShow, MovieSearchResult, TVSearchResult, SeasonDetails } from "~/types";

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

export async function getTVSeason(tvId: string, seasonNumber: number): Promise<SeasonDetails> {
  const res = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?language=en-US`, { headers });
  return handleResponse(res);
}

export function getImageUrl(path: string | null, size: string = "original"): string {
  if (!path) return "/img/noPoster.png";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export const STREAMING_SERVERS = [
  { id: "vidfast", name: "VidFast", baseUrl: "https://vidfast.pro" },
  { id: "moviesapi", name: "MoviesAPI", baseUrl: "https://moviesapi.to" },
  { id: "pstream", name: "PStream", baseUrl: "https://iframe.pstream.org" },
  { id: "111movies", name: "111Movies", baseUrl: "https://111movies.net" },
  { id: "cinezo", name: "Cinezo", baseUrl: "https://api.cinezo.net" },
  { id: "vidcore", name: "VidCore", baseUrl: "https://vidcore.net" },
  { id: "vidking", name: "VidKing", baseUrl: "https://www.vidking.net" },
  { id: "vidlink", name: "VidLink", baseUrl: "https://vidlink.pro" },
  { id: "videasy", name: "Videasy", baseUrl: "https://player.videasy.net" },
  { id: "vidsrc", name: "VidSrc", baseUrl: "https://vidsrc.cc" },
  { id: "2embed", name: "2Embed", baseUrl: "https://www.2embed.cc" },
];

export function getMovieEmbedUrl(id: string, server: string = "vidfast"): string {
  switch (server) {
    case "vidfast":
      return `${STREAMING_SERVERS[0].baseUrl}/movie/${id}`;
    case "moviesapi":
      return `${STREAMING_SERVERS[1].baseUrl}/movie/${id}`;
    case "pstream":
      return `${STREAMING_SERVERS[2].baseUrl}/embed/tmdb-movie-${id}`;
    case "111movies":
      return `${STREAMING_SERVERS[3].baseUrl}/movie/${id}?autoplay=1`;
    case "cinezo":
      return `${STREAMING_SERVERS[4].baseUrl}/movie/${id}`;
    case "vidcore":
      return `${STREAMING_SERVERS[5].baseUrl}/movie/${id}`;
    case "vidking":
      return `${STREAMING_SERVERS[6].baseUrl}/embed/movie/${id}`;
    case "vidlink":
      return `${STREAMING_SERVERS[7].baseUrl}/movie/${id}`;
    case "videasy":
      return `${STREAMING_SERVERS[8].baseUrl}/movie/${id}&color=8B5CF6&provider=Poseidon`;
    case "vidsrc":
      return `${STREAMING_SERVERS[9].baseUrl}/v3/embed/movie/${id}`;
    case "2embed":
      return `${STREAMING_SERVERS[10].baseUrl}/embed/${id}`;
    default:
      return `${STREAMING_SERVERS[0].baseUrl}/movie/${id}`;
  }
}

export function getTVEmbedUrl(id: string, season: string, episode: string, server: string = "vidfast"): string {
  switch (server) {
    case "vidfast":
      return `${STREAMING_SERVERS[0].baseUrl}/tv/${id}/${season}/${episode}`;
    case "moviesapi":
      return `${STREAMING_SERVERS[1].baseUrl}/tv/${id}-${season}-${episode}`;
    case "pstream":
      return `${STREAMING_SERVERS[2].baseUrl}/embed/tmdb-tv-${id}/${season}/${episode}`;
    case "111movies":
      return `${STREAMING_SERVERS[3].baseUrl}/tv/${id}/${season}/${episode}?autoplay=1`;
    case "cinezo":
      return `${STREAMING_SERVERS[4].baseUrl}/tv/${id}?s=${season}&e=${episode}`;
    case "vidcore":
      return `${STREAMING_SERVERS[5].baseUrl}/tv/${id}/${season}/${episode}`;
    case "vidking":
      return `${STREAMING_SERVERS[6].baseUrl}/embed/tv/${id}/${season}/${episode}`;
    case "vidlink":
      return `${STREAMING_SERVERS[7].baseUrl}/tv/${id}/${season}/${episode}`;
    case "videasy":
      return `${STREAMING_SERVERS[8].baseUrl}/tv/${id}/${season}/${episode}?nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&color=8B5CF6&provider=Poseidon`;
    case "vidsrc":
      return `${STREAMING_SERVERS[9].baseUrl}/v3/embed/tv/${id}/${season}/${episode}`;
    case "2embed":
      return `${STREAMING_SERVERS[10].baseUrl}/embed/${id}?s=${season}&e=${episode}`;
    default:
      return `${STREAMING_SERVERS[0].baseUrl}/tv/${id}/${season}/${episode}`;
  }
}
