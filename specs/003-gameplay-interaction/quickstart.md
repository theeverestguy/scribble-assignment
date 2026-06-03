# Quickstart: Gameplay Interaction Implementation

**Prerequisite**: Game Start & Drawer Flow (feature `002-game-start-flow`) complete.

## Files to Modify (in dependency order)

### Backend (6 files)

| Step | File | Action |
|------|------|--------|
| 1 | `backend/src/models/game.ts` | Add `Point`, `Guess`, `Stroke` interfaces; add `strokes`, `guesses` to `Room`; add `score`, `hasScoredThisRound` to `Participant`; add `strokes`, `guesses` to `RoomSnapshot` |
| 2 | `backend/src/services/roomStore.ts` | Add `appendStroke()`, `clearCanvas()`, `submitGuess()`, `checkGuess()` functions; update `toRoomSnapshot()` to include strokes/guesses |
| 3 | `backend/src/api/schemas.ts` | Add `drawSchema`, `clearSchema`, `guessSchema` Zod schemas |
| 4 | `backend/src/api/rooms.ts` | Add `POST /:code/draw`, `POST /:code/clear`, `POST /:code/guess` routes |

### Frontend (5 files)

| Step | File | Action |
|------|------|--------|
| 5 | `frontend/src/services/api.ts` | Add `Point`, `Guess` types; add `strokes`, `guesses` to `RoomSnapshot`; add `score`, `hasScoredThisRound` to `Participant`; add `submitDraw()`, `clearCanvas()`, `submitGuess()` methods |
| 6 | `frontend/src/components/Canvas.tsx` | **NEW** — HTML5 Canvas with mouse handlers, local drawing, remote stroke rendering, clear button |
| 7 | `frontend/src/components/GuessForm.tsx` | Wire submit to `api.submitGuess()`, show correct/incorrect feedback |
| 8 | `frontend/src/state/roomStore.ts` | Add `submitDraw()`, `clearCanvas()`, `submitGuess()` methods |
| 9 | `frontend/src/pages/GamePage.tsx` | Replace canvas placeholder with `<Canvas>`; add guess history display; wire actions through roomStore |

### Validation

| Step | Action |
|------|--------|
| 10 | `cd backend && npm run build` |
| 11 | `cd frontend && npm run build` |
| 12 | `cd backend && npx vitest run` |
| 13 | `cd frontend && npx vitest run` |
| 14 | Manual: host starts a game, drawer draws, guesser sees strokes; guesser submits correct word → 100 points |

## Key Implementation Notes

- **Canvas**: Use `useRef` + `<canvas>` element. Redraw all strokes on every `strokes` prop change via `useEffect`. For drawer mode, track `isDrawing` state with `onMouseDown`/`onMouseUp`/`onMouseMove`.
- **Stroke submission**: Call `api.submitDraw()` only on mouseup. Never during `mousemove`.
- **Guess Feedback**: After `api.submitGuess()` resolves, show inline success/error text. Do NOT clear the guess history — it updates via the next poll.
- **Score Display**: The existing `Scoreboard` component receives `participants` from the snapshot — ensure it reads `participant.score`.
- **Polling**: No changes needed — existing `GET /:code` polling already brings in the full snapshot.

## Rollback

```bash
git checkout 002-gameplay-interaction  # previous feature branch
```
