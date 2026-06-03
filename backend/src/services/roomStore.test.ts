import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, leaveRoom, startGame } from "./roomStore.js";

describe("createRoom", () => {
  it("returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("sets isHost true on the creator participant", () => {
    const result = createRoom("Alice");

    expect(result.room.participants[0].isHost).toBe(true);
  });

  it("sets hostId to the creator participantId", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });
});

describe("joinRoom", () => {
  it("returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("sets isHost false on a joining participant", () => {
    const { room } = createRoom("Alice");
    const result = joinRoom(room.code, "Bob");

    if (result === null || "error" in result) {
      throw new Error("expected successful join");
    }

    expect(result.room.participants[1].isHost).toBe(false);
  });

  it("returns name-taken error when name is already in use", () => {
    const { room } = createRoom("Alice");
    const result = joinRoom(room.code, "Alice");

    expect(result).toEqual({ error: "name-taken" });
  });

  it("allows joining with a different name (case-sensitive)", () => {
    const { room } = createRoom("Alice");
    const result = joinRoom(room.code, "alice");

    expect(result).not.toBeNull();
    expect(result).not.toEqual({ error: "name-taken" });
  });
});

describe("startGame", () => {
  it("transitions status to game with host and 2+ players", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const result = startGame(room.code, participantId);

    if ("error" in result) {
      throw new Error(`unexpected error: ${result.error}`);
    }

    expect(result.status).toBe("game");
  });

  it("returns not-found for an unknown room code", () => {
    const result = startGame("ZZZZ", "some-id");

    expect(result).toEqual({ error: "not-found" });
  });

  it("returns not-host when participantId is not the host", () => {
    const { room } = createRoom("Alice");
    const joinResult = joinRoom(room.code, "Bob");

    if (joinResult === null || "error" in joinResult) {
      throw new Error("expected successful join");
    }

    const result = startGame(room.code, joinResult.participantId);

    expect(result).toEqual({ error: "not-host" });
  });

  it("returns not-enough-players when only 1 player is present", () => {
    const { room, participantId } = createRoom("Alice");

    const result = startGame(room.code, participantId);

    expect(result).toEqual({ error: "not-enough-players" });
  });
});

describe("leaveRoom", () => {
  it("removes a participant from the room", () => {
    const { room } = createRoom("Alice");
    const joinResult = joinRoom(room.code, "Bob");

    if (joinResult === null || "error" in joinResult) {
      throw new Error("expected successful join");
    }

    const result = leaveRoom(room.code, joinResult.participantId);

    expect(result).toBe("left");
    expect(getRoom(room.code)?.participants).toHaveLength(1);
  });

  it("deletes the room when the last participant leaves", () => {
    const { room, participantId } = createRoom("Alice");

    const result = leaveRoom(room.code, participantId);

    expect(result).toBe("room-removed");
    expect(getRoom(room.code)).toBeNull();
  });

  it("returns not-found for an unknown room code", () => {
    const result = leaveRoom("ZZZZ", "some-id");

    expect(result).toBe("not-found");
  });
});

describe("room isolation", () => {
  it("starting a game in room A does not affect room B", () => {
    const { room: roomA, participantId: hostA } = createRoom("Alice");
    joinRoom(roomA.code, "Bob");

    const { room: roomB } = createRoom("Charlie");

    startGame(roomA.code, hostA);

    expect(getRoom(roomB.code)?.status).toBe("lobby");
  });

  it("joining room A does not change the participant list of room B", () => {
    const { room: roomA } = createRoom("Alice");
    const { room: roomB } = createRoom("Charlie");

    joinRoom(roomA.code, "Dave");

    expect(getRoom(roomB.code)?.participants).toHaveLength(1);
  });
});
