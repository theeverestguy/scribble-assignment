# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks needed — project structure already exists from previous features. All work extends existing files.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type definitions that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 [P] Add `Point` and `Guess` interfaces; add `strokes: {points: Point[]}[]` and `guesses: Guess[]` to `Room` and `RoomSnapshot` in `backend/src/models/game.ts`
- [x] T002 [P] Add `score: number` (default 0) and `hasScoredThisRound: boolean` (default false) to `Participant` interface in `backend/src/models/game.ts`
- [x] T003 [P] Add `Point`, `Guess`, `strokes`, `guesses`, `score`, and `hasScoredThisRound` types/interfaces to `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — all type definitions in sync between backend and frontend. User story implementation can now begin.

---

## Phase 3: User Story 1 — Drawing on the Canvas (Priority: P1) 🎯 MVP

**Goal**: The drawer can draw freeform lines on an interactive canvas and clear it. Guessers see the drawing update via polling.

**Independent Test**: Start a game with 2+ players. The drawer draws three strokes on the canvas and presses clear. The guesser polls and sees the final blank canvas. The drawer draws one more stroke; after the next poll, the guesser sees that stroke.

### Implementation for User Story 1

- [x] T004 [P] [US1] Add `drawSchema` and `clearSchema` Zod validation schemas in `backend/src/api/schemas.ts`
- [x] T005 [P] [US1] Implement `appendStroke(code, participantId, points)` and `clearCanvas(code, participantId)` service functions in `backend/src/services/roomStore.ts` — validate room in "game" status, caller is drawer, append strokes or reset to `[]`
- [x] T006 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `strokes: room.strokes ?? []`; add `POST /:code/draw` and `POST /:code/clear` route handlers in `backend/src/api/rooms.ts`
- [x] T007 [P] [US1] Add `submitDraw(code, participantId, points)` and `clearCanvas(code, participantId)` API methods to `frontend/src/services/api.ts`
- [x] T008 [P] [US1] Add `submitDraw(points)` and `clearCanvas()` methods to `frontend/src/state/roomStore.ts` — each calls the API then triggers `fetchRoom()` to refresh state
- [x] T009 [US1] Create `Canvas.tsx` component in `frontend/src/components/` — HTML5 `<canvas>` with mouse event handlers (mousedown starts stroke, mousemove extends it, mouseup finalizes and calls `onDraw`); redraws all strokes from `strokes` prop on change; clear button calls `onClear`; read-only for viewers; black pen, 2px width, round line caps
- [x] T010 [US1] Update `GamePage.tsx` in `frontend/src/pages/` — replace the canvas placeholder `<div>` with `<Canvas>` component; pass `strokes`, `isDrawer`, `onDraw`, `onClear` props; wire `onDraw` to `roomStore.submitDraw()` and `onClear` to `roomStore.clearCanvas()`

**Checkpoint**: At this point, the drawer can draw and clear. Guessers see the canvas state update via the next poll cycle. Canvas is the only active feature — no guessing or scoring yet.

---

## Phase 4: User Story 2 — Submitting Guesses (Priority: P2)

**Goal**: Guessers can submit text guesses. The system validates (trim, reject empty, case-insensitive match), records each guess, and displays the guess history to all players.

**Independent Test**: Start a game with 2+ players. Guesser submits "PIZZA" (secret word is "pizza") — sees "Correct!" feedback. Guesser submits empty text — sees error feedback. All players see the correct guess in the guess history marked as correct.

### Implementation for User Story 2

- [x] T011 [P] [US2] Add `guessSchema` Zod validation schema (`participantId: uuid`, `text: string().min(1)`) in `backend/src/api/schemas.ts`
- [x] T012 [P] [US2] Implement pure function `checkGuess(text, secretWord): boolean` in `backend/src/services/roomStore.ts` — trims input, returns case-insensitive match result
- [x] T013 [US2] Implement `submitGuess(code, participantId, text)` in `backend/src/services/roomStore.ts` — validate room in "game" status, caller is guesser (not drawer), trim text and reject empty, run `checkGuess` against `room.currentWord`, create `Guess` record, append to `room.guesses`
- [x] T014 [US2] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `guesses: room.guesses ?? []`; add `POST /:code/guess` route handler in `backend/src/api/rooms.ts` returning `{ guess, correct, points }`
- [x] T015 [P] [US2] Add `submitGuess(code, participantId, text)` API method to `frontend/src/services/api.ts`
- [x] T016 [P] [US2] Add `submitGuess(text)` method to `frontend/src/state/roomStore.ts` — calls API then triggers `fetchRoom()` (or optimistically appends the guess locally)
- [x] T017 [US2] Update `GuessForm.tsx` in `frontend/src/components/` — wire submit handler to `roomStore.submitGuess()`; show inline feedback ("Correct!" / "Incorrect") from API response; clear input on submit
- [x] T018 [US2] Add guess history display in `GamePage.tsx` in `frontend/src/pages/` — render `room.guesses` as an ordered list showing each guesser's name, text, correct/incorrect badge, and points awarded

**Checkpoint**: At this point, guessers can submit guesses, see validation feedback, and view all guesses in the history. Scoring exists in the backend but isn't displayed yet.

---

## Phase 5: User Story 3 — Score Visibility (Priority: P3)

**Goal**: Scores earned from guessing correctly are visible to all players on the scoreboard.

**Independent Test**: Start a game with 2+ players. One guesser guesses correctly. All players see that guesser's score update to 100 on the scoreboard. A second guesser guesses correctly and their score updates to 100.

### Implementation for User Story 3

- [x] T019 [P] [US3] Add scoring logic inside `submitGuess()` in `backend/src/services/roomStore.ts` — if guess is correct AND `participant.hasScoredThisRound === false`: set `awardedPoints = 100`, `participant.score += 100`, `participant.hasScoredThisRound = true`; reset `hasScoredThisRound` based on `currentRound` tracking
- [x] T020 [US3] Update `Scoreboard` component consumption in `GamePage.tsx` in `frontend/src/pages/` — ensure the scoreboard reads `participant.score` from the room snapshot and displays each player's cumulative score; add "100 pts" label next to correct guesses in guess history

**Checkpoint**: At this point, all three user stories are functional. Scoring is displayed and updated correctly.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Build verification and validation

- [x] T021 Run `cd backend && npm run build` and `cd frontend && npm run build` to verify TypeScript compiles cleanly across both projects
- [x] T022 [P] Verify no existing tests are broken by running `cd backend && npx vitest run` and `cd frontend && npx vitest run`
- [ ] T023 Run quickstart.md validation manually: host starts game, drawer draws and clears, guesser submits correct and incorrect guesses, scores update, polling syncs everything — **pending manual test**

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion (type definitions)
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion (types) and Phase 3 (game must be running with canvas for guesses to be meaningful, but no code dependency)
- **User Story 3 (Phase 5)**: Depends on Phase 4 completion (scoring occurs during guess submission)
- **Polish (Phase 6)**: Depends on all phases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) — MVP scope
- **User Story 2 (P2)**: Depends on Foundational only — does not depend on US1 code; can be implemented in parallel with US1
- **User Story 3 (P3)**: Depends on US2 (scoring runs inside submitGuess)

### Within Each User Story

- Backend models before services
- Service functions before route handlers
- API methods before store methods
- Store methods before component integration

### Parallel Opportunities

- **Phase 2**: T001, T002, T003 can all run in parallel (different fields on different interfaces/files)
- **Phase 3**: T004, T005, T007, T008 can run in parallel (schemas, service functions, api.ts, roomStore.ts — all different files)
- **Phase 3 & 4**: US1 and US2 can run in parallel (US2 only depends on Phase 2 types, not US1 canvas code)
- **Phase 4**: T011, T012, T015, T016 can run in parallel (schemas, pure function, api.ts, roomStore.ts)
- T021, T022 are independent build and test runs that can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all type definition updates in parallel:
T001: "Add Point, Guess, strokes, guesses to backend/src/models/game.ts"
T002: "Add score, hasScoredThisRound to Participant in backend/src/models/game.ts"
T003: "Add Point, Guess, strokes, guesses, score, hasScoredThisRound to frontend/src/services/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Drawer can draw and clear canvas; guessers see canvas updates via polling
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Types defined
2. Add User Story 1 → Drawing canvas functional → Test independently (MVP!)
3. Add User Story 2 → Guessing with validation and history → Test independently
4. Add User Story 3 → Score display on scoreboard → Test independently

### Parallel Team Strategy

With multiple developers:

1. Developer A: Phase 2 (all type definitions) — ~5 minutes
2. Once Phase 2 done:
   - Developer A: User Story 1 (canvas backend + frontend)
   - Developer B: User Story 2 (guess backend + frontend), except T013/T014 which touch roomStore.ts
3. Developer A continues to integrate (T010 uses Canvas component)
4. Developer B completes guess submission and history UI
5. Developer A or B: User Story 3 (score display, 1-2 tasks)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
