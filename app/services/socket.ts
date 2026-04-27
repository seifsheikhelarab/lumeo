import Ably from "ably";

const ABLY_AUTH_URL = import.meta.env.VITE_ABLY_AUTH_URL || "/api/ably-auth";
const ROOM_API_URL = "/api/room";

let realtime: Ably.Realtime | null = null;
let channel: Ably.RealtimeChannel | null = null;

interface AblySocket {
  emit: (event: string, data: unknown) => void;
  once: <T = unknown>(event: string, callback: (data: T) => void) => void;
  on: <T = unknown>(event: string, callback: (data: T) => void) => void;
  off: (event: string) => void;
  disconnect: () => void;
  connect: (channelName: string) => Promise<void>;
  connected: boolean;
}

class AblySocketAdapter implements AblySocket {
  private listeners: Map<string, Set<(msg: Ably.InboundMessage) => void>> = new Map();
  private _connected = false;

  get connected(): boolean {
    return this._connected;
  }

  async connect(channelName: string): Promise<void> {
    if (!realtime) {
      realtime = new Ably.Realtime({
        authUrl: ABLY_AUTH_URL,
        authMethod: "POST",
      });
    }

    const state = realtime!.connection.state;
    console.log(`[Socket] Connection state: ${state}`);
    
    if (state === "connected") {
      channel = realtime!.channels.get(channelName);
      this._connected = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (realtime!.connection.state !== "connected") {
          reject(new Error(`Ably connection timed out (state: ${realtime!.connection.state})`));
        }
      }, 15000);

      const cleanup = () => {
        clearTimeout(timeout);
        realtime!.connection.off(onConnected);
        realtime!.connection.off(onFailed);
      };

      const onConnected = () => {
        cleanup();
        this._connected = true;
        channel = realtime!.channels.get(channelName);
        console.log("[Socket] Ably connected!");
        resolve();
      };

      const onFailed = (err: any) => {
        cleanup();
        console.error("[Socket] Ably connection failed:", err);
        reject(err);
      };

      realtime!.connection.on("connected", onConnected);
      realtime!.connection.on("failed", onFailed);

      if (state === "initialized" || state === "disconnected" || state === "suspended") {
        realtime!.connection.connect();
      }
    });
  }

  emit(event: string, data: unknown): void {
    if (channel) {
      channel.publish(event, data);
    }
  }

  once<T = unknown>(event: string, callback: (data: T) => void): void {
    const wrapper = (msg: Ably.InboundMessage) => {
      this.off(event);
      callback(msg.data as T);
    };
    this.on(event, wrapper as any);
  }

  on<T = unknown>(event: string, callback: (data: T) => void): void {
    if (!channel) return;
    
    const ablyCallback = (msg: Ably.InboundMessage) => {
      callback(msg.data as T);
    };

    // Store the Ably callback so we can unsubscribe it later
    const wrappers = this.listeners.get(event) || new Set();
    wrappers.add(ablyCallback);
    this.listeners.set(event, wrappers);

    channel.subscribe(event, ablyCallback);
  }

  off(event: string): void {
    if (channel) {
      const wrappers = this.listeners.get(event);
      if (wrappers) {
        wrappers.forEach(cb => channel!.unsubscribe(event, cb));
      }
    }
    this.listeners.delete(event);
  }

  disconnect(): void {
    if (realtime) {
      realtime.close();
      realtime = null;
      channel = null;
      this._connected = false;
      this.listeners.clear();
    }
  }
}

let socketInstance: AblySocketAdapter | null = null;

export function getSocket(): AblySocket {
  if (!socketInstance) {
    socketInstance = new AblySocketAdapter();
  }
  return socketInstance;
}

export async function connectSocket(roomId?: string): Promise<AblySocket> {
  const s = getSocket() as AblySocketAdapter;
  const channelName = roomId 
    ? `room:${roomId}` 
    : `watch-together:${import.meta.env.DEV ? "dev" : "prod"}`;
  await s.connect(channelName);
  return s;
}

export async function createRoom(params: {
  contentId: string;
  contentType: "movie" | "episode";
  userName: string;
  season?: string;
  episode?: string;
}): Promise<RoomState> {
  const response = await fetch(ROOM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create-room", ...params }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create room");
  }
  
  return response.json();
}

export async function joinRoom(params: {
  roomId: string;
  userName: string;
  participantId: string;
}): Promise<RoomState> {
  const response = await fetch(ROOM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "join-room", ...params }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to join room");
  }
  
  return response.json();
}

export async function updateRoom(params: {
  roomId: string;
  isStarted?: boolean;
  server?: string;
  hostId: string;
}): Promise<void> {
  await fetch(ROOM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "update-room", ...params }),
  });
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
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

export interface SyncResponse {
  roomId: string;
  currentTime: number;
  isPlaying: boolean;
}
