# Discovery & Scaffold Understanding: Scribble

**Date**: 2026-06-03
**Covers**: All 4 features (001–004)

## Project Overview

Scribble is a multiplayer drawing game where one player draws a secret word and others guess what it is. Built as a monorepo with an Express TypeScript backend and React/Vite TypeScript frontend. All sync via HTTP polling, all state in-memory, zero authentication.

### Feature Build Order

| # | Feature | What It Adds | Depends On |
|---|---------|-------------|------------|
| 001 | Room Setup & Lobby | Create/join rooms, host tracking, player list, polling, start game | Nothing |
| 002 | Game Start & Drawer Flow | Role assignment, word selection, secret word visibility | 001 |
| 003 | Gameplay Interaction | Canvas drawing, guess submission, scoring, guess history | 002 |
| 004 | Results & Restart | Round completion, results display, host-only restart | 003 |

---

## Feature 001: Room Setup & Lobby

### Problem Space
Players need to create or join a shared drawing room identified by a short code, see who else is present, and wait in a lobby until the host starts the game. Without this, there is no way for multiple players to connect into the same game session.

### Entry State (Before This Feature)
- `RoomStatus = "lobby"` only — no game state exists
- `createRoom`, `joinRoom`, `getRoom` service functions exist
- `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code` routes exist
- Minimal frontend with CreateRoomPage, JoinRoomPage
- No polling, no host concept, no player name validation

### What Needs to Change

| File | Change | Why |
|------|--------|-----|
| `backend/src/models/game.ts` | Add `hostId` to Room, `isHost` to Participant, `"game"` to RoomStatus | Host identity for authorization |
| `backend/src/services/roomStore.ts` | Enhance createRoom/joinRoom with validation, add leaveRoom, add startGame stub | Business logic for lobby lifecycle |
| `backend/src/api/schemas.ts` | Zod schemas for name validation, start game, room code format | Input boundary enforcement |
| `backend/src/api/rooms.ts` | Add POST /:code/start, DELETE /:code/players/:id | New endpoints for host actions and cleanup |
| `frontend/src/services/api.ts` | Add startGame, leaveRoom methods | Call new endpoints |
| `frontend/src/state/roomStore.ts` | Add polling loop, host detection, startGame | Real-time lobby sync |
| `frontend/src/pages/LobbyPage.tsx` | **CREATE** — player list, start button, room code display | Required UI |
| `frontend/src/pages/GamePage.tsx` | **CREATE** — placeholder for post-start redirect | Navigation target |
| `frontend/src/components/` | **CREATE** Card, RoomCodeBadge, Scoreboard, ResultPanel | Shared UI primitives |

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Room code | 4-char unambiguous alphabet | Readable, existing generator |
| Host tracking | `isHost` on Participant + `hostId` on Room | O(1) checks in backend, simple rendering in frontend |
| Polling | `setInterval` 2s in RoomStoreProvider | Single loop per app, cleanup on unmount |
| Leave cleanup | DELETE endpoint + beforeunload | Best-effort, no server-side timer needed |
| Validation | Zod (existing) | No new dependencies |

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Code collision | Wrong room | `while (rooms.has(code))` regeneration |
| Polling race on start | Duplicate game state | Service layer guards lobby→game transition |
| Server restart | All rooms lost | Accepted — ephemeral by design |

---

## Feature 002: Game Start & Drawer Flow

### Problem Space
When the host clicks "Start Game", the room transitions to active game state. Host becomes drawer, others become guessers. A secret word is selected and shown only to the drawer. All players see their role.

### Entry State (After 001)
- Room has `code`, `hostId`, `participants[]` with `isHost`
- `status: "lobby"`, polling is active
- `startGame()` exists but only validates host/permissions
- No game fields, no role concept, no secret word

### What Needs to Change

| File | Change | Why |
|------|--------|-----|
| `backend/src/models/game.ts` | Add `ParticipantRole` type, add `currentWord`, `drawerId`, `currentRound` to Room | Game state fields |
| `backend/src/services/roomStore.ts` | Enhance startGame with role assignment + word selection; add selectWord() pure function; add toRoomSnapshot() with secretWord filter | Core game start logic |
| `backend/src/seed/starterData.ts` | Verify STARTER_WORDS exists (5 words: rocket, pizza, castle, guitar, sunflower) | Word source |
| `frontend/src/services/api.ts` | Mirror ParticipantRole type | Type alignment |
| `frontend/src/pages/GamePage.tsx` | Rewrite: show role, word card (drawer only), scoreboard | Game UI |
| `frontend/src/components/Scoreboard.tsx` | **CREATE** — sorted participant list with scores | Required UI |

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Word selection | `list[round % list.length]` deterministic | Pure function, reproducible |
| Role assignment | Host = drawer | Spec requirement |
| Role storage | `role` field on Participant | Simple, no indirection |
| Secret word | Server-side filter in toRoomSnapshot | Guessers never see it over the wire |
| Game state | Fields directly on Room | No separate GameSession needed |

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Word list too small (5 words) | Predictable after 5 games | Acceptable for prototype |
| Non-host calls start | Game doesn't start | 403 response |
| Player joins mid-game | Sees game but not word | Role-based filtering handles it |

