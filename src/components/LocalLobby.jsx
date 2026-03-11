export default function LocalLobby({ onBack, onStart }) {
  return (
    <div className="page">
      <div className="container small">
        <div className="panel">
          <div className="top-row">
            <h1>Lokal 1v1</h1>
            <button className="btn dark" onClick={onBack}>
              ← Zurück
            </button>
          </div>

          <p>Zwei Spieler auf einem Gerät.</p>

          <button className="btn green" onClick={onStart}>
            Spiel starten
          </button>
        </div>
      </div>
    </div>
  );
}