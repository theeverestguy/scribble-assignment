# Research: Room Setup & Lobby

**Phase**: 0 | **Date**: 2026-06-03 | **Plan**: [plan.md](./plan.md)

## Decision Log

### 1. Room Code Length

**Decision**: Keep 4-character codes (existing `generateCode()` implementation).

**Rationale**: The spec permits 4–6 characters; the existing generator already produces exactly 4-character codes from an unambiguous alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, which excludes O, I, 0, 1). Validation schemas accept 4–6 uppercase alphanumeric characters per spec, so 4-char codes satisfy the constraint. Changing the generator length would break the existing test (`/^[A-Z0-9]{4}$/`).

**Alternatives considered**:
- 6-char codes — more entropy, but unnecessary for a prototype with ephemeral rooms; rejected.
- UUID — unreadable to users; rejected.

---

### 2. Host Tracking Approach

**Decision**: Add `isHost: boolean` to `Participant` and `hostId: string` to `Room`. Both are included in `RoomSnapshot`.

**Rationale**: `hostId` on `Room` lets service functions (e.g., `startGame`) check host identity in O(1) without scanning the participant list. `isHost` on `Participant` gives the frontend a per-participant flag it can use directly when rendering the player list, without needing to compare IDs. Both are set at `createRoom` time and never changed.

**Alternatives considered**:
- Store host as index into participants array — fragile if participants are reordered; rejected.
- Derive host on the frontend by comparing `participantId` to first participant — hidden coupling to insertion order; rejected.

---

### 3. Validation Implementation

**Decision**: Extend existing Zod schemas in `backend/src/api/schemas.ts`. No new library.

**Rationale**: Zod is already the project's validation library (VAL-1). Adding `.min(1)`, `.trim()`, and `.regex()` constraints to existing schemas is zero-cost. Client-side validation in the frontend pages mirrors the rules but does not depend on Zod — plain TypeScript guards are sufficient and keep the frontend bundle lean.

**Specific rules**:
- Player name: trimmed, minimum 1 character after trimming (rejects empty and whitespace-only).
- Room code (URL param): must match `/^[A-Z0-9]{4,6}$/` — reject malformed before room lookup.
- Participant ID (body): non-empty string UUID format.
- Duplicate name check: performed in `joinRoom` service function after format validation, before inserting participant.

**Alternatives considered**:
- Yup / Joi — no benefit over Zod for this scope; rejected.
- Validate only on the frontend — violates VAL-1 (validate at system boundaries); rejected.

---

### 4. Lobby Polling Implementation

**Decision**: `setInterval` (2000 ms) inside a `useEffect` within the `RoomStoreProvider`. Cleanup on unmount. No new library.

**Rationale**: The `RoomStore` class already has `fetchRoom()`. A single `setInterval` in the provider ensures one polling loop per app instance, regardless of how many components subscribe. This matches POL-1 (HTTP polling) and requires no additional abstractions.

**Implementation notes**:
- Polling only runs when `room !== null` (i.e., after the player has joined or created a room).
- On each tick, call `store.fetchRoom()` silently (errors surface through existing `store.error` state, not as thrown exceptions in the interval callback).
- When `room.status` transitions to `"game"`, the `LobbyPage` `useEffect` detects the change and navigates to `/game`.

**Alternatives considered**:
- `react-query` / SWR polling — new dependency; rejected per user constraint.
- Long-polling — server-side complexity; violates POL-1 intent; rejected.
- Polling inside `LobbyPage` only — mounts/unmounts with the page; less stable; rejected in favour of provider-level control.

---

### 5. Game Start Endpoint

**Decision**: `POST /rooms/:code/start` with `{ participantId }` in the request body. Returns the updated `RoomSnapshot`.

**Rationale**: Consistent with existing mutation pattern (`POST /:code/join`). `participantId` in the body lets the backend verify the caller is the host without requiring authentication headers. The endpoint transitions `room.status` from `"lobby"` to `"game"` — the single state change all clients detect via polling (SC-006).

**Service-layer rules enforced**:
1. Room must exist → 404 if not.
2. `participantId` must match `room.hostId` → 403 if not host.
3. Room must have ≥ 2 participants → 400 if under-attended.

**Alternatives considered**:
- `PATCH /rooms/:code` with `{ status: "game" }` — more generic but ambiguous about who can call it; rejected.
- Include host check in frontend only — violates VAL-1; rejected.

---

### 6. Room Cleanup (Leave + Empty-Room Removal)

**Decision**: Add `DELETE /rooms/:code/players/:participantId` endpoint. `leaveRoom` service function removes the participant; if the room becomes empty, it is deleted from the `rooms` Map. Frontend calls this endpoint on `beforeunload`.

**Rationale**: FR-013 requires explicit removal when all players leave. The `beforeunload` hook gives best-effort cleanup on browser close or navigation away. For the lobby phase, this is sufficient; persistent reconnection is explicitly out of scope.

**Concurrency note**: Concurrent leave calls are safe — the last one to find an empty room deletes it; intermediate calls just remove a participant.

**Alternatives considered**:
- Inactivity timeout (last-poll-based) — requires tracking last poll timestamps; more complex; deferred to future work.
- No explicit leave, rely on room code reuse — memory leak risk for long-running demos; rejected for FR-013 compliance.

---

### 7. Frontend isHost Helper

**Decision**: Expose a computed `isHost` getter on `RoomStore` (or inline in the component) by comparing `state.participantId` to `state.room.hostId`.

**Rationale**: The comparison is trivial and deterministic. A dedicated getter keeps components readable without adding new state. Since `hostId` is part of `RoomSnapshot` (returned by every room endpoint), this works for both the creator and other clients.

**No new state field**: `isHost` is not stored in `RoomState` — it is derived on read. This prevents stale flags if room data is refreshed.
