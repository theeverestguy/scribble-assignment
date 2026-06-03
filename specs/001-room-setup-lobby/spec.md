# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Feature: Room Setup & Lobby — add host tracking, join validation, room isolation, lobby polling, and host-only game start"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Designated on Room Creation (Priority: P1)

When a player creates a new room, they are automatically designated as the host of that room. This role is visible to all players in the lobby and persists for the lifetime of the room.

**Why this priority**: Host status is the foundation that gates game start and determines who has privileged actions. All other stories depend on knowing who the host is.

**Independent Test**: Create a room, join the lobby, and verify the creator is identified as the host before any other player joins.

**Acceptance Scenarios**:

1. **Given** a player submits a valid name and creates a new room, **When** the lobby loads, **Then** the creating player is marked as host and all other players can see that designation.
2. **Given** a room has a designated host, **When** additional players join, **Then** the host designation remains with the original creator and is visible to all players in the lobby.
3. **Given** a room is created, **When** the lobby displays the player list, **Then** exactly one player is marked as host at any given time.

---

### User Story 2 - Validated Room Joining (Priority: P2)

When a player attempts to join a room, the system validates both the player's name and the room code before allowing entry. Invalid inputs are rejected with clear feedback.

**Why this priority**: Validation prevents corrupt or ambiguous state from entering the lobby. Clean data is required for host tracking, room isolation, and game start to function correctly.

**Independent Test**: Attempt to join with an empty name, a whitespace-only name, an empty room code, and a non-existent room code — each attempt should be rejected with an appropriate message without crashing the application.

**Acceptance Scenarios**:

1. **Given** the join form is displayed, **When** a player submits an empty name, **Then** the system rejects the request and displays a clear error message asking for a name.
2. **Given** the join form is displayed, **When** a player submits a name containing only spaces or whitespace, **Then** the system rejects the request with the same empty-name error.
3. **Given** the join form is displayed, **When** a player submits an empty room code, **Then** the system rejects the request and prompts the player to enter a room code.
4. **Given** the join form is displayed, **When** a player submits a room code that does not correspond to any active room, **Then** the system rejects the request and informs the player the room was not found.
5. **Given** valid name and valid room code are submitted, **When** the player joins, **Then** they are admitted to the lobby immediately.

---

### User Story 3 - Host-Controlled Game Start (Priority: P3)

Only the host can start the game, and only when at least two players are present in the lobby. Non-host players cannot trigger a game start, and the host is blocked from starting with fewer than two players.

**Why this priority**: This is the primary decision point for the lobby phase. It ensures the host has authority over progression and that a minimum viable session is in place before play begins.

**Independent Test**: With the host present alone, verify the start button is either absent or disabled. With a second player joined, verify only the host's start action advances the game while a non-host player has no such control.

**Acceptance Scenarios**:

1. **Given** only the host is in the lobby, **When** the lobby is displayed, **Then** the game start action is unavailable or disabled for the host.
2. **Given** at least two players are in the lobby including the host, **When** the host initiates a game start, **Then** the game advances to the next phase for all players in the room.
3. **Given** at least two players are in the lobby, **When** a non-host player attempts to start the game, **Then** the action is blocked and no state change occurs.
4. **Given** the host starts the game, **When** the state transitions, **Then** all players in the room observe the same transition simultaneously (within the polling interval).

---

### User Story 4 - Automatic Lobby Refresh (Priority: P4)

The lobby automatically stays up to date as players join or leave, without requiring any manual action from the player. The player list and game state are refreshed approximately every two seconds.

**Why this priority**: Polling is the synchronisation mechanism for the entire application. Players need to see arrivals and host actions reflected promptly without manual intervention.

**Independent Test**: Open two browser sessions in the same room. In one session, have a second player join. Without refreshing, verify the first session updates to show the new player within approximately 2 seconds.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** another player joins the same room, **Then** the first player's lobby view updates to show the new player within the polling interval (approximately 2 seconds) without manual action.
2. **Given** a player is in the lobby, **When** the host starts the game, **Then** all non-host players are redirected or updated within the polling interval.
3. **Given** a player is in the lobby with automatic polling active, **When** no state changes occur, **Then** the lobby remains stable and does not flicker or reset.

