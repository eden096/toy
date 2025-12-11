// src/components/TicTacToe.tsx
import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import './TicTacToe.css';

interface TicTacToeProps {
  socket: Socket;
  onBackToLobby: () => void;
}

type PlayerSymbol = 'X' | 'O';

interface UpdatePayload {
  board: Array<string | null>;
  isXNext: boolean;
  winner?: string | null;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ socket, onBackToLobby }) => {
  const [board, setBoard] = useState<Array<string | null>>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [symbol, setSymbol] = useState<PlayerSymbol | null>(null);
  const [status, setStatus] = useState<string>('Create a room or join with a 5-digit code.');
  const [playerCount, setPlayerCount] = useState<number>(1);

  const handleClick = (index: number) => {
    if (!roomCode) return;
    if (calculateWinner(board) || board[index]) return;
    socket.emit('tictactoe:move', { index });
  };

  useEffect(() => {
    const onRoomCreated = ({ code, symbol, board, isXNext }: { code: string; symbol: PlayerSymbol; board: Array<string | null>; isXNext: boolean }) => {
      setRoomCode(code);
      setSymbol(symbol);
      setBoard(board);
      setIsXNext(isXNext);
      setStatus(`Room created! Code: ${code} (You are ${symbol})`);
    };

    const onJoined = ({ code, symbol, board, isXNext }: { code: string; symbol: PlayerSymbol; board: Array<string | null>; isXNext: boolean }) => {
      setRoomCode(code);
      setSymbol(symbol);
      setBoard(board);
      setIsXNext(isXNext);
      setStatus(`Joined room ${code}. You are ${symbol}.`);
    };

    const onUpdate = ({ board, isXNext, winner }: UpdatePayload) => {
      setBoard(board);
      setIsXNext(isXNext);
      if (winner) {
        setStatus(`Winner: ${winner}`);
      } else {
        setStatus(`Next: ${isXNext ? 'X' : 'O'}`);
      }
    };

    const onError = ({ message }: { message: string }) => setStatus(message);

    const onPlayerCount = (count: number) => setPlayerCount(count);

    socket.on('tictactoe:roomCreated', onRoomCreated);
    socket.on('tictactoe:joined', onJoined);
    socket.on('tictactoe:update', onUpdate);
    socket.on('tictactoe:error', onError);
    socket.on('tictactoe:playerCount', onPlayerCount);

    return () => {
      socket.off('tictactoe:roomCreated', onRoomCreated);
      socket.off('tictactoe:joined', onJoined);
      socket.off('tictactoe:update', onUpdate);
      socket.off('tictactoe:error', onError);
      socket.off('tictactoe:playerCount', onPlayerCount);
    };
  }, [socket]);

  const handleCreateRoom = () => socket.emit('tictactoe:createRoom');

  const handleJoinRoom = () => {
    const trimmed = inputCode.trim();
    if (!trimmed) return;
    socket.emit('tictactoe:joinRoom', { code: trimmed });
  };

  const renderSquare = (index: number) => (
    <button className="square" onClick={() => handleClick(index)}>
      {board[index]}
    </button>
  );

  const handleReset = () => {
    if (!roomCode) return;
    socket.emit('tictactoe:reset');
  };

  return (
    <div>
      <button onClick={onBackToLobby}>Back to Lobby</button>
      <div className="room-controls">
        <button onClick={handleCreateRoom}>Create Room</button>
        <div className="join-box">
          <input
            type="text"
            placeholder="Enter 5-digit code"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            maxLength={5}
          />
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
      </div>
      <button onClick={handleReset} disabled={!roomCode}>Reset Game</button>
      <h2>Tic-Tac-Toe Game</h2>
      <div className="status">
        <div>{status}</div>
        {roomCode && <div>Room: {roomCode} | Players: {playerCount}/2 | You: {symbol ?? '-'}</div>}
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
