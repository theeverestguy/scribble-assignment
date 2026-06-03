# Data Model: Gameplay Interaction

**Phase**: 1 — Design & Contracts
**Date**: 2026-06-03
**Source**: [spec.md](./spec.md), [research.md](./research.md)

## Entities

### Participant (extended)

Represents a player in a room. Existing fields kept; `score` and `hasScoredThisRound` are new.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique participant identifier |
| `name` | `string` | Yes | Display name, trimmed, non-empty |
| `isHost` | `boolean` | Yes | True for room creator |
| `score` | `number` | Yes | Cumulative points. Default `0` |
| `hasScoredThisRound` | `boolean` | Yes | Guard flag. Default `false`. Reset when `currentRound` increments |
| `role` | `"drawer" \| "guesser"` | No | Assigned on game start. Only set when `status="game"` |
| `joinedAt` | `string` (ISO 8601) | Yes | Timestamp of joining |

### Room (extended)

Represents an active game room. Existing fields kept; `strokes` and `guesses` are new.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` (4-6 chars) | Yes | Room identifier, uppercase alphanumeric |
| `status` | `"lobby" \| "game"` | Yes | Current phase of the room |
| `participants` | `Participant[]` | Yes | All players currently in the room |
| `hostId` | `string` (UUID) | Yes | Participant ID of the host |
| `currentWord` | `string` | No | Secret word for current round. Only set when `status="game"` |
| `drawerId` | `string` (UUID) | No | Participant ID of the drawer. Only set when `status="game"` |
| `currentRound` | `number` | No | 0-based round counter. Only set when `status="game"` |
| `strokes` | `{points: Point[]}[]` | Yes | Array of finalized canvas strokes. Empty array `[]` when no strokes |
| `guesses` | `Guess[]` | Yes | Array of submitted guesses. Empty array `[]` when no guesses |
| `createdAt` | `string` (ISO 8601) | Yes | Room creation timestamp |
| `updatedAt` | `string` (ISO 8601) | Yes | Last state change timestamp |

### Point

A 2D coordinate on the canvas.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x` | `number` | Yes | Horizontal position (CSS pixels) |
| `y` | `number` | Yes | Vertical position (CSS pixels) |

### Stroke

A single continuous line drawn by the drawer.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `points` | `Point[]` | Yes | Ordered array of points along the stroke. Minimum 1 point |

### Guess

A text submission from a guesser.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique guess identifier |
| `participantId` | `string` (UUID) | Yes | ID of the guesser |
| `text` | `string` | Yes | Trimmed guess text |
| `isCorrect` | `boolean` | Yes | Whether the guess matches the secret word (case-insensitive) |
| `awardedPoints` | `number` | Yes | Points awarded: `100` if first correct guess, `0` otherwise |
| `timestamp` | `string` (ISO 8601) | Yes | When the guess was submitted |

### RoomSnapshot (extended)

Response payload sent to clients. Existing fields kept; `strokes` and `guesses` are new.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | Yes | Room code |
| `status` | `"lobby" \| "game"` | Yes | Current phase |
| `participants` | `Participant[]` | Yes | All participants with scores and role |
| `hostId` | `string` | Yes | Host participant ID |
| `currentRound` | `number` | Yes | 0-based round number |
| `secretWord` | `string` | No | Only present when viewer is drawer |
| `strokes` | `{points: Point[]}[]` | Yes | Full canvas stroke array |
| `guesses` | `Guess[]` | Yes | Full guess history array |
| `availableWords` | `string[]` | Yes | Full word list (for UI display) |
| `roles` | `("drawer" \| "guesser")[]` | Yes | Role options (for UI display) |

## Guess Validation Rules

| Rule | Implementation |
|------|---------------|
| Trim whitespace | `text.trim()` before any processing |
| Reject empty | After trim, reject if `text.length === 0` |
| Case-insensitive match | `guess.trim().toLowerCase() === secretWord.toLowerCase()` |
| First correct score | If `guess.isCorrect && !participant.hasScoredThisRound` → `awardedPoints = 100` |

## Score Lifecycle

```
Game Start → participant.score = 0, participant.hasScoredThisRound = false
   │
   ├── First correct guess → score += 100, hasScoredThisRound = true
   ├── Subsequent correct guess → score unchanged (0 points)
   └── Incorrect guess → score unchanged (0 points)

Round End (future feature) → hasScoredThisRound = false for all participants
```

## State Transitions

```
[GAME] ── drawer draws ──▶ POST /:code/draw ──▶ strokes[] appended
[GAME] ── drawer clears ──▶ POST /:code/clear ──▶ strokes[] = []
[GAME] ── guesser guesses ──▶ POST /:code/guess ──▶ guesses[] appended, score updated
[GAME] ── anyone polls ──▶ GET /:code ──▶ full snapshot with strokes, guesses, scores
```
