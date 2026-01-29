import { INVALID_MOVE } from 'boardgame.io/core';

export const Connect4 = {
  name: 'connect4',

  setup: () => ({
    cells: Array(42).fill(null), // 6 rows * 7 columns
  }),

  turn: {
    moveLimit: 1,
    order: {
      // Empezar con un jugador aleatorio (0 o 1)
      first: ({ G, ctx }) => Math.floor(Math.random() * 2),
      next: ({ G, ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
    }
  },

  moves: {
    dropToken: ({ G, playerID }, column) => {
      // Find the lowest empty cell in the column
      let cellIndex = -1;
      for (let row = 5; row >= 0; row--) {
        const index = row * 7 + column;
        if (G.cells[index] === null) {
          cellIndex = index;
          break;
        }
      }

      if (cellIndex === -1) {
        return INVALID_MOVE;
      }

      G.cells[cellIndex] = playerID;
    },
  },

  ai: {
    enumerate: (G, ctx) => {
      let moves = [];
      for (let c = 0; c < 7; c++) {
        // Check if column is not full
        if (G.cells[c] === null) {
          moves.push({ move: 'dropToken', args: [c] });
        }
      }
      return moves;
    },
  },

  endIf: ({ G, ctx }) => {
    if (IsVictory(G.cells)) {
      return { winner: ctx.currentPlayer };
    }
    if (IsDraw(G.cells)) {
      return { draw: true };
    }
  },
};

function IsVictory(cells) {
  const winPatterns = [];

  // Horizontal
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c <= 3; c++) {
      winPatterns.push([r * 7 + c, r * 7 + c + 1, r * 7 + c + 2, r * 7 + c + 3]);
    }
  }

  // Vertical
  for (let r = 0; r <= 2; r++) {
    for (let c = 0; c < 7; c++) {
      winPatterns.push([r * 7 + c, (r + 1) * 7 + c, (r + 2) * 7 + c, (r + 3) * 7 + c]);
    }
  }

  // Diagonal Down-Right
  for (let r = 0; r <= 2; r++) {
    for (let c = 0; c <= 3; c++) {
      winPatterns.push([r * 7 + c, (r + 1) * 7 + c + 1, (r + 2) * 7 + c + 2, (r + 3) * 7 + c + 3]);
    }
  }

  // Diagonal Up-Right
  for (let r = 3; r < 6; r++) {
    for (let c = 0; c <= 3; c++) {
      winPatterns.push([r * 7 + c, (r - 1) * 7 + c + 1, (r - 2) * 7 + c + 2, (r - 3) * 7 + c + 3]);
    }
  }

  for (const pattern of winPatterns) {
    const [a, b, c, d] = pattern;
    if (cells[a] !== null && cells[a] === cells[b] && cells[a] === cells[c] && cells[a] === cells[d]) {
      return true;
    }
  }

  return false;
}

function IsDraw(cells) {
  return cells.filter(c => c === null).length === 0;
}

