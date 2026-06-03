# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Feature: Gameplay Interaction. Prerequisite: Game Start & Drawer Flow complete. Add: 1. Interactive drawing canvas 2. Clear canvas 3. Guess submission 4. Guess validation (trim, reject empty, case-insensitive matching) 5. Guess history 6. Polling synchronization 7. Scoring (correct guess = 100, incorrect = 0). Out of Scope: Results, Restart."

## Clarifications

### Session 2026-06-03

- Q: Canvas state format → A: Array of finalized stroke objects `{points: Array<{x: number, y: number}>}`. Each stroke finalized on mouseup. Single black pen on white. Clear replaces array with `[]`.
- Q: Guess history structure → A: Flat array `{id, participantId, text, isCorrect, awardedPoints, timestamp}` on room, append-only, chronological, included in every snapshot.
- Q: Scoring behavior → A: Per-participant `score` (default 0) and `hasScoredThisRound`. First correct guess → +100 and guard set. Subsequent guesses → 0 points. Guard resets when `currentRound` increments.
- Q: Synchronization strategy → A: Pure HTTP polling. Three new endpoints: `POST /:code/draw` (submit stroke), `POST /:code/clear` (reset strokes), `POST /:code/guess` (submit guess, validate, score). Existing `GET /:code` includes `strokes[]`, `guesses[]`, `participants[].score` in snapshot.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawing on the Canvas (Priority: P1)

When the game phase loads, the player assigned as drawer sees an interactive drawing canvas. They can draw freeform lines to visually convey the secret word to the guessers. A clear button resets the canvas to a blank state.

**Why this priority**: The drawing canvas is the primary output mechanism of the game — without it, the drawer cannot communicate the secret word to the guessers.

**Independent Test**: Host starts a game with 2+ players. The drawer can draw lines on the canvas using their mouse and clear the canvas with a single click. Guessers see the drawn content update via polling.

**Acceptance Scenarios**:

1. **Given** a game is in progress and the viewer is the drawer, **When** the drawer moves their mouse while holding the left button on the canvas, **Then** a visible line trail follows the cursor path.
2. **Given** the drawer has drawn content on the canvas, **When** the drawer clicks the clear button, **Then** the canvas returns to a blank white state.
3. **Given** a game is in progress and the viewer is a guesser, **When** the guesser views the game page, **Then** the canvas shows the drawer's latest drawing (or blank if nothing drawn yet), but the guesser cannot draw on it.

---

### User Story 2 - Submitting Guesses (Priority: P2)

Guessers can type and submit text guesses. The system trims whitespace, rejects empty submissions, and matches guesses against the secret word case-insensitively. All guesses are recorded in a visible history.

**Why this priority**: Guessing is the core input mechanism — without it, players cannot interact with the game.

**Independent Test**: Start a game with 2+ players. The guesser types a guess, submits it, and sees it appear in the guess history. An empty submission is rejected. A correct guess (any casing) is recognized as correct.

**Acceptance Scenarios**:

1. **Given** a game is in progress and the viewer is a guesser, **When** the guesser types "PIZZA" in the guess input and submits, **Then** the guess "PIZZA" appears in the guess history.
2. **Given** a guesser has submitted a guess, **When** the guesser submits an empty or whitespace-only guess, **Then** the system rejects it with a visible error and does not add it to the guess history.
3. **Given** the secret word is "pizza", **When** a guesser submits "PIZZA", "Pizza", or "pizza", **Then** the system marks the guess as correct.
4. **Given** a guesser has submitted multiple guesses, **When** the guesser views the guess history, **Then** all guesses are listed in chronological order with their correct/incorrect status.

---

### User Story 3 - Scoring (Priority: P3)

Correctly guessing the secret word earns 100 points. Incorrect guesses earn 0 points. Scores are tracked per player and visible to all participants via polling.

**Why this priority**: Scoring adds competitive motivation, but the game is playable without it — drawings and guesses are the core loop.

**Independent Test**: Start a game with 2+ players. One guesser submits the correct word and receives 100 points. The scoreboard updates to reflect the new score.

**Acceptance Scenarios**:

1. **Given** a game is in progress, **When** a guesser submits a correct guess (case-insensitive match), **Then** the system awards that guesser 100 points.
2. **Given** a guesser has submitted a correct guess, **When** the same guesser submits additional guesses, **Then** no additional points are awarded (one score per player per round).
3. **Given** a guesser submits an incorrect guess, **When** the guess is processed, **Then** the guesser earns 0 points for that guess.
4. **Given** any player views the game screen, **When** polling updates the room state, **Then** the scoreboard reflects all players' current scores.

