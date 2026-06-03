# Data Model: Results & Restart

**Phase**: 1 — Design & Contracts
**Date**: 2026-06-03
**Source**: [spec.md](./spec.md), [research.md](./research.md)

## Type Changes

### RoomStatus (extended)

```typescript
export type RoomStatus = "lobby" | "game" | "results";
```

The `"results"` value is added to the existing union type. No other type changes needed.

## State Transitions

```
lobby ── startGame() ──▶ game
 game ── submitGuess() (isCorrect) ──▶ results
 results ── restartGame() (host only) ──▶ lobby
```

### Transition Details

#### `game → results`

Triggered inside `submitGuess()` when `isCorrect === true`:

| Field | Before | After |
|-------|--------|-------|
| `status` | `"game"` | `"results"` |
| Everything else | Unchanged | Unchanged (strokes, guesses, scores preserved for display) |

#### `results → lobby`

Triggered by `restartGame()`:

| Field | Before | After | Notes |
|-------|--------|-------|-------|
| `status` | `"results"` | `"lobby"` | |
| `currentRound` | `0` | `undefined` | Cleared for fresh game |
| `drawerId` | UUID | `undefined` | Cleared |
| `currentWord` | string | `undefined` | Cleared |
| `strokes` | `[...]` | `[]` | Cleared |
| `guesses` | `[...]` | `[]` | Cleared |
| `participants[].score` | number | `0` | Reset |
| `participants[].hasScoredThisRound` | boolean | `false` | Reset |
| `participants[].role` | `"drawer" \| "guesser"` | `undefined` | Cleared |
| `code` | string | unchanged | **Preserved** |
| `hostId` | string | unchanged | **Preserved** |
| `participants[]` | `[...]` | unchanged | **Preserved** |
| `createdAt` | ISO string | unchanged | **Preserved** |

## Snapshot Behavior

### `toRoomSnapshot()` — secretWord visibility

| Status | Viewer is drawer | Viewer is guesser |
|--------|-----------------|-------------------|
| `"lobby"` | N/A (no game) | N/A (no game) |
| `"game"` | `secretWord` shown | `secretWord` hidden |
| `"results"` | `secretWord` shown | `secretWord` shown |

Existing condition updated from:
```typescript
secretWord: isViewerDrawer ? room.currentWord : undefined,
```
to:
```typescript
secretWord: (isViewerDrawer || room.status === "results") ? room.currentWord : undefined,
```

## Winner Calculation

Computed client-side. No backend changes needed.

```typescript
function getWinner(participants: Participant[]): Participant | null {
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  if (sorted.length === 0 || sorted[0].score === 0) return null;
  return sorted[0];
}
```

Returns `null` (display "No winner") when all scores are 0.
