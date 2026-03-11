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

function createBoards() {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

export function createUltimateState(xName = "Spieler X", oName = "Spieler O") {
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

export function resetUltimateState(xName, oName) {
  return createUltimateState(xName, oName);
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
  return cells.every((cell) => cell !== null);
}

export function getMeta(boards) {
  const winners = boards.map((board) => getWinner(board));
  const draws = boards.map((board, i) => !winners[i] && isFull(board));
  const bigWinner = getWinner(winners);
  const bigDraw = !bigWinner && winners.every((w, i) => w || draws[i]);

  return { winners, draws, bigWinner, bigDraw };
}

export function getActiveBoards(boards, nextBoard, meta) {
  if (nextBoard !== null && !meta.winners[nextBoard] && !meta.draws[nextBoard]) {
    return [nextBoard];
  }

  return boards.map((_, i) => i).filter((i) => !meta.winners[i] && !meta.draws[i]);
}

export function makeMove(gameState, boardIndex, cellIndex) {
  const meta = getMeta(gameState.boards);
  const activeBoards = getActiveBoards(gameState.boards, gameState.nextBoard, meta);

  if (!activeBoards.includes(boardIndex)) return gameState;
  if (gameState.boards[boardIndex][cellIndex]) return gameState;
  if (meta.bigWinner || meta.bigDraw) return gameState;

  const nextBoards = gameState.boards.map((b) => [...b]);
  nextBoards[boardIndex][cellIndex] = gameState.currentPlayer;

  return {
    ...gameState,
    boards: nextBoards,
    currentPlayer: gameState.currentPlayer === "X" ? "O" : "X",
    nextBoard: cellIndex,
    history: [...gameState.history],
  };
}
