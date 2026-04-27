import { Link, useLoaderData } from "react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  type RoomState,
  type ChatMessage,
  type Participant,
  type PlaybackUpdate,
} from "~/services/socket";
import { getTVShow } from "~/services/api";
import { ParticipantList } from "~/components/Together/ParticipantList";
import { Chat } from "~/components/Together/Chat";
import { TogetherPlayer } from "~/components/Together/TogetherPlayer";
import type { TVShow } from "~/types";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const contentId = url.searchParams.get("contentId");
  const contentType = url.searchParams.get("contentType");
  const season = url.searchParams.get("season");
  
  if (contentType === "episode" && contentId) {
    try {
      const show = await getTVShow(contentId);
      return { show };
    } catch (e) {
      return { show: null };
    }
  }
  return { show: null };
}

function isLastInShow(show: TVShow | null, currentSeason: number, currentEpisode: number, totalEpisodes: number): boolean {
  if (!show || currentEpisode < totalEpisodes) return false;
  const nextSeasons = show.seasons.filter(s => s.season_number > currentSeason && s.episode_count > 0);
  return nextSeasons.length === 0;
}

export default function TogetherRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { show } = useLoaderData<typeof loader>();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [userName, setUserName] = useState(() => location.state?.userName || "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showNameModal, setShowNameModal] = useState(() => !location.state?.userName);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackUpdatedBy, setPlaybackUpdatedBy] = useState<string | undefined>();
  const lastSyncEmitRef = useRef(0);
  const syncPendingRef = useRef(false);
  const isReconnectingRef = useRef(false);
  const lastPlaybackStateRef = useRef({ time: 0, playing: false });

  const isCreateMode = roomId === "CREATE";
  const isJoinMode = roomId && roomId.length === 6 && roomId !== "CREATE";

  const handleJoin = useCallback(async () => {
    if (!userName.trim()) return;
    
    setIsConnecting(true);
    console.log("Connecting to socket server...");
    
    try {
      const socket = await connectSocket();
      console.log("Socket connected, setting up listeners...");

      socket.once("room-created", (data: RoomState) => {
        console.log("Room created:", data);
        setRoomState(data);
        setIsConnecting(false);
        setShowNameModal(false);
        const query = new URLSearchParams({
          contentId: data.contentId,
          contentType: data.contentType,
          ...(data.season ? { season: data.season } : {}),
          ...(data.episode ? { episode: data.episode } : {}),
        }).toString();
        navigate(`/together/${data.roomId}?${query}`, { replace: true });
      });

      socket.once("room-joined", (data: RoomState) => {
        console.log("Room joined:", data);
        setRoomState(data);
        setIsConnecting(false);
        setShowNameModal(false);
      });

      socket.once("error", (data: { message: string }) => {
        console.error("Room error:", data);
        setError(data.message);
        setIsConnecting(false);
      });

      if (isJoinMode) {
        socket.emit("join-room", { roomId, userName: userName.trim() });
      } else {
        const params = new URLSearchParams(window.location.search);
        const contentId = params.get("contentId") || "";
        const contentType = (params.get("contentType") as "movie" | "episode") || "movie";
        const season = params.get("season") || undefined;
        const episode = params.get("episode") || undefined;
        const nameFromState = location.state?.userName || userName.trim();
        
        socket.emit("create-room", {
          contentId,
          contentType,
          season,
          episode,
          userName: nameFromState,
        });
      }
    } catch (err) {
      console.error("Failed to connect:", err);
      setError("Failed to connect to server");
      setIsConnecting(false);
    }
  }, [userName, roomId, isJoinMode, isCreateMode, navigate, location.state]);

  useEffect(() => {
    if (!roomState) return;

    const socket = getSocket();

    socket.on("participant-joined", (data: { participant: Participant; participants: Participant[] }) => {
      setRoomState((prev) =>
        prev ? { ...prev, participants: data.participants } : null
      );
    });

    socket.on("participant-left", (data: { participants: Participant[] }) => {
      setRoomState((prev) =>
        prev ? { ...prev, participants: data.participants } : null
      );
    });

    socket.on("host-changed", (data: { newHostId: string }) => {
      setRoomState((prev) =>
        prev
          ? {
              ...prev,
              isHost: prev.participant.id === data.newHostId,
              participants: prev.participants.map((p) => ({
                ...p,
                isHost: p.id === data.newHostId,
              })),
            }
          : null
      );
    });

    socket.on("chat-message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("room-updated", (data: { isStarted: boolean; server: string }) => {
      setRoomState((prev) =>
        prev ? { ...prev, isStarted: data.isStarted, server: data.server } : null
      );
    });

    socket.on("playback-update", (data: PlaybackUpdate) => {
      setPlaybackTime(data.currentTime);
      setIsPlaying(data.isPlaying);
      setPlaybackUpdatedBy(data.updatedBy);
    });

    socket.on("sync-response", (data: { currentTime: number; isPlaying: boolean }) => {
      if (!roomState?.isHost) return;
      setIsPlaying(data.isPlaying);
      setPlaybackTime(data.currentTime);
    });

    socket.on("sync-request", () => {
      if (!roomState?.isHost) return;
      getSocket().emit("sync-response", {
        roomId: roomState.roomId,
        currentTime: playbackTime,
        isPlaying: isPlaying,
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect" || reason === "transport close") {
        isReconnectingRef.current = true;
        socket.connect();
      }
    });

    socket.on("connect", () => {
      if (isReconnectingRef.current && roomState) {
        console.log("Socket reconnected, requesting sync...");
        isReconnectingRef.current = false;
        if (!roomState.isHost) {
          getSocket().emit("join-room", { 
            roomId: roomState.roomId, 
            userName: roomState.participant.name,
            isReconnect: true
          });
        } else {
          getSocket().emit("rejoin-room", { 
            roomId: roomState.roomId, 
            userName: roomState.participant.name 
          });
        }
      }
    });

    return () => {
      socket.off("participant-joined");
      socket.off("participant-left");
      socket.off("host-changed");
      socket.off("chat-message");
      socket.off("room-updated");
      socket.off("playback-update");
      socket.off("sync-request");
      socket.off("sync-response");
      socket.off("disconnect");
      socket.off("connect");
    };
  }, [roomState?.roomId]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (!showNameModal && userName && !roomState && !error) {
      handleJoin();
    }
  }, [showNameModal, userName]);

  const handleLeave = () => {
    if (roomState) {
      getSocket().emit("leave-room", { roomId: roomState.roomId });
    }
    disconnectSocket();
    navigate("/");
  };

  const handleSyncRequest = useCallback(() => {
    if (!roomState) return;
    getSocket().emit("sync-request", { roomId: roomState.roomId });
  }, [roomState]);

  const handleSendMessage = (message: string) => {
    if (roomState) {
      getSocket().emit("chat-message", { roomId: roomState.roomId, message });
    }
  };

  const handleUpdateRoom = (updates: { isStarted?: boolean; server?: string }) => {
    if (roomState?.isHost) {
      getSocket().emit("update-room", { roomId: roomState.roomId, ...updates });
    }
  };

  const emitPlaybackSync = useCallback((videoTime: number, playing: boolean) => {
    const now = Date.now();
    if (now - lastSyncEmitRef.current < 200) return;
    lastSyncEmitRef.current = now;
    syncPendingRef.current = false;

    setIsPlaying(playing);
    setPlaybackTime(videoTime);
    setPlaybackUpdatedBy(roomState?.participant.name);
    getSocket().emit("playback-sync", {
      roomId: roomState?.roomId,
      currentTime: videoTime,
      isPlaying: playing,
    });
  }, [roomState]);

  const handlePlayPause = useCallback((playing: boolean, videoTime: number) => {
    if (!roomState?.isHost || !roomState.isStarted) return;
    if (syncPendingRef.current) return;
    syncPendingRef.current = true;
    emitPlaybackSync(videoTime, playing);
  }, [roomState, emitPlaybackSync]);

  const handleSeek = useCallback((videoTime: number) => {
    if (!roomState?.isHost || !roomState.isStarted) return;
    if (syncPendingRef.current) return;
    syncPendingRef.current = true;
    setPlaybackTime(videoTime);
    emitPlaybackSync(videoTime, isPlaying);
  }, [roomState, isPlaying, emitPlaybackSync]);

  const copyLink = () => {
    const url = `${window.location.origin}/together/${roomState?.roomId}?contentId=${roomState?.contentId}&contentType=${roomState?.contentType}`;
    navigator.clipboard.writeText(url);
  };

  const isTVEpisode = roomState?.contentType === "episode" && roomState?.season && roomState?.episode;
  const currentSeason = isTVEpisode ? Number(roomState.season) : 0;
  const currentEpisode = isTVEpisode ? Number(roomState.episode) : 0;
  const currentSeasonData = show?.seasons.find(s => s.season_number === currentSeason);
  const totalEpisodes = currentSeasonData?.episode_count || 1;
  const isFirstEpisode = currentSeason === 1 && currentEpisode === 1;
  const isLastEpisode = isLastInShow(show, currentSeason, currentEpisode, totalEpisodes);
  const hasPrevBtn = !isFirstEpisode;
  const hasNextBtn = !isLastEpisode;
  
  const prevEpisode = isTVEpisode && hasPrevBtn
    ? currentEpisode > 1 
      ? { season: currentSeason, episode: currentEpisode - 1 }
      : { season: currentSeason - 1, episode: (show?.seasons.find(s => s.season_number === currentSeason - 1)?.episode_count || 1) }
    : null;
    
  const nextEpisode = isTVEpisode && hasNextBtn
    ? currentEpisode < totalEpisodes
      ? { season: currentSeason, episode: currentEpisode + 1 }
      : { season: currentSeason + 1, episode: 1 }
    : null;
  
  const contentId = roomState?.contentId;

  if (showNameModal) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-xl p-8 max-w-md w-full border border-zinc-800">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isJoinMode ? "Join Watch Party" : "Start Watch Party"}
          </h1>
          <p className="text-zinc-400 mb-6">
            {isJoinMode
              ? `You're joining room ${roomId}. Enter your name to continue.`
              : "Enter your name to start a watch party with friends."}
          </p>
          
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 mb-4"
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          
          <button
            onClick={handleJoin}
            disabled={!userName.trim() || isConnecting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
          >
            {isConnecting ? "Connecting..." : isJoinMode ? "Join Party" : "Create Party"}
          </button>
        </div>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Watch Party</h1>
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="text-sm">Room:</span>
              <code className="bg-zinc-800 px-2 py-1 rounded text-indigo-400 font-mono">
                {roomState.roomId}
              </code>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyLink}
              className="text-zinc-400 hover:text-white transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </button>
            <button
              onClick={handleLeave}
              className="text-red-400 hover:text-red-300 transition-colors text-sm"
            >
              Leave Party
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TogetherPlayer
              contentId={roomState.contentId}
              contentType={roomState.contentType}
              season={roomState.season}
              episode={roomState.episode}
              server={roomState.server}
              isStarted={roomState.isStarted}
              isHost={roomState.isHost}
              currentTime={playbackTime}
              isPlaying={isPlaying}
              playbackUpdatedBy={playbackUpdatedBy}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onSyncRequest={handleSyncRequest}
            />
            
            {isTVEpisode && roomState.isHost && (
              <div className="flex flex-nowrap items-center justify-center gap-3">
                <Link
                  to={prevEpisode ? `/together/${roomState.roomId}?contentId=${contentId}&contentType=episode&season=${prevEpisode.season}&episode=${prevEpisode.episode}` : "#"}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${hasPrevBtn ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95" : "bg-zinc-800 text-zinc-600 cursor-not-allowed"}`}
                  aria-disabled={!hasPrevBtn}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Prev Episode
                </Link>
                <span className="px-4 py-2 bg-zinc-900 rounded-lg text-zinc-400 font-plex-mono">
                  S{currentSeason}E{currentEpisode}
                </span>
                <Link
                  to={nextEpisode && hasNextBtn ? `/together/${roomState.roomId}?contentId=${contentId}&contentType=episode&season=${nextEpisode.season}&episode=${nextEpisode.episode}` : "#"}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${hasNextBtn ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95" : "bg-zinc-800 text-zinc-600 cursor-not-allowed"}`}
                  aria-disabled={!hasNextBtn}
                >
                  Next Episode
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
            
            {roomState.isStarted && !roomState.isHost && (
              <div className="bg-zinc-900/50 rounded-lg px-4 py-3 border border-zinc-800 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
                <span className="text-sm text-zinc-400">
                  {isPlaying ? "Playing" : "Paused"} · host controls playback
                </span>
              </div>
            )}
            
            {roomState.isHost && (
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Host Controls</h3>
                    <p className="text-zinc-400 text-sm">You control the experience for everyone</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => handleUpdateRoom({ isStarted: !roomState.isStarted })}
                      className={`px-6 py-2 rounded-lg font-bold transition-all ${
                        roomState.isStarted 
                          ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                      }`}
                    >
                      {roomState.isStarted ? "Stop for Everyone" : "Start for Everyone"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-400">
                <div className={`w-2 h-2 rounded-full ${getSocket().connected ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm">
                  {getSocket().connected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <ParticipantList
              participants={roomState.participants}
              currentUserId={roomState.participant.id}
            />
            <Chat messages={messages} onSendMessage={handleSendMessage} />
          </div>
        </div>
      </main>
    </div>
  );
}
