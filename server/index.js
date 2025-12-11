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
let tictactoe_board = Array(9).fill(null);
let tictactoe_isXNext = true;

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
}

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
  
  // --- Tic-Tac-Toe Events ---
  socket.emit('tictactoe:update', tictactoe_board);
  socket.on('tictactoe:move', ({ index }) => {
    if (calculateWinner(tictactoe_board) || tictactoe_board[index]) return;
    const player = tictactoe_isXNext ? 'X' : 'O';
    tictactoe_board[index] = player;
    tictactoe_isXNext = !tictactoe_isXNext;
    io.emit('tictactoe:update', tictactoe_board);
  });
  socket.on('tictactoe:reset', () => {
    tictactoe_board = Array(9).fill(null);
    tictactoe_isXNext = true;
    io.emit('tictactoe:update', tictactoe_board);
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
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
