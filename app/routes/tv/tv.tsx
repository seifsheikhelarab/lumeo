import { Link, useLoaderData, useRouteError, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/tv";
import { getTVShows, getImageUrl } from "~/services/api";
import { ErrorDisplay } from "~/components/UI/ErrorDisplay";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query");
  const page = Number(url.searchParams.get("page")) || 1;
  
  if (!query && page < 1) {
    throw new Response("Invalid parameters", { status: 400 });
  }
  
  const data = await getTVShows(query, page);
  return { shows: data.results, page, lastPage: data.total_pages, query };
}

export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return <ErrorDisplay title={error.status === 404 ? "No Results" : "Error"} message={error.status === 404 ? "No TV shows found. Try a different search." : error.statusText} status={error.status === 404 ? undefined : error.status} />;
  }
  
  return <ErrorDisplay title="Error" message="Failed to load TV shows. Please try again." />;
}

export function meta({ data }: Route.MetaArgs) {
  const title = data?.query ? `Search: ${data.query} - TV Shows - Lumeo` : "Browse TV Shows - Lumeo";
  const desc = data?.query 
    ? `Search results for "${data.query}". Find TV shows streaming online.`
    : "Browse the latest and most popular TV shows. Watch streaming online free.";
  return [
    { title },
    { name: "description", content: desc },
    { property: "og:title", content: title },
    { property: "og:description", content: desc },
    { property: "og:type", content: "website" },
  ];
}

export default function TV() {
  const { shows, page, lastPage, query } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <form method="GET" className="mb-10">
        <div className="flex gap-3 max-w-lg">
          <input
            type="text"
            name="query"
            defaultValue={query || ""}
            placeholder="Find a show..."
            aria-label="Search TV shows"
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
        {shows.map((show, idx) => (
          <Link
            key={show.id}
            to={`/tv/${show.id}`}
            className="group block animate-fade-in-up"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className="aspect-[2/3] rounded-md overflow-hidden bg-zinc-900 mb-3">
              <img
                src={getImageUrl(show.poster_path, "w500")}
                alt={show.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                width={300}
                height={450}
              />
            </div>
            <h3 className="font-medium text-sm text-zinc-300 truncate group-hover:text-white transition-colors">
              {show.name}
            </h3>
            <p className="text-xs text-zinc-600 mt-0.5">
              TV Show
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
              to={`/tv?page=${page - 1}${query ? `&query=${query}` : ""}`}
              className="px-5 py-2.5 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Previous
            </Link>
          )}
          {page < lastPage && (
            <Link
              to={`/tv?page=${page + 1}${query ? `&query=${query}` : ""}`}
              className="px-5 py-2.5 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