---

### Edge Cases

- What happens if the drawer has not drawn anything and guessers see a blank canvas? (Blank canvas is the expected default state — guessers see an empty white canvas.)
- What happens if a guesser submits a guess that is identical to a previous guess? (Both are recorded in history — duplicate submissions are allowed.)
- What happens if a non-drawer tries to interact with the canvas drawing controls? (Canvas controls are only rendered for the drawer — guessers see a read-only canvas.)
- What happens while a drawing stroke is in progress and a polling request arrives? (Drawings are stored as completed strokes only; in-progress strokes are not synced until the mouse button is released.)
- What happens if the guess input contains leading/trailing spaces? (The system trims whitespace before validation and storage.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an interactive drawing canvas visible to the drawer that responds to mouse input for freeform line drawing.
- **FR-002**: System MUST provide a clear canvas action that removes all drawn content and resets the canvas to blank.
- **FR-003**: System MUST render a read-only version of the canvas for guessers, showing the drawer's most recent strokes.
- **FR-004**: System MUST provide a guess input field for guessers to submit text guesses.
- **FR-005**: System MUST trim leading and trailing whitespace from submitted guesses before processing.
- **FR-006**: System MUST reject empty or whitespace-only guesses with a visible error message.
- **FR-007**: System MUST match guesses against the secret word case-insensitively to determine correctness.
- **FR-008**: System MUST record all guesses in a chronological guess history visible to all players.
- **FR-009**: System MUST display correct/incorrect status for each guess in the history.
- **FR-010**: System MUST award 100 points to a guesser for their first correct guess in a round.
- **FR-011**: System MUST NOT award additional points for subsequent guesses by an already-correct guesser in the same round.
- **FR-012**: System MUST synchronize canvas strokes, guesses, and scores to all players via HTTP polling. Three endpoints handle user actions: `POST /:code/draw` (submit finalized stroke), `POST /:code/clear` (reset strokes), `POST /:code/guess` (submit guess with server-side validation and scoring). Existing `GET /:code` returns the full snapshot including strokes, guesses, and scores.
- **FR-013**: System MUST NOT allow guessers to draw on the canvas (drawing controls are drawer-only).

### Key Entities

- **Stroke**: A single finalized line drawn by the drawer. Contains `points: Array<{x: number, y: number}>`. Finalized on mouseup. In-progress strokes are not synced.
- **Guess**: A text submission from a guesser. Fields: `id`, `participantId`, `text` (trimmed), `isCorrect`, `awardedPoints` (100 or 0), `timestamp`. Appended to an array on the room.
- **GuessHistory**: The ordered array of all guesses made in the current round, included in every room snapshot for all players.
- **Score**: A cumulative point total per participant. Each participant has `score: number` (default 0) and a `hasScoredThisRound: boolean` guard. First correct guess in a round adds 100 and sets the guard.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The drawer can draw visible lines on the canvas via mouse input and clear the canvas in under 1 second.
- **SC-002**: Guessers can submit a guess and see it appear in the guess history within the standard polling interval after submission.
- **SC-003**: Empty or whitespace-only guesses are rejected 100% of the time with a visible error message.
- **SC-004**: Case-insensitive matching works correctly — all casing variants of the secret word are recognized as correct.
- **SC-005**: A correct guess awards exactly 100 points to the guessing player and is reflected in the scoreboard within the polling interval.
- **SC-006**: Duplicate correct guesses by the same player in the same round do not award additional points.
- **SC-007**: All players see the same canvas content, guess history, and scores within the polling interval.

## Assumptions

- The drawing canvas uses mouse-based freehand input (touch/touchscreen is out of scope for v1).
- The canvas area is 600×400 CSS pixels (fixed size, not responsive).
- Strokes use a single black pen on a white background — no color, width, or style options.
- Canvas strokes are finalized on mouseup and sent to the server only at that point, not during active drawing.
- Clearing the canvas is irreversible — only the current stroke array is stored.
- The guess input field is only rendered for guessers; drawers do not see the guess input.
- Guess history is displayed below the canvas in a scrollable list, visible to all players.
- Players can submit unlimited guesses; there is no cooldown or limit on guess frequency.
- Guesses are visible to all players (drawer included) to allow the drawer to see progress.
- A `hasScoredThisRound` flag on each participant prevents duplicate scoring within a round.
- Polling interval remains at ~2 seconds (existing baseline from Room Setup & Lobby feature).
- The existing `GET /:code` endpoint is extended to include `strokes`, `guesses`, and per-participant `score` fields.
- The scoreboard component from the existing GamePage is reused and extended to display cumulative scores.
