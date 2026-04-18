import { useEffect, useState } from "react";
import { getMovieEmbedUrl, getTVEmbedUrl, STREAMING_SERVERS } from "~/services/api";

interface TogetherPlayerProps {
  contentId: string;
  contentType: "movie" | "episode";
  season?: string;
  episode?: string;
  isStarted: boolean;
  server: string;
  currentTime?: number;
  isPlaying?: boolean;
  playbackUpdatedBy?: string;
}

export function TogetherPlayer({
  contentId,
  contentType,
  season,
  episode,
  isStarted,
  server,
  currentTime = 0,
  isPlaying = false,
  playbackUpdatedBy,
}: TogetherPlayerProps) {
  const [playbackKey, setPlaybackKey] = useState(0);

  useEffect(() => {
    if (isStarted) {
      setPlaybackKey((k) => k + 1);
    }
  }, [isStarted, isPlaying, currentTime]);

  if (!isStarted) {
    return (
      <div className="aspect-video bg-zinc-900 rounded-lg flex flex-col items-center justify-center p-8 text-center border border-zinc-800 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-indigo-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Ready to watch?</h3>
        <p className="text-zinc-400 max-w-sm">
          The host hasn't started the playback yet. Grab your popcorn and wait for the show to begin!
        </p>
      </div>
    );
  }

  const embedUrl =
    contentType === "movie"
      ? getMovieEmbedUrl(contentId, server)
      : getTVEmbedUrl(contentId, season || "1", episode || "1", server);

  // Add autoplay and ensure it reloads when playback state changes
  const finalUrl = `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1`;

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-zinc-900 rounded-lg overflow-hidden shadow-2xl border border-zinc-800 relative">
        <iframe
          key={`${server}-${playbackKey}`}
          src={finalUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Together player"
        />
        {playbackUpdatedBy && (
          <div className="absolute top-3 right-3 bg-zinc-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-700/50 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
            <span className="text-xs text-zinc-300">
              {isPlaying ? "Playing" : "Paused"} • {playbackUpdatedBy}
            </span>
          </div>
        )}
      </div>
      
      <div className="bg-zinc-900/50 rounded-lg px-4 py-2 border border-zinc-800 inline-flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Source:</span>
        <span className="text-xs text-indigo-400 font-mono">
          {STREAMING_SERVERS.find(s => s.id === server)?.name || server}
        </span>
      </div>
    </div>
  );
}
