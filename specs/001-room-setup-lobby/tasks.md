# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Tests**: Included for backend service and schema logic. Frontend unit test included for polling (US4). Manual end-to-end verification in Phase 7.

**Organization**: Tasks grouped by user story. Each phase is an independently testable increment.

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Parallelizable — different files, no dependency on an incomplete sibling task
- **[Story]**: User story this task belongs to (US1–US5)
- Each task includes **Acceptance Criteria** as sub-bullets

---

## Phase 1: Foundational — Data Model & Type Updates

**Purpose**: Update the shared data types that all user stories depend on. No story implementation can begin until T001 is complete.

**⚠️ CRITICAL**: T001 must be complete before any Phase 2–6 backend work begins. T002 can run in parallel with T001 (different directory).

- [x] T001 Update type definitions — `backend/src/models/game.ts`
  - Add `isHost: boolean` to `Participant` interface
  - Add `hostId: string` to `Room` interface
  - Add `"game"` to `RoomStatus` union type (`"lobby" | "game"`)
  - Add `hostId: string` to `RoomSnapshot` interface
  - **AC**: TypeScript compiles with no errors after changes. All four interfaces reflect the additions above. `RoomStatus` accepts `"game"` as a valid value.

- [x] T002 [P] Mirror type changes in frontend API client — `frontend/src/services/api.ts`
  - Add `isHost: boolean` to `Participant` interface
  - Add `hostId: string` to `RoomSnapshot` interface
  - Update `RoomSnapshot.status` from `"lobby"` literal to `RoomStatus = "lobby" | "game"` union
  - **AC**: Frontend TypeScript compiles with no errors. `RoomSnapshot.status` accepts `"game"`. `Participant.isHost` is typed as `boolean`. `RoomSnapshot.hostId` is typed as `string`.

**Checkpoint**: Data model updated — all story implementation can now begin.

---

## Phase 2: User Story 1 — Host Designated on Room Creation (Priority: P1) 🎯 MVP

**Goal**: The room creator is automatically marked as host, the designation persists for the room's lifetime, and the lobby shows which player is the host.

**Independent Test**: Create a room, open the lobby — the creating player is labelled "(Host)" in the player list. Join with a second player — the label stays on the creator. Confirm via `GET /rooms/:code` that the snapshot includes `hostId` and that the creator's participant has `isHost: true`.

**Depends on**: T001, T002

- [x] T003 Assign host on room creation and joining — `backend/src/services/roomStore.ts`
  - In `createRoom`: set `isHost: true` on the creator's `Participant`; set `room.hostId = participant.id`
  - In `joinRoom`: set `isHost: false` on every joining participant
  - Remove the silent `displayName` fallback (the `|| "Player"` default) — validation will guard empty names from Phase 3 onwards; for now keep existing behaviour for `createRoom` and update only the host assignment
  - **AC**: `createRoom("Alice")` returns `result.room.hostId === result.participantId` and `result.room.participants[0].isHost === true`. `joinRoom(code, "Bob")` returns `result.room.participants[1].isHost === false`.

- [x] T004 Include `hostId` in room snapshot — `backend/src/services/roomStore.ts`
  - In `toRoomSnapshot`: add `hostId: room.hostId` to the returned object
  - **AC**: `GET /rooms/:code` response body contains `"hostId": "<uuid>"`. Each participant in the response includes `"isHost": true/false`. Exactly one participant has `isHost: true`.

- [x] T005 [P] Add backend unit tests for host assignment — `backend/src/services/roomStore.test.ts`
  - Test: `createRoom` returns `participantId` that equals `room.hostId`
  - Test: `createRoom` sets `isHost: true` on the first participant
  - Test: `joinRoom` on an existing room returns a participant with `isHost: false`
  - Test: `toRoomSnapshot` includes `hostId` field
  - **AC**: All new tests pass with `npm test` in `backend/`. No existing tests regress.

