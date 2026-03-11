import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import HomeScreen from "./components/HomeScreen";
import OnlineLobby from "./components/OnlineLobby";
import UltimateBoard from "./components/UltimateBoard";
import {
  createUltimateState,
  makeMove,
  resetUltimateState,
} from "./games/ultimate";
import "./styles.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [localGame, setLocalGame] = useState(() =>
    createUltimateState("Spieler X", "Spieler O")
  );

  const [onlineGame, setOnlineGame] = useState(null);
  const [onlineRoomId, setOnlineRoomId] = useState(null);
  const [onlineRole, setOnlineRole] = useState(null); // X oder O

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

  async function createRoom() {
    if (!supabase) {
      setError("Supabase nicht eingerichtet.");
      return;
    }

    setLoading(true);
    setError("");

    const code = randomCode();
    const state = createUltimateState(playerName || "Spieler X", "Wartet...");

    const { data, error } = await supabase
      .from("rooms")
      .insert([{ code, game: "ultimate", state }])
      .select()
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setRoomCode(code);
    setOnlineRoomId(data.id);
    setOnlineGame(data.state);
    setOnlineRole("X");
    setScreen("online");
  }

  async function joinRoom() {
    if (!supabase) {
      setError("Supabase nicht eingerichtet.");
      return;
    }

    if (!roomCode.trim()) {
      setError("Bitte Raumcode eingeben.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode.trim().toUpperCase())
      .single();

    if (error || !data) {
      setLoading(false);
      setError("Raum nicht gefunden.");
      return;
    }

    const updatedState = {
      ...data.state,
      players: {
        ...data.state.players,
        O: playerName || "Spieler O",
      },
    };

    const { data: updated, error: updateError } = await supabase
      .from("rooms")
      .update({ state: updatedState })
      .eq("id", data.id)
      .select()
      .single();

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setOnlineRoomId(updated.id);
    setOnlineGame(updated.state);
    setOnlineRole("O");
    setScreen("online");
  }

  async function updateOnlineGame(nextState) {
    if (!supabase || !onlineRoomId) return;

    const { error } = await supabase
      .from("rooms")
      .update({ state: nextState })
      .eq("id", onlineRoomId);

    if (error) {
      setError(error.message);
    } else {
      setOnlineGame(nextState);
    }
  }

  function handleOnlineMove(boardIndex, cellIndex) {
    if (!onlineGame || !onlineRole) return;
    if (onlineGame.currentPlayer !== onlineRole) return;

    const next = makeMove(onlineGame, boardIndex, cellIndex);
    if (next !== onlineGame) {
      updateOnlineGame(next);
    }
  }

  function resetOnlineGame() {
    if (!onlineGame) return;
    const next = resetUltimateState(
      onlineGame.players?.X || "Spieler X",
      onlineGame.players?.O || "Spieler O"
    );
    updateOnlineGame(next);
  }

  useEffect(() => {
    if (!supabase || !onlineRoomId || screen !== "online") return;

    const channel = supabase
      .channel(`room-${onlineRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${onlineRoomId}`,
        },
        (payload) => {
          if (payload.new?.state) {
            setOnlineGame(payload.new.state);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onlineRoomId, screen]);

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
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          loading={loading}
          error={error}
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

      {screen === "online" && onlineGame && (
        <UltimateBoard
          title="Ultimate Tic-Tac-Toe"
          subtitle={`Online 1v1 • Raum ${roomCode}`}
          gameState={onlineGame}
          onMove={handleOnlineMove}
          onBack={() => setScreen("home")}
          onReset={resetOnlineGame}
          isLocal={false}
          roomCode={roomCode}
        />
      )}
    </div>
  );
}
