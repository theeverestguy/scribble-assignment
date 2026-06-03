# Feature Specification: Results & Restart

**Feature Branch**: `004-results-restart`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Feature: Results & Restart. \nPrerequisite: Gameplay Interaction complete.\n\nAdd:\n\n1. Round completion\n2. Result state\n3. Display:\n   - correct word\n   - winner\n   - scores\n   - guess history\n4. Restart\n5. Return all players to lobby\n6. Preserve:\n   - room\n   - host\n   - players\n7. Clear:\n   - scores\n   - guesses\n   - drawing\n   - roles\n   - word\n\nOut of Scope:\n- Multiple rounds\n- Rotation"

## Clarifications

### Session 2026-06-03

- Q: Round end trigger → A: Round ends automatically when `submitGuess()` returns `isCorrect: true`. The `submitGuess` service function transitions `room.status` from `"game"` to `"results"` immediately after awarding points for a correct guess. No timer or manual trigger needed.
- Q: Restart state reset rules → A: Single `restartGame()` service function validates host + "results" status, then sets `status = "lobby"`, resets `currentRound = 0`, clears `drawerId` and `currentWord`, empties `strokes` and `guesses` arrays, and resets each participant's `score = 0`, `hasScoredThisRound = false`, `role = undefined`. Preserves `code`, `hostId`, and `participants` array.
- Q: Result state structure → A: Room status `"results"` is a new read-only terminal state for the round. The existing `GET /:code` snapshot reveals `secretWord` to ALL players (not just drawer). The frontend replaces `GameView` with `ResultsView` when `status === "results"`. All draw/guess/clear endpoints return 403.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Results Display (Priority: P1)

When the round completes (a guesser submits a correct guess), all players see a results screen showing the correct secret word, who guessed correctly, the final scoreboard, and the full guess history from the round. No further drawing or guessing is allowed.

**Why this priority**: Without a results display, players never see the outcome of the round — the game would have no sense of completion or closure.

**Independent Test**: Start a game with 2+ players. The guesser submits the correct word. All players see a results view displaying the correct word, the winner (the guesser who scored 100 points), the scoreboard, and the guess history. Correct and incorrect guesses are both shown.

**Acceptance Scenarios**:

1. **Given** a round is in progress, **When** any guesser submits a correct guess, **Then** the room transitions to a results state and all players see the results view.
2. **Given** the results view is displayed, **When** any player views the screen, **Then** they see the correct secret word that was being drawn.
3. **Given** the results view is displayed, **When** any player views the screen, **Then** they see which player(s) guessed correctly (the winner is the first correct guesser who earned 100 points).
4. **Given** the results view is displayed, **When** any player views the screen, **Then** they see the final scoreboard with all players' cumulative scores.
5. **Given** the results view is displayed, **When** any player views the screen, **Then** they see the full guess history including each guesser's name, their guess text, and whether it was correct or incorrect.
6. **Given** the results view is displayed, **When** a guesser or drawer attempts to draw or submit a guess, **Then** the system rejects the action.

---

### User Story 2 - Restart Game (Priority: P2)

From the results view, the host can restart the game. This returns all players to the lobby state while preserving the room code, host identity, and player roster. All round-specific data is cleared so a fresh game can begin.

**Why this priority**: Restarting lets players play again without creating a new room and re-inviting everyone — essential for a good group experience.

**Independent Test**: Start a game with 2+ players, complete the round. The host clicks restart from the results view. All players see the lobby screen with the same room code and player list. Scores, guesses, drawing, roles, and the secret word are cleared.

**Acceptance Scenarios**:

1. **Given** the results view is displayed, **When** the host clicks the restart action, **Then** the room transitions to lobby status.
2. **Given** the room has restarted to lobby, **When** any player views the lobby, **Then** they see the same room code as before.
3. **Given** the room has restarted to lobby, **When** any player views the lobby, **Then** they see the same host and player list as before.
4. **Given** the room has restarted to lobby, **When** any player views the lobby, **Then** all scores are reset to zero.
5. **Given** the room has restarted to lobby, **When** any player views the lobby, **Then** the guess history is empty.
6. **Given** the room has restarted to lobby, **When** any player views the lobby, **Then** the canvas is blank (no strokes).
7. **Given** the room has restarted to lobby, **When** any player views the lobby, **Then** no player has a role (drawer/guesser) assigned.
8. **Given** the room has restarted to lobby, **When** any player views the lobby, **Then** no secret word is set.
9. **Given** the results view is displayed and the viewer is not the host, **When** they view the results screen, **Then** they do not see the restart action.

