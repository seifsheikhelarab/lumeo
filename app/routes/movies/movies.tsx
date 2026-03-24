import { Link, useLoaderData, useRouteError, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/movies";
import { getMovies, getImageUrl } from "~/services/api";
import { ErrorDisplay } from "~/components/UI/ErrorDisplay";

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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <form method="GET" className="mb-8">
        <div className="flex gap-3 max-w-xl">
          <input
            type="text"
            name="query"
            defaultValue={query || ""}
            placeholder="Search movies..."
            aria-label="Search movies"
            className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-white text-zinc-900 font-medium rounded-lg hover:scale-105 hover:bg-zinc-200 active:scale-95 transition-all duration-200"
          >
            Search
          </button>
        </div>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {movies.map((movie, idx) => (
          <Link
            key={movie.id}
            to={`/movies/${movie.id}`}
            className="group block animate-fade-in-up"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900 mb-3 shadow-lg group-hover:shadow-amber-500/20 transition-shadow duration-300">
              <img
                src={getImageUrl(movie.poster_path, "w500")}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                width={300}
                height={450}
              />
            </div>
            <h3 className="font-medium text-sm truncate text-white group-hover:text-amber-200 transition-colors">
              {movie.title}
            </h3>
            <div className="flex items-center justify-between mt-1 text-xs text-zinc-500">
              <span>{movie.release_date?.split("-")[0] || "N/A"}</span>
              <span className="px-2 py-0.5 bg-zinc-800 rounded text-amber-200/80">
                {movie.vote_average.toFixed(1)} / 10
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center gap-4 mt-12">
        {page > 1 && (
          <Link
            to={`/movies?page=${page - 1}${query ? `&query=${query}` : ""}`}
            className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Previous
          </Link>
        )}
        {page < lastPage && (
          <Link
            to={`/movies?page=${page + 1}${query ? `&query=${query}` : ""}`}
            className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
