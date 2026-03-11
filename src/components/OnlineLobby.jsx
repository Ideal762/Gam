export default function OnlineLobby({
  playerName,
  roomCode,
  setRoomCode,
  onBack,
  onCreateRoom,
  onJoinRoom,
  loading,
  error,
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

          <p>Erstelle einen Raum oder tritt mit Code bei.</p>

          <div className="info-box">
            <p><strong>Name:</strong> {playerName || "Nicht gesetzt"}</p>
          </div>
        </div>

        <div className="online-lobby-grid">
          <div className="panel">
            <h2>Raum erstellen</h2>
            <p>Du wirst Spieler X.</p>
            <button className="btn blue" onClick={onCreateRoom} disabled={loading}>
              {loading ? "Lädt..." : "Raum erstellen"}
            </button>
          </div>

          <div className="panel">
            <h2>Raum beitreten</h2>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Raumcode"
            />

            <div className="game-actions" style={{ marginTop: "14px" }}>
              <button className="btn dark" onClick={onJoinRoom} disabled={loading}>
                {loading ? "Lädt..." : "Beitreten"}
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="panel">
            <p style={{ color: "#f87171", margin: 0 }}>{error}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
