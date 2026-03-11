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

function useViewport() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    width,
    isMobile: width < 900,
    isTablet: width >= 900 && width < 1280,
    isDesktop: width >= 1280,
  };
}

function createBoards() {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

function createUltimateState(xName = "Spieler X", oName = "Spieler O") {
  return {
    boards: createBoards(),
    currentPlayer: "X",
    nextBoard: null,
    history: [],
    players: {
      X: xName,
      O: oName,
    },
  };
}

function getWinner(cells) {
  for (const [a, b, c] of WIN_LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) return cells[a];
  }
  return null;
}

function isFull(cells) {
  return cells.every((cell) => cell !== null);
}

function getMeta(boards) {
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

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function shellStyle(isMobile) {
  return {
    minHeight: "100dvh",
    background: "linear-gradient(180deg, #0b1120 0%, #111827 55%, #0f172a 100%)",
    color: "white",
    fontFamily: "Arial, sans-serif",
    padding: isMobile ? "10px" : "20px",
    boxSizing: "border-box",
  };
}

function containerStyle(isDesktop) {
  return {
    width: "100%",
    maxWidth: isDesktop ? "1800px" : "1450px",
    margin: "0 auto",
    display: "grid",
    gap: "16px",
    minWidth: 0,
  };
}

function cardStyle() {
  return {
    background: "rgba(15, 23, 42, 0.92)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "18px",
    padding: "16px",
    boxSizing: "border-box",
    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
    width: "100%",
    minWidth: 0,
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

function secondaryButtonStyle() {
  return {
    ...buttonStyle("#334155", "white"),
  };
}

function Cell({ value, disabled, onClick, isMobile }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        border: "1px solid #475569",
        borderRadius: isMobile ? "7px" : "10px",
        background: disabled ? "#1e293b" : "#334155",
        color: "white",
        fontSize: isMobile ? "16px" : "clamp(18px, 2vw, 24px)",
        fontWeight: "bold",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 0,
      }}
    >
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
  isMobile,
}) {
  return (
    <div
      style={{
        position: "relative",
        padding: isMobile ? "3px" : "6px",
        borderRadius: isMobile ? "10px" : "14px",
        background: isActive ? "#1d4ed8" : "#0f172a",
        border: isActive ? "2px solid #7dd3fc" : "2px solid #334155",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: isMobile ? "3px" : "4px",
        }}
      >
        {board.map((cell, cellIndex) => (
          <Cell
            key={cellIndex}
            value={cell}
            disabled={gameOver || !!cell || !!boardWinner || boardDraw || !isActive}
            onClick={() => onMove(boardIndex, cellIndex)}
            isMobile={isMobile}
          />
        ))}
      </div>

      {(boardWinner || boardDraw) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: isMobile ? "10px" : "14px",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isMobile ? "24px" : "clamp(28px, 4vw, 42px)",
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
  const [loading, setLoading] = useState(false);

  async function loadSuggestions() {
    if (!supabase) {
      setMessage("Supabase ist nicht eingerichtet.");
      return;
    }

    try {
      setMessage("");

      const { data, error } = await supabase
        .from("game_suggestions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) {
        setMessage("Fehler beim Laden: " + error.message);
        return;
      }

      setItems(data || []);
    } catch (err) {
      console.error("loadSuggestions error:", err);
      setMessage("Fehler beim Laden: " + (err.message || "Unbekannter Fehler"));
    }
  }

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!supabase) {
      setMessage("Supabase ist nicht eingerichtet.");
      return;
    }

    if (!gameName.trim()) {
      setMessage("Bitte einen Spielnamen eingeben.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("game_suggestions")
        .insert([
          {
            player_name: playerName?.trim() || "Anonym",
            game_name: gameName.trim(),
            details: details.trim() || null,
          },
        ])
        .select();

      if (error) {
        setMessage("Fehler: " + error.message);
        return;
      }

      if (data && data.length > 0) {
        setItems((prev) => [data[0], ...prev].slice(0, 8));
      }

      setGameName("");
      setDetails("");
      setMessage("Vorschlag gespeichert.");
    } catch (err) {
      console.error("submitSuggestion error:", err);
      setMessage("Fehler: " + (err.message || "Unbekannter Fehler"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={cardStyle()}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Spiel vorschlagen</h2>
        <button onClick={loadSuggestions} style={secondaryButtonStyle()}>
          Aktualisieren
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: "14px" }}>
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

        <button
          type="submit"
          disabled={loading}
          style={{ ...buttonStyle("#22c55e"), marginTop: "12px" }}
        >
          {loading ? "Speichert..." : "Vorschlag absenden"}
        </button>
      </form>

      {message ? <div style={{ marginTop: "10px", color: "#93c5fd" }}>{message}</div> : null}

      <div style={{ marginTop: "18px", display: "grid", gap: "10px" }}>
        {items.length === 0 ? (
          <div style={{ color: "#94a3b8" }}>Noch keine Vorschläge.</div>
        ) : (
          items.map((item) => (
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
          ))
        )}
      </div>
    </div>
  );
}

function RulesCard() {
  return (
    <div style={cardStyle()}>
      <h2 style={{ marginTop: 0 }}>Kurzregeln</h2>
      <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
        Wenn du in einem kleinen Feld spielst, schickst du den Gegner in das entsprechende
        nächste kleine Feld. Gewonnene kleine Felder zählen im großen Brett. Drei kleine
        Siege in einer Reihe gewinnen das ganze Spiel.
      </div>
    </div>
  );
}

function HomeScreen({
  playerName,
  setPlayerName,
  onStartLocal,
  onStartOnline,
  isMobile,
  isTablet,
  isDesktop,
}) {
  return (
    <div style={shellStyle(isMobile)}>
      <div style={containerStyle(isDesktop)}>
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

            <div style={{ width: "100%", maxWidth: "340px" }}>
              <div style={{ marginBottom: "8px", color: "#94a3b8" }}>Dein Name</div>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Name eingeben"
                style={inputStyle()}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : isTablet
              ? "1.15fr 1fr"
              : "1.7fr 1fr",
            gap: "16px",
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: "16px", minWidth: 0 }}>
            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0 }}>Spiele</h2>

              <div style={{ display: "grid", gap: "12px" }}>
                <div style={{ ...cardStyle(), padding: "16px", background: "#1e3a8a" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <strong style={{ fontSize: "20px" }}>Ultimate Tic-Tac-Toe</strong>
                    <span
                      style={{
                        background: "#22c55e",
                        color: "#07111f",
                        borderRadius: "999px",
                        padding: "4px 10px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      Live
                    </span>
                  </div>

                  <p style={{ marginBottom: "14px", color: "#cbd5e1" }}>
                    Lokal 1v1 oder Online mit Raumcode.
                  </p>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button onClick={onStartLocal} style={buttonStyle("#22c55e")}>
                      Lokal 1v1
                    </button>
                    <button onClick={onStartOnline} style={buttonStyle("#38bdf8")}>
                      Online 1v1
                    </button>
                  </div>
                </div>

                <div style={{ ...cardStyle(), padding: "16px", background: "#0f172a" }}>
                  <strong style={{ fontSize: "20px" }}>Classic Tic-Tac-Toe</strong>
                  <p style={{ marginBottom: 0, color: "#cbd5e1" }}>Kommt später.</p>
                </div>

                <div style={{ ...cardStyle(), padding: "16px", background: "#0f172a" }}>
                  <strong style={{ fontSize: "20px" }}>Connect Four</strong>
                  <p style={{ marginBottom: 0, color: "#cbd5e1" }}>Kommt später.</p>
                </div>
              </div>
            </div>

            <RulesCard />
          </div>

          <Suggestions playerName={playerName} />
        </div>
      </div>
    </div>
  );
}

function OnlineLobbyScreen({
  playerName,
  roomCodeInput,
  setRoomCodeInput,
  onBack,
  onCreate,
  onJoin,
  error,
  isMobile,
  isDesktop,
}) {
  return (
    <div style={shellStyle(isMobile)}>
      <div style={containerStyle(isDesktop)}>
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
              <h1 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 40px)" }}>GAM Games</h1>
              <p style={{ color: "#cbd5e1", marginBottom: 0 }}>
                Ultimate Tic-Tac-Toe Online
              </p>
            </div>

            <button onClick={onBack} style={secondaryButtonStyle()}>
              ← Zurück
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "16px",
          }}
        >
          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>Raum erstellen</h2>
            <p style={{ color: "#cbd5e1" }}>
              Du bist Spieler X. Name: {playerName?.trim() || "Spieler"}
            </p>
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

function UltimateBoard({
  title,
  roomCode,
  mySymbol,
  gameState,
  onBack,
  onMove,
  onReset,
  isMobile,
  isTablet,
  isDesktop,
  isLocal,
}) {
  const meta = useMemo(() => getMeta(gameState.boards), [gameState.boards]);
  const activeBoards = useMemo(
    () => getActiveBoards(gameState.boards, gameState.nextBoard, meta),
    [gameState.boards, gameState.nextBoard, meta]
  );
  const [copied, setCopied] = useState(false);

  let status = "";
  if (meta.bigWinner) status = `Spieler ${meta.bigWinner} gewinnt das Spiel`;
  else if (meta.bigDraw) status = "Unentschieden";
  else if (isLocal) status = `Spieler ${gameState.currentPlayer} ist dran`;
  else if (gameState.currentPlayer === mySymbol) status = `Du bist dran (${mySymbol})`;
  else status = `Warte auf ${gameState.currentPlayer}`;

  async function copyRoomCode() {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div style={shellStyle(isMobile)}>
      <div style={containerStyle(isDesktop)}>
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
            <button onClick={onBack} style={secondaryButtonStyle()}>
              ← Zurück
            </button>

            <div
              style={{
                color: "#cbd5e1",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {isLocal ? (
                <strong style={{ color: "white" }}>Lokal 1v1</strong>
              ) : (
                <>
                  <span>
                    Raumcode: <strong style={{ color: "white" }}>{roomCode}</strong>
                  </span>
                  <button onClick={copyRoomCode} style={secondaryButtonStyle()}>
                    {copied ? "Kopiert" : "Code kopieren"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : isTablet
              ? "repeat(3, minmax(180px, 1fr))"
              : "repeat(3, minmax(260px, 1fr))",
            gap: "12px",
          }}
        >
          <div style={cardStyle()}>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>
              {isLocal ? "Aktiver Spieler" : "Du spielst als"}
            </div>
            <div style={{ fontSize: "24px", fontWeight: "bold", marginTop: "4px" }}>
              {isLocal ? gameState.currentPlayer : mySymbol}
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>Spieler X</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>
              {gameState.players?.X || "Spieler X"}
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>Spieler O</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>
              {gameState.players?.O || "Spieler O"}
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle(), minWidth: 0 }}>
          <h1 style={{ textAlign: "center", marginTop: 0, fontSize: "clamp(28px, 4vw, 40px)" }}>
            {title}
          </h1>

          <p style={{ textAlign: "center", color: "#7dd3fc", fontSize: "18px" }}>{status}</p>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
            <button onClick={onReset} style={buttonStyle()}>
              Neue Runde
            </button>
          </div>

          <div style={{ width: "100%", minWidth: 0 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: isMobile ? "4px" : isTablet ? "8px" : "12px",
                width: "100%",
                minWidth: 0,
                alignItems: "stretch",
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
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        </div>

        <RulesCard />
      </div>
    </div>
  );
}

export default function App() {
  const { isMobile, isTablet, isDesktop } = useViewport();

  const [screen, setScreen] = useState("home");
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mySymbol, setMySymbol] = useState(null);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");

  const [localGame, setLocalGame] = useState(() =>
    createUltimateState("Spieler X", "Spieler O")
  );

  useEffect(() => {
    if (!supabase || !roomCode || screen !== "online-room") return;

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

  function resetLocalGame() {
    setLocalGame(createUltimateState("Spieler X", "Spieler O"));
  }

  function handleLocalMove(boardIndex, cellIndex) {
    const gameState = localGame;
    const meta = getMeta(gameState.boards);
    const activeBoards = getActiveBoards(gameState.boards, gameState.nextBoard, meta);

    if (!activeBoards.includes(boardIndex)) return;
    if (gameState.boards[boardIndex][cellIndex]) return;
    if (meta.bigWinner || meta.bigDraw) return;

    const nextBoards = gameState.boards.map((b) => [...b]);
    nextBoards[boardIndex][cellIndex] = gameState.currentPlayer;

    setLocalGame({
      ...gameState,
      boards: nextBoards,
      currentPlayer: gameState.currentPlayer === "X" ? "O" : "X",
      nextBoard: cellIndex,
      history: [...gameState.history],
    });
  }

  async function createRoom() {
    if (!supabase) {
      setError("Supabase ist nicht eingerichtet.");
      return;
    }

    setError("");
    const code = randomCode();
    const state = createUltimateState(playerName?.trim() || "Host", null);

    const { data, error } = await supabase
      .from("utt_rooms")
      .insert({ room_code: code, state })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setRoom(data);
    setRoomCode(code);
    setMySymbol("X");
    setScreen("online-room");
  }

  async function joinRoom() {
    if (!supabase) {
      setError("Supabase ist nicht eingerichtet.");
      return;
    }

    setError("");
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) return;

    const { data, error } = await supabase
      .from("utt_rooms")
      .select("*")
      .eq("room_code", code)
      .single();

    if (error || !data) {
      setError("Raum nicht gefunden.");
      return;
    }

    const nextState = {
      ...data.state,
      players: {
        ...data.state.players,
        O: data.state.players?.O || playerName?.trim() || "Gast",
      },
    };

    const { data: updated, error: updateError } = await supabase
      .from("utt_rooms")
      .update({ state: nextState })
      .eq("room_code", code)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setRoom(updated);
    setRoomCode(code);
    setMySymbol("O");
    setScreen("online-room");
  }

  async function saveOnlineState(nextState) {
    const { data, error } = await supabase
      .from("utt_rooms")
      .update({ state: nextState })
      .eq("room_code", roomCode)
      .select()
      .single();

    if (!error && data) setRoom(data);
  }

  async function handleOnlineMove(boardIndex, cellIndex) {
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
      history: [...gameState.history],
    };

    await saveOnlineState(nextState);
  }

  async function resetOnlineRoom() {
    if (!room) return;
    const nextState = createUltimateState(
      room.state.players?.X || "Host",
      room.state.players?.O || null
    );
    await saveOnlineState(nextState);
  }

  function leaveOnlineRoom() {
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
        onStartLocal={() => setScreen("local-game")}
        onStartOnline={() => setScreen("online-lobby")}
        isMobile={isMobile}
        isTablet={isTablet}
        isDesktop={isDesktop}
      />
    );
  }

  if (screen === "online-lobby") {
    return (
      <OnlineLobbyScreen
        playerName={playerName}
        roomCodeInput={roomCodeInput}
        setRoomCodeInput={setRoomCodeInput}
        onBack={() => setScreen("home")}
        onCreate={createRoom}
        onJoin={joinRoom}
        error={error}
        isMobile={isMobile}
        isTablet={isTablet}
        isDesktop={isDesktop}
      />
    );
  }

  if (screen === "local-game") {
    return (
      <UltimateBoard
        title="GAM Games - Lokal 1v1"
        roomCode=""
        mySymbol={null}
        gameState={localGame}
        onBack={() => setScreen("home")}
        onMove={handleLocalMove}
        onReset={resetLocalGame}
        isMobile={isMobile}
        isTablet={isTablet}
        isDesktop={isDesktop}
        isLocal={true}
      />
    );
  }

  return (
    <UltimateBoard
      title="GAM Games - Online 1v1"
      roomCode={roomCode}
      mySymbol={mySymbol}
      gameState={room?.state || createUltimateState()}
      onBack={leaveOnlineRoom}
      onMove={handleOnlineMove}
      onReset={resetOnlineRoom}
      isMobile={isMobile}
      isTablet={isTablet}
      isDesktop={isDesktop}
      isLocal={false}
    />
  );
}
