# Quickstart: Game Start & Drawer Flow

**Phase**: 1 — Design & Contracts
**Date**: 2026-06-03
**Branch**: `002-game-start-flow`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md)

## Implementation Walkthrough

### Step 1: Update Models (`backend/src/models/game.ts`)

1. Add `role: ParticipantRole` to `Participant` interface
2. Add `currentWord`, `drawerId`, `currentRound` to `Room` interface
3. Add `currentRound` and `secretWord?: string` to `RoomSnapshot`

### Step 2: Enhance Game Start (`backend/src/services/roomStore.ts`)

1. Create pure function `selectWord(wordList, round)` outside the class
2. Inside `startGame()`, after existing validations:
   - Select word with `selectWord(STARTER_WORDS, 0)`
   - Iterate participants: set host role = "drawer", others = "guesser"
   - Set `room.currentWord`, `room.drawerId`, `room.currentRound`
3. In `toRoomSnapshot()`, use `viewerParticipantId` to find viewer's role:
   - If drawer: include `secretWord`
   - Otherwise: omit it

### Step 3: Frontend Types (`frontend/src/services/api.ts`)

1. Add `currentRound: number` and `secretWord?: string` to `RoomSnapshot`

### Step 4: Update Game Page (`frontend/src/pages/GamePage.tsx`)

1. Find viewer participant from `room.participants` by `participantId`
2. If viewer.role === "drawer":
   - Show `room.secretWord` in a prominent card
   - Hide GuessForm (drawers don't guess)
3. If viewer.role === "guesser":
   - Hide secret word
   - Show GuessForm with prompt hint
4. Show role badge next to viewer name

### Step 5: Tests

1. **Backend** (`roomStore.test.ts`):
   - Test that `startGame` assigns roles correctly
   - Test that `selectWord` is deterministic
   - Test that `toRoomSnapshot` filters word per role
2. **Frontend** (`GamePage` test or new):
   - Test drawer sees word
   - Test guesser does not see word (or word is undefined)

### Files to Modify

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add fields to Participant, Room, RoomSnapshot |
| `backend/src/services/roomStore.ts` | Enhance startGame, toRoomSnapshot; add selectWord |
| `frontend/src/services/api.ts` | Add new fields to RoomSnapshot type |
| `frontend/src/pages/GamePage.tsx` | Role-aware rendering |

### Files NOT to Modify

- `backend/src/api/schemas.ts` — No new endpoints or body schemas
- `backend/src/api/rooms.ts` — Existing routes work; benefit from snapshot changes
- `backend/src/seed/starterData.ts` — Word list is sufficient
- `frontend/src/state/roomStore.ts` — Generic polling works without changes
- `frontend/src/pages/LobbyPage.tsx` — Already navigates to /game on status change

## Verification

1. `cd backend && npm run build` — TypeScript compiles without errors
2. `cd frontend && npm run build` — TypeScript compiles without errors
3. `cd backend && npx vitest run` — Existing + new tests pass
4. Manual: host starts game with 2+ players → all see game screen, drawer sees word, guessers don't
