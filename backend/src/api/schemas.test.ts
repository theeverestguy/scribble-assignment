import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startGameSchema } from "./schemas.js";

describe("createRoomSchema", () => {
  it("accepts a valid playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("rejects an empty playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("rejects a whitespace-only playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("trims surrounding whitespace from playerName", () => {
    const result = createRoomSchema.parse({ playerName: "  Alice  " });

    expect(result.playerName).toBe("Alice");
  });

  it("rejects a missing playerName", () => {
    expect(() => createRoomSchema.parse({})).toThrow();
  });
});

describe("joinRoomSchema", () => {
  it("rejects an empty playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("rejects a whitespace-only playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "  " })).toThrow();
  });
});

describe("roomCodeParamsSchema", () => {
  it("accepts a valid 4-character uppercase code", () => {
    const result = roomCodeParamsSchema.parse({ code: "ABCD" });

    expect(result.code).toBe("ABCD");
  });

  it("accepts a valid 6-character uppercase alphanumeric code", () => {
    const result = roomCodeParamsSchema.parse({ code: "AB12CD" });

    expect(result.code).toBe("AB12CD");
  });

  it("rejects a missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("rejects a lowercase code", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "abcd" })).toThrow();
  });

  it("rejects a code with special characters", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "AB!1" })).toThrow();
  });

  it("rejects a code shorter than 4 characters", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "ABC" })).toThrow();
  });

  it("rejects a code longer than 6 characters", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "ABCDEFG" })).toThrow();
  });
});

describe("startGameSchema", () => {
  it("accepts a valid UUID participantId", () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    const result = startGameSchema.parse({ participantId: id });

    expect(result.participantId).toBe(id);
  });

  it("rejects a non-UUID participantId", () => {
    expect(() => startGameSchema.parse({ participantId: "not-a-uuid" })).toThrow();
  });

  it("rejects a missing participantId", () => {
    expect(() => startGameSchema.parse({})).toThrow();
  });
});
