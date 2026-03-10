import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 4, 6],
  [0, 4, 8],
  [2, 4, 6],
];

const GAME_CATALOG = [
  {
    id: "ultimate-ttt",
    title: "Ultimate Tic-Tac-Toe",
    description: "Das aktuelle Hauptspiel mit Online-Räumen.",
    status: "live",
  },
  {
    id: "classic-ttt",
    title: "Classic Tic-Tac-Toe",
    description: "Kleines schnelles 3x3 für später.",
    status: "coming-soon",
  },
  {
    id: "connect-four",
    title: "Connect Four",
    description: "Vier gewinnt als nächstes Brettspiel.",
    status: "coming-soon",
  },
  {
    id: "memory-duel",
    title: "Memory Duel",
    description: "Kurzes 1v1 Memory für Handy und Browser.",
    status: "coming-soon",
  },
];

function getWinner(cells) {
  for (const [a, b, c] of WIN_LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) return cells[a];
  }
  return null;
}

function isFull(cells) {
  return cells.every((cell) => cell !== null);
}

function createBoards() {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

function createGameState(hostName = "Host") {
  return {
    boards: createBoards(),
    currentPlayer: "X",
    nextBoard: null,
    history: [],
    players: {
      X: hostName,
      O: null,
    },
  };
}

function computeMeta(boards) {
  const winners = boards.map((board) => getWinner(board));
  const draws = boards.map((board, i) => !winners[i] && isFull(board));
  const bigWinner = getWinner(winners);
  const bigDraw = !bigWinner && winners.every((w, i) => w || draws[i]);
  return { winners, draws, bigWinner, bigDraw };
}

function getActiveBoards(boards, nextBoard, meta) {
  if (nextBoard !== null && !meta.winners[nextBoard] && !meta.draws[nextBoard]) {
    return [nextBoard];
  }
  return boards.map((_, i) => i).filter((i) => !meta.winners[i] && !meta.draws[i]);
}

function randomRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function Shell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0b1120 0%, #111827 55%, #0f172a 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>{children}</div>
    </div>
  );
}

function SectionCard({ children, style }) {
  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.88)",
        border: "1px solid rgba(148, 163, 184, 0.15)",
        borderRadius: "18px",
        padding: "18px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Cell({ value, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        fontSize: "22px",
        fontWeight: "bold",
        border: "1px solid #475569",
        background: disabled ? "#1e293b" : "#334155",
        color: "white",
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: "8px",
      }}
    >
      {value}
    </button>
  );
}

function SmallBoard({ board, boardIndex, boardWinner, boardDraw, isActive, onMove, gameOver }) {
  return (
    <div
      style={{
        position: "relative",
        padding: "6px",
        background: isActive ? "#1d4ed8" : "#0f172a",
        border: isActive ? "2px solid #7dd3fc" : "2px solid #334155",
        borderRadius: "12px",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            fontSize: "42px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          {boardWinner ? boardWinner : "—"}
        </div>
      )}
    </div>
  );
}

