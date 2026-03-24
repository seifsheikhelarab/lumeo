import { Link, useLoaderData, useRouteError, isRouteErrorResponse } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/tv.$id";
import { getTVShow, getImageUrl } from "~/services/api";
import { ErrorDisplay, NotFound } from "~/components/UI/ErrorDisplay";

export async function loader({ params }: Route.LoaderArgs) {
  if (!params.id) {
    throw new Response("TV Show ID required", { status: 400 });
  }
  const show = await getTVShow(params.id);
  return { show };
}

export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return <NotFound resource="TV Show" />;
  }
  
  return <ErrorDisplay title="Error" message="Failed to load TV show details. Please try again." />;
}

export function meta({ data }: Route.MetaArgs) {
  const title = data?.show?.name || "TV Show";
  const overview = data?.show?.overview?.slice(0, 160) || "";
  return [
    { title: `${title} - Lumeo` },
    { name: "description", content: overview },
    { property: "og:title", content: `${title} - Lumeo` },
    { property: "og:description", content: overview },
    { property: "og:image", content: data?.show?.poster_path ? `https://image.tmdb.org/t/p/w500${data.show.poster_path}` : "" },
    { property: "og:type", content: "video.tv_show" },
  ];
}

export default function TVDetails() {
  const { show } = useLoaderData<typeof loader>();
  const [openSeasons, setOpenSeasons] = useState<Record<number, boolean>>({});

  const toggleSeason = (seasonNumber: number) => {
    setOpenSeasons((prev) => ({
      ...prev,
      [seasonNumber]: !prev[seasonNumber],
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mb-16">
        <div className="flex-shrink-0 w-full md:w-72 lg:w-80 mx-auto md:mx-0">
          <div className="rounded-xl overflow-hidden bg-zinc-900 shadow-2xl">
            <img
              src={getImageUrl(show.poster_path, "w500")}
              alt={`${show.name} poster`}
              className="w-full h-auto"
              width={400}
              height={600}
            />
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 animate-fade-in-up">
            {show.name}
          </h1>
          {show.tagline && (
            <p className="text-lg md:text-xl text-zinc-400 italic mb-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              {show.tagline}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            {show.genres.map((genre) => (
              <span
                key={genre.id}
                className="px-3 py-1 bg-zinc-800/80 rounded-full text-sm text-zinc-300 hover:bg-amber-500/20 hover:text-amber-200 transition-colors duration-200 cursor-default"
              >
                {genre.name}
              </span>
            ))}
          </div>

          {show.overview && (
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <h2 className="text-xl font-semibold mb-3 text-zinc-200">Overview</h2>
              <p className="text-zinc-400 leading-relaxed text-base md:text-lg">
                {show.overview}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-6 mb-8 text-zinc-400 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <div>
              <span className="text-zinc-500">Total Episodes: </span>
              <span className="text-white font-medium">{show.number_of_episodes}</span>
            </div>
            <div>
              <span className="text-zinc-500">Total Seasons: </span>
              <span className="text-white font-medium">{show.number_of_seasons}</span>
            </div>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-6 animate-fade-in-up">Seasons</h2>
        <div className="space-y-4">
          {show.seasons.map((season, idx) => (
            <div 
              key={season.id} 
              className="border border-zinc-800 rounded-lg overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <button
                onClick={() => toggleSeason(season.season_number)}
                className="w-full flex items-center gap-4 p-4 bg-zinc-900 hover:bg-zinc-800 transition-colors text-left"
              >
                <img
                  src={getImageUrl(season.poster_path, "w92")}
                  alt={`Season ${season.season_number}`}
                  className="w-12 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {season.name}
                    <span className="text-zinc-500 font-normal ml-2">
                      (Season {season.season_number})
                    </span>
                  </h3>
                  <span className="text-sm text-zinc-500">
                    {season.episode_count} Episodes
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${
                    openSeasons[season.season_number] ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  openSeasons[season.season_number] ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                  {season.overview && (
                    <p className="text-zinc-400 mb-4 text-sm">{season.overview}</p>
                  )}
                  {season.episode_count > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {Array.from({ length: season.episode_count }, (_, i) => i + 1).map((episode) => (
                        <Link
                          key={episode}
                          to={`/tv/${show.id}/season/${season.season_number}/episode/${episode}`}
                          className="flex items-center justify-between px-3 py-2 bg-zinc-900 rounded hover:bg-amber-500/20 hover:text-amber-200 transition-colors"
                        >
                          <span className="text-sm">Ep {episode}</span>
                          <span className="text-xs text-zinc-500">▶</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-sm">No episode data available.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