---

## Feature 003: Gameplay Interaction

### Problem Space
During an active game, the drawer draws on a canvas and guessers submit text guesses. All players see canvas updates, guess history, and scores. First correct guess awards 100 points.

### Entry State (After 002)
- Room has `status: "game"`, `drawerId`, `currentWord`, `currentRound`
- Drawer knows role, sees secretWord in snapshot
- GamePage shows role, word card (drawer), basic scoreboard
- No canvas, no guess input, no scoring

### What Needs to Change

| File | Change | Why |
|------|--------|-----|
| `backend/src/models/game.ts` | Add `Point`, `Guess` types; add `score`, `hasScoredThisRound` to Participant | Data model for gameplay |
| `backend/src/services/roomStore.ts` | Add `checkGuess`, `appendStroke`, `clearCanvas`, `submitGuess` | Core gameplay logic |
| `backend/src/api/schemas.ts` | Add drawSchema, clearSchema, guessSchema | Input validation |
| `backend/src/api/rooms.ts` | Add POST /:code/draw, /clear, /guess | New endpoints |
| `frontend/src/components/Canvas.tsx` | **CREATE** — HTML5 Canvas with mouse drawing | Drawing UI |
| `frontend/src/components/GuessForm.tsx` | **CREATE** — text input + submit | Guessing UI |
| `frontend/src/components/ResultPanel.tsx` | **CREATE** — feedback display | Guess result feedback |
| `frontend/src/pages/GamePage.tsx` | Integrate canvas, guess form, history, controls | Full game UI |
| `frontend/src/state/roomStore.ts` | Add submitDraw, clearCanvas, submitGuess | Store methods |
| `frontend/src/services/api.ts` | Add Point, Guess types + API methods | API client |
| `frontend/src/app.css` | Canvas layout styles | Visual layout |

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Canvas format | `{points: {x,y}[]}[]` finalized strokes | Simplest, no real-time streaming needed |
| Guess history | Flat append-only Guess[] on Room | No delete/reorder, full history in every snapshot |
| Scoring | hasScoredThisRound boolean, +100 first correct | Simple boolean guard, matches spec |
| Drawing tech | Raw HTML5 Canvas API | No external dependencies |
| Stroke rendering | Full redraw on every snapshot | Deterministic, avoids incremental bugs |
| Sync | 3 new POST endpoints + existing GET polling | No new infrastructure |

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Canvas state grows unbounded | Memory pressure | Acceptable for 2-8 player single round |
| 2s polling delay on canvas | Slight lag | Acceptable for turn-based drawing |
| Drawer could call guess API | Wrongful scoring | Server rejects non-guesser roles |
| Case sensitivity frustration | UX confusion | Normalize to lowercase before comparison |

---

## Feature 004: Results & Restart

### Problem Space
When a correct guess ends the round, all players see the outcome (correct word, winner, scores, guess history). The host can restart, returning everyone to lobby with cleared game state but preserved room/host/players.

### Entry State (After 003)
- `submitGuess()` detects correct guesses, awards 100 points
- Room has `status: "game"`, scoring works, guess history exists
- Canvas, guess form, scoreboard rendered in GamePage
- No "results" status, no results view, no restart capability

### What Needs to Change

