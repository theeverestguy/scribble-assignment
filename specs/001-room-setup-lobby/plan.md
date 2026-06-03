# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Extend the existing Scribble lobby so that the room creator is designated host, all join inputs are strictly validated, the lobby refreshes automatically every 2 seconds via HTTP polling, only the host can start the game (with at least 2 players present), and rooms are removed from memory when empty. The change is surgical: no new libraries, no new routes beyond one start endpoint and one leave endpoint, and all modifications stay within the existing file layout. See [research.md](./research.md) for design decisions and [data-model.md](./data-model.md) for type changes.

## Technical Context

**Language/Version**: TypeScript — Node.js 20 (backend), React 18 (frontend)

**Primary Dependencies**: Express, Zod (backend); React Router v6, `useSyncExternalStore` (frontend); Vitest (tests)

**Storage**: In-memory `Map<string, Room>` — no persistence (MEM-1)

**Testing**: Vitest — colocated `.test.ts` files in `backend/src/` and `frontend/src/`

**Target Platform**: Local development server / web browser

**Project Type**: Web application — Node.js/Express REST API + React SPA

**Performance Goals**: Lobby state visible to all clients within 3 seconds of any state change (SC-002, SC-006)

**Constraints**: No WebSockets, no databases, no authentication, no new npm libraries (POL-1, MEM-1, constitution)

**Scale/Scope**: Small-scale prototype; no concurrent-user volume targets defined

## Constitution Check

| Principle | Gate Status | Notes |
|-----------|-------------|-------|
| TS-1 TypeScript Absolute | ✅ PASS | All new code fully typed; `any` forbidden; strict mode maintained throughout |
| IMM-1 Immutability & Purity | ✅ PASS | `cloneRoom` pattern extended to new service functions; mutation stays inside `roomStore.ts` |
| MEM-1 Ephemeral In-Memory | ✅ PASS | `rooms` Map only; new `leaveRoom` function provides explicit cleanup per MEM-1 requirement |
| POL-1 HTTP Polling | ✅ PASS | `setInterval` + existing `GET /rooms/:code` — no WebSockets introduced |
| VAL-1 Validation-Driven Integrity | ✅ PASS | All new inputs validated at API boundary via extended Zod schemas; centralised error handler unchanged |

No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              ← this file
├── research.md          ← Phase 0 decisions
├── data-model.md        ← Phase 1 type changes
├── quickstart.md        ← Phase 1 dev setup
├── contracts/
│   └── api.md           ← Phase 1 API contracts
└── tasks.md             ← Phase 2 (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── models/
    │   └── game.ts           ← add isHost to Participant; hostId to Room; "game" to RoomStatus
    ├── services/
    │   └── roomStore.ts      ← host assignment, strict validation, startGame, leaveRoom, cleanup
    └── api/
        ├── schemas.ts        ← strict Zod schemas: name, room code format, participantId
        └── rooms.ts          ← POST /:code/start  |  DELETE /:code/players/:participantId

frontend/
└── src/
    ├── services/
    │   └── api.ts            ← add startGame(); update Participant/RoomSnapshot/RoomStatus types
    ├── state/
    │   └── roomStore.ts      ← add 2s polling interval; add startGame(); expose isHost helper
    └── pages/
        ├── LobbyPage.tsx     ← auto-poll; host badge; conditional Start Game; game-start redirect
        ├── CreateRoomPage.tsx ← client-side name validation before submit
        └── JoinRoomPage.tsx  ← client-side name + room code format validation before submit
```

**Structure Decision**: Existing web-application layout — no new directories under `src/`. All changes are surgical edits to existing files, plus the two new route handlers within the existing `rooms.ts` router.

## Complexity Tracking

> No constitution violations — this section is intentionally empty.
