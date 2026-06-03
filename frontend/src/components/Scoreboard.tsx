import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      {sorted.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sorted.map((p, index) => (
            <li
              key={p.id}
              style={{
                padding: "0.25rem 0",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                justifyContent: "space-between"
              }}
            >
              <span>
                {index === 0 && <span style={{ marginRight: "0.25rem" }}>🥇</span>}
                {index === 1 && <span style={{ marginRight: "0.25rem" }}>🥈</span>}
                {index === 2 && <span style={{ marginRight: "0.25rem" }}>🥉</span>}
                {p.name}
              </span>
              <strong>{p.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
