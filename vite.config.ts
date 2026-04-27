import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { type ViteDevServer, type Plugin } from "vite";
import express from "express";
import { Server } from "socket.io";

function socketIoPlugin(): Plugin {
  return {
    name: "socket-io",
    configureServer(server: ViteDevServer) {
      if (!server.httpServer) return;

      const io = new Server(server.httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] },
      });

      interface Participant {
        id: string;
        name: string;
        isHost: boolean;
      }

      interface Room {
        id: string;
        contentId: string;
        contentType: "movie" | "episode";
        season?: string;
        episode?: string;
        hostId: string;
        isStarted: boolean;
        server: string;
        participants: Map<string, Participant>;
        currentTime: number;
        isPlaying: boolean;
      }

      const rooms = new Map<string, Room>();

      function generateRoomId(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on("create-room", ({ contentId, contentType, season, episode, userName }) => {
          const roomId = generateRoomId();
          const room: Room = {
            id: roomId, contentId, contentType, season, episode,
            hostId: socket.id, isStarted: false, server: "vidfast",
            participants: new Map(), currentTime: 0, isPlaying: false,
          };
          const host: Participant = { id: socket.id, name: userName || "Host", isHost: true };
          room.participants.set(socket.id, host);
          rooms.set(roomId, room);
          socket.join(roomId);

          socket.emit("room-created", {
            roomId, contentId, contentType, season, episode,
            isHost: true, isStarted: room.isStarted, server: room.server,
            participant: host,
            participants: Array.from(room.participants.values()),
            currentTime: room.currentTime, isPlaying: room.isPlaying,
          });
          console.log(`Room ${roomId} created by ${userName}`);
        });

        socket.on("join-room", ({ roomId, userName }) => {
          const room = rooms.get(roomId);
          if (!room) { socket.emit("error", { message: "Room not found" }); return; }
          if (room.participants.size >= 5) { socket.emit("error", { message: "Room is full (max 5 participants)" }); return; }

          const isHost = room.hostId === socket.id;
          const participant: Participant = {
            id: socket.id,
            name: userName || (isHost ? room.participants.get(socket.id)?.name : `User ${room.participants.size + 1}`) || "User",
            isHost,
          };
          room.participants.set(socket.id, participant);
          socket.join(roomId);

          socket.emit("room-joined", {
            roomId, isHost: false, participant,
            participants: Array.from(room.participants.values()),
            contentId: room.contentId, contentType: room.contentType,
            season: room.season, episode: room.episode,
            isStarted: room.isStarted, server: room.server,
            currentTime: room.currentTime, isPlaying: room.isPlaying,
          });
          socket.to(roomId).emit("participant-joined", { participant, participants: Array.from(room.participants.values()) });
          console.log(`${userName} joined room ${roomId}`);
        });

        socket.on("playback-sync", ({ roomId, currentTime, isPlaying }) => {
          const room = rooms.get(roomId);
          if (!room) return;
          room.currentTime = currentTime;
          room.isPlaying = isPlaying;
          socket.to(roomId).emit("playback-update", { currentTime, isPlaying, updatedBy: room.participants.get(socket.id)?.name });
        });

        socket.on("chat-message", ({ roomId, message }) => {
          const room = rooms.get(roomId);
          if (!room) return;
          const participant = room.participants.get(socket.id);
          if (!participant) return;
          io.to(roomId).emit("chat-message", {
            id: Date.now().toString(), userId: socket.id, userName: participant.name, message, timestamp: new Date().toISOString(),
          });
        });

        socket.on("update-room", ({ roomId, isStarted, server }) => {
          const room = rooms.get(roomId);
          if (!room || room.hostId !== socket.id) return;
          if (isStarted !== undefined) room.isStarted = isStarted;
          if (server !== undefined) room.server = server;
          io.to(roomId).emit("room-updated", { isStarted: room.isStarted, server: room.server });
        });

        socket.on("leave-room", ({ roomId }) => handleLeaveRoom(socket, roomId));

        socket.on("disconnect", () => {
          for (const [roomId, room] of rooms.entries()) {
            if (room.participants.has(socket.id)) handleLeaveRoom(socket, roomId);
          }
        });

        function handleLeaveRoom(socket: any, roomId: string) {
          const room = rooms.get(roomId);
          if (!room) return;
          const participant = room.participants.get(socket.id);
          room.participants.delete(socket.id);
          socket.leave(roomId);
          if (room.participants.size === 0) { rooms.delete(roomId); console.log(`Room ${roomId} deleted (empty)`); return; }
          if (room.hostId === socket.id) {
            const newHost = room.participants.values().next().value;
            if (newHost) { newHost.isHost = true; room.hostId = newHost.id; io.to(roomId).emit("host-changed", { newHostId: newHost.id, newHostName: newHost.name }); }
          }
          io.to(roomId).emit("participant-left", { participantId: socket.id, participantName: participant?.name, participants: Array.from(room.participants.values()) });
          console.log(`${participant?.name || "User"} left room ${roomId}`);
        }
      });

      console.log("Socket.IO attached to Vite dev server");
    },
  };
}

export default defineConfig({
  resolve: { tsconfigPaths: true },
  server: { port: 5173, host: true },
  plugins: [tailwindcss(), reactRouter(), socketIoPlugin()],
});