# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-flow/`

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

No setup tasks needed — project structure already exists from previous feature. All work extends existing files.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type and interface changes that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 [P] Add `role: ParticipantRole` field to `Participant` interface in `backend/src/models/game.ts`
- [ ] T002 [P] Add `currentWord: string`, `drawerId: string`, `currentRound: number` fields to `Room` interface in `backend/src/models/game.ts`
- [ ] T003 [P] Add `currentRound: number` and `secretWord?: string` fields to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [ ] T004 [P] Add `currentRound: number` and `secretWord?: string` fields to `RoomSnapshot` interface in `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — all type definitions in sync between backend and frontend. User story implementation can now begin.

---

## Phase 3: User Story 1 — Game Starts with Role and Word Assignment (Priority: P1) 🎯 MVP

**Goal**: When the host triggers game start, the backend assigns roles (host=drawer, rest=guessers), selects a word deterministically, initializes game state, and transitions the room to "game" status.

**Independent Test**: Host starts a game with 3 players in the room. Verify all 3 players transition to the game screen, the host is marked as drawer, the other 2 are marked as guessers, and a word is selected.

### Implementation for User Story 1

- [ ] T005 [P] [US1] Create pure `selectWord(wordList, roundNumber)` function in `backend/src/services/roomStore.ts` (returns `wordList[roundNumber % wordList.length]`)
- [ ] T006 [P] [US1] Import `STARTER_WORDS` and integrate `selectWord` call into `startGame()` in `backend/src/services/roomStore.ts` (round 0)
- [ ] T007 [US1] Add role assignment loop in `startGame()` in `backend/src/services/roomStore.ts` — set host participant.role = "drawer", all others = "guesser"
- [ ] T008 [US1] Add `room.currentWord`, `room.drawerId`, `room.currentRound = 0` assignment in `startGame()` in `backend/src/services/roomStore.ts`
- [ ] T009 [US1] Add edge case guard in `selectWord()` for empty word list (return empty string rather than crash) in `backend/src/services/roomStore.ts`

**Checkpoint**: At this point, `POST /:code/start` returns a room with status "game", participants with roles, currentRound=0, and currentWord selected. The game state is fully initialized on the backend.

---

## Phase 4: User Story 2 — Drawer Sees the Secret Word (Priority: P2)

**Goal**: The backend filters the secret word per viewer role, and the frontend GamePage renders accordingly — drawer sees the word, guessers do not.

**Independent Test**: Start a game with 4 players. The drawer sees the secret word on their screen. All 3 guessers do not see the word. Fetching the room snapshot without a participantId also omits the word.

### Implementation for User Story 2

- [ ] T010 [US2] Enhance `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to use `viewerParticipantId` parameter — find viewer's role from room participants; if drawer include `secretWord: room.currentWord`, otherwise omit it
- [ ] T011 [P] [US2] Update `GET /:code` route in `backend/src/api/rooms.ts` to pass `participantId` query param into `toRoomSnapshot(room, participantId)` (if not already being passed)
- [ ] T012 [P] [US2] Update `POST /:code/start` route response in `backend/src/api/rooms.ts` to include `participantId` in `toRoomSnapshot(result, participantId)` (if not already being passed)
- [ ] T013 [US2] Implement role-aware rendering in `frontend/src/pages/GamePage.tsx` — find viewer participant from `room.participants` by `participantId`; if `role === "drawer"` display `room.secretWord` in a prominent card; if `role === "guesser"` hide secret word and show GuessForm
- [ ] T014 [US2] Add conditionally hidden GuessForm in `frontend/src/pages/GamePage.tsx` — show for guessers (with prompt text), hide for drawer
- [ ] T015 [US2] Add round display using `room.currentRound` in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: At this point, the drawer sees the word on their game screen, guessers don't. The secret word is never sent to guessers over the wire.

---

## Phase 5: User Story 3 — Role Assignment Visibility (Priority: P3)

**Goal**: All players can see who the drawer is and who the guessers are during the game phase.

**Independent Test**: Start a game with 3 players. Each player's screen shows the same role assignments (host as drawer, others as guessers). The drawer sees themselves as drawer.

### Implementation for User Story 3

- [ ] T016 [US3] Add role badge next to each player name in the player list in `frontend/src/pages/GamePage.tsx` — show "(Drawer)" or "(Guesser)" label for each participant
- [ ] T017 [US3] Ensure the player info card in `frontend/src/pages/GamePage.tsx` displays the viewer's own role prominently at the top
- [ ] T018 [US3] Update lobby redirect guard in `frontend/src/pages/GamePage.tsx` — if room status returns to "lobby" during polling, redirect to `/lobby`

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T019 Run `cd backend && npm run build` and `cd frontend && npm run build` to verify TypeScript compiles cleanly across both projects
- [ ] T020 [P] Verify no tests are broken by running `cd backend && npx vitest run`
- [ ] T021 Run quickstart.md validation manually: host starts game with 2+ players, verify drawer sees word, guessers don't

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion (type definitions)
- **User Story 2 (Phase 4)**: Depends on Phase 3 completion (game state must be initialized to have a word to filter)
- **User Story 3 (Phase 5)**: Depends on Phase 2 completion only (roles are already assigned in Phase 3; GamePage just needs to display them)
- **Polish (Phase 6)**: Depends on all phases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) — MVP scope
- **User Story 2 (P2)**: Depends on US1 (needs game state to exist for word visibility)
- **User Story 3 (P3)**: Depends on Foundational only (role data already in Participant model) — can start in parallel with US1

### Within Each User Story

- Models before services
- Core implementation before rendering
- Backend endpoints before frontend consumption

### Parallel Opportunities

- **Phase 2**: T001, T002, T003, T004 can all run in parallel (different fields on different interfaces/files)
- **Phase 3**: T005 and T006 can run in parallel (T005 creates the function, T006 imports it)
- **Phase 4**: T011 and T012 can run in parallel (checking two routes)
- **Phase 3 & 5**: US1 (Phase 3) and US3 (Phase 5) can run in parallel since US3 only depends on the type definitions from Phase 2
- T019, T020 are independent build and test runs that can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all type definition updates in parallel:
T001: "Add role field to Participant in backend/src/models/game.ts"
T002: "Add game state fields to Room in backend/src/models/game.ts"
T003: "Add fields to RoomSnapshot in backend/src/models/game.ts"
T004: "Add fields to RoomSnapshot in frontend/src/services/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: POST /:code/start returns correct game state with roles and word
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Types defined
2. Add User Story 1 → Game state initialized on backend → Test independently (MVP!)
3. Add User Story 2 → Word visible to drawer only → Test independently
4. Add User Story 3 → Role badges on UI → Test independently

### Parallel Team Strategy

With multiple developers:

1. Developer A: Phase 2 (all type definitions)
2. Once Phase 2 done:
   - Developer A: User Story 1 (game start + word selection + role assignment)
   - Developer B: User Story 3 (role display on GamePage)
3. Developer A continues to User Story 2 (word visibility)
4. All stories integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
