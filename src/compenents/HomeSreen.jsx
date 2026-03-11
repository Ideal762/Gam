import GameCard from "./GameCard";

export default function HomeScreen({
  playerName,
  setPlayerName,
  onStartLocal,
  onOpenOnline,
}) {
  return (
    <div className="page">
      <div className="container">
        <div className="hero-card">
          <div>
            <h1>GAM Games</h1>
            <p>Mehrere Spiele auf einer Plattform.</p>
          </div>

          <div className="name-box">
            <label>Dein Name</label>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Name eingeben"
            />
          </div>
        </div>

        <div className="grid-home">
          <div className="panel">
            <h2>Spiele</h2>

            <div className="game-list">
              <GameCard
                title="Ultimate Tic-Tac-Toe"
                description="Lokal 1v1 oder später online."
                status="Live"
                actions={
                  <>
                    <button className="btn green" onClick={onStartLocal}>
                      Lokal 1v1
                    </button>
                    <button className="btn blue" onClick={onOpenOnline}>
                      Online 1v1
                    </button>
                  </>
                }
              />

              <GameCard
                title="Classic Tic-Tac-Toe"
                description="Kommt später."
                status="Bald"
              />

              <GameCard
                title="Connect Four"
                description="Kommt später."
                status="Bald"
              />
            </div>
          </div>

          <div className="panel">
            <h2>Infos</h2>
            <p>
              Wir starten erstmal mit einer sauberen Basis. Danach können wir
              Online, Vorschläge, Bots und weitere Spiele wieder ordentlich
              einbauen.
            </p>

            <div className="info-box">
              <strong>Nächste sinnvolle Schritte:</strong>
              <p>Online 1v1 sauber</p>
              <p>Spielvorschläge</p>
              <p>Weitere Spiele</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}