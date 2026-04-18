import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/movies.$id.watch";
import { getMovieEmbedUrl, STREAMING_SERVERS } from "~/services/api";

export async function loader({ params }: Route.LoaderArgs) {
  return { id: params.id };
}

export function meta() {
  return [
    { title: "Watch Movie - Lumeo" },
    { name: "description", content: "Watch movies streaming online free" },
  ];
}

export default function MovieWatch() {
  const { id } = useLoaderData<typeof loader>();
  const [server, setServer] = useState("moviesapi");
  const embedUrl = getMovieEmbedUrl(id!, server);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6 text-center">Enjoy watching!</h1>

      <div className="aspect-video bg-zinc-900 rounded-lg overflow-hidden mb-6 shadow-2xl">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Movie player"
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
          to={`/together?contentId=${id}&contentType=movie`}
          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Watch Together
        </Link>

        <Link
          to={`/movies/${id}`}
          className="px-6 py-2 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          ← Back to Details
        </Link>
      </div>
    </div>
  );
}
