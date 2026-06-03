import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { ResultsView } from "../components/ResultsView";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const { room, participantId } = useRoomState();
  const store = useRoomStore();
  const [guessFeedback, setGuessFeedback] = useState<{ correct: boolean; text: string } | null>(null);

  const navigateHome = useCallback(() => navigate("/", { replace: true }), [navigate]);
  const navigateLobby = useCallback(() => navigate("/lobby", { replace: true }), [navigate]);

  useEffect(() => {
    if (!room) {
      navigateHome();
      return;
    }

    if (room.status === "lobby") {
      navigateLobby();
    }
  }, [navigateHome, navigateLobby, room]);

  if (!room || room.status === "lobby") {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;

  async function handleRestart() {
    try {
      await store.restartGame();
      navigateLobby();
    } catch {
      navigateLobby();
    }
  }

  if (room.status === "results") {
    return <ResultsView room={room} viewer={viewer} onRestart={handleRestart} />;
  }

  const isDrawer = viewer?.role === "drawer";
  const roundNumber = (room.currentRound ?? 0) + 1;

  async function handleDraw(points: { x: number; y: number }[]) {
    await store.submitDraw(points);
  }

  async function handleClear() {
    await store.clearCanvas();
  }

  async function handleGuess(text: string) {
    const result = await store.submitGuess(text);
    setGuessFeedback({ correct: result.correct, text });

    setTimeout(() => {
      setGuessFeedback(null);
    }, 3000);
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {roundNumber}</span>
          <h1 className="game-page__title">{isDrawer ? "Draw the Word!" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          {isDrawer && room.secretWord && (
            <Card title="Your Secret Word">
              <div className="secret-word-display" style={{ fontSize: "2rem", textAlign: "center", padding: "1rem", fontWeight: "bold" }}>
                {room.secretWord}
              </div>
            </Card>
          )}
          <Card title="Canvas">
            <Canvas
              strokes={room.strokes}
              isDrawer={isDrawer}
              onDraw={handleDraw}
              onClear={handleClear}
            />
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>
                  {viewer?.name ?? "Unknown player"}
                  {viewer && <span className="player-list__badge"> ({viewer.role === "drawer" ? "Drawer" : "Guesser"})</span>}
                </dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{viewer?.role === "drawer" ? "Drawer" : "Guesser"}</dd>
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
                    {p.role && <span className="player-list__badge"> ({p.role === "drawer" ? "Drawer" : "Guesser"})</span>}
                    {p.id === participantId && <span className="player-list__badge"> (You)</span>}
                  </span>
                  <span style={{ marginLeft: "0.5rem", fontWeight: "bold" }}>{p.score} pts</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Guess History">
            {room.guesses.length === 0 ? (
              <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
                No guesses yet
              </div>
            ) : (
              <ul className="guess-history" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {room.guesses.map((guess) => (
                  <li
                    key={guess.id}
                    style={{
                      padding: "0.25rem 0",
                      borderBottom: "1px solid #f3f4f6",
                      display: "flex",
                      justifyContent: "space-between"
                    }}
                  >
                    <span>
                      <strong>{guess.text}</strong>
                      {guess.isCorrect && <span style={{ color: "green", marginLeft: "0.5rem" }}>✓</span>}
                    </span>
                    <span>
                      {guess.awardedPoints > 0 && <span style={{ color: "green", fontWeight: "bold" }}>+{guess.awardedPoints}</span>}
                      {guess.isCorrect ? <span style={{ color: "green", marginLeft: "0.25rem" }}>Correct</span> : <span style={{ color: "#9ca3af", marginLeft: "0.25rem" }}>Incorrect</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {!isDrawer && (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuess} />
              {guessFeedback && (
                <div style={{ marginTop: "0.5rem", fontWeight: "bold", color: guessFeedback.correct ? "green" : "#ef4444" }}>
                  {guessFeedback.correct ? "Correct!" : "Incorrect"}
                </div>
              )}
            </Card>
          )}
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
