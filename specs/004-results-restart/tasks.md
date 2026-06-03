# Tasks: Results & Restart

**Input**: Design documents from `/specs/004-results-restart/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions
- Acceptance Criteria (AC): listed below each task

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks needed — project structure already exists from previous features. All work extends existing files.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type definition updates that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 [P] Add `"results"` to `RoomStatus` type union in `backend/src/models/game.ts`
  - AC: `RoomStatus` is `"lobby" | "game" | "results"` after change
  - AC: No other model changes needed
  - AC: `npm run build` in backend passes

- [X] T002 [P] Add `"results"` to `RoomStatus` type union in `frontend/src/services/api.ts`
  - AC: `RoomStatus` is `"lobby" | "game" | "results"` after change
  - AC: No other type changes needed
  - AC: `npm run build` in frontend passes

**Checkpoint**: Foundation ready — "results" is recognized as a valid status everywhere. User story implementation can now begin.

---

## Phase 3: User Story 1 — Results Display (Priority: P1) 🎯 MVP

**Goal**: When a correct guess is submitted, the room transitions to "results" status and all players see a results view showing the correct word, winner, scores, and guess history.

**Independent Test**: Start a game with 2+ players. Guesser submits the correct word. All players see the results view within one poll cycle. The correct word is visible to all (including guessers). The winner (first correct guesser with 100 points) is highlighted. The guess history shows all guesses.

### Implementation for User Story 1

- [X] T003 [US1] Update `submitGuess()` in `backend/src/services/roomStore.ts` to set `room.status = "results"` when `isCorrect === true`, before returning the response
  - AC: When a correct guess is submitted, `room.status` changes from `"game"` to `"results"`
  - AC: When an incorrect guess is submitted, `room.status` remains unchanged
  - AC: Existing scoring and guess recording behavior is preserved
  - AC: All existing tests still pass
  - AC: Existing `appendStroke()`, `clearCanvas()`, and `submitGuess()` guards check `room.status !== "game"` — they now also reject actions when status is `"results"` (no code change needed)

- [X] T004 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to reveal `secretWord` to all players when `room.status === "results"`
  - AC: Change condition from `isViewerDrawer` to `isViewerDrawer || room.status === "results"`
  - AC: In game state, `secretWord` still only visible to drawer
  - AC: In results state, `secretWord` visible to all viewers in the snapshot
  - AC: In lobby state, `secretWord` is never visible

- [X] T005 [US1] Create `ResultsView.tsx` component in `frontend/src/components/` — display correct word, winner (highest score), scoreboard, full guess history, and host-only restart button
  - AC: Component accepts `room: RoomSnapshot` and `viewer: Participant | null` props
  - AC: Shows the secret word prominently at the top
  - AC: Computes and displays winner as participant with highest score (shows "No winner" if all scores are 0)
  - AC: Shows sorted scoreboard with each participant's name and cumulative score
  - AC: Shows full chronological guess history with guesser name, text, correct/incorrect badge, and points
  - AC: Shows restart button ONLY when `viewer.isHost === true`
  - AC: No drawing controls, no guess input, no canvas

- [X] T006 [US1] Update `GamePage.tsx` in `frontend/src/pages/` — render `<ResultsView>` when `room.status === "results"` (replaces game view)
  - AC: When `room.status === "results"`, `ResultsView` is rendered instead of `GameView` (canvas + guess form)
  - AC: When `room.status === "game"`, normal game view is shown
  - AC: Results view does not interfere with existing lobby redirect logic
  - AC: `viewer` is computed same way as existing code (`participants.find(p => p.id === participantId)`)

**Checkpoint**: At this point, submitting a correct guess transitions to results state. All players see the correct word, winner, scores, and guess history. The restart button is rendered for the host but is non-functional until Phase 4 (US2) is complete.

---

## Phase 4: User Story 2 — Restart Game (Priority: P2)

**Goal**: From the results view, the host can restart the game. All players return to lobby with room/host/players preserved but all game state cleared.

**Independent Test**: Complete a round to reach results view. Host clicks restart. All players see lobby with same room code and player list. Scores are reset to 0, guesses and canvas are empty, no roles assigned, no secret word set.

### Implementation for User Story 2

- [X] T007 [US2] Implement `restartGame(code, participantId)` service function in `backend/src/services/roomStore.ts` — validate room exists, status is "results", caller is host; reset all game state; preserve room/host/players
  - AC: Room must exist (404), be in "results" status (400), and caller must be hostId (403) — else return appropriate error
  - AC: On success: `status = "lobby"`, `currentRound = undefined`, `drawerId = undefined`, `currentWord = undefined`, `strokes = []`, `guesses = []`
  - AC: Each participant: `score = 0`, `hasScoredThisRound = false`, `role = undefined`
  - AC: `code`, `hostId`, and `participants` array are preserved unchanged
  - AC: `createdAt` is preserved, `updatedAt` is updated
  - AC: Existing `createRoom`, `joinRoom`, `startGame` still work after restart

- [X] T008 [P] [US2] Add `restartSchema` Zod validation (`participantId: z.string().uuid()`) in `backend/src/api/schemas.ts`
  - AC: Schema validates `{ participantId: "valid-uuid" }` — passes
  - AC: Schema rejects missing or invalid `participantId`

- [X] T009 [US2] Add `POST /:code/restart` route handler in `backend/src/api/rooms.ts` — parse params, validate with restartSchema, call restartGame, return snapshot
  - AC: `POST /rooms/:code/restart` returns 200 with `{ room: RoomSnapshot }` on success
  - AC: Returns 404 for unknown room code
  - AC: Returns 403 for non-host caller
  - AC: Returns 400 if room is not in "results" status

- [X] T010 [P] [US2] Add `restartGame(code, participantId)` API method to `frontend/src/services/api.ts`
  - AC: Calls `POST /rooms/:code/restart` with `{ participantId }`
  - AC: Returns `{ room: RoomSnapshot }` on success
  - AC: Throws error on non-200 response

- [X] T011 [US2] Add `restartGame()` method to `frontend/src/state/roomStore.ts` — calls API then triggers `fetchRoom()` to refresh state
  - AC: Method reads `code` and `participantId` from current session
  - AC: On success, calls `fetchRoom()` to refresh room state
  - AC: After restart, polling returns status "lobby" and UI redirects to lobby view
  - AC: No errors thrown for expected flow

**Checkpoint**: At this point, both user stories are functional. Host can restart from results. All players return to lobby with preserved room/host/players and cleared game state.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Build verification and validation

- [X] T012 Run `npm run build` in backend and `npx tsc --noEmit` in frontend to verify TypeScript compiles cleanly across both projects
  - AC: `npm run build` exits with code 0 in both projects
  - AC: No TypeScript errors

- [X] T013 [P] Verify no existing tests are broken by running `npx vitest run` in both backend and frontend
  - AC: All existing tests still pass after changes (33/33 backend, 5/5 frontend)
  - AC: No regressions in existing test suites

- [ ] T014 Run quickstart.md validation manually: host starts game, guesser submits correct word, results view appears with correct data, host restarts, all players return to lobby with reset state
  - AC: Full flow test passes end-to-end
  - AC: Results view renders within one poll cycle
  - AC: Restart clears all game state as specified

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion (type definitions)
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion (types) — can run in parallel with US1 but logically follows
- **Polish (Phase 5)**: Depends on all phases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) — MVP scope
- **User Story 2 (P2)**: Depends on Foundational (Phase 2) — no code dependency on US1; restart button is only visible in ResultsView (US1) but the backend endpoint works independently

### Within Each User Story

- Service functions before route handlers
- API methods before store methods
- Store methods before component integration

### Parallel Opportunities

- **Phase 2**: T001, T002 can run in parallel (different files: backend game.ts vs frontend api.ts)
- **Phase 3**: T003, T004 can run in parallel (roomStore.ts line changes for different functions)
- **Phase 3 & 4**: US1 and US2 backend work can run in parallel (T003/T004 vs T007/T008 involve different functions)
- **Phase 4**: T008, T010 can run in parallel (schemas.ts vs frontend api.ts — different projects)
- T012, T013 are independent build and test runs that can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch both type definition updates in parallel:
T001: "Add 'results' to RoomStatus in backend/src/models/game.ts"
T002: "Add 'results' to RoomStatus in frontend/src/services/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Correct guess triggers results view; word, winner, scores, history displayed
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Types updated
2. Add User Story 1 → Results display functional → Test independently (MVP!)
3. Add User Story 2 → Restart functional → Test independently

### Parallel Team Strategy

With multiple developers:

1. Developer A: Phase 2 (both type updates) — ~2 minutes
2. Once Phase 2 done:
   - Developer A: User Story 1 (T003, T004, T005, T006)
   - Developer B: User Story 2 (T007, T008, T009, T010, T011)
3. Developer A or B: Phase 5 polish tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
