import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/tv.$id.season.$season.episode.$episode";
import { getTVEmbedUrl, getTVShow, STREAMING_SERVERS } from "~/services/api";
import type { TVShow, Season } from "~/types";

export async function loader({ params }: Route.LoaderArgs) {
  const { id, season, episode } = params;
  let show: TVShow | null = null;
  
  try {
    show = await getTVShow(id!);
  } catch (e) {
    console.error("Failed to load show:", e);
  }
  
  if (!show) {
    return { id, season, episode, showName: "Episode", totalEpisodes: 1, hasPrev: false, hasNext: false };
  }
  
  const currentSeasonNum = Number(season);
  const currentEpisodeNum = Number(episode);
  
  const currentSeason = show.seasons.find(s => s.season_number === currentSeasonNum);
  const totalEpisodes = currentSeason?.episode_count || 1;
  
  const isFirstEpisode = currentSeasonNum === 1 && currentEpisodeNum === 1;
  const isLastEpisode = isLastInShow(show, currentSeasonNum, currentEpisodeNum, totalEpisodes);
  
  return {
    id,
    season,
    episode,
    showName: show.name || "Episode",
    totalEpisodes,
    hasPrev: !isFirstEpisode,
    hasNext: !isLastEpisode,
  };
}

function isLastInShow(show: TVShow, currentSeason: number, currentEpisode: number, totalEpisodes: number): boolean {
  if (currentEpisode < totalEpisodes) return false;
  
  const nextSeasons = show.seasons.filter(s => s.season_number > currentSeason && s.episode_count > 0);
  return nextSeasons.length === 0;
}

export function meta() {
  return [
    { title: "Watch Episode - Lumeo" },
    { name: "description", content: "Watch TV episodes streaming online free" },
  ];
}

export default function TVWatch() {
  const { id, season, episode, showName, totalEpisodes, hasPrev, hasNext } = useLoaderData<typeof loader>();
  const [server, setServer] = useState("vidfast");
  const embedUrl = getTVEmbedUrl(id!, season!, episode!, server);
  
  const currentSeason = Number(season);
  const currentEpisode = Number(episode);
  const prevEpisode = currentEpisode > 1 
    ? { season: currentSeason, episode: currentEpisode - 1 }
    : null;
  const nextEpisode = currentEpisode < totalEpisodes 
    ? { season: currentSeason, episode: currentEpisode + 1 }
    : { season: currentSeason + 1, episode: 1 };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-2 text-center">
        {showName}
      </h1>
      <p className="text-zinc-400 text-center mb-6">
        Season {season}, Episode {episode}
      </p>

      <div className="aspect-video bg-zinc-900 rounded-lg overflow-hidden mb-6 shadow-2xl">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="TV episode player"
        />
      </div>

      <div className="flex flex-nowrap items-center justify-center gap-3 mb-4">
          <Link
            to={prevEpisode ? `/tv/${id}/season/${prevEpisode.season}/episode/${prevEpisode.episode}` : "#"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${prevEpisode && hasPrev ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95" : "bg-zinc-800 text-zinc-600 cursor-not-allowed"}`}
            aria-disabled={!prevEpisode || !hasPrev}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Prev Episode
          </Link>
          <span className="px-4 py-2 bg-zinc-900 rounded-lg text-zinc-400 font-plex-mono">
            {episode}/{totalEpisodes}
          </span>
          <Link
            to={hasNext ? `/tv/${id}/season/${nextEpisode.season}/episode/${nextEpisode.episode}` : "#"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${hasNext ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95" : "bg-zinc-800 text-zinc-600 cursor-not-allowed"}`}
            aria-disabled={!hasNext}
          >
            Next Episode
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="flex flex-nowrap items-center justify-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="server-select" className="text-zinc-400 text-sm">Server:</label>
            <select
              id="server-select"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
            >
              {STREAMING_SERVERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <Link
            to={`/together?contentId=${id}&contentType=episode&season=${season}&episode=${episode}`}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Watch Together
          </Link>

          <Link
            to={`/tv/${id}`}
            className="px-4 py-2 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all"
          >
            Back to Show
          </Link>
        </div>
    </div>
  );
}
