# Data Model: Game Start & Drawer Flow

**Phase**: 1 — Design & Contracts
**Date**: 2026-06-03
**Source**: [spec.md](./spec.md), [research.md](./research.md)

## Entities

### Participant (extended)

Represents a player in a room. Existing fields kept; `role` is new.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique participant identifier |
| `name` | `string` | Yes | Display name, trimmed, non-empty |
| `isHost` | `boolean` | Yes | True for room creator |
| `role` | `"drawer" \| "guesser"` | Yes* | Assigned on game start. *Only set when status="game"* |
| `joinedAt` | `string` (ISO 8601) | Yes | Timestamp of joining |

### Room (extended)

Represents an active game room. Existing fields kept; `currentWord`, `drawerId`, `currentRound` are new.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` (4-6 chars) | Yes | Room identifier, uppercase alphanumeric |
| `status` | `"lobby" \| "game"` | Yes | Current phase of the room |
| `participants` | `Participant[]` | Yes | All players currently in the room |
| `hostId` | `string` (UUID) | Yes | Participant ID of the host |
| `currentWord` | `string` | No* | Secret word for current round. *Only set when status="game"* |
| `drawerId` | `string` (UUID) | No* | Participant ID of the drawer. *Only set when status="game"* |
| `currentRound` | `number` | No* | 0-based round counter. *Only set when status="game"* |
| `createdAt` | `string` (ISO 8601) | Yes | Room creation timestamp |
| `updatedAt` | `string` (ISO 8601) | Yes | Last state change timestamp |

### RoomSnapshot (extended)

Response payload sent to clients. Existing fields kept; `currentRound` and `secretWord` are new.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | Yes | Room code |
| `status` | `"lobby" \| "game"` | Yes | Current phase |
| `participants` | `Participant[]` | Yes | All participants with roles |
| `hostId` | `string` | Yes | Host participant ID |
| `currentRound` | `number` | Yes | 0-based round number |
| `secretWord` | `string` | No* | Only present when viewer is drawer. *Omitted for guessers* |
| `availableWords` | `string[]` | Yes | Full word list (for UI display) |
| `roles` | `("drawer" \| "guesser")[]` | Yes | Role options (for UI display) |

## State Transitions

```
[LOBBY] ── host triggers startGame() ──▶ [GAME]
   │                                          │
   │ join/leave allowed                       │ join blocked
   │                                          │ (no rejoin mechanism)
   └── room empty ──▶ removed                 │
                                              └── single round, no further
                                                  transitions in this feature
```

On game start:
1. Status changes `"lobby"` → `"game"`
2. Host participant gets `role = "drawer"`
3. All other participants get `role = "guesser"`
4. `currentWord = selectWord(wordList, 0)`
5. `drawerId = hostId`
6. `currentRound = 0`

## Role-Based Visibility Rules

| Viewer Role | Fields Visible in Snapshot |
|-------------|---------------------------|
| Drawer | All fields including `secretWord` |
| Guesser | All fields EXCEPT `secretWord` |
| Unknown / no participantId | All fields EXCEPT `secretWord` (safe default) |

## Validation Rules

| Rule | Enforced By | Error |
|------|-------------|-------|
| Game start requires >= 2 players | `startGame()` in roomStore | `"not-enough-players"` |
| Only host can start game | `startGame()` in roomStore | `"not-host"` |
| Word list must not be empty | Assumption (spec) | N/A (guarded by spec) |

## Key Functions

```
selectWord(wordList, roundNumber) → string
  Pure function. Returns wordList[roundNumber % wordList.length].
  Satisfies IMM-1 (deterministic, no side effects).
```
