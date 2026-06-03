import { Router } from "express";
import {
  clearSchema,
  createRoomSchema,
  drawSchema,
  guessSchema,
  HttpError,
  joinRoomSchema,
  restartSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema
} from "./schemas.js";
import {
  appendStroke,
  clearCanvas,
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  restartGame,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code, playerName);

      if (result === null) {
        throw new HttpError(404, "Room not found");
      }

      if ("error" in result) {
        throw new HttpError(400, "That name is already taken in this room");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code);

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code, participantId);

      if ("error" in result) {
        switch (result.error) {
          case "not-found":
            throw new HttpError(404, "Room not found");
          case "not-host":
            throw new HttpError(403, "Only the host can start the game");
          default:
            throw new HttpError(400, "At least 2 players are required to start the game");
        }
      }

      response.json({
        room: toRoomSnapshot(result, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/draw", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, points } = drawSchema.parse(request.body);
      const result = appendStroke(code, participantId, points);

      if ("error" in result) {
        switch (result.error) {
          case "not-found":
            throw new HttpError(404, "Room not found");
          case "not-game":
            throw new HttpError(400, "Game has not started");
          default:
            throw new HttpError(403, "Only the drawer can draw");
        }
      }

      response.json({ room: toRoomSnapshot(result, participantId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearSchema.parse(request.body);
      const result = clearCanvas(code, participantId);

      if ("error" in result) {
        switch (result.error) {
          case "not-found":
            throw new HttpError(404, "Room not found");
          case "not-game":
            throw new HttpError(400, "Game has not started");
          default:
            throw new HttpError(403, "Only the drawer can clear the canvas");
        }
      }

      response.json({ room: toRoomSnapshot(result, participantId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = guessSchema.parse(request.body);
      const result = submitGuess(code, participantId, text);

      if ("error" in result) {
        switch (result.error) {
          case "not-found":
            throw new HttpError(404, "Room not found");
          case "not-game":
            throw new HttpError(400, "Game has not started");
          case "not-guesser":
            throw new HttpError(403, "Only guessers can submit guesses");
          default:
            throw new HttpError(400, "Guess cannot be empty");
        }
      }

      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartSchema.parse(request.body);
      const result = restartGame(code, participantId);

      if ("error" in result) {
        switch (result.error) {
          case "not-found":
            throw new HttpError(404, "Room not found");
          case "not-host":
            throw new HttpError(403, "Only the host can restart");
          default:
            throw new HttpError(400, "Round has not ended yet");
        }
      }

      response.json({ room: toRoomSnapshot(result, participantId) });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:code/players/:participantId", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = request.params;
      const result = leaveRoom(code, participantId);

      if (result === "not-found") {
        throw new HttpError(404, "Room not found");
      }

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
