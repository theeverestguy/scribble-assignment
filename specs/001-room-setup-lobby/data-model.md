# Data Model: Room Setup & Lobby

**Phase**: 1 | **Date**: 2026-06-03 | **Plan**: [plan.md](./plan.md)

## Overview

Three types change in `backend/src/models/game.ts`. The frontend mirror types in `frontend/src/services/api.ts` are updated in sync. No new entities are introduced.

---

## Changed Types

### `RoomStatus`

```typescript
// Before
export type RoomStatus = "lobby";

// After
export type RoomStatus = "lobby" | "game";
```

**Why**: `startGame` transitions a room from `"lobby"` to `"game"`. Clients detect this via polling and navigate to the game page.

---

### `Participant`

```typescript
// Before
export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

// After
export interface Participant {
  id: string;
  name: string;
  isHost: boolean;   // true for the room creator only; never changes
  joinedAt: string;
}
```

**Why**: `isHost` lets the frontend render a host badge in the player list without needing to compare IDs. Immutable after creation (host role does not transfer).

---

### `Room`

```typescript
// Before
export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

// After
export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;     // participantId of the room creator; never changes
  createdAt: string;
  updatedAt: string;
}
```

**Why**: `hostId` allows O(1) host verification in `startGame` and `leaveRoom` without scanning the participant list.

---

### `RoomSnapshot`

```typescript
// Before
export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}

// After
export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];    // each now includes isHost
  hostId: string;                // propagated from Room
  availableWords: string[];
  roles: ParticipantRole[];
}
```

**Why**: Frontend needs `hostId` to derive `isHost` for the current viewer (compare `participantId` in client state to `room.hostId`). Including it in the snapshot means all clients get it on every poll.

---

## New Service Functions

These are added to `backend/src/services/roomStore.ts`.

### `startGame(code, participantId) → Room | StartGameError`

| Condition | Return |
|-----------|--------|
| Room not found | `{ error: "not-found" }` |
| `participantId !== room.hostId` | `{ error: "not-host" }` |
| `room.participants.length < 2` | `{ error: "not-enough-players" }` |
| All checks pass | Updated `Room` with `status: "game"` |

### `leaveRoom(code, participantId) → "left" | "room-removed" | "not-found"`

| Condition | Return |
|-----------|--------|
| Room not found | `"not-found"` |
| Participant removed; room still has players | `"left"` |
| Participant removed; room is now empty | `"room-removed"` (room deleted from Map) |

---

## Validation Rules (Zod — `backend/src/api/schemas.ts`)

| Field | Rule | Error message |
|-------|------|---------------|
| `playerName` (create/join body) | `z.string().trim().min(1)` | "Player name is required" |
| `code` (URL param) | `z.string().regex(/^[A-Z0-9]{4,6}$/)` | "Invalid room code format" |
| `participantId` (start body) | `z.string().uuid()` | "Invalid participant ID" |

**Note**: The existing error handler maps `ZodError` → HTTP 400 with `{ message: "Invalid request payload" }`. The specific per-field message is included in the Zod `issues` array but not currently surfaced to the client. This is intentional — the frontend provides its own user-facing messages.

---

## Frontend Type Alignment (`frontend/src/services/api.ts`)

```typescript
// RoomStatus updated
export type RoomStatus = "lobby" | "game";

// Participant updated
export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: string;
}

// RoomSnapshot updated
export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  availableWords: string[];
  roles: ParticipantRole[];
}

// New api method
startGame(code: string, participantId: string): Promise<{ room: RoomSnapshot }>;
leaveRoom(code: string, participantId: string): Promise<void>;
```

---

## Invariants

- Exactly one participant in a room has `isHost === true` at all times.
- `room.hostId` always equals the `id` of the participant where `isHost === true`.
- `room.status` transitions only from `"lobby"` → `"game"` — never backwards.
- A room with zero participants does not exist in the `rooms` Map.
- Player names within a room are unique (case-sensitive).
