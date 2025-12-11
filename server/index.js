const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const DEFAULT_ORIGINS = ["http://localhost:5173"];
const CLIENT_ORIGINS = process.env.CLIENT_ORIGINS
  ? process.env.CLIENT_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : DEFAULT_ORIGINS;

const app = express();
app.use(cors({ origin: CLIENT_ORIGINS, methods: ["GET", "POST"] }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGINS,
    methods: ["GET", "POST"]
  }
});

// --- Tic-Tac-Toe Game State ---
const rooms = new Map(); // code -> { board, isXNext, players: Map<socketId, { symbol }> }
const socketToRoom = new Map(); // socketId -> code

const calculateWinner = (squares) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};

const generateRoomCode = () => {
  let code = "";
  do {
    code = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit
  } while (rooms.has(code));
  return code;
};

const leaveRoom = (socket) => {
  const code = socketToRoom.get(socket.id);
  if (!code) return;
  const room = rooms.get(code);
  if (room) {
    room.players.delete(socket.id);
    if (room.players.size === 0) {
      rooms.delete(code);
    } else {
      io.to(code).emit("tictactoe:playerCount", room.players.size);
    }
  }
  socket.leave(code);
  socketToRoom.delete(socket.id);
};

// --- Minesweeper Game State ---
const MS_ROWS = 10;
const MS_COLS = 10;
const MS_MINES = 10;
let minesweeper_board = createMinesweeperBoard(MS_ROWS, MS_COLS, MS_MINES);

function createMinesweeperBoard(rows, cols, mines) {
    let board = Array(rows).fill(null).map(() => Array(cols).fill(null).map(() => ({
        isMine: false, isRevealed: false, isFlagged: false, neighborCount: 0
    })));

    let minesPlaced = 0;
    while (minesPlaced < mines) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        if (!board[row][col].isMine) {
            board[row][col].isMine = true;
            minesPlaced++;
        }
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].isMine) continue;
            let count = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = r + i;
                    const newCol = c + j;
                    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && board[newRow][newCol].isMine) {
                        count++;
                    }
                }
            }
            board[r][c].neighborCount = count;
        }
    }
    return board;
}

function revealMinesweeperCell(board, row, col) {
  if (row < 0 || row >= MS_ROWS || col < 0 || col >= MS_COLS || board[row][col].isRevealed) {
    return;
  }
  board[row][col].isRevealed = true;
  if (board[row][col].neighborCount === 0) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        revealMinesweeperCell(board, row + i, col + j);
      }
    }
  }
}

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);
  
  // --- Tic-Tac-Toe Roomed Events ---
  socket.on('tictactoe:createRoom', () => {
    const code = generateRoomCode();
    const room = { board: Array(9).fill(null), isXNext: true, players: new Map() };
    room.players.set(socket.id, { symbol: 'X' });
    rooms.set(code, room);
    socketToRoom.set(socket.id, code);
    socket.join(code);
    socket.emit('tictactoe:roomCreated', { code, symbol: 'X', board: room.board, isXNext: room.isXNext });
    io.to(code).emit('tictactoe:playerCount', room.players.size);
  });

  socket.on('tictactoe:joinRoom', ({ code }) => {
    const room = rooms.get(code);
    if (!room) {
      socket.emit('tictactoe:error', { message: 'Room not found' });
      return;
    }
    if (room.players.size >= 2 && !room.players.has(socket.id)) {
      socket.emit('tictactoe:error', { message: 'Room is full' });
      return;
    }
    const existingSymbol = room.players.get(socket.id)?.symbol;
    const symbol = existingSymbol || (room.players.size === 0 ? 'X' : 'O');
    room.players.set(socket.id, { symbol });
    socketToRoom.set(socket.id, code);
    socket.join(code);
    socket.emit('tictactoe:joined', { code, symbol, board: room.board, isXNext: room.isXNext });
    io.to(code).emit('tictactoe:playerCount', room.players.size);
  });

  socket.on('tictactoe:move', ({ index }) => {
    const code = socketToRoom.get(socket.id);
    if (!code || index === undefined) return;
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    const currentTurn = room.isXNext ? 'X' : 'O';
    if (player.symbol !== currentTurn) return;
    if (calculateWinner(room.board) || room.board[index]) return;

    room.board[index] = player.symbol;
    room.isXNext = !room.isXNext;
    io.to(code).emit('tictactoe:update', { board: room.board, isXNext: room.isXNext, winner: calculateWinner(room.board) });
  });

  socket.on('tictactoe:reset', () => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    room.board = Array(9).fill(null);
    room.isXNext = true;
    io.to(code).emit('tictactoe:update', { board: room.board, isXNext: room.isXNext, winner: null });
  });

  // --- Minesweeper Events ---
  socket.emit('minesweeper:update', minesweeper_board);
  socket.on('minesweeper:reveal', ({ row, col }) => {
    if (minesweeper_board[row][col].isMine) {
        minesweeper_board.forEach(r => r.forEach(c => { if (c.isMine) c.isRevealed = true; }));
    } else {
        revealMinesweeperCell(minesweeper_board, row, col);
    }
    io.emit('minesweeper:update', minesweeper_board);
  });
  socket.on('minesweeper:flag', ({ row, col }) => {
    if (!minesweeper_board[row][col].isRevealed) {
        minesweeper_board[row][col].isFlagged = !minesweeper_board[row][col].isFlagged;
        io.emit('minesweeper:update', minesweeper_board);
    }
  });
  socket.on('minesweeper:reset', () => {
    minesweeper_board = createMinesweeperBoard(MS_ROWS, MS_COLS, MS_MINES);
    io.emit('minesweeper:update', minesweeper_board);
  });

  // --- Drawing Events ---
  socket.on('drawing:start', (data) => {
    const payload = { ...data, userId: socket.id };
    socket.broadcast.emit('drawing:start', payload);
  });
  socket.on('drawing:draw', (data) => {
    const payload = { ...data, userId: socket.id };
    socket.broadcast.emit('drawing:draw', payload);
  });
  socket.on('drawing:stop', () => {
    socket.broadcast.emit('drawing:stop', { userId: socket.id });
  });
  socket.on('drawing:clear', () => {
    io.emit('drawing:clear'); // Use io.emit to clear for everyone, including sender
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    leaveRoom(socket);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
