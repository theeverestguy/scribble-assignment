# Research: Game Start & Drawer Flow

**Phase**: 0 — Outline & Research
**Date**: 2026-06-03
**Plan**: [plan.md](./plan.md)

## Overview

All technical decisions are resolved by the feature spec and existing codebase. No NEEDS CLARIFICATION items exist.

## Decisions

### 1. Word List Source

- **Decision**: Use existing `STARTER_WORDS` in `backend/src/seed/starterData.ts`
- **Rationale**: Already present with 5 words. The spec says "provided word list" — this is it. Avoids creating a new data source.
- **Alternatives considered**: External word list file, API-based word service. All rejected for violating the no-database / keep-it-simple constraint.

### 2. Role Assignment Strategy

- **Decision**: Host becomes drawer; all others become guessers. Role set at game start.
- **Rationale**: Matches spec exactly (FR-002, FR-003). Simplest possible assignment — no rotation logic needed since "role reassignment in subsequent rounds" is out of scope.
- **Alternatives considered**: Random drawer selection. Rejected because spec explicitly says host becomes drawer.

### 3. Word Selection Strategy

- **Decision**: Deterministic index: `wordList[roundNumber % wordList.length]`
- **Rationale**: 
  - `roundNumber = 0` for first round → selects `wordList[0]` ("rocket")
  - Identical room configs produce identical word (SC-003)
  - Pure function satisfies IMM-1 (immutability)
- **Alternatives considered**: 
  - Seeded PRNG based on room code — adds unnecessary complexity
  - Random selection — violates determinism requirement

### 4. Role Storage

- **Decision**: Add `role: ParticipantRole` field to `Participant` interface
- **Rationale**: Each participant has exactly one role per game. Storing it on the participant is the simplest data model — no separate role map or lookup table needed. The role is assigned once when game starts.

### 5. Visibility Enforcement

- **Decision**: `toRoomSnapshot(room, viewerParticipantId)` conditionally includes `secretWord`
- **Rationale**: 
  - The function already accepts `viewerParticipantId` but currently ignores it — this activates it
  - Security: word never leaves the server for guessers
  - Frontend: no trust boundary needed for secret word hiding
- **Alternatives considered**: Frontend-only hiding — rejected because guessers could inspect network responses

### 6. Game State Storage

- **Decision**: Add `currentWord`, `drawerId`, and `currentRound` fields directly to `Room` interface
- **Rationale**: Room is the only aggregate entity. A separate `GameState` object would add indirection without benefit for the current scope. Can be extracted in future if the game becomes complex.
- **Alternatives considered**: Separate `GameSession` class. Rejected as premature — room-level fields suffice for single-round game.
