// src/components/Lobby.tsx
import React from 'react';

interface LobbyProps {
  onSelectGame: (game: 'TicTacToe' | 'Minesweeper' | 'Drawing') => void;
}

const Lobby: React.FC<LobbyProps> = ({ onSelectGame }) => {
  return (
    <div className="lobby">
      <h1>Choose a Game</h1>
      <button onClick={() => onSelectGame('TicTacToe')}>Tic-Tac-Toe</button>
      <button onClick={() => onSelectGame('Minesweeper')}>Minesweeper</button>
      <button onClick={() => onSelectGame('Drawing')}>Drawing</button>
    </div>
  );
};

export default Lobby;
