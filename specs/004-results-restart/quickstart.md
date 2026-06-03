# Quickstart: Results & Restart

## Implementation Order

1. **Backend types**: Add `"results"` to `RoomStatus` in `backend/src/models/game.ts`
2. **Backend service — submitGuess**: Add `room.status = "results"` when `isCorrect` in `backend/src/services/roomStore.ts`
3. **Backend service — restartGame**: New function with validation and state reset in `backend/src/services/roomStore.ts`
4. **Backend service — toRoomSnapshot**: Update `secretWord` visibility condition
5. **Backend schema**: Add `restartSchema` in `backend/src/api/schemas.ts`
6. **Backend route**: Add `POST /:code/restart` in `backend/src/api/rooms.ts`
7. **Backend tests**: Write tests for `submitGuess` results transition and `restartGame`
8. **Frontend types**: Add `"results"` to `RoomStatus` in `frontend/src/services/api.ts`
9. **Frontend API**: Add `restartGame()` to `api` object in `frontend/src/services/api.ts`
10. **Frontend store**: Add `restartGame()` method in `frontend/src/state/roomStore.ts`
11. **Frontend component**: Create `ResultsView.tsx` in `frontend/src/components/`
12. **Frontend page**: Update `GamePage.tsx` to render `ResultsView` when `status === "results"`
13. **Frontend tests**: Write tests for `ResultsView` rendering
14. **Build & verify**: `npm run build` on both projects; `npx vitest run` on both

## Integration Test

Start two browser windows, join the same room, start the game:
1. Guesser submits a correct guess → both players see the results view with the correct word revealed, the winner highlighted, final scores, and full guess history
2. Host clicks restart → both players return to the lobby with the same room code and player list, but scores/guesses/drawing/roles/word are cleared
3. Non-host player does NOT see the restart button
