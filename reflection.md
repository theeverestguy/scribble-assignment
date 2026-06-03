# Reflection Report: Scribble Assignment

## Overview

This report captures the architectural decisions, tradeoffs, and AI usage patterns across all four features built for the Scribble multiplayer drawing game. The project was implemented iteratively across four spec-based features, each extending the previous one:

| # | Feature | Focus |
|---|---------|-------|
| 001 | Room Setup & Lobby | Foundational multiplayer infrastructure: create/join rooms, player management, polling |
| 002 | Game Start & Drawer Flow | Transition lobby→game: role assignment, word selection, secret word visibility |
| 003 | Gameplay Interaction | Core drawing + guessing loop: canvas, strokes, guess submission, scoring, guess history |
| 004 | Results & Restart | Round completion, results display, host-only restart, state cleanup |

---

## Architecture & Key Decisions

### 1. Polling Over WebSockets (POL-1)

**Decision**: All state synchronization uses periodic HTTP polling at ~2s intervals. No WebSockets.

**Rationale**: Simplicity. A single `setInterval` calling `GET /:code` replaces the complexity of WebSocket connection management, reconnection logic, and broadcast channels. For a session-based prototype with 2-8 players, the 2-second latency is imperceptible.

**Tradeoff**: Higher bandwidth (every client polls every 2s) and potential thundering-herd on server restart. Acceptable for the scale.

### 2. In-Memory Storage With Mutation Pattern (MEM-1 / IMM-1)

**Decision**: All room state lives in `Map<string, Room>`. Mutations happen in-place on the Map reference, then output is `structuredClone()`d before returning.

**Rationale**: In-memory is zero-infrastructure. The mutation-then-clone pattern (as opposed to immutable state trees) keeps service functions simple: `const room = rooms.get(code)` → mutate → `rooms.set(code, room)` → `return cloneRoom(room)`.

**Tradeoff**: State is lost on server restart. The clone-on-output pattern means callers never hold live references to the canonical Room object. This is a pragmatic compromise between IMM-1's preference for purity and the ergonomics of in-place Map mutations.

### 3. Single Round, No Rotation

**Decision**: Each game session is exactly one round. The host is always the drawer. No drawer rotation or multiple rounds.

**Rationale**: Drastically simplifies the state machine (no round increment logic, no role cycling, no "next round" endpoint). The spec explicitly scopes this out.

**Tradeoff**: No replay variety — same drawer every time. Acceptable for a v1 prototype.

### 4. Stateless Client-Side Winner Calculation

**Decision**: Winner is computed in the frontend by sorting participants by `score` descending. The backend returns all data; the frontend derives the winner.

**Rationale**: The data is already in every snapshot. Computing a derived value on the client avoids adding a `winnerId` field, a `calculateWinner()` backend function, and keeping it in sync. Single-round makes this trivial (first correct guesser has 100, all others 0).

**Tradeoff**: If the scoring system becomes complex (e.g., time bonuses, partial points, multiple rounds), client-side calculation could drift from server authority. Fine for v1.

### 5. Host Identity Via Dual Tracking

**Decision**: Host is tracked via both `participant.isHost: boolean` AND `room.hostId: string`.

**Rationale**: `hostId` enables O(1) host checks in service functions without iterating participants. `isHost` is used in the frontend for UI rendering without needing to cross-reference the room object.

**Tradeoff**: Duplicated data that must be kept in sync. The host never changes, so there's no sync cost.

### 6. Role Assignment: Host Always Drawer

**Decision**: On game start, `host.role = "drawer"` and all others get `"guesser"`. No randomization.

**Rationale**: Simplicity. No need for a role-assignment algorithm or fairness logic. The host is the room creator who has the most context.

**Tradeoff**: The host always draws, guessers always guess. Predictable but not particularly fun. Explicitly scoped as "rotation out of scope."

### 7. Auto Round End on Correct Guess

**Decision**: The round ends automatically when `submitGuess()` detects `isCorrect === true`. No timer, no manual trigger.

**Rationale**: The simplest possible trigger — no additional API calls, no background timers, no "end round" button. The status transition is a single line change inside the existing `submitGuess()` function.

**Tradeoff**: If no one ever guesses correctly, the round continues indefinitely. A future feature would need a manual end-round button or a timer. Documented as an edge case in the spec.

### 8. Zero Test Tasks

**Decision**: No test tasks were created for the 004 feature. Existing test suites were verified to still pass (no regressions), but no new tests were written.

**Rationale**: The spec explicitly stated tests were not requested. The implementation followed the existing patterns exactly — adding tests for `restartGame()`, `restartSchema`, and `ResultsView` would have been beneficial but was out of scope.

**Tradeoff**: No regression coverage for the new functionality. Manual validation is required to verify the restart endpoint and results view work correctly.

---

## AI Usage Methodology

This entire project was built using AI assistance via the `opencode` tool (powered by the `big-pickle` model). The workflow followed a structured spec-driven development pattern:

