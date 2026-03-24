# Together - Watch Party Feature

## Overview

A real-time synchronized viewing feature allowing up to 5 users to watch movies/episodes together with shared playback controls.

## User Flow

1. **Start Together** - User clicks "Watch Together" on movie/episode page
2. **Create Room** - Host creates a room, gets unique shareable link
3. **Invite Friends** - Share link via URL/clipboard
4. **Join Room** - Friends join via link, appear in participant list
5. **Sync Watch** - Host controls playback, all participants sync automatically
6. **Chat** - Real-time text chat during viewing

## Technical Architecture

### Socket.io + Express (Self-Hosted)

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (lumeo)                   │
│  React Router → TogetherRoom Component → Socket Client  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (lumeo-v1)                    │
│              Express + Socket.io Server                 │
└─────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Backend Infrastructure (lumeo-v1)

- Install Socket.io
- Create socket handler for room management
- Handle playback sync events

### Phase 2: Frontend Components

```
app/
├── routes/
│   └── together/
│       └── together.$roomId.tsx   # Room page
├── components/
│   └── Together/
│       ├── TogetherPlayer.tsx      # Sync video player
│       ├── ParticipantList.tsx     # Show joined users
│       └── Chat.tsx              # Real-time chat
└── services/
    └── socket.ts                   # Socket client
```

### Phase 3: Integration

- Add "Watch Together" button to movie/episode pages
- Create room modal
- Join room flow

## Features

### Core (Must Have)
- [x] Room creation with unique ID
- [x] Join via URL link
- [x] Max 5 participants
- [x] Host-only playback control (play/pause/seek)
- [x] Auto-sync all viewers
- [x] Participant list with names
- [x] Leave room functionality

### Enhanced (Should Have)
- [x] Real-time chat
- [x] User name input
- [x] Copy link button
- [x] Connection status indicator
