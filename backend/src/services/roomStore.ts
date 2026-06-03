import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

export function selectWord(wordList: readonly string[], round: number): string {
  if (wordList.length === 0) {
    return "";
  }

  return wordList[round % wordList.length];
}

const rooms = new Map<string, Room>();

type JoinRoomSuccess = { participantId: string; room: Room };
type JoinRoomResult = JoinRoomSuccess | { error: "name-taken" } | null;
type StartGameResult = Room | { error: "not-found" | "not-host" | "not-enough-players" };
type LeaveRoomResult = "left" | "room-removed" | "not-found";

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function createParticipant(name: string, isHost: boolean): Participant {
  return {
    id: randomUUID(),
    name,
    isHost,
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName, true);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostId: participant.id,
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string): JoinRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.participants.some((p) => p.name === playerName)) {
    return { error: "name-taken" };
  }

  const participant = createParticipant(playerName, false);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startGame(code: string, participantId: string): StartGameResult {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not-found" };
  }

  if (participantId !== room.hostId) {
    return { error: "not-host" };
  }

  if (room.participants.length < 2) {
    return { error: "not-enough-players" };
  }

  const word = selectWord([...STARTER_WORDS], 0);

  for (const participant of room.participants) {
    participant.role = participant.isHost ? "drawer" : "guesser";
  }

  room.status = "game";
  room.currentWord = word;
  room.drawerId = room.hostId;
  room.currentRound = 0;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function leaveRoom(code: string, participantId: string): LeaveRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return "not-found";
  }

  room.participants = room.participants.filter((p) => p.id !== participantId);

  if (room.participants.length === 0) {
    rooms.delete(code);
    return "room-removed";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);
  return "left";
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const viewer = room.participants.find((p) => p.id === viewerParticipantId);
  const isViewerDrawer = viewer?.role === "drawer";

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostId: room.hostId,
    currentRound: room.currentRound ?? 0,
    secretWord: isViewerDrawer ? room.currentWord : undefined,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