---

### Edge Cases

- What happens if no player correctly guesses the word? (The round continues indefinitely with no results state. This feature only triggers on a correct guess. A future feature may add a timer or manual round-end.)
- What happens if a player joins after the round has ended? (They see the results view. On restart, they are in the lobby like everyone else.)
- What happens if the host leaves and rejoins during the results view? (Host identity is preserved — the original host remains the host on restart.)
- What happens if only one player is in the room when the round completes? (The results view still displays correctly with that player as the winner if they guessed correctly.)
- What happens if all guesses were incorrect and the round never completes? (The game continues — the only way to reach results is via a correct guess or a future manual end-round feature.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST transition the room to "results" status immediately inside `submitGuess()` when a correct guess is detected, before returning the response to the guesser.
- **FR-002**: System MUST prevent drawing and guessing actions while the room is in "results" status.
- **FR-003**: System MUST display the correct secret word to all players in the results view.
- **FR-004**: System MUST identify and display the winner (the player who earned the most points in the round).
- **FR-005**: System MUST display a final scoreboard showing all players' cumulative scores.
- **FR-006**: System MUST display the full chronological guess history from the round, including each guesser's name, guess text, and correct/incorrect status.
- **FR-007**: System MUST provide a restart action available only to the host from the results view.
- **FR-008**: System MUST return the room to "lobby" status when restart is triggered.
- **FR-009**: System MUST preserve the room code, host identity, and full player roster on restart.
- **FR-010**: System MUST reset all participant scores to zero on restart.
- **FR-011**: System MUST clear the guess history array on restart.
- **FR-012**: System MUST clear the strokes array (canvas) on restart.
- **FR-013**: System MUST clear all participant roles (drawer/guesser) on restart.
- **FR-014**: System MUST clear the secret word on restart.
- **FR-015**: System MUST synchronize the results state to all players via HTTP polling (same mechanism as existing gameplay sync).

### Key Entities

- **RoomStatus**: Room lifecycle: `lobby → game → results → lobby → ...`. The "results" status is a read-only terminal state for the completed round.
- **ResultsView**: Read-only display shown to all players when `room.status === "results"`. Shows the correct word (revealed to all), winner (highest scorer), final scoreboard with cumulative scores, and full chronological guess history. Only interactive element is the host's restart button.
- **RestartAction**: A host-only action invoked from the results view. Calls `restartGame()` which sets `status = "lobby"`, clears `currentRound`, `drawerId`, `currentWord`, `strokes`, `guesses`, and resets each participant's `score`, `hasScoredThisRound`, and `role`. Preserves `code`, `hostId`, and `participants` array.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players see the results view within the standard polling interval after a correct guess is submitted.
- **SC-002**: The winner is correctly identified — the player with the highest score (the first correct guesser) is displayed.
- **SC-003**: The secret word is revealed to all players (including guessers who previously could not see it).
- **SC-004**: The guess history shows every guess from the round in chronological order, with correct/incorrect status.
- **SC-005**: The host can restart the game with a single click from the results view.
- **SC-006**: On restart, all players return to lobby within the standard polling interval and see the same room code, host, and players as before.
- **SC-007**: On restart, all round data (scores, guesses, drawing, roles, word) is cleared and confirmed as reset.

## Assumptions

- Round completion is triggered by a correct guess — there is no timer or manual end-round action in this feature.
- If no player guesses correctly, the round continues indefinitely (a future feature may add a manual end-round mechanism).
- The winner is the player with the highest score. In a single-round game, this is the first guesser to submit a correct guess (100 points).
- The restart action is host-only, consistent with the existing pattern where only the host can start a game.
- The results view replaces the gameplay view (no in-place overlay) — all players see the same screen.
- After restart, the new game follows the existing game start flow: host selects a word, a drawer is assigned, and gameplay resumes.
- The room's `currentRound` counter is reset to 0 on restart.
- Polling interval remains at ~2 seconds for results and restart state synchronization.
- Multiple rounds and drawer rotation are explicitly out of scope for this feature.