- [x] T006 [US1] Render host badge in lobby player list — `frontend/src/pages/LobbyPage.tsx`
  - In the participant list `<li>`, add a `(Host)` label (or equivalent visual) next to the participant whose `isHost === true`
  - For the current viewer, additionally show `(You)` to disambiguate their own entry — derive from `participantId === room.hostId`
  - **AC**: Opening the lobby shows the creator's name with a visible "(Host)" indicator. Other players' entries do not show the indicator. When a second player joins and views the lobby, the creator still shows as host.

**Checkpoint**: User Story 1 complete — host designation is visible in the lobby.

---

## Phase 3: User Story 2 — Validated Room Joining (Priority: P2)

**Goal**: Empty names, whitespace-only names, malformed room codes, non-existent rooms, and duplicate names are all rejected with clear, specific error messages.

**Independent Test**: Attempt each invalid input variant (empty name, spaces-only name, empty code, lowercase code, special-char code, non-existent code, duplicate name) — each must return an error without navigating to the lobby. Valid inputs must still work.

**Depends on**: T001 (schemas share Participant type structure)

- [x] T007 [US2] Enforce strict player name validation in Zod schemas — `backend/src/api/schemas.ts`
  - Update `createRoomSchema.playerName`: `z.string().trim().min(1, "Player name is required")` (no longer optional)
  - Update `joinRoomSchema.playerName`: same rule as above
  - **AC**: `createRoomSchema.parse({ playerName: "" })` throws. `createRoomSchema.parse({ playerName: "   " })` throws (after trim, length is 0). `createRoomSchema.parse({ playerName: "Alice" })` succeeds. `POST /rooms` with `{}` body returns HTTP 400.

- [x] T008 [P] [US2] Enforce room code format in Zod schema — `backend/src/api/schemas.ts`
  - Update `roomCodeParamsSchema.code`: `z.string().regex(/^[A-Z0-9]{4,6}$/, "Invalid room code format")`
  - **AC**: `roomCodeParamsSchema.parse({ code: "abcd" })` throws (lowercase). `roomCodeParamsSchema.parse({ code: "AB!1" })` throws (special character). `roomCodeParamsSchema.parse({ code: "ABCD" })` succeeds. `POST /rooms/abcd/join` returns HTTP 400 before any room lookup.

- [x] T009 [US2] Add duplicate name check in `joinRoom` — `backend/src/services/roomStore.ts`
  - Before inserting the new participant, check if any existing participant in the room has the same name (case-sensitive exact match)
  - If duplicate found, return `{ error: "name-taken" }` instead of adding the participant
  - **AC**: `joinRoom(code, "Alice")` after "Alice" is already in the room returns `{ error: "name-taken" }`. `joinRoom(code, "alice")` (different case) succeeds (case-sensitive).

- [x] T010 [US2] Map service errors to correct HTTP responses — `backend/src/api/rooms.ts`
  - In `POST /:code/join` handler: check result for `{ error: "name-taken" }` and throw `new HttpError(400, "That name is already taken in this room")`
  - Ensure `null` result from `joinRoom` still returns 404 "Unable to join room"
  - **AC**: Joining with a duplicate name returns HTTP 400 with `{ "message": "That name is already taken in this room" }`. Joining with a non-existent code returns HTTP 404. Joining with a malformed code returns HTTP 400 from Zod before reaching `joinRoom`.

- [x] T011 [P] [US2] Add backend schema unit tests — `backend/src/api/schemas.test.ts`
  - Test: `createRoomSchema` rejects empty string
  - Test: `createRoomSchema` rejects whitespace-only string
  - Test: `roomCodeParamsSchema` rejects lowercase code
  - Test: `roomCodeParamsSchema` rejects code with special characters
  - Test: `roomCodeParamsSchema` rejects code shorter than 4 characters
  - Test: `roomCodeParamsSchema` accepts valid 4-char uppercase alphanumeric code
  - **AC**: All new tests pass. No existing tests regress.

- [x] T012 [P] [US2] Add client-side name validation to create room form — `frontend/src/pages/CreateRoomPage.tsx`
  - Before calling `roomStore.createRoom`, trim the `playerName` value and reject if empty
  - Show inline error: "Player name is required"
  - **AC**: Submitting the form with an empty field shows the error without making a network request. Submitting with only spaces shows the same error. Submitting with a valid name proceeds normally.

