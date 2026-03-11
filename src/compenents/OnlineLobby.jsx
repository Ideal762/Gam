export default function OnlineLobby({
  playerName,
  roomCode,
  setRoomCode,
  onBack,
}) {
  return (
    <div className="page">
      <div className="container small">
        <div className="panel">
          <div className="top-row">
            <h1>Online 1v1</h1>
            <button className="btn dark" onClick={onBack}>
              ← Zurück
            </button>
          </div>

          <p>
            Dieser Bereich ist jetzt erstmal nur vorbereitet, damit die Struktur
            sauber bleibt.
          </p>

          <div className="info-box">
            <p><strong>Name:</strong> {playerName || "Nicht gesetzt"}</p>
          </div>

          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Raumcode"
          />

          <div className="game-actions">
            <button className="btn blue" disabled>
              Raum erstellen
            </button>
            <button className="btn dark" disabled>
              Beitreten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}