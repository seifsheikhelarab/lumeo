import { Link, useLoaderData, useRouteError, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/movies.$id";
import { getMovie, getImageUrl } from "~/services/api";
import { ErrorDisplay, NotFound } from "~/components/UI/ErrorDisplay";

export async function loader({ params }: Route.LoaderArgs) {
  if (!params.id) {
    throw new Response("Movie ID required", { status: 400 });
  }
  const movie = await getMovie(params.id);
  return { movie };
}

export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return <NotFound resource="Movie" />;
  }
  
  return <ErrorDisplay title="Error" message="Failed to load movie details. Please try again." />;
}

export function meta({ data }: Route.MetaArgs) {
  const title = data?.movie?.title || "Movie";
  const overview = data?.movie?.overview?.slice(0, 160) || "";
  return [
    { title: `${title} - Lumeo` },
    { name: "description", content: overview },
    { property: "og:title", content: `${title} - Lumeo` },
    { property: "og:description", content: overview },
    { property: "og:image", content: data?.movie?.poster_path ? `https://image.tmdb.org/t/p/w500${data.movie.poster_path}` : "" },
    { property: "og:type", content: "video.movie" },
  ];
}

export default function MovieDetails() {
  const { movie } = useLoaderData<typeof loader>();

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        <div className="flex-shrink-0 w-full md:w-72 lg:w-80 mx-auto md:mx-0">
          <div className="rounded-xl overflow-hidden bg-zinc-900 shadow-2xl">
            <img
              src={getImageUrl(movie.poster_path, "w500")}
              alt={`${movie.title} poster`}
              className="w-full h-auto"
              width={400}
              height={600}
            />
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 animate-fade-in-up">
            {movie.title}
          </h1>
          {movie.tagline && (
            <p className="text-lg md:text-xl text-zinc-400 italic mb-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              {movie.tagline}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            {movie.genres.map((genre) => (
              <span
                key={genre.id}
                className="px-3 py-1 bg-zinc-800/80 rounded-full text-sm text-zinc-300 hover:bg-amber-500/20 hover:text-amber-200 transition-colors duration-200 cursor-default"
              >
                {genre.name}
              </span>
            ))}
          </div>

          {movie.overview && (
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <h2 className="text-xl font-semibold mb-3 text-zinc-200">Overview</h2>
              <p className="text-zinc-400 leading-relaxed text-base md:text-lg">
                {movie.overview}
              </p>
            </div>
          )}

          {movie.runtime > 0 && (
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
              <span className="text-zinc-500">Runtime: </span>
              <span className="px-3 py-1 bg-zinc-800 rounded text-zinc-300">
                {formatRuntime(movie.runtime)}
              </span>
            </div>
          )}

          <Link
            to={`/movies/${movie.id}/watch`}
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-zinc-900 font-semibold rounded-lg hover:scale-105 hover:bg-zinc-200 active:scale-95 transition-all duration-200 animate-fade-in-up"
            style={{ animationDelay: "500ms" }}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Watch Now
          </Link>
        </div>
      </div>
    </div>
  );
}