function GameCard({ game, onOpen, active }) {
  const statusText = game.status === "live" ? "Live" : "Bald";
  const statusColor = game.status === "live" ? "#22c55e" : "#f59e0b";

  return (
    <button
      onClick={() => onOpen(game.id)}
      style={{
        width: "100%",
        textAlign: "left",
        background: active ? "#1e3a8a" : "#0f172a",
        border: active ? "1px solid #7dd3fc" : "1px solid rgba(148,163,184,0.2)",
        borderRadius: "16px",
        padding: "18px",
        color: "white",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
        <strong style={{ fontSize: "20px" }}>{game.title}</strong>
        <span
          style={{
            background: statusColor,
            color: "#07111f",
            fontWeight: "bold",
            borderRadius: "999px",
            padding: "4px 10px",
            fontSize: "12px",
          }}
        >
          {statusText}
        </span>
      </div>
      <p style={{ color: "#cbd5e1", lineHeight: 1.5, marginBottom: 0 }}>{game.description}</p>
    </button>
  );
}

function SuggestionPanel({ playerName }) {
  const [gameName, setGameName] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    async function loadSuggestions() {
      if (!supabase) return;
      const { data } = await supabase
        .from("game_suggestions")
        .select("id, player_name, game_name, details, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      if (data) setSuggestions(data);
    }
    loadSuggestions();
  }, []);

  async function submitSuggestion(e) {
    e.preventDefault();
    if (!supabase) {
      setMessage("Supabase fehlt noch.");
      return;
    }
    if (!gameName.trim()) {
      setMessage("Bitte mindestens einen Spielnamen eingeben.");
      return;
    }

    setSending(true);
    setMessage("");
    const { data, error } = await supabase
      .from("game_suggestions")
      .insert({
        player_name: playerName || "Anonym",
        game_name: gameName.trim(),
        details: details.trim() || null,
      })
      .select()
      .single();

    setSending(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSuggestions((prev) => [data, ...prev].slice(0, 8));
    setGameName("");
    setDetails("");
    setMessage("Vorschlag gespeichert.");
  }

  return (
    <SectionCard>
      <h2 style={{ marginTop: 0, marginBottom: "10px" }}>Spiel vorschlagen</h2>
      <p style={{ color: "#cbd5e1", lineHeight: 1.5 }}>
        Andere Spieler können hier neue Spiele vorschlagen. Diese Vorschläge werden online gespeichert.
      </p>

      <form onSubmit={submitSuggestion}>
        <input
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          placeholder="Zum Beispiel: Schach, Uno, 2048 Duel"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid #334155",
            background: "#020617",
            color: "white",
            boxSizing: "border-box",
            marginBottom: "10px",
          }}
        />
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Was soll das Spiel können? Online, Bot, Ranking, Handy, etc."
          rows={4}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid #334155",
            background: "#020617",
            color: "white",
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
        <button
          type="submit"
          disabled={sending}
          style={{
            marginTop: "12px",
            padding: "12px 18px",
            borderRadius: "10px",
            border: "none",
            background: "#22c55e",
            color: "#07111f",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {sending ? "Speichere..." : "Vorschlag absenden"}
        </button>
      </form>

      {message ? <div style={{ marginTop: "12px", color: "#93c5fd" }}>{message}</div> : null}

      <div style={{ marginTop: "18px" }}>
        <h3 style={{ marginTop: 0 }}>Neueste Vorschläge</h3>
        <div style={{ display: "grid", gap: "10px" }}>
          {suggestions.length === 0 ? (
            <div style={{ color: "#94a3b8" }}>Noch keine Vorschläge.</div>
          ) : (
            suggestions.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#020617",
                  border: "1px solid rgba(148,163,184,0.15)",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{item.game_name}</div>
                <div style={{ color: "#93c5fd", fontSize: "13px", marginTop: "4px" }}>
                  von {item.player_name || "Anonym"}
                </div>
                {item.details ? <div style={{ color: "#cbd5e1", marginTop: "6px" }}>{item.details}</div> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function HomeScreen({ playerName, setPlayerName, selectedGame, setSelectedGame, onStartOnline }) {
  return (
    <Shell>
      <div style={{ display: "grid", gap: "18px" }}>
        <SectionCard>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "42px" }}>Isa Game Hub</h1>
              <p style={{ color: "#cbd5e1", marginBottom: 0 }}>
                Ein Menü mit mehreren Spielen. Ultimate Tic-Tac-Toe ist nur das erste Live-Spiel.
              </p>
            </div>
            <div style={{ minWidth: "260px", flex: 1, maxWidth: "360px" }}>
              <div style={{ color: "#94a3b8", marginBottom: "8px" }}>Dein Name</div>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #334155",
                  background: "#020617",
                  color: "white",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </SectionCard>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "18px" }}>
          <SectionCard>
            <h2 style={{ marginTop: 0 }}>Spiele</h2>
            <div style={{ display: "grid", gap: "12px" }}>
              {GAME_CATALOG.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  active={selectedGame === game.id}
                  onOpen={setSelectedGame}
                />
              ))}
            </div>
            <div style={{ marginTop: "16px" }}>
              <button
                onClick={onStartOnline}
                disabled={selectedGame !== "ultimate-ttt"}
                style={{
                  padding: "14px 20px",
                  borderRadius: "12px",
                  border: "none",
                  background: selectedGame === "ultimate-ttt" ? "#38bdf8" : "#475569",
                  color: "#07111f",
                  fontWeight: "bold",
                  cursor: selectedGame === "ultimate-ttt" ? "pointer" : "not-allowed",
                }}
              >
                {selectedGame === "ultimate-ttt" ? "Ultimate Tic-Tac-Toe öffnen" : "Dieses Spiel kommt später"}
              </button>
            </div>
          </SectionCard>

          <SuggestionPanel playerName={playerName} />
        </div>
      </div>
    </Shell>
  );
}

function OnlineLobby({ playerName, onBack, onCreateRoom, onJoinRoom, roomCodeInput, setRoomCodeInput, loading, error }) {
  return (
    <Shell>
      <div style={{ display: "grid", gap: "18px" }}>
        <SectionCard>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "36px" }}>Ultimate Tic-Tac-Toe Online</h1>
              <p style={{ color: "#cbd5e1", marginBottom: 0 }}>Raum erstellen oder mit Code beitreten.</p>
            </div>
            <button
              onClick={onBack}
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                border: "none",
                background: "#334155",
                color: "white",
                cursor: "pointer",
              }}
            >
              ← Zurück zum Hub
            </button>
          </div>
        </SectionCard>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
          <SectionCard>
            <h2 style={{ marginTop: 0 }}>Raum erstellen</h2>
            <p style={{ color: "#cbd5e1" }}>Du bist Spieler X. Name: {playerName || "Spieler"}</p>
            <button
              onClick={onCreateRoom}
              disabled={loading}
              style={{
                padding: "12px 18px",
                borderRadius: "10px",
                border: "none",
                background: "#22c55e",
                color: "#07111f",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Raum erstellen
            </button>
          </SectionCard>

          <SectionCard>
            <h2 style={{ marginTop: 0 }}>Raum beitreten</h2>
            <input
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="Raumcode"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #334155",
                background: "#020617",
                color: "white",
                boxSizing: "border-box",
                marginBottom: "12px",
              }}
            />
            <button
              onClick={onJoinRoom}
              disabled={loading}
              style={{
                padding: "12px 18px",
                borderRadius: "10px",
                border: "none",
                background: "#38bdf8",
                color: "#07111f",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Beitreten
            </button>
          </SectionCard>
        </div>

        {error ? <div style={{ color: "#fca5a5" }}>{error}</div> : null}
      </div>
    </Shell>
  );
}

