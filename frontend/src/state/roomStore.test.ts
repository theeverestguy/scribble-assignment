import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomStore } from "./roomStore";
import type { RoomSnapshot } from "../services/api";

vi.mock("../services/api", () => ({
  api: {
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    fetchRoom: vi.fn().mockResolvedValue({ room: null }),
    startGame: vi.fn(),
    submitDraw: vi.fn(),
    clearCanvas: vi.fn(),
    submitGuess: vi.fn(),
    leaveRoom: vi.fn()
  }
}));

const mockRoom: RoomSnapshot = {
  code: "ABCD",
  status: "lobby",
  participants: [],
  hostId: "participant-1",
  currentRound: 0,
  strokes: [],
  guesses: [],
  availableWords: [],
  roles: []
};

describe("RoomStore polling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("calls fetchRoom after 2000ms when a room is set", async () => {
    const { api } = await import("../services/api");
    vi.mocked(api.fetchRoom).mockResolvedValue({ room: mockRoom });

    const store = new RoomStore();
    store.setRoomSession({ participantId: "participant-1", room: mockRoom });
    store.startPolling();

    vi.advanceTimersByTime(2000);
    await Promise.resolve();

    expect(api.fetchRoom).toHaveBeenCalledTimes(1);
    expect(api.fetchRoom).toHaveBeenCalledWith("ABCD", "participant-1");

    store.stopPolling();
  });

  it("does not call fetchRoom after stopPolling", async () => {
    const { api } = await import("../services/api");

    const store = new RoomStore();
    store.setRoomSession({ participantId: "participant-1", room: mockRoom });
    store.startPolling();
    store.stopPolling();

    vi.advanceTimersByTime(4000);
    await Promise.resolve();

    expect(api.fetchRoom).not.toHaveBeenCalled();
  });

  it("does not call fetchRoom when no room is set", async () => {
    const { api } = await import("../services/api");

    const store = new RoomStore();
    store.startPolling();

    vi.advanceTimersByTime(2000);
    await Promise.resolve();

    expect(api.fetchRoom).not.toHaveBeenCalled();

    store.stopPolling();
  });
});
