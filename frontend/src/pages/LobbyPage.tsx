import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }
    if (room.status === "game") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room]);

  async function handleStartGame() {
    try {
      setStartError(null);
      await roomStore.startGame();
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const canStart = isHost && room.participants.length >= 2;

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>
                    {participant.name}
                    {participant.isHost && (
                      <span className="player-list__badge"> (Host)</span>
                    )}
                    {participant.id === participantId && (
                      <span className="player-list__badge"> (You)</span>
                    )}
                  </span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p
            className="status-line"
            style={{
              backgroundColor: isLoading ? "#fef3c7" : "#e0e7ff",
              color: isLoading ? "#b45309" : "#3730a3"
            }}
          >
            {isLoading ? "Syncing..." : "Live"}
          </p>
          <p style={{ marginTop: "8px" }}>
            {error ?? startError ?? (isHost ? "You are the host." : "Waiting for the host to start the game.")}
          </p>
        </Card>
      </div>

      {isHost && (
        <div className="button-row button-row--spread">
          <button
            className="button button--primary"
            onClick={handleStartGame}
            disabled={!canStart || isLoading}
            title={!canStart ? "Need at least 2 players to start" : undefined}
          >
            {canStart ? "Start Game" : "Waiting for players..."}
          </button>
        </div>
      )}
    </section>
  );
}