### Phase 1: Specification (`/speckit.specify`)
- Natural language feature descriptions were converted to structured specs with FR numbering, edge cases, and user stories
- Clarification loops (`/speckit.clarify`) resolved ambiguities before coding
- Each spec was validated against a quality checklist (16 items)

### Phase 2: Planning (`/speckit.plan`)
- Technical designs were generated from specs, including data models, API contracts, and implementation order
- Constitution alignment checks verified every plan element against project principles
- Research docs captured alternative approaches and rejected options

### Phase 3: Task Generation (`/speckit.tasks`)
- Tasks were decomposed into atomic, dependency-ordered units with acceptance criteria
- Parallel markers [P] identified independent tasks
- Phases grouped tasks for incremental delivery (MVP first)

### Phase 4: Implementation (`/speckit.implement`)
- Tasks were executed in dependency order
- Parallel tasks were batched for efficiency
- Build verification (`npm run build`) and test verification (`npx vitest run`) ran after every change
- Tasks.md was updated in real-time to track progress ([ ] → [X])

### Phase 5: Analysis (`/speckit.analyze`)
- Cross-artifact consistency checks identified spec/plan/task misalignments
- Coverage mapping verified every requirement had at least one task
- Constitution compliance was re-verified on the final output

### Key AI Usage Observations

1. **Spec-first approach prevented rework**: Spending time on specifications before coding caught ambiguities early (e.g., "should restart preserve hostId?" clarified before implementation)

2. **AC-driven tasks kept scope bounded**: Each task had explicit acceptance criteria that made it clear when a task was truly done

3. **Constitution enforcement caught violations**: The project constitution provided a hard boundary that prevented architectural drift

4. **Incremental delivery kept each PR manageable**: The 4-feature split meant each PR touched at most 7 files

---

## Tradeoffs Summary

| Decision | Chosen Approach | Alternatives Considered | Why Chosen |
|----------|----------------|------------------------|------------|
| Sync mechanism | HTTP polling (2s) | WebSockets | Simplicity, no connection management |
| Storage | In-memory `Map` | SQLite, PostgreSQL | Zero infrastructure, session-based |
| Round trigger | Auto on correct guess | Timer, manual button | Simplest implementation |
| Winner calc | Client-side sort | Backend `winnerId` field | Data already in snapshot, trivial calc |
| Restart auth | Host-only | Any player, majority vote | Consistent with start game pattern |
| Role assignment | Host=drawer | Random assignment | Simplest, rotation scoped out |
| State mutation | In-place + clone | Immutable state tree | Matches existing pattern, simple ergonomics |
| Type sharing | Manual mirror | Shared package | No build tooling needed for monorepo |
| Testing | Existing tests only | New unit tests | Not requested, acceptable for prototype |

---

## What Worked Well

1. **Spec-driven development**: The clear separation of spec → plan → tasks → implementation made each phase independently verifiable. Errors were caught before code was written.

2. **Incremental build order**: Starting with lobby infrastructure, then game start, then gameplay, then results created a natural dependency chain where each feature could be independently tested.

3. **Constitution enforcement**: Having explicit principles (TS-1, IMM-1, MEM-1, POL-1, VAL-1) made it easy to reject bad patterns during code review.

4. **Parallel task execution**: Marking independent tasks with [P] allowed efficient batching (e.g., T001 + T002 in parallel, T003 + T004 in parallel).

5. **Existing guard re-use**: The `room.status !== "game"` guard in `appendStroke()`, `clearCanvas()`, and `submitGuess()` automatically rejected actions in "results" state without any code change — a design win from 003.

## What Could Be Improved

1. **No new tests**: The 004 feature introduced a new endpoint (`POST /:code/restart`) and a new component (`ResultsView.tsx`) without corresponding test coverage. Adding at minimum an integration test for the restart flow would improve confidence.

2. **No timer**: The lack of a round timer means if no one guesses correctly, the game is stuck indefinitely. A future feature should add a countdown or manual "end round" button.

3. **`currentRound: 0` vs `undefined` inconsistency**: The spec clarification says `currentRound = 0` on restart, but the implementation and data-model use `undefined`. This cosmetic inconsistency should be reconciled.

4. **No drawer rotation**: The game has no replay variety since the host always draws. Adding rotation would improve the experience but was deliberately scoped out.

5. **Canvas is basic**: The drawing implementation uses a single black pen with 2px width. No color picker, eraser, or stroke width variation. Fine for v1 but limited.

## Future Considerations

- **Timer**: Add a countdown for each round so the game always reaches the results state
- **Manual end-round**: Allow the drawer or host to end the round early if no one can guess
- **Multiple rounds**: Cycle through drawers with a `currentRound` increment
- **Persistent rooms**: Store room state to survive server restarts (contradicts MEM-1 but enables longer sessions)
- **Mobile support**: The canvas uses mouse events only — touch events needed for mobile play
- **Spectator mode**: Allow joining without a role just to watch
- **Custom words**: Let the host choose from categories or type a custom word
- **Scoring variety**: Time bonuses, streak bonuses, or partial credit for close guesses