---

### User Story 5 - Room Isolation (Priority: P5)

Actions performed in one room — such as a player joining, the host starting the game, or any state change — have no effect on any other room.

**Why this priority**: Isolation is a non-functional integrity requirement. Without it, multi-room usage would be unpredictable, but it is architecturally implicit and primarily verified by testing, not visible to end users.

**Independent Test**: Create two separate rooms. Perform a state-changing action in room A (e.g., host starts game). Verify the state of room B is entirely unchanged.

**Acceptance Scenarios**:

1. **Given** two rooms exist simultaneously, **When** a player joins room A, **Then** the player list in room B is unaffected.
2. **Given** two rooms exist simultaneously, **When** the host of room A starts the game, **Then** room B remains in the lobby phase unaffected.
3. **Given** two rooms exist simultaneously, **When** any action is taken in room A, **Then** polling in room B returns only the state of room B.

---

### Edge Cases

- What happens when a player submits a name that is valid but the room code has expired or was never created?
- What happens when the host closes their browser or disconnects before starting the game? (Note: session recovery is out of scope; the room may become unstartable — document this behaviour.)
- What happens when two players attempt to join the same room at the same moment?
- What happens when the host attempts to start the game while a polling update is in-flight?
- What happens if a room code contains unexpected characters (e.g., special characters, mixed case)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST assign host status to the player who creates a room, and MUST persist that designation for the room's lifetime.
- **FR-002**: System MUST display host designation to all players in the lobby so that every participant knows who the host is.
- **FR-003**: System MUST reject a join request where the player name is empty or consists entirely of whitespace, and MUST return a descriptive error.
- **FR-004**: System MUST reject a join request where the room code is empty, and MUST return a descriptive error.
- **FR-005**: System MUST reject a join request where the room code does not match any active room, and MUST return a descriptive error.
- **FR-006**: System MUST prevent any player other than the host from initiating a game start.
- **FR-007**: System MUST prevent the host from starting the game when fewer than two players are present in the room.
- **FR-008**: System MUST refresh the lobby state automatically at approximately a 2-second interval without requiring manual user action.
- **FR-009**: System MUST ensure that any state change in one room produces no side effects on any other room.
- **FR-010**: System MUST propagate a host-initiated game start to all players in that room within the polling interval.

### Key Entities

- **Room**: Represents an active game session. Has a unique code, a designated host, a list of current players, and a current phase (lobby or game).
- **Player**: A participant in a room. Has a display name, a host flag, and belongs to exactly one room at a time.
- **RoomCode**: The identifier used to locate and join a specific room. Must be non-empty and correspond to an active room.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of join attempts with an empty name, whitespace-only name, empty room code, or invalid room code are rejected before the player enters a lobby.
- **SC-002**: The lobby player list reflects new joins within 3 seconds of a player entering the room, with no manual refresh required.
- **SC-003**: A non-host player cannot trigger a game start under any circumstance; 0 unauthorised game-start transitions occur.
- **SC-004**: The host cannot start a game with fewer than 2 players present; 0 single-player game-start transitions occur.
- **SC-005**: State changes in one room produce 0 observable side effects in any other concurrent room.
- **SC-006**: All players in a room observe the game-start transition within the 2-second polling interval after the host triggers it.

## Assumptions

- Players do not have persistent accounts; identity is name-only and scoped to the current room session.
- Room codes are generated by the system on room creation and are not user-defined.
- A player who closes their browser is treated as disconnected; no reconnection logic is required for this feature.
- The host role does not transfer if the host leaves; the room may become unstartable in that scenario (out of scope).
- There is no maximum player limit enforced by this feature; that concern is deferred.
- Invalid room codes include codes that were once valid but whose rooms have since been removed from memory.
- All polling intervals are approximate and subject to network conditions; exact millisecond precision is not guaranteed.