- [x] T013 [US2] Add client-side validation to join room form — `frontend/src/pages/JoinRoomPage.tsx`
  - Before calling `roomStore.joinRoom`, validate: (a) trimmed name is non-empty; (b) room code matches `/^[A-Z0-9]{4,6}$/`
  - Show field-specific inline errors: "Player name is required" / "Invalid room code format"
  - **AC**: Submitting with empty name shows name error, not code error. Submitting with valid name but lowercase code (e.g., "abcd") shows the code format error before any network request. Submitting both invalid fields shows the first failing validation error. Submitting valid inputs proceeds to the lobby.

**Checkpoint**: User Story 2 complete — all invalid join attempts are blocked with descriptive errors.

---

## Phase 4: User Story 3 — Host-Controlled Game Start (Priority: P3)

**Goal**: Only the host can start the game, only when at least 2 players are present. All clients transition to the game page within the polling interval.

**Independent Test**: In one tab (host), verify the Start Game button is disabled with 1 player and enabled with 2. In a second tab (non-host), verify no Start Game button is shown. Host clicks Start Game — both tabs navigate to `/game` within 2 seconds.

**Depends on**: US1 complete (hostId available in state), T001 (RoomStatus has "game")

- [x] T014 [US3] Add `startGameSchema` — `backend/src/api/schemas.ts`
  - Add `export const startGameSchema = z.object({ participantId: z.string().uuid() })`
  - **AC**: `startGameSchema.parse({ participantId: "not-a-uuid" })` throws. `startGameSchema.parse({ participantId: "<valid-uuid>" })` succeeds.

- [x] T015 [US3] Implement `startGame` service function — `backend/src/services/roomStore.ts`
  - Add `export function startGame(code: string, participantId: string)` returning `Room | { error: "not-found" | "not-host" | "not-enough-players" }`
  - Logic: get room (null → `"not-found"`), check `participantId === room.hostId` (false → `"not-host"`), check `room.participants.length >= 2` (false → `"not-enough-players"`), set `room.status = "game"`, call `saveRoom`, return updated room
  - **AC**: Calling `startGame` with valid host and 2 players returns a room with `status: "game"`. Calling with a non-host participant ID returns `{ error: "not-host" }`. Calling with only 1 participant returns `{ error: "not-enough-players" }`. Calling with an unknown code returns `{ error: "not-found" }`.

- [x] T016 [US3] Add `POST /:code/start` route — `backend/src/api/rooms.ts`
  - Parse `roomCodeParamsSchema` (URL param) and `startGameSchema` (body)
  - Call `startGame(code, participantId)`; map errors: `"not-found"` → 404, `"not-host"` → 403, `"not-enough-players"` → 400
  - On success, return 200 with `{ room: toRoomSnapshot(room, participantId) }`
  - **AC**: `POST /rooms/ABCD/start` with the host's `participantId` and 2 players returns 200 with `room.status === "game"`. Non-host participantId returns 403. Single player returns 400. Unknown code returns 404.

- [x] T017 [P] [US3] Add backend unit tests for `startGame` — `backend/src/services/roomStore.test.ts`
  - Test: `startGame` with host + 2 players returns room with `status: "game"`
  - Test: `startGame` with non-host participantId returns `{ error: "not-host" }`
  - Test: `startGame` with only 1 player returns `{ error: "not-enough-players" }`
  - Test: `startGame` with unknown room code returns `{ error: "not-found" }`
  - **AC**: All four tests pass. No existing tests regress.

- [x] T018 [P] [US3] Add `startGame` API method — `frontend/src/services/api.ts`
  - Add `startGame(code: string, participantId: string): Promise<{ room: RoomSnapshot }>` — `POST /rooms/:code/start` with `{ participantId }` body
  - **AC**: Method exists and is typed correctly. Existing api tests still pass.

- [x] T019 [US3] Add `startGame` action to `RoomStore` — `frontend/src/state/roomStore.ts`
  - Add `async startGame()` method: reads `this.state.room.code` and `this.state.participantId`; calls `api.startGame(code, participantId)` inside `withLoading`; calls `setRoomSnapshot` with the returned room
  - **AC**: Calling `store.startGame()` when host with ≥2 players updates `store.getSnapshot().room.status` to `"game"`. Calling when not host rejects with the server error message surfaced to `store.error`.