| File | Change | Why |
|------|--------|-----|
| `backend/src/models/game.ts` | Add `"results"` to RoomStatus | New state for round completion |
| `backend/src/services/roomStore.ts` | submitGuess: auto-transition to "results" on correct; toRoomSnapshot: reveal word in results; **new** restartGame() | Core results + restart logic |
| `backend/src/api/schemas.ts` | Add restartSchema | Input validation |
| `backend/src/api/rooms.ts` | Add POST /:code/restart | New endpoint |
| `frontend/src/components/ResultsView.tsx` | **CREATE** — word, winner, scoreboard, history, restart button | Results UI |
| `frontend/src/pages/GamePage.tsx` | Render ResultsView when status === "results" | Conditional routing |
| `frontend/src/services/api.ts` | Add "results" to RoomStatus; add restartGame() | API mirror |
| `frontend/src/state/roomStore.ts` | Add restartGame() method | Store method |

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Round end trigger | Auto on correct guess in submitGuess() | Simplest — no timer, no manual endpoint |
| State reset | Single restartGame() function | Atomic, matches startGame() pattern |
| Result state | New "results" RoomStatus value | Minimal change, existing guards auto-reject actions |
| Secret word reveal | `isViewerDrawer \|\| status === "results"` | One-line condition change in toRoomSnapshot |
| Winner calc | Client-side sort by score descending | Data already in snapshot, trivial derivation |
| Restart auth | Host-only (403 for non-host) | Consistent with startGame() |
| Lobby return | Automatic via existing polling + lobby redirect | No new sync mechanism |

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Round never ends (no correct guess) | Stuck in game | Documented out-of-scope; future timer |
| Player joins during results | Sees word intentionally | Acceptable — results are public |
| Restart + stale poll | Delayed redirect | One extra poll cycle, then redirect |
| `currentRound` 0 vs undefined | Minor inconsistency | Implementation uses undefined; spec says 0 |

---

## Global Constraints (Apply To All Features)

| Constraint | Source | Impact |
|------------|--------|--------|
| No WebSockets | POL-1 | All sync via 2s HTTP polling |
| No databases | MEM-1 | All state in-memory Map<string, Room> |
| Zod validation | VAL-1 | All inputs validated at API boundary |
| TypeScript strict | TS-1 | No `any`, use `unknown` and narrow |
| Immutability | IMM-1 | cloneRoom pattern, pure functions where possible |
| No authentication | Project rule | Host identity via participantId comparison |

## Technology Stack

- **Backend**: Node.js, Express 4.x, TypeScript 5.x, Zod 3.x, tsx
- **Frontend**: React 18, React Router 6, Vite 5, TypeScript 5.x
- **Testing**: Vitest (both backend and frontend)
- **Storage**: In-memory `Map<string, Room>` in roomStore.ts

## Gaps (Known Limitations)

1. **No round timer** — If no guesser submits a correct answer, the round continues indefinitely. The only exit is a correct guess or server restart. A timer or manual "end round" button is needed for production use. Affects: 003, 004.

2. **No drawer rotation** — The host is always the drawer for every game. Players cannot rotate the drawer role between rounds (not that multiple rounds exist). This reduces replay variety. Affects: 002, 004.

3. **No test coverage for new features** — Feature 004 added `restartGame()`, `restartSchema`, `POST /:code/restart`, and `ResultsView.tsx` without corresponding unit or integration tests. Existing tests pass but new code is untested. Affects: 004.

## Assumptions

1. **Single-round sessions** — Each game consists of exactly one round. After results, the host restarts (which clears all state) or players leave. There is no concept of "next round" within a game session. This simplifies the state machine to `lobby → game → results → lobby`.

2. **Trusted frontend for winner display** — The winner is computed client-side by sorting participants by score. There is no server-authoritative `winnerId` field. If the client displays an incorrect winner (e.g., due to a bug), the server has no way to correct it. Acceptable for a prototype.

## Scaffold Summary (All Features)

### Files Created
```
frontend/src/components/Canvas.tsx        (003)
frontend/src/components/GuessForm.tsx     (003)
frontend/src/components/ResultPanel.tsx   (003)
frontend/src/components/ResultsView.tsx   (004)
frontend/src/components/Scoreboard.tsx    (002)
frontend/src/components/Card.tsx          (001)
frontend/src/components/RoomCodeBadge.tsx (001)
frontend/src/pages/LobbyPage.tsx          (001)
frontend/src/pages/GamePage.tsx           (001, rewritten 002/003/004)
```

### Files Modified
```
backend/src/models/game.ts                (001/002/003/004)
backend/src/services/roomStore.ts         (001/002/003/004)
backend/src/api/schemas.ts                (001/002/003/004)
backend/src/api/rooms.ts                  (001/002/003/004)
frontend/src/services/api.ts              (001/002/003/004)
frontend/src/state/roomStore.ts           (001/002/003/004)
frontend/src/App.tsx                      (001)
frontend/src/app.css                      (003)
```

### API Endpoints Added Per Feature
```
001: POST /:code/start, DELETE /:code/players/:participantId
002: (none — enhances existing endpoints)
003: POST /:code/draw, POST /:code/clear, POST /:code/guess
004: POST /:code/restart
```

### State Machine
```
lobby ── startGame() ──▶ game ── submitGuess(correct) ──▶ results
                                                             │
                                                      restartGame()
                                                             │
                                                              └──▶ lobby
```
