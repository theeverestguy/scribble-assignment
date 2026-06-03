# API Contracts: Game Start & Drawer Flow

**Source**: [data-model.md](../data-model.md) | **Plan**: [plan.md](../plan.md)

## Overview

This feature introduces no new endpoints. All changes are backward-compatible enhancements to existing endpoints:
- `POST /rooms/:code/start` — now returns roles and game state
- `GET /rooms/:code?participantId=` — now returns role-filtered snapshot with `secretWord`

## Endpoint: POST /rooms/:code/start

**Request** (unchanged):
```json
{ "participantId": "uuid-string" }
```

**Response** (enhanced — `participants` now include `role`, new fields added):
```json
{
  "room": {
    "code": "ABCD",
    "status": "game",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "isHost": true, "role": "drawer", "joinedAt": "..." },
      { "id": "uuid-2", "name": "Bob", "isHost": false, "role": "guesser", "joinedAt": "..." }
    ],
    "hostId": "uuid-1",
    "currentRound": 0,
    "secretWord": "rocket",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors** (unchanged):
| Status | Condition |
|--------|-----------|
| 404 | Room not found |
| 403 | Caller is not host |
| 400 | Fewer than 2 players |

## Endpoint: GET /rooms/:code?participantId=

**Query params** (unchanged):
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `participantId` | string (UUID) | No | Viewer identity for role-based filtering |

**Response** (enhanced — `secretWord` only present for drawer):

When viewer is the **drawer**:
```json
{
  "room": {
    ...,
    "currentRound": 0,
    "secretWord": "rocket",
    ...
  }
}
```

When viewer is a **guesser** (or `participantId` omitted):
```json
{
  "room": {
    ...,
    "currentRound": 0,
    "secretWord": undefined,
    ...
  }
}
```

## Type Changes

### Participant (new field: `role`)
- Type: `"drawer" | "guesser"`
- Always present when `status === "game"`
- May be absent/undefined when `status === "lobby"` (role not yet assigned)

### RoomSnapshot (new fields)
| Field | Type | Always present | Description |
|-------|------|----------------|-------------|
| `currentRound` | `number` | Yes | 0-based round counter |
| `secretWord` | `string` | No | Word for drawer; omitted for guessers |
