// src/components/Minesweeper.tsx
import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import './Minesweeper.css';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborCount: number;
}

interface MinesweeperProps {
  socket: Socket;
  onBackToLobby: () => void;
}

const Minesweeper: React.FC<MinesweeperProps> = ({ socket, onBackToLobby }) => {
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const handleUpdate = (newBoard: Cell[][]) => {
      setBoard(newBoard);
      const hitMine = newBoard.some((row) =>
        row.some((cell) => cell.isRevealed && cell.isMine),
      );
      setGameOver(hitMine);
    };

    socket.on('minesweeper:update', handleUpdate);
    return () => {
      socket.off('minesweeper:update', handleUpdate);
    };
  }, [socket]);

  const handleClick = (row: number, col: number) => {
    if (!gameOver) {
      socket.emit('minesweeper:reveal', { row, col });
    }
  };

  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (!gameOver) {
      socket.emit('minesweeper:flag', { row, col });
    }
  };

  const handleReset = () => {
    socket.emit('minesweeper:reset');
  };

  const renderCell = (cell: Cell, row: number, col: number) => {
    let content = '';
    let className = 'cell';

    if (cell.isRevealed) {
      className += ' revealed';
      if (cell.isMine) {
        content = 'M';
        className += ' mine';
      } else if (cell.neighborCount > 0) {
        content = cell.neighborCount.toString();
      }
    } else if (cell.isFlagged) {
      content = 'F';
    }

    return (
      <div
        className={className}
        key={`${row}-${col}`}
        onClick={() => handleClick(row, col)}
        onContextMenu={(e) => handleRightClick(e, row, col)}
      >
        {content}
      </div>
    );
  };

  const flatCells = board.flat().filter(Boolean);
  const mineTotal = flatCells.filter((cell) => cell.isMine).length;
  const flagTotal = flatCells.filter((cell) => cell.isFlagged).length;
  const remainingMines = Math.max(mineTotal - flagTotal, 0);

  return (
    <div>
      <button onClick={onBackToLobby}>Back to Lobby</button>
      <button onClick={handleReset}>Reset Game</button>
      <h2>Minesweeper Game</h2>
      {gameOver && <h3>Game Over!</h3>}
      <div className="status-bar">
        <span>Flags: {flagTotal} / {mineTotal}</span>
        <span>Remaining: {remainingMines}</span>
      </div>
      <div className="board">
        {board.map((row, r_idx) =>
          row.map((cell, c_idx) => (cell ? renderCell(cell, r_idx, c_idx) : null)),
        )}
      </div>
    </div>
  );
};

export default Minesweeper;
