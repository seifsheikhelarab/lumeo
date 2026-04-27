import { Link, useLoaderData, useRouteError, isRouteErrorResponse } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/tv.$id";
import { getTVShow, getTVSeason, getImageUrl } from "~/services/api";
import { ErrorDisplay, NotFound } from "~/components/UI/ErrorDisplay";
import type { SeasonDetails } from "~/types";

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

function formatRuntime(minutes: number | null): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function TVDetails() {
  const { show } = useLoaderData<typeof loader>();
  const [openSeasons, setOpenSeasons] = useState<Record<number, boolean>>({});
  const [seasonDetails, setSeasonDetails] = useState<Record<number, SeasonDetails | null>>({});
  const [loadingSeasons, setLoadingSeasons] = useState<Record<number, boolean>>({});

  const toggleSeason = async (e: React.MouseEvent, seasonNumber: number) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpening = !openSeasons[seasonNumber];
    setOpenSeasons((prev) => ({ ...prev, [seasonNumber]: isOpening }));
    
    if (isOpening && !seasonDetails[seasonNumber]) {
      setLoadingSeasons((prev) => ({ ...prev, [seasonNumber]: true }));
      try {
        const details = await getTVSeason(String(show.id), seasonNumber);
        setSeasonDetails((prev) => ({ ...prev, [seasonNumber]: details }));
      } catch (err) {
        console.error("Failed to load season:", err);
      } finally {
        setLoadingSeasons((prev) => ({ ...prev, [seasonNumber]: false }));
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex gap-8 mb-12 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        <div className="flex-shrink-0 w-40">
          <img
            src={getImageUrl(show.poster_path, "w300")}
            alt={`${show.name} poster`}
            className="w-full rounded-lg"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">
            {show.name}
          </h1>
          <p className="text-sm text-zinc-500 mb-4">
            {show.number_of_seasons} seasons · {show.number_of_episodes} episodes
          </p>
          {show.overview && (
            <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">
              {show.overview}
            </p>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-zinc-300">Seasons</h2>
        <div className="space-y-2">
          {show.seasons.filter(s => s.season_number > 0).map((season, idx) => (
            <div key={season.id} className="border border-zinc-800 rounded-lg overflow-hidden animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <button
                onClick={(e) => toggleSeason(e, season.season_number)}
                className="w-full flex items-center gap-3 p-3 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] transition-all duration-200 text-left"
              >
                <span className="text-zinc-500 font-medium w-8">
                  S{season.season_number}
                </span>
                <span className="flex-1 text-zinc-300 truncate">
                  {season.name}
                </span>
                <span className="text-zinc-600 text-sm">
                  {season.episode_count} eps
                </span>
                <svg
                  className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${openSeasons[season.season_number] ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openSeasons[season.season_number] && (
                <div className="border-t border-zinc-800 bg-zinc-950">
                  {loadingSeasons[season.season_number] ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-3 animate-shimmer rounded-md">
                          <div className="w-6 h-4 bg-zinc-800 rounded" />
                          <div className="flex-1">
                            <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-zinc-800/50 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : seasonDetails[season.season_number] ? (
                    <div className="divide-y divide-zinc-800/50">
                      {seasonDetails[season.season_number]!.episodes.map((episode) => (
                        <Link
                          key={episode.id}
                          to={`/tv/${show.id}/season/${season.season_number}/episode/${episode.episode_number}`}
                          className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 transition-colors"
                        >
                          <span className="text-zinc-600 text-sm w-6">
                            {episode.episode_number}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-zinc-300 text-sm truncate">
                              {episode.name || `Episode ${episode.episode_number}`}
                            </p>
                            {(episode.air_date || episode.runtime) && (
                              <p className="text-zinc-600 text-xs mt-0.5">
                                {[formatDate(episode.air_date), formatRuntime(episode.runtime)].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                          {episode.still_path && (
                            <img
                              src={getImageUrl(episode.still_path, "w92")}
                              alt=""
                              className="w-16 h-10 object-cover rounded"
                            />
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <button
                        onClick={(e) => toggleSeason(e, season.season_number)}
                        className="text-zinc-500 hover:text-zinc-300 text-sm"
                      >
                        Load episodes
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}