- [x] T020 [US3] Render conditional Start Game button — `frontend/src/pages/LobbyPage.tsx`
  - Replace the always-enabled Start Game button with logic:
    - If current player is NOT host (`participantId !== room.hostId`): render no Start Game button
    - If host but fewer than 2 participants: render disabled button with tooltip/caption "Waiting for more players"
    - If host and ≥2 participants: render enabled button that calls `roomStore.startGame()`
  - **AC**: Non-host player sees no Start Game button. Host with 1 player sees a disabled button. Host with 2 players sees an enabled button. Clicking the enabled button calls the backend (observable via network tab or mock).

- [x] T021 [US3] Navigate to `/game` when room status changes to `"game"` — `frontend/src/pages/LobbyPage.tsx`
  - Add/update the existing `useEffect` that watches `room` to also check `room.status === "game"` and call `navigate("/game", { replace: true })` when true
  - **AC**: When the host starts the game, `LobbyPage` for the host immediately navigates to `/game`. Within the next poll cycle (~2s), non-host clients whose lobby is open also navigate to `/game` automatically.

**Checkpoint**: User Story 3 complete — host can start the game; all clients transition.

---

## Phase 5: User Story 4 — Automatic Lobby Refresh (Priority: P4)

**Goal**: The lobby polls `GET /rooms/:code` every 2 seconds automatically; no manual refresh button required.

**Independent Test**: Open two tabs in the same room. In Tab 2, join a second player. Without any manual action in Tab 1, the player list in Tab 1 updates within ~2 seconds.

**Depends on**: T002 (frontend types), `roomStore.fetchRoom` (already exists)

- [x] T022 [US4] Add 2-second polling interval to `RoomStoreProvider` — `frontend/src/state/roomStore.ts`
  - In the `RoomStoreProvider` `useEffect`, add `setInterval(() => { store.fetchRoom().catch(() => {}) }, 2000)`
  - Only start the interval when `store.getSnapshot().room !== null`
  - Return a cleanup function that calls `clearInterval` on unmount
  - **AC**: While the lobby is open, `GET /rooms/:code` is called approximately every 2 seconds (observable in browser DevTools Network tab). When the page unmounts (navigate away), the interval is cleared and no further requests are made.

- [x] T023 [US4] Remove manual refresh button from lobby — `frontend/src/pages/LobbyPage.tsx`
  - Remove `handleRefresh` function, `refreshError` state, and the "Refresh Room" `<button>`
  - Update the Status card text to reflect automatic polling: e.g., "Syncing..." when `isLoading` is true, "Live" otherwise
  - **AC**: The lobby UI no longer contains a "Refresh Room" button. The status card updates between "Syncing..." and "Live" as polling ticks. No console errors appear during normal polling.

- [x] T024 [P] [US4] Add unit test for polling setup — `frontend/src/state/roomStore.test.ts` (create if not exists)
  - Use Vitest fake timers (`vi.useFakeTimers()`)
  - Test: after a room is set in the store and 2000ms elapses, `fetchRoom` (mocked) has been called at least once
  - Test: after the provider unmounts, advancing the timer does NOT trigger additional `fetchRoom` calls
  - **AC**: Both tests pass with `npm test` in `frontend/`. No existing tests regress.

**Checkpoint**: User Story 4 complete — lobby refreshes automatically every ~2 seconds.

---

## Phase 6: User Story 5 — Room Isolation & Cleanup (Priority: P5)

**Goal**: State changes in one room do not affect other rooms. Rooms are removed from memory when all players have left.

**Independent Test**: Create two rooms. In Room A, start the game. Confirm Room B's state is unchanged via `GET /rooms/:code-b`. Then have all players in Room A leave — confirm `GET /rooms/:code-a` returns 404.

**Depends on**: T001 (Room type)

