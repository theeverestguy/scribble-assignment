import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema
} from "./schemas.js";
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  startGame,
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
