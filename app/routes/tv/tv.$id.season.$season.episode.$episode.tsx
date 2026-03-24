import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/tv.$id.season.$season.episode.$episode";
import { getTVEmbedUrl, STREAMING_SERVERS } from "~/services/api";

export async function loader({ params }: Route.LoaderArgs) {
  return {
    id: params.id,
    season: params.season,
    episode: params.episode,
  };
}

export function meta() {
  return [
    { title: "Watch Episode - Lumeo" },
    { name: "description", content: "Watch TV episodes streaming online free" },
  ];
}

export default function TVWatch() {
  const { id, season, episode } = useLoaderData<typeof loader>();
  const [server, setServer] = useState("moviesapi");
  const embedUrl = getTVEmbedUrl(id!, season!, episode!, server);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Season {season}, Episode {episode}
      </h1>

      <div className="aspect-video bg-zinc-900 rounded-lg overflow-hidden mb-6 shadow-2xl">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="TV episode player"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="server-select" className="text-zinc-400 text-sm">Server:</label>
          <select
            id="server-select"
            value={server}
            onChange={(e) => setServer(e.target.value)}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
          >
            {STREAMING_SERVERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <Link
          to={`/tv/${id}`}
          className="px-6 py-2 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          ← Back to Show
        </Link>
      </div>
    </div>
  );
}
