// src/components/TicTacToe.tsx
import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import './TicTacToe.css';

interface TicTacToeProps {
  socket: Socket;
  onBackToLobby: () => void;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ socket, onBackToLobby }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const handleClick = (index: number) => {
    if (calculateWinner(board) || board[index]) {
      return;
    }
    // The server will determine the player based on its state
    socket.emit('tictactoe:move', { index });
  };

  useEffect(() => {
    socket.on('tictactoe:update', (newBoard: Array<string|null>) => {
      const xCount = newBoard.filter(val => val === 'X').length;
      const oCount = newBoard.filter(val => val === 'O').length;
      setBoard(newBoard);
      setIsXNext(xCount === oCount);
    });

    return () => {
      socket.off('tictactoe:update');
    };
  }, [socket]);

  const renderSquare = (index: number) => {
    return (
      <button className="square" onClick={() => handleClick(index)}>
        {board[index]}
      </button>
    );
  };

  const winner = calculateWinner(board);
  let status;
  if (winner) {
    status = 'Winner: ' + winner;
  } else {
    status = 'Next player: ' + (isXNext ? 'X' : 'O');
  }

  const handleReset = () => {
    socket.emit('tictactoe:reset');
  };

  return (
    <div>
      <button onClick={onBackToLobby}>Back to Lobby</button>
      <button onClick={handleReset}>Reset Game</button>
      <h2>Tic-Tac-Toe Game</h2>
      <div className="status">{status}</div>
      <div className="board-row">
        {renderSquare(0)}
        {renderSquare(1)}
        {renderSquare(2)}
      </div>
      <div className="board-row">
        {renderSquare(3)}
        {renderSquare(4)}
        {renderSquare(5)}
      </div>
      <div className="board-row">
        {renderSquare(6)}
        {renderSquare(7)}
        {renderSquare(8)}
      </div>
    </div>
  );
};

function calculateWinner(squares: Array<string | null>) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

export default TicTacToe;
