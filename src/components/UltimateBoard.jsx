import { getMeta, getActiveBoards } from "../games/ultimate";

function Cell({ value, disabled, onClick }) {
  return (
    <button className="cell" disabled={disabled} onClick={onClick}>
      {value}
    </button>
  );
}

function SmallBoard({
  board,
  boardIndex,
  boardWinner,
  boardDraw,
  isActive,
  gameOver,
  onMove,
}) {
  return (
    <div className={`small-board ${isActive ? "active" : ""}`}>
      <div className="small-board-grid">
        {board.map((cell, cellIndex) => (
          <Cell
            key={cellIndex}
            value={cell}
            disabled={gameOver || !!cell || !!boardWinner || boardDraw || !isActive}
            onClick={() => onMove(boardIndex, cellIndex)}
          />
        ))}
      </div>

      {(boardWinner || boardDraw) && (
        <div className="small-board-overlay">{boardWinner || "—"}</div>
      )}
    </div>
  );
}

function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard?.writeText(text);
}

export default function UltimateBoard({
  title,
  subtitle,
  gameState,
  onMove,
  onBack,
  onReset,
  isLocal,
  roomCode,
}) {
  const meta = getMeta(gameState.boards);
  const activeBoards = getActiveBoards(gameState.boards, gameState.nextBoard, meta);

  let status = "";
  if (meta.bigWinner) status = `Spieler ${meta.bigWinner} gewinnt das Spiel`;
  else if (meta.bigDraw) status = "Unentschieden";
  else if (isLocal) status = `Spieler ${gameState.currentPlayer} ist dran`;
  else status = `Warte auf ${gameState.currentPlayer}`;

  return (
    <div className="page">
      <div className="container wide">
        <div className="panel">
          <div className="top-row">
            <button className="btn dark" onClick={onBack}>
              ← Zurück
            </button>

            <div className="game-actions">
              {!isLocal && roomCode ? (
                <button
                  className="btn dark"
                  onClick={() => copyToClipboard(roomCode)}
                >
                  Code kopieren
                </button>
              ) : null}

              <div className="board-mode-label">
                {isLocal ? "Lokal 1v1" : `Raum: ${roomCode || "-"}`}
              </div>
            </div>
          </div>
        </div>

        <div className="info-grid">
          <div className="panel compact">
            <span className="muted">{isLocal ? "Aktiver Spieler" : "Am Zug"}</span>
            <strong className="big">{gameState.currentPlayer}</strong>
          </div>

          <div className="panel compact">
            <span className="muted">Spieler X</span>
            <strong className="big">{gameState.players?.X || "Spieler X"}</strong>
          </div>

          <div className="panel compact">
            <span className="muted">Spieler O</span>
            <strong className="big">{gameState.players?.O || "Spieler O"}</strong>
          </div>
        </div>

        <div className="panel board-panel">
          <h1 className="board-title">{title}</h1>
          {subtitle ? <p className="board-subtitle">{subtitle}</p> : null}
          <p className="status">{status}</p>

          <div className="board-toolbar">
            <button className="btn blue" onClick={onReset}>
              Neue Runde
            </button>
          </div>

          <div className="ultimate-wrapper">
            <div className="ultimate-grid">
              {gameState.boards.map((board, boardIndex) => (
                <SmallBoard
                  key={boardIndex}
                  board={board}
                  boardIndex={boardIndex}
                  boardWinner={meta.winners[boardIndex]}
                  boardDraw={meta.draws[boardIndex]}
                  isActive={activeBoards.includes(boardIndex)}
                  gameOver={!!meta.bigWinner || !!meta.bigDraw}
                  onMove={onMove}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>Regeln</h2>
          <p>
            Wenn du in einem kleinen Feld spielst, schickst du den Gegner in das
            entsprechende nächste Feld. Drei gewonnene kleine Bretter in einer
            Reihe gewinnen das ganze Spiel.
          </p>
        </div>
      </div>
    </div>
  );
}
