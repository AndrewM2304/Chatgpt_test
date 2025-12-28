import { useMemo, useState } from "react";

const initialBoard = Array(9).fill(null);

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const calculateWinner = (board) => {
  for (const [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a], line: [a, b, c] };
    }
  }
  return null;
};

const getStatusText = (winner, isDraw, nextPlayer) => {
  if (winner) {
    return `Winner: ${winner.player}`;
  }
  if (isDraw) {
    return "Draw game";
  }
  return `Next player: ${nextPlayer}`;
};

export default function App() {
  const [board, setBoard] = useState(initialBoard);
  const [isXNext, setIsXNext] = useState(true);

  const winner = useMemo(() => calculateWinner(board), [board]);
  const isDraw = !winner && board.every(Boolean);
  const nextPlayer = isXNext ? "X" : "O";

  const statusText = getStatusText(winner, isDraw, nextPlayer);

  const handleSquareClick = (index) => {
    if (board[index] || winner) {
      return;
    }
    const updatedBoard = board.map((value, position) =>
      position === index ? nextPlayer : value
    );
    setBoard(updatedBoard);
    setIsXNext((prev) => !prev);
  };

  const handleReset = () => {
    setBoard(initialBoard);
    setIsXNext(true);
  };

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">Classic game</p>
        <h1>Tic Tac Toe</h1>
        <p className="subtitle">
          Play a quick match and challenge a friend on any device.
        </p>
      </header>

      <main className="game">
        <section className="board" aria-label="Tic tac toe board">
          {board.map((value, index) => {
            const isWinningSquare = winner?.line.includes(index);
            return (
              <button
                key={index}
                className={`square${isWinningSquare ? " is-winning" : ""}`}
                type="button"
                onClick={() => handleSquareClick(index)}
                aria-label={`Square ${index + 1}`}
              >
                {value}
              </button>
            );
          })}
        </section>

        <aside className="panel" aria-live="polite">
          <div className="status">
            <span className="status-label">Status</span>
            <strong>{statusText}</strong>
          </div>
          <div className="turns">
            <span>Player X</span>
            <span className={isXNext ? "active" : ""}>●</span>
            <span>Player O</span>
            <span className={!isXNext ? "active" : ""}>●</span>
          </div>
          <button className="reset" type="button" onClick={handleReset}>
            New game
          </button>
        </aside>
      </main>
    </div>
  );
}
