import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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

const GAMES = [
  {
    id: "ultimate",
    title: "Ultimate Tic-Tac-Toe",
    desc: "Online spielbar mit Raumcode.",
    live: true,
  },
  {
    id: "classic",
    title: "Classic Tic-Tac-Toe",
    desc: "Kommt später.",
    live: false,
  },
  {
    id: "connect4",
    title: "Connect Four",
    desc: "Kommt später.",
    live: false,
  },
];

function createBoards() {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

function createState(host = "Host") {
  return {
    boards: createBoards(),
    currentPlayer: "X",
    nextBoard: null,
    history: [],
    players: { X: host, O: null },
  };
}

function getWinner(cells) {
  for (const [a, b, c] of WIN_LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a];
    }
  }
  return null;
}

function isFull(cells) {
  return cells.every(Boolean);
}

function getMeta(boards) {
  const winners = boards.map(getWinner);
  const draws = boards.map((b, i) => !winners[i] && isFull(b));
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

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function pageStyle() {
  return {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0f172a, #111827)",
    color: "white",
    fontFamily: "Arial, sans-serif",
    padding: "16px",
    boxSizing: "border-box",
  };
}

function cardStyle() {
  return {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "18px",
    padding: "18px",
    boxSizing: "border-box",
  };
}

function buttonStyle(bg = "#38bdf8", color = "#07111f") {
  return {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "none",
    background: bg,
    color,
    fontWeight: "bold",
    cursor: "pointer",
  };
}

function inputStyle() {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "#020617",
    color: "white",
    boxSizing: "border-box",
  };
}

function Cell({ value, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        border: "1px solid #475569",
        borderRadius: "8px",
        background: disabled ? "#1e293b" : "#334155",
        color: "white",
        fontSize: "clamp(18px, 2vw, 24px)",
        fontWeight: "bold",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {value}
    </button>
  );
}

function SmallBoard({ board, boardIndex, boardWinner, boardDraw, isActive, gameOver, onMove }) {
  return (
    <div
      style={{
        position: "relative",
        padding: "6px",
        borderRadius: "12px",
        background: isActive ? "#1d4ed8" : "#0f172a",
        border: isActive ? "2px solid #7dd3fc" : "2px solid #334155",
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
            borderRadius: "12px",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
            fontWeight: "bold",
          }}
        >
          {boardWinner || "—"}
        </div>
      )}
    </div>
  );
}

