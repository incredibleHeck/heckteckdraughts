/**
 * Global Physical Constants
 * Context: HORIZONTALLY FLIPPED BOARD (10x10)
 */

export const BOARD_SIZE = 10;

export const PIECE = {
  NONE: 0,
  WHITE: 1,
  BLACK: 2,
  WHITE_KING: 3,
  BLACK_KING: 4,
};

export const PLAYER = {
  WHITE: 1,
  BLACK: 2,
};

export const GAME_STATE = {
  ONGOING: "ongoing",
  WHITE_WIN: "whiteWin",
  BLACK_WIN: "blackWin",
  DRAW: "draw",
};

// Mirror-specific Dark Square logic (row + col must be even)
export function isDarkSquare(row, col) {
  return (row + col) % 2 === 0;
}

// Notation Mapping (1-50) adapted for Flipped Board (Right-to-Left)
export const SQUARE_NUMBERS = (function () {
  const numbers = new Int32Array(BOARD_SIZE * BOARD_SIZE);
  let count = 1;
  for (let row = 0; row < BOARD_SIZE; row++) {
    // Number from Right to Left
    for (let col = BOARD_SIZE - 1; col >= 0; col--) {
      if (isDarkSquare(row, col)) {
        numbers[row * BOARD_SIZE + col] = count++;
      }
    }
  }
  return numbers;
})();

export const DIRECTIONS = {
  WHITE_MOVES: [
    { dy: -1, dx: -1 },
    { dy: -1, dx: 1 },
  ],
  BLACK_MOVES: [
    { dy: 1, dx: -1 },
    { dy: 1, dx: 1 },
  ],
  KING_MOVES: [
    { dy: -1, dx: -1 },
    { dy: -1, dx: 1 },
    { dy: 1, dx: -1 },
    { dy: 1, dx: 1 },
  ],
};
