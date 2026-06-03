## Scribble Game

## Context
You can create a room, join it, and see participants in the lobby. The current UI also uses Scribble branding and game-themed marketing copy, but everything beyond that basic room flow is either missing or placeholder.

## What already works (happy path only):

- App shell with routing between all screens
- Branded Scribble landing page and starter UI styling
- Create Room — generates a unique room code, adds the creator as a participant, navigates to the lobby
- Join Room — accepts a room code, adds the player to that room, navigates to the lobby
- Lobby — displays the room code and participant list (manual refresh button only, no auto-polling)
- In-memory room store on the backend with POST /rooms, POST /rooms/:code/join, GET /rooms/:code

## What is scaffolded but non-functional:

- Game screen — shows placeholder areas for canvas, guess input, scoreboard, and results, but none of them do anything
- Canvas — a styled <div> with text, not an interactive drawing surface
- Guess form — renders an input and button, but submission does nothing
- Scoreboard and Result panel — display placeholder text only
- Landing page copy — describes the intended game experience, but does not reflect implemented gameplay features yet

## What is missing entirely:

- Host tracking — no concept of who created the room or who can start the game
- Player name validation — empty names silently become "Player"
- Automatic lobby polling — only a manual refresh button exists
- Start-game flow — no endpoint, no gating, no transition out of lobby
- Drawer assignment and secret word selection — roles and words exist as seed data but are never assigned
- Viewer-specific responses — everyone sees the same room snapshot regardless of role
- Drawing interaction, guess handling, scoring, result state, restart flow — none of this exists

## What is provided as data:

Word list: rocket, pizza, castle, guitar, sunflower

Roles: drawer, guesser

README with setup and run commands

In short: The starter gives you a working room creation and join flow so you can verify the app runs immediately. Your job is to add validation, host logic, auto-polling, and build the entire game from scratch.

## Requirements

### Requirement 1 — Room Setup & Lobby
Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present.

## Requirement 2 — Game Start & Drawer Flow
Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer.

## Requirement 3 — Gameplay Interaction
Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0).

## Requirement 4 — Result, Restart & Final Validation
Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared.

## Explicitly Out of Scope
The following items are intentionally out of scope for this lab.

Do not build them, and do not include them in your spec, plan, or tasks.

### Technical
WebSockets / real-time sync

Databases / persistent storage

Authentication / accounts / sessions

Deployment / hosting / CI pipelines

Docker / containerization

New state-management or routing libraries (beyond what the starter ships)

### Game features
Multiple rounds

Drawer rotation

Round timers / countdowns

Speed or drawer bonuses

Custom or random word packs

Spectator mode

Room moderation (kick / mute)

Room passwords or invite links

## Process
Rewriting the starter from scratch — extend, don't replace

Adding top-level dependencies your spec doesn't justify

Refactoring unrelated code

## Phased Checkpoints
Work in phases. Complete each checkpoint before moving to the next phase.

### Feature Group Map
Use these 4 feature groups throughout your specify → plan → tasks → implement → validate loop:

Group	Scenario	What You Should Have By The End
1. Room setup and lobby	Scenario 1	Host tracking on room creation, join validation with clear error messages, verified multi-room isolation, automatic lobby polling within about 2 seconds, host-only start with 2-player minimum
2. Game start and drawer flow	Scenario 2	Player name validation (trim, reject empty), drawer assignment, deterministic secret word selection, drawer-only word visibility
3. Gameplay interaction	Scenario 3	Interactive drawing canvas, clear canvas, guess submission with validation, synced guess history via polling, deterministic scoring
4. Result, restart, and final validation	Scenario 4	Shared result state visible to all players, clean restart to lobby with players preserved and round state cleared

## Business Scenarios
### Scenario 1 — Room Setup & Lobby
Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present.

### Scenario 2 — Game Start & Drawer Flow
Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer.

### Scenario 3 — Gameplay Interaction
Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0).

### Scenario 4 — Result, Restart & Final Validation
Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared.