function Suggestions({ playerName }) {
  const [gameName, setGameName] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data } = await supabase
        .from("game_suggestions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      if (data) setItems(data);
    }
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!supabase) {
      setMessage("Supabase fehlt.");
      return;
    }
    if (!gameName.trim()) {
      setMessage("Bitte Spielnamen eingeben.");
      return;
    }

    const { data, error } = await supabase
      .from("game_suggestions")
      .insert({
        player_name: playerName || "Anonym",
        game_name: gameName.trim(),
        details: details.trim() || null,
      })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setItems((prev) => [data, ...prev].slice(0, 6));
    setGameName("");
    setDetails("");
    setMessage("Vorschlag gespeichert.");
  }

  return (
    <div style={cardStyle()}>
      <h2 style={{ marginTop: 0 }}>Spiel vorschlagen</h2>
      <form onSubmit={submit}>
        <input
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          placeholder="Spielname"
          style={{ ...inputStyle(), marginBottom: "10px" }}
        />
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Beschreibung"
          rows={4}
          style={{ ...inputStyle(), resize: "vertical" }}
        />
        <button type="submit" style={{ ...buttonStyle("#22c55e"), marginTop: "12px" }}>
          Vorschlag absenden
        </button>
      </form>

      {message ? <div style={{ marginTop: "10px", color: "#93c5fd" }}>{message}</div> : null}

      <div style={{ marginTop: "18px", display: "grid", gap: "10px" }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#020617",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              padding: "12px",
            }}
          >
            <strong>{item.game_name}</strong>
            <div style={{ color: "#93c5fd", fontSize: "13px", marginTop: "4px" }}>
              von {item.player_name || "Anonym"}
            </div>
            {item.details ? (
              <div style={{ color: "#cbd5e1", marginTop: "6px" }}>{item.details}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function Home({ playerName, setPlayerName, selectedGame, setSelectedGame, onOpenGame }) {
  return (
    <div style={pageStyle()}>
      <div style={{ width: "100%", maxWidth: "1500px", margin: "0 auto", display: "grid", gap: "18px" }}>
        <div style={cardStyle()}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 46px)" }}>GAM Games</h1>
              <p style={{ color: "#cbd5e1", marginBottom: 0 }}>
                Mehrere Spiele auf einer Plattform.
              </p>
            </div>

            <div style={{ width: "100%", maxWidth: "320px" }}>
              <div style={{ marginBottom: "8px", color: "#94a3b8" }}>Dein Name</div>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={inputStyle()}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "18px",
            alignItems: "start",
          }}
        >
          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>Spiele</h2>
            <div style={{ display: "grid", gap: "12px" }}>
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  style={{
                    ...cardStyle(),
                    padding: "16px",
                    textAlign: "left",
                    cursor: "pointer",
                    background: selectedGame === game.id ? "#1e3a8a" : "#0f172a",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <strong style={{ fontSize: "20px" }}>{game.title}</strong>
                    <span
                      style={{
                        background: game.live ? "#22c55e" : "#f59e0b",
                        color: "#07111f",
                        borderRadius: "999px",
                        padding: "4px 10px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {game.live ? "Live" : "Bald"}
                    </span>
                  </div>
                  <p style={{ marginBottom: 0, color: "#cbd5e1" }}>{game.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={onOpenGame}
              disabled={selectedGame !== "ultimate"}
              style={{
                ...buttonStyle(),
                marginTop: "16px",
                background: selectedGame === "ultimate" ? "#38bdf8" : "#475569",
              }}
            >
              {selectedGame === "ultimate"
                ? "Ultimate Tic-Tac-Toe öffnen"
                : "Dieses Spiel kommt später"}
            </button>
          </div>

          <Suggestions playerName={playerName} />
        </div>
      </div>
    </div>
  );
}

function Lobby({ playerName, roomCodeInput, setRoomCodeInput, onBack, onCreate, onJoin, error }) {
  return (
    <div style={pageStyle()}>
      <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", display: "grid", gap: "18px" }}>
        <div style={cardStyle()}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <h1 style={{ margin: 0 }}>GAM Games</h1>
              <p style={{ color: "#cbd5e1", marginBottom: 0 }}>
                Ultimate Tic-Tac-Toe Online
              </p>
            </div>
            <button onClick={onBack} style={buttonStyle("#334155", "white")}>
              ← Zurück
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "18px",
          }}
        >
          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>Raum erstellen</h2>
            <p style={{ color: "#cbd5e1" }}>Du bist Spieler X. Name: {playerName}</p>
            <button onClick={onCreate} style={buttonStyle("#22c55e")}>
              Raum erstellen
            </button>
          </div>

          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>Raum beitreten</h2>
            <input
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="Raumcode"
              style={{ ...inputStyle(), marginBottom: "12px" }}
            />
            <button onClick={onJoin} style={buttonStyle()}>
              Beitreten
            </button>
          </div>
        </div>

        {error ? <div style={{ color: "#fca5a5" }}>{error}</div> : null}
      </div>
    </div>
  );
}

function Room({ roomCode, mySymbol, room, onLeave, onMove, onReset }) {
  const gameState = room?.state || createState();
  const meta = useMemo(() => getMeta(gameState.boards), [gameState.boards]);
  const activeBoards = useMemo(
    () => getActiveBoards(gameState.boards, gameState.nextBoard, meta),
    [gameState.boards, gameState.nextBoard, meta]
  );

  let status = "";
  if (meta.bigWinner) status = `Spieler ${meta.bigWinner} gewinnt das Spiel`;
  else if (meta.bigDraw) status = "Unentschieden";
  else if (gameState.currentPlayer === mySymbol) status = `Du bist dran (${mySymbol})`;
  else status = `Warte auf ${gameState.currentPlayer}`;

  return (
    <div style={pageStyle()}>
      <div style={{ width: "100%", maxWidth: "1500px", margin: "0 auto", display: "grid", gap: "18px" }}>
        <div style={cardStyle()}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button onClick={onLeave} style={buttonStyle("#334155", "white")}>
              ← Lobby
            </button>
            <div style={{ color: "#cbd5e1" }}>
              Raumcode: <strong style={{ color: "white" }}>{roomCode}</strong>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <div style={cardStyle()}>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>Du spielst als</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", marginTop: "4px" }}>{mySymbol}</div>
          </div>
          <div style={cardStyle()}>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>Spieler X</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>
              {gameState.players?.X || "Wartet..."}
            </div>
          </div>
          <div style={cardStyle()}>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>Spieler O</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>
              {gameState.players?.O || "Wartet..."}
            </div>
          </div>
        </div>

        <div style={cardStyle()}>
          <h1 style={{ textAlign: "center", marginTop: 0 }}>GAM Games</h1>
          <p style={{ textAlign: "center", color: "#7dd3fc", fontSize: "18px" }}>{status}</p>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
            <button onClick={onReset} style={buttonStyle()}>
              Neue Runde
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(110px, 1fr))",
              gap: "12px",
            }}
          >
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
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [playerName, setPlayerName] = useState("Isa");
  const [selectedGame, setSelectedGame] = useState("ultimate");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mySymbol, setMySymbol] = useState(null);
  const [room, setRoom] = useState(null);
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
    if (!supabase) return setError("Supabase ist nicht eingerichtet.");
    setError("");

    const code = randomCode();
    const state = createState(playerName || "Host");

    const { data, error } = await supabase
      .from("utt_rooms")
      .insert({ room_code: code, state })
      .select()
      .single();

    if (error) return setError(error.message);

    setRoom(data);
    setRoomCode(code);
    setMySymbol("X");
    setScreen("room");
  }

  async function joinRoom() {
    if (!supabase) return setError("Supabase ist nicht eingerichtet.");
    setError("");

    const code = roomCodeInput.trim().toUpperCase();
    if (!code) return;

    const { data, error } = await supabase
      .from("utt_rooms")
      .select("*")
      .eq("room_code", code)
      .single();

    if (error || !data) return setError("Raum nicht gefunden.");

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

    if (updateError) return setError(updateError.message);

    setRoom(updated);
    setRoomCode(code);
    setMySymbol("O");
    setScreen("room");
  }

  async function saveState(nextState) {
    const { data } = await supabase
      .from("utt_rooms")
      .update({ state: nextState })
      .eq("room_code", roomCode)
      .select()
      .single();

    if (data) setRoom(data);
  }

  async function handleMove(boardIndex, cellIndex) {
    if (!room || !mySymbol) return;

    const gameState = room.state;
    const meta = getMeta(gameState.boards);
    const activeBoards = getActiveBoards(gameState.boards, gameState.nextBoard, meta);

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
    const nextState = createState(room.state.players?.X || "Host");
    nextState.players.O = room.state.players?.O || null;
    await saveState(nextState);
  }

  function leaveRoom() {
    setScreen("lobby");
    setRoomCode("");
    setRoom(null);
    setMySymbol(null);
    setError("");
  }

  if (screen === "home") {
    return (
      <Home
        playerName={playerName}
        setPlayerName={setPlayerName}
        selectedGame={selectedGame}
        setSelectedGame={setSelectedGame}
        onOpenGame={() => setScreen("lobby")}
      />
    );
  }

  if (screen === "lobby") {
    return (
      <Lobby
        playerName={playerName}
        roomCodeInput={roomCodeInput}
        setRoomCodeInput={setRoomCodeInput}
        onBack={() => setScreen("home")}
        onCreate={createRoom}
        onJoin={joinRoom}
        error={error}
      />
    );
  }

  return (
    <Room
      roomCode={roomCode}
      mySymbol={mySymbol}
      room={room}
      onLeave={leaveRoom}
      onMove={handleMove}
      onReset={resetRoom}
    />
  );
}
