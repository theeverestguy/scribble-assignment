# API Contracts: Results & Restart

## `POST /:code/restart`

Restarts the game from the results state. Host-only. All players return to lobby.

### Request

**URL**: `POST /rooms/{code}/restart`

**Path Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` (4-6 alphanum) | Room identifier |

**Body** (`application/json`):

```json
{
  "participantId": "uuid-string"
}
```

### Success Response (200)

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      {
        "id": "uuid",
        "name": "Alice",
        "isHost": true,
        "role": null,
        "score": 0,
        "hasScoredThisRound": false,
        "joinedAt": "2026-06-03T12:00:00.000Z"
      }
    ],
    "hostId": "uuid",
    "currentRound": 0,
    "strokes": [],
    "guesses": [],
    "availableWords": ["...", "..."],
    "roles": ["drawer", "guesser"]
  }
}
```

Note: `secretWord` is absent when `status === "lobby"`.

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 404 | Room not found | `{ "message": "Room not found" }` |
| 403 | Non-host caller | `{ "message": "Only the host can restart" }` |
| 400 | Room not in results state | `{ "message": "Round has not ended yet" }` |

### Zod Schema

```typescript
export const restartSchema = z.object({
  participantId: z.string().uuid()
});
```

---

## Existing Endpoints — Behavioral Change

### `POST /:code/draw`, `POST /:code/clear`, `POST /:code/guess`

These endpoints already guard against non-`"game"` status. When room is in `"results"` state:

| Endpoint | Behavior |
|----------|----------|
| `POST /:code/draw` | Returns 400 — "Game has not started" (no change needed) |
| `POST /:code/clear` | Returns 400 — "Game has not started" (no change needed) |
| `POST /:code/guess` | Returns 400 — "Game has not started" (no change needed) |

### `GET /:code`

When `status === "results"`, the `secretWord` field is now included for **all** viewers (not just the drawer).
