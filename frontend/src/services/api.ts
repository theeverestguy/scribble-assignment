export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "game";

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

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({ message: "Request failed" }))) as {
      message?: string;
    };

    throw new Error(errorBody.message ?? "Request failed");
  }

  return (await response.json()) as T;
}

export const api = {
  createRoom(playerName: string) {
    return request<RoomSessionResponse>("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  },
  joinRoom(code: string, playerName: string) {
    return request<RoomSessionResponse>(`/rooms/${encodeURIComponent(code)}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  },
  fetchRoom(code: string, participantId?: string) {
    const query = participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}${query}`);
  },
  startGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  submitDraw(code: string, participantId: string, points: Point[]) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/draw`, {
      method: "POST",
      body: JSON.stringify({ participantId, points })
    });
  },
  clearCanvas(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/clear`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ guess: Guess; correct: boolean; points: number }>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      body: JSON.stringify({ participantId, text })
    });
  },
  leaveRoom(code: string, participantId: string) {
    return fetch(`${API_BASE_URL}/rooms/${encodeURIComponent(code)}/players/${encodeURIComponent(participantId)}`, {
      method: "DELETE",
      keepalive: true
    });
  }
};
