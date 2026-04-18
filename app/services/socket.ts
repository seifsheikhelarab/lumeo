import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    console.log("Socket created, connecting to:", SOCKET_URL);
  }
  return socket;
}

export function connectSocket(): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    if (s.connected) {
      resolve(s);
      return;
    }

    const timeout = setTimeout(() => {
      s.off("connect", onConnect);
      s.off("connect_error", onError);
      reject(new Error("Connection timed out"));
    }, 10000);

    const onConnect = () => {
      clearTimeout(timeout);
      s.off("connect_error", onError);
      console.log("Socket connected!");
      resolve(s);
    };

    const onError = (err: Error) => {
      clearTimeout(timeout);
      s.off("connect", onConnect);
      console.error("Socket connection error:", err);
      reject(err);
    };

    s.once("connect", onConnect);
    s.once("connect_error", onError);
    s.connect();
  });
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export interface RoomState {
  roomId: string;
  isHost: boolean;
  participant: Participant;
  participants: Participant[];
  contentId: string;
  contentType: "movie" | "episode";
  season?: string;
  episode?: string;
  isStarted: boolean;
  server: string;
  currentTime: number;
  isPlaying: boolean;
}

export type RoomStateSetter = (state: RoomState | null) => void;

export interface PlaybackUpdate {
  currentTime: number;
  isPlaying: boolean;
  updatedBy?: string;
}
