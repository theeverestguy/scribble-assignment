import type { Participant, RoomSnapshot } from "../services/api";
import { Card } from "./Card";
import { RoomCodeBadge } from "./RoomCodeBadge";

interface ResultsViewProps {
  room: RoomSnapshot;
  viewer: Participant | null;
  onRestart?: () => void;
}

function getWinner(participants: Participant[]): Participant | null {
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  if (sorted.length === 0 || sorted[0].score === 0) return null;
  return sorted[0];
}

export function ResultsView({ room, viewer, onRestart }: ResultsViewProps) {
  const winner = getWinner(room.participants);
  const sortedParticipants = [...room.participants].sort((a, b) => b.score - a.score);
  const isHost = viewer?.isHost === true;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round Complete</span>
          <h1 className="game-page__title">Results</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Card title="Winner">
            {winner ? (
              <div style={{ textAlign: "center", padding: "1rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🏆</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{winner.name}</div>
                <div style={{ color: "#6b7280", marginTop: "0.25rem" }}>{winner.score} points</div>
              </div>
            ) : (
              <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
                No winner
              </div>
            )}
          </Card>

          <Card title="Scoreboard">
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {sortedParticipants.map((p, index) => (
                <li
                  key={p.id}
                  style={{
                    padding: "0.5rem 0",
                    borderBottom: "1px solid #f3f4f6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span>
                    {index === 0 && <span style={{ marginRight: "0.25rem" }}>🥇</span>}
                    {index === 1 && <span style={{ marginRight: "0.25rem" }}>🥈</span>}
                    {index === 2 && <span style={{ marginRight: "0.25rem" }}>🥉</span>}
                    {p.name}
                    {p.isHost && <span className="player-list__badge"> (Host)</span>}
                    {p.id === viewer?.id && <span className="player-list__badge"> (You)</span>}
                  </span>
                  <strong>{p.score}</strong>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        <div className="game-page__main">
          <Card title="The Word Was">
            <div
              style={{
                fontSize: "2rem",
                textAlign: "center",
                padding: "2rem 1rem",
                fontWeight: "bold",
                letterSpacing: "0.05em"
              }}
            >
              {room.secretWord}
            </div>
          </Card>

          <Card title="Guess History">
            {room.guesses.length === 0 ? (
              <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
                No guesses were made
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {room.guesses.map((guess) => {
                  const guesser = room.participants.find((p) => p.id === guess.participantId);
                  return (
                    <li
                      key={guess.id}
                      style={{
                        padding: "0.5rem 0",
                        borderBottom: "1px solid #f3f4f6",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span>
                        <span style={{ color: "#6b7280", marginRight: "0.5rem" }}>{guesser?.name ?? "Unknown"}:</span>
                        <strong>{guess.text}</strong>
                      </span>
                      <span>
                        {guess.isCorrect ? (
                          <span style={{ color: "green", fontWeight: "bold" }}>
                            ✓ Correct
                            {guess.awardedPoints > 0 && <> +{guess.awardedPoints}</>}
                          </span>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>✗ Incorrect</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {isHost && (
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button
                className="button button--primary"
                style={{ fontSize: "1.1rem", padding: "0.75rem 2rem" }}
                onClick={onRestart}
              >
                Restart Game
              </button>
            </div>
          )}
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Round complete</dd>
              </div>
            </dl>
          </Card>

          <Card title="Participants">
            <ul className="player-list">
              {room.participants.map((p) => (
                <li key={p.id}>
                  <span>
                    {p.name}
                    {p.isHost && <span className="player-list__badge"> (Host)</span>}
                    {p.id === viewer?.id && <span className="player-list__badge"> (You)</span>}
                  </span>
                  <span style={{ marginLeft: "0.5rem", fontWeight: "bold" }}>{p.score} pts</span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </section>
  );
}
