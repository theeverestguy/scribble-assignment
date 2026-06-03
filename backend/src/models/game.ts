export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "game" | "results";

export interface Point {
  x: number;
  y: number;
}

export interface Guess {
  id: string;
  participantId: string;
  text: string;
  isCorrect: boolean;
  awardedPoints: number;
  timestamp: string;
}

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  role?: ParticipantRole;
  score: number;
  hasScoredThisRound: boolean;
  joinedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  currentWord?: string;
  drawerId?: string;
  currentRound?: number;
  strokes: { points: Point[] }[];
  guesses: Guess[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  currentRound: number;
  secretWord?: string;
  strokes: { points: Point[] }[];
  guesses: Guess[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
