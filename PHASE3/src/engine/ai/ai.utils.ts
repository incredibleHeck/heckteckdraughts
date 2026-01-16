/**
 * AI Utilities - Ruthlessly Optimized
 */

import {
  BOARD_SIZE,
  PIECE,
  PLAYER,
  DIRECTIONS,
} from "../constants";
import { Position } from "../../utils/fen-parser";

export interface Coordinate {
  row: number;
  col: number;
}

export interface Move {
  from: Coordinate;
  to: Coordinate;
  captures: Coordinate[];
}

// ============================================
// BOARD UTILITIES
// ============================================

export function isValidSquare(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function isPieceOfCurrentPlayer(piece: PIECE, currentPlayer: PLAYER): boolean {
  if (piece === PIECE.NONE) return false;
  return currentPlayer === PLAYER.WHITE
    ? piece === PIECE.WHITE || piece === PIECE.WHITE_KING
    : piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
}

export function isOpponentPiece(piece: PIECE, currentPlayer: PLAYER): boolean {
  if (piece === PIECE.NONE) return false;
  return currentPlayer === PLAYER.WHITE
    ? piece === PIECE.BLACK || piece === PIECE.BLACK_KING
    : piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
}

export function shouldPromote(piece: PIECE, row: number): boolean {
  return (
    (piece === PIECE.WHITE && row === 0) ||
    (piece === PIECE.BLACK && row === BOARD_SIZE - 1)
  );
}

/**
 * Optimized Make Move
 */
export function makeMove(position: Position, move: Move): Position {
  const newPieces = new Array(BOARD_SIZE);
  for (let r = 0; r < BOARD_SIZE; r++)
    newPieces[r] = position.pieces[r].slice();

  const piece = newPieces[move.from.row][move.from.col];
  newPieces[move.from.row][move.from.col] = PIECE.NONE;
  newPieces[move.to.row][move.to.col] = piece;

  if (move.captures) {
    const capLen = move.captures.length;
    for (let i = 0; i < capLen; i++) {
      newPieces[move.captures[i].row][move.captures[i].col] = PIECE.NONE;
    }
  }

  if (shouldPromote(piece, move.to.row)) {
    newPieces[move.to.row][move.to.col] =
      piece === PIECE.WHITE ? PIECE.WHITE_KING : PIECE.BLACK_KING;
  }

  return {
    pieces: newPieces,
    currentPlayer:
      position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE,
  };
}

// ============================================
// MOVE GENERATION (OPTIMIZED)
// ============================================

export function generateMoves(position: Position): Move[] {
  const captures = getAvailableCaptures(position);
  if (captures.length > 0) return captures;

  const normalMoves: Move[] = [];
  const currentPlayer = position.currentPlayer;

  for (let r = 0; r < BOARD_SIZE; r++) {
    let c = r % 2 === 0 ? 0 : 1; // Corrected: row+col must be even for dark squares
    // Wait, in my constants.ts: isDarkSquare(row, col) => (row+col)%2 === 0
    // If row is even (0, 2..), col must be even (0, 2..).
    // If row is odd (1, 3..), col must be odd (1, 3..).
    for (; c < BOARD_SIZE; c += 2) {
      if (isPieceOfCurrentPlayer(position.pieces[r][c], currentPlayer)) {
        addNormalMovesForPiece(normalMoves, position, r, c);
      }
    }
  }
  return normalMoves;
}

export function getAvailableCaptures(position: Position): Move[] {
  const allCaptures: Move[] = [];
  const scratchBoard = new Array(BOARD_SIZE);
  for (let r = 0; r < BOARD_SIZE; r++)
    scratchBoard[r] = position.pieces[r].slice();

  const currentPlayer = position.currentPlayer;

  for (let r = 0; r < BOARD_SIZE; r++) {
    let c = r % 2 === 0 ? 0 : 1;
    for (; c < BOARD_SIZE; c += 2) {
      if (isPieceOfCurrentPlayer(scratchBoard[r][c], currentPlayer)) {
        findCaptureSequences(
          allCaptures,
          scratchBoard,
          { row: r, col: c },
          [],
          [],
          new Set()
        );
      }
    }
  }

  if (allCaptures.length > 0) {
    let maxLen = 0;
    for (const m of allCaptures)
      if (m.captures.length > maxLen) maxLen = m.captures.length;
    return allCaptures.filter((move) => move.captures.length === maxLen);
  }

  return [];
}

function findCaptureSequences(
  sequences: Move[],
  pieces: Int8Array[],
  currentPos: Coordinate,
  path: Coordinate[],
  capturedSoFar: Coordinate[],
  visitedPositions: Set<number>,
  recursionDepth = 0
) {
  if (recursionDepth > 20) return;
  const posKey = (currentPos.row << 4) | currentPos.col;
  if (visitedPositions.has(posKey)) return;
  visitedPositions.add(posKey);

  let foundJump = false;
  const piece = pieces[currentPos.row][currentPos.col];
  const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
  const currentPlayer =
    piece === PIECE.WHITE || piece === PIECE.WHITE_KING
      ? PLAYER.WHITE
      : PLAYER.BLACK;

  const dirs = DIRECTIONS.KING_MOVES;

  for (const dir of dirs) {
    if (isKing) {
      let checkRow = currentPos.row + dir.dy;
      let checkCol = currentPos.col + dir.dx;
      let enemyPos: Coordinate | null = null;
      let enemyPieceVal = PIECE.NONE;

      while (isValidSquare(checkRow, checkCol)) {
        const p = pieces[checkRow][checkCol];
        if (p !== PIECE.NONE) {
          if (isOpponentPiece(p, currentPlayer)) {
            enemyPos = { row: checkRow, col: checkCol };
            enemyPieceVal = p;
            break;
          } else break;
        }
        checkRow += dir.dy;
        checkCol += dir.dx;
      }

      if (
        enemyPos &&
        !capturedSoFar.some(
          (p) => p.row === enemyPos!.row && p.col === enemyPos!.col
        )
      ) {
        let landRow = enemyPos.row + dir.dy;
        let landCol = enemyPos.col + dir.dx;

        while (
          isValidSquare(landRow, landCol) &&
          pieces[landRow][landCol] === PIECE.NONE
        ) {
          foundJump = true;

          pieces[currentPos.row][currentPos.col] = PIECE.NONE;
          pieces[enemyPos.row][enemyPos.col] = PIECE.NONE;
          pieces[landRow][landCol] = piece;

          findCaptureSequences(
            sequences,
            pieces,
            { row: landRow, col: landCol },
            path.length === 0 ? [currentPos] : path,
            [...capturedSoFar, enemyPos],
            visitedPositions,
            recursionDepth + 1
          );

          pieces[landRow][landCol] = PIECE.NONE;
          pieces[enemyPos.row][enemyPos.col] = enemyPieceVal;
          pieces[currentPos.row][currentPos.col] = piece;

          landRow += dir.dy;
          landCol += dir.dx;
        }
      }
    } else {
      const jumpOverPos = {
        row: currentPos.row + dir.dy,
        col: currentPos.col + dir.dx,
      };
      const landPos = {
        row: currentPos.row + 2 * dir.dy,
        col: currentPos.col + 2 * dir.dx,
      };

      if (isValidSquare(landPos.row, landPos.col)) {
        const jumpPiece = pieces[jumpOverPos.row][jumpOverPos.col];
        if (
          pieces[landPos.row][landPos.col] === PIECE.NONE &&
          isOpponentPiece(jumpPiece, currentPlayer)
        ) {
          if (
            !capturedSoFar.some(
              (p) => p.row === jumpOverPos.row && p.col === jumpOverPos.col
            )
          ) {
            foundJump = true;
            pieces[currentPos.row][currentPos.col] = PIECE.NONE;
            pieces[jumpOverPos.row][jumpOverPos.col] = PIECE.NONE;
            pieces[landPos.row][landPos.col] = piece;

            findCaptureSequences(
              sequences,
              pieces,
              landPos,
              path.length === 0 ? [currentPos] : path,
              [...capturedSoFar, jumpOverPos],
              visitedPositions,
              recursionDepth + 1
            );

            pieces[landPos.row][landPos.col] = PIECE.NONE;
            pieces[jumpOverPos.row][jumpOverPos.col] = jumpPiece;
            pieces[currentPos.row][currentPos.col] = piece;
          }
        }
      }
    }
  }

  if (!foundJump && capturedSoFar.length > 0) {
    sequences.push({
      from: path[0] || currentPos,
      to: currentPos,
      captures: [...capturedSoFar],
    });
  }
  visitedPositions.delete(posKey);
}

export function addNormalMovesForPiece(moves: Move[], position: Position, r: number, c: number) {
  const piece = position.pieces[r][c];
  const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;

  if (isKing) {
    const dirs = DIRECTIONS.KING_MOVES;
    for (const d of dirs) {
      let nr = r + d.dy;
      let nc = c + d.dx;
      while (isValidSquare(nr, nc) && position.pieces[nr][nc] === PIECE.NONE) {
        moves.push({
          from: { row: r, col: c },
          to: { row: nr, col: nc },
          captures: [],
        });
        nr += d.dy;
        nc += d.dx;
      }
    }
  } else {
    const dirs =
      position.currentPlayer === PLAYER.WHITE
        ? DIRECTIONS.WHITE_MOVES
        : DIRECTIONS.BLACK_MOVES;
    for (const d of dirs) {
      const nr = r + d.dy;
      const nc = c + d.dx;
      if (isValidSquare(nr, nc) && position.pieces[nr][nc] === PIECE.NONE) {
        moves.push({
          from: { row: r, col: c },
          to: { row: nr, col: nc },
          captures: [],
        });
      }
    }
  }
}

// ============================================
// ZOBRIST HASHING (Lazy Initialization)
// ============================================
let ZOBRIST_TABLE: any = null;

function getZobristTable() {
  if (!ZOBRIST_TABLE) {
    let seed = 123456789;
    const random = () => {
      seed = (Math.imul(1597334677, seed) + 12345) | 0;
      return Math.abs(seed);
    };

    ZOBRIST_TABLE = new Array(BOARD_SIZE * BOARD_SIZE).fill(null).map(() => ({
      [PIECE.WHITE]: random(),
      [PIECE.WHITE_KING]: random(),
      [PIECE.BLACK]: random(),
      [PIECE.BLACK_KING]: random(),
      [PLAYER.WHITE]: random(), // Side to move
    }));
  }
  return ZOBRIST_TABLE;
}

export function generatePositionKey(position: Position): number {
  const table = getZobristTable();
  let hash = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    let c = r % 2 === 0 ? 0 : 1;
    for (; c < BOARD_SIZE; c += 2) {
      const piece = position.pieces[r][c];
      if (piece !== PIECE.NONE) {
        const index = r * BOARD_SIZE + c;
        hash ^= table[index][piece];
      }
    }
  }
  
  if (position.currentPlayer === PLAYER.WHITE) {
    hash ^= table[0][PLAYER.WHITE];
  }

  return hash;
}

export function clonePosition(position: Position): Position {
  return {
    pieces: position.pieces.map((row) => new Int8Array(row)),
    currentPlayer: position.currentPlayer,
  };
}

export function isSameMove(move1: Move | null, move2: Move | null): boolean {
  if (!move1 || !move2) return false;
  return (
    move1.from.row === move2.from.row &&
    move1.from.col === move2.from.col &&
    move1.to.row === move2.to.row &&
    move1.to.col === move2.to.col
  );
}
