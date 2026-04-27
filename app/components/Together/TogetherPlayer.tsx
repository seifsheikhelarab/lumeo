import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { getMovieEmbedUrl, getTVEmbedUrl, STREAMING_SERVERS } from "~/services/api";

const VIDFAST_ORIGINS = [
  "https://vidfast.pro",
  "https://vidfast.in",
  "https://vidfast.io",
  "https://vidfast.me",
  "https://vidfast.net",
  "https://vidfast.pm",
  "https://vidfast.xyz",
  "https://vidfast.org",
  "https://vidfast.cc",
  "https://vidfast.to",
];

const SYNC_THRESHOLD = 3.5; // More relaxed to allow for network jitter
const BLOCK_DURATION = 2000; // Longer block to ensure player settles
const SYNC_CHECK_INTERVAL = 3000; // Check more often
const MAX_DRIFT_ALLOWED = 5; // Allow more drift before hard-syncing

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
  onTimeUpdate?: (time: number) => void;
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
  onTimeUpdate,
  onSyncRequest,
}: TogetherPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastTimeRef = useRef(0);
  const blockedUntilRef = useRef(0);
  const lastHostUpdateRef = useRef(0);
  const [localPlayerReady, setLocalPlayerReady] = useState(false);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const syncCheckIntervalRef = useRef<number | null>(null);

  const allowedOrigins = useMemo(() => {
    const currentServer = STREAMING_SERVERS.find(s => s.id === server);
    const origins = [...VIDFAST_ORIGINS];
    if (currentServer) {
      try {
        const origin = new URL(currentServer.baseUrl).origin;
        if (!origins.includes(origin)) {
          origins.push(origin);
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    }
    return origins;
  }, [server]);

  const send = useCallback((msg: Record<string, unknown>) => {
    if (iframeRef.current?.contentWindow) {
      // Most players accept objects, but we'll try stringify as a fallback for older players
      // but only one message per command to avoid double-processing
      const target = iframeRef.current.contentWindow;
      target.postMessage(msg, "*");
      // If we know a player specifically needs strings, we'd handle it here
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
    
    send({ 
      command: isPlaying ? "play" : "pause",
      time: currentTime 
    });
    
    // Always seek if it's a significant drift, even if playing/pausing
    if (Math.abs(currentTime - lastTimeRef.current) > SYNC_THRESHOLD) {
      send({ command: "seek", time: currentTime });
    }
  }, [currentTime, isPlaying, send]);

  useEffect(() => {
    if (!isStarted) return;

    const handler = (e: MessageEvent) => {
      // Check if it's a valid VidFast origin
      const isValidOrigin = allowedOrigins.some(origin => e.origin === origin);
      if (!isValidOrigin) return;

      // Log raw data for debugging
      console.log("[Player Event]", e.origin, e.data);

      let eventType = "";
      let eventTime = 0;

      // Handle different possible event structures
      if (e.data?.type === "PLAYER_EVENT") {
        eventType = e.data.data?.event || "";
        eventTime = e.data.data?.currentTime || 0;
      } else if (e.data?.event) {
        eventType = e.data.event;
        eventTime = e.data.currentTime || e.data.time || 0;
      } else if (typeof e.data === "string" && (e.data.includes("{") || e.data.includes("["))) {
        try {
          const parsed = JSON.parse(e.data);
          eventType = parsed.event || parsed.type || "";
          eventTime = parsed.currentTime || parsed.time || 0;
        } catch (err) {
          // Not JSON or not our format
        }
      }

      // If we got ANY valid message from a valid origin, the player is alive
      if (!localPlayerReady) {
        setLocalPlayerReady(true);
      }

      if (!eventType) return;

      if (eventType === "playerstatus" || eventType === "ready" || eventType === "loaded") {
        setLocalPlayerReady(true);
        // Sync if drift is too high
        if (!isHost && (Math.abs(eventTime - currentTime) > MAX_DRIFT_ALLOWED)) {
          onSyncRequest?.();
        }
        return;
      }

      if (eventType === "play") {
        setLocalIsPlaying(true);
        if (isHost) {
          onPlayPause?.(true, eventTime);
        }
      } else if (eventType === "pause") {
        setLocalIsPlaying(false);
        if (isHost) {
          onPlayPause?.(false, eventTime);
        }
      } else if (eventType === "seeked" || eventType === "seek") {
        setLocalTime(eventTime);
        if (isHost) {
          onSeek?.(eventTime);
        }
      } else if (eventTime) {
        setLocalTime(eventTime);
        if (isHost) {
          onTimeUpdate?.(eventTime);
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isStarted, onPlayPause, onSeek, onTimeUpdate, onSyncRequest, currentTime, isHost, localPlayerReady, allowedOrigins]);

  useEffect(() => {
    if (!isStarted || !localPlayerReady || isHost) return;

    const now = Date.now();
    if (now < blockedUntilRef.current) return;

    // Only sync if state differs
    if (isPlaying !== localIsPlaying) {
      console.log(`[Sync] Mismatch detected: host playing=${isPlaying}, local playing=${localIsPlaying}`);
      blockedUntilRef.current = now + BLOCK_DURATION;
      send({ 
        command: isPlaying ? "play" : "pause",
        time: currentTime 
      });
    }
  }, [isStarted, isPlaying, isHost, localPlayerReady, localIsPlaying, send, currentTime]);

  useEffect(() => {
    if (!isStarted || !localPlayerReady || isHost) return;

    const drift = Math.abs(currentTime - localTime);
    if (drift < SYNC_THRESHOLD) return;

    const now = Date.now();
    if (now < blockedUntilRef.current) return;

    console.log(`[Sync] Drift detected: host time=${currentTime}, local time=${localTime}, drift=${drift}`);
    blockedUntilRef.current = now + BLOCK_DURATION;
    lastTimeRef.current = currentTime;
    send({ command: "seek", time: currentTime });
  }, [isStarted, currentTime, isHost, localPlayerReady, localTime, send]);

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