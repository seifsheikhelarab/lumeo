import { useEffect, useRef, useCallback, useState } from "react";
import { getMovieEmbedUrl, getTVEmbedUrl } from "~/services/api";

const VIDFAST_ORIGINS = [
  "https://vidfast.pro",
  "https://vidfast.in",
  "https://vidfast.io",
  "https://vidfast.me",
  "https://vidfast.net",
  "https://vidfast.pm",
  "https://vidfast.xyz",
];

const SYNC_THRESHOLD = 2;
const BLOCK_DURATION = 800;
const SYNC_CHECK_INTERVAL = 10000;
const MAX_DRIFT_ALLOWED = 5;

interface TogetherPlayerProps {
  contentId: string;
  contentType: "movie" | "episode";
  season?: string;
  episode?: string;
  server: string;
  isStarted: boolean;
  isHost: boolean;
  currentTime: number;
  isPlaying: boolean;
  playbackUpdatedBy?: string;
  onPlayPause?: (isPlaying: boolean, currentTime: number) => void;
  onSeek?: (currentTime: number) => void;
  onSyncRequest?: () => void;
}

export function TogetherPlayer({
  contentId,
  contentType,
  season,
  episode,
  server,
  isStarted,
  isHost,
  currentTime,
  isPlaying,
  playbackUpdatedBy,
  onPlayPause,
  onSeek,
  onSyncRequest,
}: TogetherPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastTimeRef = useRef(0);
  const blockedUntilRef = useRef(0);
  const lastHostUpdateRef = useRef(0);
  const isRemoteUpdateRef = useRef(false);
  const [localPlayerReady, setLocalPlayerReady] = useState(false);
  const syncCheckIntervalRef = useRef<number | null>(null);

  const send = useCallback((msg: Record<string, unknown>) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, "*");
    }
  }, []);

  const getStatus = useCallback(() => {
    send({ command: "getStatus" });
  }, [send]);

  const forceSync = useCallback(() => {
    const now = Date.now();
    if (now < blockedUntilRef.current) return;
    
    blockedUntilRef.current = now + BLOCK_DURATION;
    lastTimeRef.current = currentTime;
    send({ command: isPlaying ? "play" : "pause" });
    if (Math.abs(currentTime - lastTimeRef.current) > SYNC_THRESHOLD) {
      send({ command: "seek", time: currentTime });
    }
  }, [currentTime, isPlaying, send]);

  useEffect(() => {
    if (!isStarted) return;

    const handler = (e: MessageEvent) => {
      if (!VIDFAST_ORIGINS.includes(e.origin)) return;
      if (e.data?.type !== "PLAYER_EVENT") return;

      const ev = e.data.data?.event;
      const t = e.data.data?.currentTime;

      if (ev === "playerstatus") {
        setLocalPlayerReady(true);
        if (!isHost && Math.abs(t - currentTime) > MAX_DRIFT_ALLOWED && Date.now() - lastHostUpdateRef.current > 2000) {
          onSyncRequest?.();
        }
        return;
      }

      const now = Date.now();
      if (now < blockedUntilRef.current) return;

      if (ev === "play") {
        isRemoteUpdateRef.current = true;
        onPlayPause?.(true, t ?? 0);
        setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
      } else if (ev === "pause") {
        isRemoteUpdateRef.current = true;
        onPlayPause?.(false, t ?? 0);
        setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
      } else if (ev === "seeked") {
        isRemoteUpdateRef.current = true;
        onSeek?.(t ?? 0);
        setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isStarted, onPlayPause, onSeek, onSyncRequest, currentTime, isHost]);

  useEffect(() => {
    if (!isStarted) return;

    const now = Date.now();
    if (now < blockedUntilRef.current) return;

    if (!isHost && isRemoteUpdateRef.current) return;

    blockedUntilRef.current = now + BLOCK_DURATION;
    send({ command: isPlaying ? "play" : "pause" });
  }, [isStarted, isPlaying, send, isHost]);

  useEffect(() => {
    if (!isStarted) return;

    if (!isHost && isRemoteUpdateRef.current) return;

    const drift = Math.abs(currentTime - lastTimeRef.current);
    if (drift < SYNC_THRESHOLD) return;

    const now = Date.now();
    if (now < blockedUntilRef.current) return;

    blockedUntilRef.current = now + BLOCK_DURATION;
    lastTimeRef.current = currentTime;
    send({ command: "seek", time: currentTime });
  }, [isStarted, currentTime, send, isHost]);

  useEffect(() => {
    if (!isStarted) return;

    syncCheckIntervalRef.current = window.setInterval(() => {
      if (!isHost) {
        getStatus();
      }
    }, SYNC_CHECK_INTERVAL);

    return () => {
      if (syncCheckIntervalRef.current) {
        clearInterval(syncCheckIntervalRef.current);
      }
    };
  }, [isStarted, isHost, getStatus]);

  useEffect(() => {
    if (!isStarted) return;

    blockedUntilRef.current = 0;
    lastTimeRef.current = 0;
    lastHostUpdateRef.current = Date.now();

    const initCheck = window.setTimeout(() => {
      if (isHost) {
        send({ command: "getStatus" });
      }
    }, 2000);

    return () => clearTimeout(initCheck);
  }, [isStarted, isHost, send]);

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
          {isHost
            ? 'Press "Start for Everyone" when your party is ready.'
            : "The host hasn't started the playback yet. Grab your popcorn!"}
        </p>
      </div>
    );
  }

  const src =
    contentType === "movie"
      ? getMovieEmbedUrl(contentId, server)
      : getTVEmbedUrl(contentId, season || "1", episode || "1", server);

  return (
    <div className="space-y-2">
      <div className="aspect-video bg-zinc-950 rounded-lg overflow-hidden shadow-2xl border border-zinc-800 relative">
        <iframe
          ref={iframeRef}
          src={src}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          referrerPolicy="no-referrer"
          title="VidFast Player"
        />

        {playbackUpdatedBy && (
          <div className="absolute top-3 right-3 bg-zinc-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-700/50 flex items-center gap-2 pointer-events-none">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
            <span className="text-xs text-zinc-300">
              {isPlaying ? "Playing" : "Paused"} · {playbackUpdatedBy}
            </span>
          </div>
        )}

        {!isHost && (
          <div className="absolute inset-0 cursor-not-allowed bg-transparent" title="Only the host controls playback" />
        )}
      </div>

      <div className="bg-zinc-900/50 rounded-lg px-4 py-2 border border-zinc-800 inline-flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Source:</span>
        <span className="text-xs text-indigo-400 font-mono">vidfast.pro</span>
      </div>
    </div>
  );
}