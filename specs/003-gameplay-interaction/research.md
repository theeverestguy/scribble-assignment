# Research: Gameplay Interaction

**Phase**: 0 — Research
**Date**: 2026-06-03
**Source**: [spec.md](./spec.md), clarifications session, codebase analysis

## Design Decisions

### Decision 1: Canvas State Format

- **Decision**: Array of finalized stroke objects `{points: Array<{x: number, y: number}>}`
- **Rationale**: Simplest representation. No styling (single black pen). Strokes finalized on mouseup to avoid partial-state sync issues.
- **Alternatives considered**:
  - Pixel buffer (server-side image) — larger payload, harder to merge concurrent strokes
  - SVG path data — more complex parsing, no benefit for freeform drawing
  - Real-time point streaming — would require WebSockets (forbidden by POL-1)

### Decision 2: Guess History Structure

- **Decision**: Flat append-only array of `{id, participantId, text, isCorrect, awardedPoints, timestamp}` on the Room object
- **Rationale**: Matches existing in-memory pattern. No delete/reorder needed. Full array returned in every snapshot.
- **Alternatives considered**:
  - Separate store for guesses — unnecessary indirection; Room object already holds per-round state
  - Only returning last N guesses — full history is small (unlimited guesses but typical game <50)

### Decision 3: Scoring Behavior

- **Decision**: Per-participant `score` (default 0) + `hasScoredThisRound` guard. First correct = +100, subsequent = 0.
- **Rationale**: Simple boolean guard avoids complex state tracking. Reset guard when `currentRound` increments.
- **Alternatives considered**:
  - Per-round score map (Map<round, Set<playerId>>) — more complex, unnecessary for single-round scope
  - Deducting points for incorrect guesses — not in spec; would need balancing

### Decision 4: Synchronization Strategy

- **Decision**: Three new POST endpoints (draw, clear, guess) + extended GET /:code snapshot
- **Rationale**: Extends existing Express router. No new infrastructure. Polling catches all state.
- **Alternatives considered**:
  - Optimistic local updates with server reconciliation — more complex; simple polling sufficient
  - Server-Sent Events — closer to real-time but forbidden by POL-1

### Decision 5: Drawing Technology

- **Decision**: HTML5 Canvas API with mouse events, wrapped in a React component
- **Rationale**: Native browser canvas API — no external dependencies. Simple mouse event handlers.
- **Alternatives considered**:
  - Canvas library (Fabric.js, Konva) — unnecessary for freeform lines
  - SVG with pointer events — heavier DOM, worse performance for many points

### Decision 6: Stroke Rendering for Viewers

- **Decision**: Redraw all strokes from the `strokes` array whenever the snapshot updates
- **Rationale**: Deterministic — given the same array of points, canvas renders identically. Avoids incremental rendering bugs.
- **Alternatives considered**:
  - Incremental append — risky with race conditions on clear/reset
  - Image snapshots (toDataURL) — larger payloads, encoding overhead
