import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const roomCodeParamsSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{4,6}$/, "Invalid room code format")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().uuid("Invalid participant ID")
});

export const drawSchema = z.object({
  participantId: z.string().uuid(),
  points: z.array(z.object({ x: z.number(), y: z.number() })).min(1)
});

export const clearSchema = z.object({
  participantId: z.string().uuid()
});

export const guessSchema = z.object({
  participantId: z.string().uuid(),
  text: z.string().min(1)
});

export const restartSchema = z.object({
  participantId: z.string().uuid()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
