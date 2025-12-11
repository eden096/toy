// src/components/TicTacToe.tsx
import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import './TicTacToe.css';

interface TicTacToeProps {
  socket: Socket;
  onBackToLobby: () => void;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ socket, onBackToLobby }) => {
  const [board, setBoard] = useState<Array<string | null>>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [symbol, setSymbol] = useState<'X' | 'O' | null>(null);
  const [status, setStatus] = useState<string>('방을 만들거나 코드로 입장하세요.');
  const [playerCount, setPlayerCount] = useState<number>(1);

  const handleClick = (index: number) => {
    if (!roomCode) return;
    if (calculateWinner(board) || board[index]) {
      return;
    }
    socket.emit('tictactoe:move', { index });
  };

  useEffect(() => {
    socket.on('tictactoe:roomCreated', ({ code, symbol, board, isXNext }) => {
      setRoomCode(code);
      setSymbol(symbol);
      setBoard(board);
      setIsXNext(isXNext);
      setStatus(`방 생성 완료! 코드: ${code} (당신은 ${symbol})`);
    });

    socket.on('tictactoe:joined', ({ code, symbol, board, isXNext }) => {
      setRoomCode(code);
      setSymbol(symbol);
      setBoard(board);
      setIsXNext(isXNext);
      setStatus(`방 ${code} 입장 완료! 당신은 ${symbol}`);
    });

    socket.on('tictactoe:update', ({ board, isXNext, winner }) => {
      setBoard(board);
      setIsXNext(isXNext);
      if (winner) {
        setStatus(`승자: ${winner}`);
      } else {
        setStatus(`다음 차례: ${isXNext ? 'X' : 'O'}`);
      }
    });

    socket.on('tictactoe:error', ({ message }) => {
      setStatus(message);
    });

    socket.on('tictactoe:playerCount', (count: number) => {
      setPlayerCount(count);
    });

    return () => {
      socket.off('tictactoe:roomCreated');
      socket.off('tictactoe:joined');
      socket.off('tictactoe:update');
      socket.off('tictactoe:error');
      socket.off('tictactoe:playerCount');
    };
  }, [socket]);

  const handleCreateRoom = () => {
    socket.emit('tictactoe:createRoom');
  };

  const handleJoinRoom = () => {
    const trimmed = inputCode.trim();
    if (!trimmed) return;
    socket.emit('tictactoe:joinRoom', { code: trimmed });
  };

  const renderSquare = (index: number) => {
    return (
      <button className="square" onClick={() => handleClick(index)}>
        {board[index]}
      </button>
    );
  };

  const winner = calculateWinner(board);
  const handleReset = () => {
    if (!roomCode) return;
    socket.emit('tictactoe:reset');
  };

  return (
    <div>
      <button onClick={onBackToLobby}>Back to Lobby</button>
      <div className="room-controls">
        <button onClick={handleCreateRoom}>방 만들기</button>
        <div className="join-box">
          <input
            type="text"
            placeholder="5자리 코드"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            maxLength={5}
          />
          <button onClick={handleJoinRoom}>방 입장</button>
        </div>
      </div>
      <button onClick={handleReset} disabled={!roomCode}>Reset Game</button>
      <h2>Tic-Tac-Toe Game</h2>
      <div className="status">
        <div>{status}</div>
        {roomCode && <div>방 코드: {roomCode} | 플레이어: {playerCount}/2 | 당신: {symbol ?? '-'}</div>}
      </div>
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