- [x] T025 [US5] Implement `leaveRoom` service function — `backend/src/services/roomStore.ts`
  - Add `export function leaveRoom(code: string, participantId: string): "left" | "room-removed" | "not-found"`
  - Logic: get room (null → `"not-found"`), filter out the participant, if room now empty delete from Map and return `"room-removed"`, else save and return `"left"`
  - **AC**: `leaveRoom(code, id)` removes the participant from the room. If the room had 1 participant, the room is deleted from the Map and subsequent `getRoom(code)` returns `null`. If the room had 2 participants, the room persists with 1 participant.

- [x] T026 [US5] Add `DELETE /:code/players/:participantId` route — `backend/src/api/rooms.ts`
  - Parse `roomCodeParamsSchema` for code; parse `participantId` from URL params as non-empty string
  - Call `leaveRoom(code, participantId)`; map `"not-found"` → 404; return 204 No Content on success
  - **AC**: `DELETE /rooms/ABCD/players/<id>` returns 204 when the participant exists. `DELETE /rooms/ABCD/players/<id>` returns 404 when the room does not exist. After all players leave, `GET /rooms/ABCD` returns 404.

- [x] T027 [P] [US5] Add backend unit tests for `leaveRoom` and room isolation — `backend/src/services/roomStore.test.ts`
  - Test: `leaveRoom` with the last participant deletes the room (`getRoom` returns null)
  - Test: `leaveRoom` with one of multiple participants removes only that participant
  - Test: `leaveRoom` with an unknown room code returns `"not-found"`
  - Test: modifying Room A (via `startGame`) does not change Room B's status
  - **AC**: All four tests pass. No existing tests regress.

- [x] T028 [P] [US5] Add `leaveRoom` API method — `frontend/src/services/api.ts`
  - Add `leaveRoom(code: string, participantId: string): Promise<void>` — `DELETE /rooms/:code/players/:participantId`
  - **AC**: Method exists and is typed correctly. Errors are silently swallowed (best-effort cleanup — use `.catch(() => {})` at the call site).

- [x] T029 [US5] Register `beforeunload` cleanup handler — `frontend/src/state/roomStore.ts`
  - In `RoomStoreProvider` `useEffect`, add `window.addEventListener("beforeunload", handleUnload)` where `handleUnload` calls `api.leaveRoom` with current room code and participantId if room is active
  - Use `navigator.sendBeacon` or synchronous fetch as fallback for `beforeunload` reliability
  - Remove the event listener on cleanup
  - **AC**: Navigating away from the lobby or closing the tab triggers a `DELETE /rooms/:code/players/:id` request (observable in DevTools). The room is eventually removed from memory when all players have left.

**Checkpoint**: User Story 5 complete — rooms are isolated and cleaned up when empty.

---

## Phase 7: Polish & Build Validation

**Purpose**: Final type-check, build, and end-to-end verification.

- [ ] T030 [P] Run full build validation in both workspaces
  - `cd backend && npm run build` — must succeed with zero TypeScript errors
  - `cd frontend && npm run build` — must succeed with zero TypeScript errors
  - **AC**: Both build commands exit with code 0. No `any` usages introduced. No suppressed type errors.

- [ ] T031 Manual end-to-end verification per `specs/001-room-setup-lobby/quickstart.md`
  - Follow the 7-step verification checklist in quickstart.md
  - Verify: host badge visible, Start Game disabled with 1 player, lobby auto-updates when second player joins, non-host cannot start, game starts for all clients within polling interval
  - **AC**: All 7 quickstart verification steps pass in a live browser session with two tabs.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Foundational)
  ├── T001 backend types
  └── T002 [P] frontend types

Phase 2 (US1) ← requires T001, T002
  ├── T003 host assignment (backend)
  ├── T004 snapshot (backend) ← requires T003
  ├── T005 [P] backend tests
  └── T006 lobby host badge (frontend) ← requires T002

Phase 3 (US2) ← requires T001
  ├── T007 name schema
  ├── T008 [P] code schema
  ├── T009 duplicate name check (backend) ← requires T007
  ├── T010 error mapping in route ← requires T009
  ├── T011 [P] schema tests
  ├── T012 [P] CreateRoomPage validation (frontend)
  └── T013 JoinRoomPage validation (frontend)

