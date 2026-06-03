# API Contracts: Room Setup & Lobby

**Phase**: 1 | **Date**: 2026-06-03 | **Plan**: [../plan.md](../plan.md)

Base URL: `http://localhost:3001` (development)

All request and response bodies are JSON. All error responses follow `{ "message": string }`.

---

## Existing Endpoints (changed behaviour)

### POST /rooms

Create a new room. The submitting player becomes the host.

**Request body**:
```json
{ "playerName": "Alice" }
```

| Field | Type | Validation |
|-------|------|------------|
| `playerName` | string | Required. Trimmed. Min 1 character after trimming. |

**Success — 201 Created**:
```json
{
  "participantId": "uuid-of-alice",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "uuid-of-alice", "name": "Alice", "isHost": true, "joinedAt": "ISO8601" }
    ],
    "hostId": "uuid-of-alice",
    "availableWords": ["..."],
    "roles": ["..."]
  }
}
```

**Error — 400 Bad Request**: `playerName` is empty or whitespace-only.

---

### POST /rooms/:code/join

Join an existing room. The submitting player is never the host.

**URL parameter**:

| Param | Validation |
|-------|------------|
| `code` | Must match `/^[A-Z0-9]{4,6}$/`. Validated before room lookup. |

**Request body**:
```json
{ "playerName": "Bob" }
```

| Field | Type | Validation |
|-------|------|------------|
| `playerName` | string | Required. Trimmed. Min 1 character after trimming. |

**Success — 200 OK**:
```json
{
  "participantId": "uuid-of-bob",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "uuid-of-alice", "name": "Alice", "isHost": true, "joinedAt": "ISO8601" },
      { "id": "uuid-of-bob",   "name": "Bob",   "isHost": false, "joinedAt": "ISO8601" }
    ],
    "hostId": "uuid-of-alice",
    "availableWords": ["..."],
    "roles": ["..."]
  }
}
```

**Error — 400**: `code` is malformed OR `playerName` is empty/whitespace-only OR `playerName` is already taken in this room.
**Error — 404**: Room code is validly formatted but no matching active room found.

---

### GET /rooms/:code?participantId=:id

Poll room state. Called every 2 seconds by the lobby client.

**URL parameter**: `code` — same format validation as join.
**Query parameter**: `participantId` (optional) — viewer's own ID; included for future personalisation.

**Success — 200 OK**:
```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [...],
    "hostId": "uuid-of-alice",
    "availableWords": ["..."],
    "roles": ["..."]
  }
}
```

**Error — 404**: Room not found (may have been removed after all players left).

---

## New Endpoints

### POST /rooms/:code/start

Start the game. Only the host may call this. Requires at least 2 participants.

**URL parameter**: `code` — same format validation.

**Request body**:
```json
{ "participantId": "uuid-of-alice" }
```

| Field | Type | Validation |
|-------|------|------------|
| `participantId` | string (UUID) | Required. Must be a valid UUID. |

**Success — 200 OK**: Returns the updated room snapshot with `status: "game"`.
```json
{
  "room": {
    "code": "ABCD",
    "status": "game",
    "participants": [...],
    "hostId": "uuid-of-alice",
    "availableWords": ["..."],
    "roles": ["..."]
  }
}
```

**Error — 400**: `participantId` is missing/malformed, OR fewer than 2 players are present.
**Error — 403**: `participantId` does not match `room.hostId` (caller is not the host).
**Error — 404**: Room not found.

---

### DELETE /rooms/:code/players/:participantId

Remove a player from a room. If the room becomes empty, it is deleted.

**URL parameters**:

| Param | Validation |
|-------|------------|
| `code` | Must match `/^[A-Z0-9]{4,6}$/`. |
| `participantId` | Non-empty string. |

**Success — 204 No Content**: Player removed (room may or may not still exist).

**Error — 404**: Room not found.

**Notes**:
- The host leaving does not transfer host status. The room remains but becomes unstartable (fewer than 2 players, or no host).
- Frontend calls this endpoint in a `beforeunload` handler (best-effort; not guaranteed to complete if the browser terminates abruptly).

---

## Error Response Shape

All error responses:
```json
{ "message": "Human-readable description" }
```

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Validation failure (malformed input or business rule violation) |
| 403 | Authorisation failure (caller is not permitted to perform the action) |
| 404 | Resource not found |
| 500 | Unexpected server error |
