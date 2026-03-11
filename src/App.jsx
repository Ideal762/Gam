import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import LocalLobby from "./components/LocalLobby";
import OnlineLobby from "./components/OnlineLobby";
import UltimateBoard from "./components/UltimateBoard";
import { createUltimateState, makeMove, resetUltimateState } from "./games/ultimate";
import "./styles.css";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [localGame, setLocalGame] = useState(() =>
    createUltimateState("Spieler X", "Spieler O")
  );

  function startLocalGame() {
    setLocalGame(createUltimateState("Spieler X", "Spieler O"));
    setScreen("local");
  }

  function handleLocalMove(boardIndex, cellIndex) {
    setLocalGame((prev) => makeMove(prev, boardIndex, cellIndex));
  }

  function resetLocalGame() {
    setLocalGame(resetUltimateState(localGame.players.X, localGame.players.O));
  }

  return (
    <div className="app-shell">
      {screen === "home" && (
        <HomeScreen
          playerName={playerName}
          setPlayerName={setPlayerName}
          onStartLocal={startLocalGame}
          onOpenOnline={() => setScreen("online-lobby")}
        />
      )}

      {screen === "online-lobby" && (
        <OnlineLobby
          playerName={playerName}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "local-lobby" && (
        <LocalLobby
          onBack={() => setScreen("home")}
          onStart={startLocalGame}
        />
      )}

      {screen === "local" && (
        <UltimateBoard
          title="Ultimate Tic-Tac-Toe"
          subtitle="Lokal 1v1"
          gameState={localGame}
          onMove={handleLocalMove}
          onBack={() => setScreen("home")}
          onReset={resetLocalGame}
          isLocal={true}
        />
      )}
    </div>
  );
}
