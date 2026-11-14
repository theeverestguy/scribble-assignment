import type { PropsWithChildren } from "react";
import scribbleLogo from "../assets/scribble-logo.svg";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div>
          <p className="app-shell__eyebrow">Multiplayer Game</p>
          <div className="app-shell__brand">
            <img className="app-shell__logo" src={scribbleLogo} alt="" />
            <p className="app-shell__title">Scribble</p>
          </div>
          <p className="app-shell__lede">
            A real-time multiplayer drawing and guessing game.
          </p>
        </div>
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
