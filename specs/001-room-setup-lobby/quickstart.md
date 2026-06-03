# Quickstart: Room Setup & Lobby

**Date**: 2026-06-03 | **Plan**: [plan.md](./plan.md)

## Prerequisites

- Node.js 20+
- npm 9+

## Running the Application

Open two terminals from the repository root.

**Terminal 1 — Backend**:
```bash
cd backend
npm install
npm run dev
```
The API starts on `http://localhost:3001`.

**Terminal 2 — Frontend**:
```bash
cd frontend
npm install
npm run dev
```
The app opens on `http://localhost:5173`.

## Running Tests

**Backend unit tests**:
```bash
cd backend
npm test
```

**Frontend unit tests**:
```bash
cd frontend
npm test
```

**Build validation** (required before finalising any feature per constitution Quality Gates):
```bash
cd backend && npm run build
cd ../frontend && npm run build
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3001` | Backend listen port |
| `VITE_API_URL` | `http://localhost:3001` | Frontend API base URL |

## Verifying This Feature

1. Open two browser tabs to `http://localhost:5173`.
2. In Tab 1, click **Create Room** — enter a name and create. Note the room code.
3. In Tab 2, click **Join Room** — enter a different name and the room code from step 2.
4. Tab 1 lobby should update automatically within ~2 seconds to show both players.
5. In Tab 2, verify the Start Game button is absent or disabled (Tab 2 is not the host).
6. In Tab 1, verify the Start Game button is enabled (2 players present).
7. Click Start Game in Tab 1. Both tabs should transition to the game page within ~2 seconds.

## Key File Locations

| File | Purpose |
|------|---------|
| `backend/src/models/game.ts` | Data types — Room, Participant, RoomSnapshot |
| `backend/src/services/roomStore.ts` | All room business logic |
| `backend/src/api/schemas.ts` | Zod validation schemas |
| `backend/src/api/rooms.ts` | HTTP route handlers |
| `frontend/src/services/api.ts` | Frontend API client + mirrored types |
| `frontend/src/state/roomStore.ts` | Frontend state + polling |
| `frontend/src/pages/LobbyPage.tsx` | Lobby UI |
