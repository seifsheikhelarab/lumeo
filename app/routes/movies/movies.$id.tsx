import { Link, useLoaderData, useRouteError, isRouteErrorResponse, useNavigation } from "react-router";
import type { Route } from "./+types/movies.$id";
import { getMovie, getImageUrl } from "~/services/api";
import { ErrorDisplay, NotFound } from "~/components/UI/ErrorDisplay";
import { Skeleton } from "boneyard-js/react";

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

function formatRuntime(minutes: number): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function MovieDetails() {
  const { movie } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        <Skeleton
          name="movie-poster"
          loading={isLoading}
          initialBones={{
            breakpoints: {
              768: {
                name: "movie-poster",
                viewportWidth: 768,
                width: 100,
                height: 450,
                bones: [[0, 0, 100, 75, 8]],
              },
              1280: {
                name: "movie-poster",
                viewportWidth: 1280,
                width: 100,
                height: 480,
                bones: [[0, 0, 100, 75, 8]],
              },
            },
          }}
        >
          <div className="flex-shrink-0 w-full md:w-72 lg:w-80 mx-auto md:mx-0 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
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
        </Skeleton>

        <div className="flex-1">
          <Skeleton
            name="movie-title"
            loading={isLoading}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-white animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              {movie.title}
            </h1>
          </Skeleton>

          <Skeleton
            name="movie-tagline"
            loading={isLoading}
          >
            {movie.tagline && (
              <p className="text-lg md:text-xl text-zinc-400 italic mb-6 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
                {movie.tagline}
              </p>
            )}
          </Skeleton>

          <Skeleton
            name="movie-genres"
            loading={isLoading}
          >
            <div className="flex flex-wrap gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-zinc-800/80 rounded-full text-sm text-zinc-300 hover:text-zinc-100 transition-colors duration-200 cursor-default"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </Skeleton>

          <Skeleton
            name="movie-overview"
            loading={isLoading}
          >
            {movie.overview && (
              <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "250ms" }}>
                <h2 className="text-xl font-semibold mb-3 text-zinc-200">Overview</h2>
                <p className="text-zinc-400 leading-relaxed text-base md:text-lg">
                  {movie.overview}
                </p>
              </div>
            )}
          </Skeleton>

          <Skeleton
            name="movie-runtime"
            loading={isLoading}
          >
            {movie.runtime > 0 && (
              <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                <span className="text-zinc-500">Runtime: </span>
                <span className="px-3 py-1 bg-zinc-800 rounded text-zinc-300">
                  {formatRuntime(movie.runtime)}
                </span>
              </div>
            )}
          </Skeleton>

          <Skeleton
            name="movie-watch-btn"
            loading={isLoading}
          >
            <Link
              to={`/movies/${movie.id}/watch`}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-zinc-900 font-semibold rounded-lg hover:scale-105 hover:bg-zinc-200 active:scale-95 transition-all duration-200 animate-fade-in-up"
              style={{ animationDelay: "350ms" }}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Watch Now
            </Link>
          </Skeleton>
        </div>
      </div>
    </div>
  );
}