# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-flow`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Feature: Game Start & Drawer Flow — Start Game flow, Drawer assignment (host becomes drawer), Deterministic word selection (provided word list), Role assignment (one drawer, everyone else guesser), Drawer-only secret word visibility"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Game Starts with Role and Word Assignment (Priority: P1)

When the host triggers game start from the lobby, all players transition to the game phase. The host is assigned as drawer, all other players are assigned as guessers, and a secret word is selected deterministically for the drawer.

**Why this priority**: This is the core transition point — without it, no gameplay can begin. Everything depends on correct role assignment and word visibility.

**Independent Test**: Host starts a game with 3 players in the room. Verify all 3 players transition to the game screen, the host is marked as drawer, the other 2 are marked as guessers, and a word is selected and displayed to the drawer only.

**Acceptance Scenarios**:

1. **Given** a host has started the game with at least one other player in the room, **When** the game phase loads for all players, **Then** each player's screen shows the game phase with their assigned role (drawer or guesser) clearly indicated.
2. **Given** the host starts the game, **When** the game begins, **Then** exactly one player is designated as drawer (the host) and all remaining players are designated as guessers.
3. **Given** the game starts, **When** the drawer's game screen is displayed, **Then** the secret word is visible on the drawer's screen.
4. **Given** the game starts, **When** a guesser's game screen is displayed, **Then** the secret word is NOT visible on the guesser's screen.

---

### User Story 2 - Drawer Sees the Secret Word (Priority: P2)

The player assigned as drawer can see the selected secret word on their game screen. No other player sees it. The word is chosen deterministically from the provided word list.

**Why this priority**: The drawer must know the word to convey it. Deterministic selection ensures reproducibility and testability.

**Independent Test**: Start two games with identical room configurations and verify both select the same word.

**Acceptance Scenarios**:

1. **Given** a game has started and the host is drawer, **When** the drawer views their game screen, **Then** the secret word is displayed prominently on the screen.
2. **Given** a game has started with 4 players, **When** the 3 guessers view their respective game screens, **Then** the secret word is absent from their displays.
3. **Given** two rooms are created with the same settings and host starts the game in both, **When** both games begin, **Then** the same word is selected for both games.

---

### User Story 3 - Role Assignment Visibility (Priority: P3)

All players can see who the drawer is and who the guessers are during the game phase. This shared context helps everyone understand their current role relative to others.

**Why this priority**: Players need to know who is drawing and who is guessing to coordinate. Without this visibility, confusion about roles would occur.

**Independent Test**: Start a game with 3 players and verify each player's screen shows the same role assignments (host as drawer, others as guessers).

**Acceptance Scenarios**:

1. **Given** a game has started with multiple players, **When** any player views the game screen, **Then** the list of all players with their designated roles (drawer or guesser) is displayed.
2. **Given** a game has started, **When** the drawer views the player list, **Then** the drawer sees themselves marked as drawer and all others as guessers.
3. **Given** a game has started, **When** a guesser views the player list, **Then** the guesser sees the host marked as drawer and themselves (and other guessers) marked as guessers.

---

### Edge Cases

- What happens when the host starts the game with only one player (themselves) in the room? (Per the lobby spec, this should be blocked — but if it occurs, the drawer would have no guessers.)
- What happens when the word list contains fewer words than the number of rounds expected?
- What happens when a new player joins the room after the game has already started? (Relevant to room isolation — they should not enter an in-progress game.)
- What happens during the brief window between the host triggering game start and all players receiving the updated state via polling?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST transition all players in the room from lobby phase to game phase when the host triggers game start.
- **FR-002**: System MUST assign the host as the drawer when the game phase begins.
- **FR-003**: System MUST assign all non-host players as guessers when the game phase begins.
- **FR-004**: System MUST select a word from the provided word list deterministically when the game starts, using a repeatable method (e.g., round number modulo word list size).
- **FR-005**: System MUST display the selected secret word to the drawer on their game screen.
- **FR-006**: System MUST NOT reveal the secret word to any guesser on their game screen.
- **FR-007**: System MUST display each player's role (drawer or guesser) to all players in the room during the game phase.

### Key Entities

- **GameSession**: Represents the active game state for a room after the lobby phase ends. Contains the current round number, selected word, and assigned roles.
- **PlayerRole**: A classification (drawer or guesser) assigned to each player at the start of a game. Exactly one drawer per game; all other players are guessers.
- **SecretWord**: The word selected for the current round, visible only to the drawer. Selected deterministically from the word list.
- **WordList**: A pre-defined collection of words from which the secret word is selected. Must contain at least one word for the game to start.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of game starts result in exactly one player designated as drawer and all others as guessers.
- **SC-002**: The secret word is visible on the drawer's screen and absent from every guesser's screen in 100% of game starts.
- **SC-003**: Identical room configurations (same room code, same round) always produce the same word selection, verifiable by restarting a game with the same configuration.
- **SC-004**: All players in the room observe the transition from lobby to game phase within the standard polling interval (approximately 2 seconds) after the host triggers game start.
- **SC-005**: Player roles are displayed consistently across all players in the room — no player sees a different set of role assignments than any other.

## Assumptions

- The word list is provided as part of the implementation and contains at least one word. The specific word list content is an implementation detail.
- Words are selected deterministically by using the round number modulo the word list size (round 0 = word at index 0, round 1 = word at index 1, etc.). This ensures reproducibility.
- The game starts at round 0 (the first round).
- Role reassignment (changing drawer in subsequent rounds) is out of scope for this feature.
- Players who join after the game has started are not admitted into the in-progress game — joining is lobby-only.
- The host-triggered game start event is already implemented per the Room Setup & Lobby feature (User Story 3 in the previous spec).
