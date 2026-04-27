import { Link, useLoaderData, useRouteError, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/movies";
import { getMovies, getImageUrl } from "~/services/api";
import { ErrorDisplay } from "~/components/UI/ErrorDisplay";
import { Skeleton } from "boneyard-js/react";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query");
  const page = Number(url.searchParams.get("page")) || 1;
  
  if (!query && page < 1) {
    throw new Response("Invalid parameters", { status: 400 });
  }
  
  const data = await getMovies(query, page);
  return { movies: data.results, page, lastPage: data.total_pages, query };
}

export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return <ErrorDisplay title={error.status === 404 ? "No Results" : "Error"} message={error.status === 404 ? "No movies found. Try a different search." : error.statusText} status={error.status === 404 ? undefined : error.status} />;
  }
  
  return <ErrorDisplay title="Error" message="Failed to load movies. Please try again." />;
}

export function meta({ data }: Route.MetaArgs) {
  const title = data?.query ? `Search: ${data.query} - Movies - Lumeo` : "Browse Movies - Lumeo";
  const desc = data?.query 
    ? `Search results for "${data.query}". Find movies streaming online.`
    : "Browse the latest and most popular movies. Watch streaming online free.";
  return [
    { title },
    { name: "description", content: desc },
    { property: "og:title", content: title },
    { property: "og:description", content: desc },
    { property: "og:type", content: "website" },
  ];
}

export default function Movies() {
  const { movies, page, lastPage, query } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <Skeleton name="movies-list" loading={false}>
        <form method="GET" className="mb-10">
          <div className="flex gap-3 max-w-lg">
            <input
              type="text"
              name="query"
              defaultValue={query || ""}
              placeholder="Find a movie..."
              aria-label="Search movies"
              className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-8">
          {movies.map((movie, idx) => (
            <Link
              key={movie.id}
              to={`/movies/${movie.id}`}
              className="group block animate-fade-in-up"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className="aspect-[2/3] rounded-md overflow-hidden bg-zinc-900 mb-3">
                <img
                  src={getImageUrl(movie.poster_path, "w500")}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  width={300}
                  height={450}
                />
              </div>
              <h3 className="font-medium text-sm text-zinc-300 truncate group-hover:text-white transition-colors">
                {movie.title}
              </h3>
              <p className="text-xs text-zinc-600 mt-0.5">
                {movie.release_date?.split("-")[0] || "—"}
              </p>
            </Link>
          ))}
        </div>

        <div className="flex justify-between items-center mt-16 pt-6 border-t border-zinc-800">
          <div className="text-sm text-zinc-500">
            Page {page} of {lastPage}
          </div>
          <div className="flex gap-3">
            {page > 1 && (
              <Link
                to={`/movies?page=${page - 1}${query ? `&query=${query}` : ""}`}
                className="px-5 py-2.5 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Previous
              </Link>
            )}
            {page < lastPage && (
              <Link
                to={`/movies?page=${page + 1}${query ? `&query=${query}` : ""}`}
                className="px-5 py-2.5 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </Skeleton>
    </div>
  );
}