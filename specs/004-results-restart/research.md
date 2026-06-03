# Research: Results & Restart

**Phase**: 0 — Research

## Overview

No open technical questions. All design decisions were clarified in the spec clarifications or are obvious from the existing architecture.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Round end trigger | Auto on correct guess inside `submitGuess()` | Simplest implementation — no timer, no manual trigger, no additional API call |
| State reset pattern | Single `restartGame()` function | Matches existing `startGame()` pattern; atomic operation |
| Result state structure | New `"results"` RoomStatus value | Minimal change — single string addition to union type; existing status guards naturally reject actions |
| Secret word reveal | Conditional in `toRoomSnapshot()`: `isViewerDrawer \|\| status === "results"` | No new fields needed; simple condition change |
| Winner calculation | Client-side sort of participants by score descending | Stateless, no backend computation needed; single-round = trivial |
| Restart authorization | Host-only (403 for non-host) | Consistent with existing `startGame()` pattern |
| Lobby return | Automatic via existing polling + lobby redirect | No new synchronization mechanism needed |

## Alternatives Considered

- **Manual round-end trigger**: Rejected — adds unnecessary complexity for v1. Can be added as a future feature.
- **Server-side winner calculation**: Rejected — the data is already in the snapshot; client-side sort is simpler.
- **Dedicated results endpoint**: Rejected — the existing `GET /:code` polling already returns all needed data.