Phase 4 (US3) ← requires US1 complete, T001
  ├── T014 startGameSchema
  ├── T015 startGame service ← requires T014
  ├── T016 start route ← requires T015
  ├── T017 [P] startGame tests
  ├── T018 [P] api.startGame (frontend)
  ├── T019 store.startGame ← requires T018
  ├── T020 conditional button ← requires T019
  └── T021 game redirect ← requires T020

Phase 5 (US4) ← requires T002 and existing fetchRoom
  ├── T022 polling interval
  ├── T023 remove manual refresh button ← requires T022
  └── T024 [P] polling unit test

Phase 6 (US5) ← requires T001
  ├── T025 leaveRoom service
  ├── T026 DELETE route ← requires T025
  ├── T027 [P] isolation + leaveRoom tests
  ├── T028 [P] api.leaveRoom (frontend)
  └── T029 beforeunload handler ← requires T028

Phase 7 (Polish) ← requires all phases complete
  ├── T030 [P] build validation
  └── T031 manual E2E verification
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|-----------|-------------------|
| US1 (P1) | Phase 1 complete | US2, US3, US5 (backend) |
| US2 (P2) | T001 only | US1, US3, US5 (backend) |
| US3 (P3) | US1 complete | US2, US5 (backend) |
| US4 (P4) | T002 only | US1, US2, US3, US5 (frontend) |
| US5 (P5) | T001 only | US1, US2, US3, US4 |

---

## Parallel Example: US2 (Validated Room Joining)

```text
After T001 completes, launch all of these simultaneously:

  T007  name schema (backend/src/api/schemas.ts)
  T008  code schema (backend/src/api/schemas.ts)  ← same file as T007; sequence within file
  T011  schema tests (backend/src/api/schemas.test.ts)  ← write alongside T007/T008
  T012  CreateRoomPage validation (frontend/src/pages/CreateRoomPage.tsx)
  T013  JoinRoomPage validation (frontend/src/pages/JoinRoomPage.tsx)

  Then once T007/T008 done:
    T009  duplicate name check (backend/src/services/roomStore.ts)
    → T010  error mapping (backend/src/api/rooms.ts)
```

## Parallel Example: US3 (Host-Controlled Game Start)

```text
After US1 complete and T001 done:

  T014  startGameSchema (schemas.ts)
  T018  api.startGame (frontend/src/services/api.ts)  ← independent of backend

  After T014:
    T015  startGame service (roomStore.ts)
    T017  startGame tests (roomStore.test.ts)  ← parallel with T015

  After T015:
    T016  POST /:code/start route (rooms.ts)

  After T018:
    T019  store.startGame (state/roomStore.ts)
    → T020  conditional button (LobbyPage.tsx)
    → T021  game redirect (LobbyPage.tsx)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1**: Update data model types (T001, T002)
2. Complete **Phase 2** (US1): Host assignment + lobby badge (T003–T006)
3. **STOP and VALIDATE**: Host is visible in the lobby — confirm with a live browser session
4. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 → Foundation ready
2. Phase 2 (US1) → Host designation visible ✅ Demo
3. Phase 3 (US2) → All invalid inputs blocked ✅ Demo
4. Phase 4 (US3) → Game can be started by host ✅ Demo
5. Phase 5 (US4) → Lobby auto-refreshes ✅ Demo
6. Phase 6 (US5) → Rooms clean up on empty ✅ Demo
7. Phase 7 → Build validated, E2E verified ✅ Ship

### Single Developer Execution Order

T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 → T017 → T018 → T019 → T020 → T021 → T022 → T023 → T024 → T025 → T026 → T027 → T028 → T029 → T030 → T031

---

## Notes

- `[P]` tasks touch different files from their siblings and can be handed to parallel agents
- Each user story phase is a complete, deployable increment — stop at any checkpoint to validate
- Backend tests are colocated (`*.test.ts`) and run with `npm test` in the `backend/` directory
- Frontend tests are colocated and run with `npm test` in the `frontend/` directory
- Build validation (T030) must pass before the branch is considered complete
- `any` usage is strictly forbidden per TS-1 — if TypeScript inference fails, use `unknown` and narrow
