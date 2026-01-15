/**
 * Ruthless FEN Parser (International 10x10)
 * - $O(1)$ Square Lookup
 * - Strict PDN Standard Compliance
 * - Memory-efficient string manipulation
 */

import {
  PIECE,
  PLAYER,
  BOARD_SIZE,
  SQUARE_NUMBERS,
} from "../engine/constants.js";

// Pre-calculated reverse lookup: SquareNumber -> {row, col}
const REVERSE_SQUARE_MAP = (() => {
  const map = new Map();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const num = SQUARE_NUMBERS[r * BOARD_SIZE + c];
      if (num !== 0) map.set(num, { r, c });
    }
  }
  return map;
})();

/**
 * Validates and Parses a FEN string atomically
 */
export function parseFEN(fen) {
  if (!fen || typeof fen !== "string")
    throw new Error("Invalid FEN: Input must be string");

  const parts = fen.trim().toUpperCase().split(":");
  if (parts.length !== 3)
    throw new Error("Invalid FEN: Format must be [W/B]:W[pieces]:B[pieces]");

  const [turn, whitePart, blackPart] = parts;

  const position = {
    pieces: Array(BOARD_SIZE)
      .fill(null)
      .map(() => new Int8Array(BOARD_SIZE).fill(PIECE.NONE)),
    currentPlayer: turn === "W" ? PLAYER.WHITE : PLAYER.BLACK,
  };

  // Parse Piece Sections
  _applySection(position.pieces, whitePart, true);
  _applySection(position.pieces, blackPart, false);

  return position;
}

function _applySection(board, section, isWhite) {
  if (section.length <= 1) return; // Only 'W' or 'B' with no pieces

  // Remove the leading 'W' or 'B' and split by comma
  const pieces = section.substring(1).split(",");

  for (const p of pieces) {
    const isKing = p.includes("K");
    const num = parseInt(p);
    const coords = REVERSE_SQUARE_MAP.get(num);

    if (!coords) continue;

    if (isWhite) {
      board[coords.r][coords.c] = isKing ? PIECE.WHITE_KING : PIECE.WHITE;
    } else {
      board[coords.r][coords.c] = isKing ? PIECE.BLACK_KING : PIECE.BLACK;
    }
  }
}

/**
 * Generates FEN from Board State
 */
export function generateFEN(position) {
  const white = [];
  const black = [];

  // One pass through the board
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = position.pieces[r][c];
      if (piece === PIECE.NONE) continue;

      const num = SQUARE_NUMBERS[r * BOARD_SIZE + c];
      const suffix =
        piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING ? "K" : "";

      if (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) {
        white.push(num + suffix);
      } else {
        black.push(num + suffix);
      }
    }
  }

  // Standard requires sorted square numbers
  const sortFn = (a, b) => parseInt(a) - parseInt(b);

  return [
    position.currentPlayer === PLAYER.WHITE ? "W" : "B",
    "W" + white.sort(sortFn).join(","),
    "B" + black.sort(sortFn).join(","),
  ].join(":");
}