function OnlineRoom({ roomCode, mySymbol, room, onLeave, onMove, onReset }) {
  const gameState = room?.state || createGameState();
  const meta = computeMeta(gameState.boards);
  const activeBoards = getActiveBoards(gameState.boards, gameState.nextBoard, meta);

  let status = "";
  if (meta.bigWinner) {
    status = `Spieler ${meta.bigWinner} gewinnt das Spiel`;
  } else if (meta.bigDraw) {
    status = "Unentschieden";
  } else if (gameState.currentPlayer === mySymbol) {
    status = `Du bist dran (${mySymbol})`;
  } else {
    status = `Warte auf ${gameState.currentPlayer}`;
  }

  return (
    <Shell>
      <div style={{ display: "grid", gap: "18px" }}>
        <SectionCard>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={onLeave}
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                border: "none",
                background: "#334155",
                color: "white",
                cursor: "pointer",
              }}
            >
              ← Lobby
            </button>
            <div style={{ color: "#cbd5e1" }}>
              Raumcode: <strong style={{ color: "white", letterSpacing: "1px" }}>{roomCode}</strong>
            </div>
          </div>
        </SectionCard>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          <SectionCard>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>Du spielst als</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", marginTop: "4px" }}>{mySymbol}</div>
          </SectionCard>
          <SectionCard>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>Spieler X</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>{gameState.players?.X || "Wartet..."}</div>
          </SectionCard>
          <SectionCard>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>Spieler O</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>{gameState.players?.O || "Wartet..."}</div>
          </SectionCard>
        </div>

        <SectionCard>
          <h1 style={{ textAlign: "center", marginTop: 0, marginBottom: "10px", fontSize: "34px" }}>Ultimate Tic-Tac-Toe</h1>
          <p style={{ textAlign: "center", marginBottom: "20px", color: "#7dd3fc", fontSize: "18px" }}>{status}</p>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <button
              onClick={onReset}
              style={{
                padding: "10px 18px",
                borderRadius: "10px",
                border: "none",
                background: "#38bdf8",
                color: "#07111f",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Neue Runde
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(220px, 1fr))", gap: "12px" }}>
            {gameState.boards.map((board, boardIndex) => (
              <SmallBoard
                key={boardIndex}
                board={board}
                boardIndex={boardIndex}
                boardWinner={meta.winners[boardIndex]}
                boardDraw={meta.draws[boardIndex]}
                isActive={activeBoards.includes(boardIndex)}
                onMove={onMove}
                gameOver={!!meta.bigWinner || !!meta.bigDraw}
              />
            ))}
          </div>
        </SectionCard>
      </div>
    </Shell>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [playerName, setPlayerName] = useState("Isa");
  const [selectedGame, setSelectedGame] = useState("ultimate-ttt");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mySymbol, setMySymbol] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase || !roomCode || screen !== "room") return;

    const channel = supabase
      .channel(`utt-room-${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "utt_rooms",
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          if (payload.new) setRoom(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, screen]);

  async function createRoom() {
    if (!supabase) {
      setError("Supabase ist noch nicht eingerichtet.");
      return;
    }

    setLoading(true);
    setError("");
    const code = randomRoomCode();
    const state = createGameState(playerName || "Host");

    const { data, error } = await supabase
      .from("utt_rooms")
      .insert({ room_code: code, state })
      .select()
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setRoom(data);
    setRoomCode(code);
    setMySymbol("X");
    setScreen("room");
  }

  async function joinRoom() {
    if (!supabase) {
      setError("Supabase ist noch nicht eingerichtet.");
      return;
    }

    const code = roomCodeInput.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("utt_rooms")
      .select("*")
      .eq("room_code", code)
      .single();

    if (error || !data) {
      setLoading(false);
      setError("Raum nicht gefunden.");
      return;
    }

    const nextState = {
      ...data.state,
      players: {
        ...data.state.players,
        O: data.state.players?.O || playerName || "Gast",
      },
    };

    const { data: updated, error: updateError } = await supabase
      .from("utt_rooms")
      .update({ state: nextState })
      .eq("room_code", code)
      .select()
      .single();

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setRoom(updated);
    setRoomCode(code);
    setMySymbol("O");
    setScreen("room");
  }

  async function saveState(nextState) {
    if (!supabase || !roomCode) return;

    const { data, error } = await supabase
      .from("utt_rooms")
      .update({ state: nextState })
      .eq("room_code", roomCode)
      .select()
      .single();

    if (!error && data) setRoom(data);
  }

  async function handleMove(boardIndex, cellIndex) {
    const gameState = room?.state || createGameState();
    const meta = computeMeta(gameState.boards);
    const activeBoards = getActiveBoards(gameState.boards, gameState.nextBoard, meta);

    if (!room || !mySymbol) return;
    if (gameState.currentPlayer !== mySymbol) return;
    if (!activeBoards.includes(boardIndex)) return;
    if (gameState.boards[boardIndex][cellIndex]) return;
    if (meta.bigWinner || meta.bigDraw) return;

    const nextBoards = gameState.boards.map((b) => [...b]);
    nextBoards[boardIndex][cellIndex] = mySymbol;

    const nextState = {
      ...gameState,
      boards: nextBoards,
      currentPlayer: mySymbol === "X" ? "O" : "X",
      nextBoard: cellIndex,
      history: [
        ...gameState.history,
        {
          boards: gameState.boards.map((b) => [...b]),
          currentPlayer: gameState.currentPlayer,
          nextBoard: gameState.nextBoard,
        },
      ],
    };

    await saveState(nextState);
  }

  async function resetRoom() {
    if (!room) return;
    const nextState = createGameState(room.state.players?.X || "Host");
    nextState.players.O = room.state.players?.O || null;
    await saveState(nextState);
  }

  function leaveRoom() {
    setScreen("online-lobby");
    setRoomCode("");
    setRoom(null);
    setMySymbol(null);
    setError("");
  }

  if (screen === "home") {
    return (
      <HomeScreen
        playerName={playerName}
        setPlayerName={setPlayerName}
        selectedGame={selectedGame}
        setSelectedGame={setSelectedGame}
        onStartOnline={() => {
          setError("");
          setScreen("online-lobby");
        }}
      />
    );
  }

  if (screen === "online-lobby") {
    return (
      <OnlineLobby
        playerName={playerName}
        roomCodeInput={roomCodeInput}
        setRoomCodeInput={setRoomCodeInput}
        loading={loading}
        error={error}
        onBack={() => setScreen("home")}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
      />
    );
  }

  return (
    <OnlineRoom
      roomCode={roomCode}
      mySymbol={mySymbol}
      room={room}
      onLeave={leaveRoom}
      onMove={handleMove}
      onReset={resetRoom}
    />
  );
}
