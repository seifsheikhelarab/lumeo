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
import { ParticipantList } from "~/components/Together/ParticipantList";
import { Chat } from "~/components/Together/Chat";
import { TogetherPlayer } from "~/components/Together/TogetherPlayer";
import { STREAMING_SERVERS } from "~/services/api";

export default function TogetherRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [userName, setUserName] = useState(() => location.state?.userName || "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showNameModal, setShowNameModal] = useState(() => !location.state?.userName);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackUpdatedBy, setPlaybackUpdatedBy] = useState<string | undefined>();

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
        navigate(`/together/${data.roomId}?contentId=${data.contentId}&contentType=${data.contentType}`, { replace: true });
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

    return () => {
      socket.off("participant-joined");
      socket.off("participant-left");
      socket.off("host-changed");
      socket.off("chat-message");
      socket.off("room-updated");
      socket.off("playback-update");
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

  const handlePlaybackControl = (action: "play" | "pause" | "restart") => {
    console.log("handlePlaybackControl called", { action, isHost: roomState?.isHost, isStarted: roomState?.isStarted });
    if (!roomState?.isHost || !roomState.isStarted) return;
    
    const newIsPlaying = action !== "pause";
    const userName = roomState.participant.name;
    
    console.log("Emitting playback-sync", { roomId: roomState.roomId, currentTime: action === "restart" ? 0 : playbackTime, isPlaying: newIsPlaying });
    
    getSocket().emit("playback-sync", {
      roomId: roomState.roomId,
      currentTime: action === "restart" ? 0 : playbackTime,
      isPlaying: newIsPlaying,
    });
  };

  const copyLink = () => {
    const url = `${window.location.origin}/together/${roomState?.roomId}?contentId=${roomState?.contentId}&contentType=${roomState?.contentType}`;
    navigator.clipboard.writeText(url);
  };

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
              isStarted={roomState.isStarted}
              server={roomState.server}
              currentTime={playbackTime}
              isPlaying={isPlaying}
              playbackUpdatedBy={playbackUpdatedBy}
            />
            
            {roomState.isStarted && (
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400">Playback:</span>
                    <div className="flex items-center gap-2">
                      {roomState.isHost ? (
                        <>
                          <button
                            onClick={() => handlePlaybackControl(isPlaying ? "pause" : "play")}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                              isPlaying
                                ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/30"
                                : "bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/30"
                            }`}
                          >
                            {isPlaying ? (
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                </svg>
                                Pause
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                                Play
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => handlePlaybackControl("restart")}
                            className="px-4 py-2 rounded-lg font-medium text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                              </svg>
                              Restart
                            </span>
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-zinc-500">
                          Only the host can control playback
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
                    <span className="text-xs text-zinc-400">
                      {isPlaying ? "Playing" : "Paused"}
                    </span>
                  </div>
                </div>
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
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-zinc-500 uppercase">Server:</label>
                      <select
                        value={roomState.server}
                        onChange={(e) => handleUpdateRoom({ server: e.target.value })}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      >
                        {STREAMING_SERVERS.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

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
