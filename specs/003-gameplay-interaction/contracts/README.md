# API Contracts: Gameplay Interaction

**Phase**: 1 — Design & Contracts
**Date**: 2026-06-03
**Source**: [spec.md](../spec.md), [data-model.md](../data-model.md)

Base URL: `http://localhost:3001/rooms/:code`

---

## POST /:code/draw

Submit a finalized canvas stroke.

### Request

```json
{
  "participantId": "uuid-string",
  "points": [
    { "x": 10, "y": 20 },
    { "x": 15, "y": 25 }
  ]
}
```

### Response (200)

```json
{
  "room": { /* full RoomSnapshot */ }
}
```

### Errors

| Status | Condition |
|--------|-----------|
| 404 | Room not found |
| 403 | Caller is not the drawer |

---

## POST /:code/clear

Clear all canvas strokes.

### Request

```json
{
  "participantId": "uuid-string"
}
```

### Response (200)

```json
{
  "room": { /* full RoomSnapshot with empty strokes[] */ }
}
```

### Errors

| Status | Condition |
|--------|-----------|
| 404 | Room not found |
| 403 | Caller is not the drawer |

---

## POST /:code/guess

Submit a text guess.

### Request

```json
{
  "participantId": "uuid-string",
  "text": "pizza"
}
```

### Response (200)

```json
{
  "guess": {
    "id": "uuid-string",
    "participantId": "uuid-string",
    "text": "pizza",
    "isCorrect": true,
    "awardedPoints": 100,
    "timestamp": "2026-06-03T12:00:00.000Z"
  },
  "correct": true,
  "points": 100
}
```

### Errors

| Status | Condition |
|--------|-----------|
| 404 | Room not found |
| 403 | Caller is the drawer (cannot guess their own word) |
| 400 | Empty or whitespace-only guess |

---

## GET /:code (extended)

Existing endpoint. Snapshot now includes `strokes[]` and `guesses[]`.

### Response (200)

```json
{
  "room": {
    "code": "ABCD",
    "status": "game",
    "participants": [
      {
        "id": "uuid",
        "name": "Alice",
        "isHost": true,
        "role": "drawer",
        "score": 0,
        "hasScoredThisRound": false,
        "joinedAt": "2026-06-03T11:59:00.000Z"
      },
      {
        "id": "uuid",
        "name": "Bob",
        "isHost": false,
        "role": "guesser",
        "score": 100,
        "hasScoredThisRound": true,
        "joinedAt": "2026-06-03T11:59:10.000Z"
      }
    ],
    "hostId": "uuid",
    "currentRound": 0,
    "secretWord": "pizza",
    "strokes": [
      { "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }] }
    ],
    "guesses": [
      {
        "id": "uuid",
        "participantId": "uuid",
        "text": "pizza",
        "isCorrect": true,
        "awardedPoints": 100,
        "timestamp": "2026-06-03T12:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```
