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
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
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
        border: "1px solid #555",
        background: disabled ? "#222" : "#2d2d2d",
        color: "white",
        cursor: disabled ? "not-allowed" : "pointer",
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
        background: isActive ? "#3a3a3a" : "#1c1c1c",
        border: isActive ? "2px solid #7dd3fc" : "2px solid #333",
        borderRadius: "10px",
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
            borderRadius: "10px",
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

function randomRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function App() {
  const [screen, setScreen] = useState("menu");
  const [playerName, setPlayerName] = useState("Isa");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mySymbol, setMySymbol] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const gameState = room?.state || createGameState();
  const meta = useMemo(() => computeMeta(gameState.boards), [gameState.boards]);
  const activeBoards = useMemo(
    () => getActiveBoards(gameState.boards, gameState.nextBoard, meta),
    [gameState.boards, gameState.nextBoard, meta]
  );

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
      setError("Supabase ist noch nicht eingerichtet. Erst .env anlegen.");
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
      setError("Supabase ist noch nicht eingerichtet. Erst .env anlegen.");
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
    setScreen("menu");
    setRoomCode("");
    setRoom(null);
    setMySymbol(null);
    setError("");
  }

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

  if (screen === "menu") {
    return (
      <div style={{ minHeight: "100vh", background: "#111", color: "white", fontFamily: "Arial, sans-serif", padding: "24px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ textAlign: "center", fontSize: "42px", marginBottom: "10px" }}>Ultimate Tic-Tac-Toe Online</h1>
          <p style={{ textAlign: "center", color: "#cbd5e1", fontSize: "18px", marginBottom: "28px" }}>
            Echter Online-Raum mit Supabase.
          </p>

          <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "16px", padding: "20px", marginBottom: "18px" }}>
            <h2 style={{ marginTop: 0 }}>Dein Name</h2>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #444", background: "#0f172a", color: "white", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
            <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "16px", padding: "20px" }}>
              <h2 style={{ marginTop: 0 }}>Raum erstellen</h2>
              <p style={{ color: "#cbd5e1", lineHeight: 1.5 }}>Du wirst Spieler X und bekommst einen Code zum Teilen.</p>
              <button onClick={createRoom} disabled={loading} style={{ padding: "12px 18px", borderRadius: "10px", border: "none", background: "#22c55e", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                Raum erstellen
              </button>
            </div>

            <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "16px", padding: "20px" }}>
              <h2 style={{ marginTop: 0 }}>Raum beitreten</h2>
              <input
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="Raumcode"
                style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #444", background: "#0f172a", color: "white", boxSizing: "border-box", marginBottom: "12px" }}
              />
              <button onClick={joinRoom} disabled={loading} style={{ padding: "12px 18px", borderRadius: "10px", border: "none", background: "#334155", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                Beitreten
              </button>
            </div>
          </div>

          {error ? <div style={{ marginTop: "18px", color: "#fca5a5" }}>{error}</div> : null}

          {!supabase ? (
            <div style={{ marginTop: "22px", background: "#1a1a1a", borderRadius: "14px", padding: "18px", color: "#fcd34d", lineHeight: 1.6 }}>
              Supabase ist noch nicht eingerichtet. Lege zuerst <strong>.env</strong> mit VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY an.
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "white", fontFamily: "Arial, sans-serif", padding: "20px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
          <button onClick={leaveRoom} style={{ padding: "10px 18px", borderRadius: "8px", border: "none", background: "#374151", color: "white", cursor: "pointer" }}>
            ← Menü
          </button>
          <div style={{ color: "#cbd5e1", alignSelf: "center" }}>
            Raumcode: <strong style={{ color: "white", letterSpacing: "1px" }}>{roomCode}</strong>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "18px" }}>
          <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "14px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>Du spielst als</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", marginTop: "4px" }}>{mySymbol}</div>
          </div>
          <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "14px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>Spieler X</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>{gameState.players?.X || "Wartet..."}</div>
          </div>
          <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "14px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>Spieler O</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>{gameState.players?.O || "Wartet..."}</div>
          </div>
        </div>

        <h1 style={{ textAlign: "center", marginBottom: "10px", fontSize: "36px" }}>Ultimate Tic-Tac-Toe Online</h1>
        <p style={{ textAlign: "center", marginBottom: "20px", color: "#7dd3fc", fontSize: "18px" }}>{status}</p>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <button onClick={resetRoom} style={{ padding: "10px 18px", borderRadius: "8px", border: "none", background: "#0ea5e9", color: "white", cursor: "pointer" }}>
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
              onMove={handleMove}
              gameOver={!!meta.bigWinner || !!meta.bigDraw}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
