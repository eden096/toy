// src/App.tsx
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import TicTacToe from './components/TicTacToe';
import Minesweeper from './components/Minesweeper';
import Drawing from './components/Drawing';
import './App.css';

// Define game types
type Game = 'TicTacToe' | 'Minesweeper' | 'Drawing' | null;

// Establish socket connection
const socketUrl = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:3001`;
const socket = io(socketUrl, { transports: ['websocket'] });

function App() {
  const [game, setGame] = useState<Game>(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server!');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server.');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const handleSelectGame = (selectedGame: Game) => {
    setGame(selectedGame);
  };

  const handleBackToLobby = () => {
    setGame(null);
  };

  const renderGame = () => {
    const props = { socket, onBackToLobby: handleBackToLobby };
    switch (game) {
      case 'TicTacToe':
        return <TicTacToe {...props} />;
      case 'Minesweeper':
        return <Minesweeper {...props} />;
      case 'Drawing':
        return <Drawing {...props} />;
      default:
        return <Lobby onSelectGame={handleSelectGame} />;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Toy Project Games</h1>
        <span className={`connection ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </header>
      <main className="content">
        <div className="game-card">
          {renderGame()}
        </div>
      </main>
    </div>
  );
}

export default App;
