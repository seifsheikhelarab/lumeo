import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import Ably from "ably";

const rooms = new Map<
  string,
  {
    id: string;
    contentId: string;
    contentType: "movie" | "episode";
    season?: string;
    episode?: string;
    hostId: string;
    hostName: string;
    server: string;
    isStarted: boolean;
    participants: Map<string, { id: string; name: string; isHost: boolean }>;
  }
>();

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function action({ request }: ActionFunctionArgs) {
  const apiKey = import.meta.env.VITE_ABLY_API_KEY || import.meta.env.ABLY_API_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Ably API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rest = new Ably.Rest(apiKey);

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const { action, roomId, contentId, contentType, userName, season, episode, hostId, participantId } = body;

  if (action === "create-room") {
    const newRoomId = generateRoomId();
    
    const room = {
      id: newRoomId,
      contentId,
      contentType,
      season,
      episode,
      hostId,
      hostName: userName,
      server: "",
      isStarted: false,
      participants: new Map([[hostId, { id: hostId, name: userName, isHost: true }]]),
    };
    
    rooms.set(newRoomId, room);
    
    const roomToPublish = {
      ...room,
      participants: Object.fromEntries(room.participants)
    };
    
    const channel = rest.channels.get(`room:${newRoomId}`);
    await channel.publish("room-state", { room: roomToPublish, timestamp: Date.now() });

    return new Response(
      JSON.stringify({
        roomId: newRoomId,
        contentId,
        contentType,
        season,
        episode,
        isHost: true,
        participant: { id: hostId, name: userName, isHost: true },
        participants: [{ id: hostId, name: userName, isHost: true }],
        isStarted: false,
        server: "",
        currentTime: 0,
        isPlaying: false,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (action === "join-room") {
    const room = rooms.get(roomId);
    if (!room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const existingParticipant = room.participants.get(participantId);
    if (!existingParticipant) {
      room.participants.set(participantId, { id: participantId, name: userName, isHost: false });
      const roomToPublish = {
        ...room,
        participants: Object.fromEntries(room.participants)
      };
      const channel = rest.channels.get(`room:${roomId}`);
      await channel.publish("room-state", { room: roomToPublish, timestamp: Date.now() });
    }

    return new Response(
      JSON.stringify({
        roomId: room.id,
        contentId: room.contentId,
        contentType: room.contentType,
        season: room.season,
        episode: room.episode,
        isHost: room.hostId === participantId,
        participant: room.participants.get(participantId),
        participants: Array.from(room.participants.values()),
        isStarted: room.isStarted,
        server: room.server,
        currentTime: 0,
        isPlaying: false,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (action === "update-room") {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId) {
      if (body.isStarted !== undefined) room.isStarted = body.isStarted;
      if (body.server) room.server = body.server;
      
      const roomToPublish = {
        ...room,
        participants: Object.fromEntries(room.participants)
      };
      const channel = rest.channels.get(`room:${roomId}`);
      await channel.publish("room-state", { room: roomToPublish, timestamp: Date.now() });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId");
  
  const room = rooms.get(roomId || "");
  if (room) {
    return new Response(
      JSON.stringify({
        roomId: room.id,
        contentId: room.contentId,
        contentType: room.contentType,
        isStarted: room.isStarted,
        server: room.server,
        participants: Array.from(room.participants.values()),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
  
  return new Response(JSON.stringify({ error: "Room not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
