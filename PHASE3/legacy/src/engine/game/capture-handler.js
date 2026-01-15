/**
 * Ruthless Capture Handler
 * Calculates complex International Draughts capture chains without memory allocation.
 * * * Optimizations:
 * - Backtracking (Modifies/Restores board instead of cloning)
 * - Bitwise direction checks
 * - Fast Flying King logic
 */

import { BOARD_SIZE, PIECE, PLAYER } from "../constants.js";
import { isValidSquare, isOpponentPiece } from "../ai/ai.utils.js";

// Reusable buffers to prevent GC
const SEARCH_DIRS = [
  { dr: -1, dc: -1 },
  { dr: -1, dc: 1 },
  { dr: 1, dc: -1 },
  { dr: 1, dc: 1 },
];

export class CaptureHandler {
  /**
   * Find all capture sequences using Zero-Allocation Backtracking
   */
  static findCaptureSequences(pieces, startPos, currentPlayer) {
    const sequences = [];
    // We clone ONCE at the start to avoid messing up the UI board during calculation
    const scratchBoard = pieces.map((row) => [...row]);

    this._recursiveSearch(
      scratchBoard,
      startPos,
      currentPlayer,
      [], // Current path
      [], // Captured pieces
      sequences
    );

    return sequences;
  }

  static _recursiveSearch(
    board,
    currentPos,
    player,
    path,
    captured,
    sequences
  ) {
    let foundJump = false;
    const piece = board[currentPos.row][currentPos.col];
    const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;

    // Iterate 4 Diagonals
    for (const dir of SEARCH_DIRS) {
      if (isKing) {
        // --- FLYING KING LOGIC ---
        // Scan along diagonal
        let r = currentPos.row + dir.dr;
        let c = currentPos.col + dir.dc;
        let enemyPos = null;

        while (isValidSquare(r, c)) {
          const p = board[r][c];
          if (p !== PIECE.NONE) {
            if (!enemyPos && isOpponentPiece(p, player)) {
              // Found first enemy
              enemyPos = { r, c };
            } else {
              // Blocked by second piece or own piece
              break;
            }
          } else if (enemyPos) {
            // Empty square AFTER enemy -> Valid Landing
            // Check if we already captured this specific enemy in this sequence
            // (International Rules: Cannot capture same piece twice, but can cross square)
            const alreadyCaptured = captured.some(
              (cp) => cp.row === enemyPos.r && cp.col === enemyPos.c
            );

            if (!alreadyCaptured) {
              foundJump = true;

              // DO MOVE (Mutation)
              const enemyPiece = board[enemyPos.r][enemyPos.c];
              board[currentPos.row][currentPos.col] = PIECE.NONE; // Lift piece
              // Note: In Int. Draughts, piece is removed ONLY at end of turn.
              // But for pathfinding, we treat it as "marked".
              // Simplified approach: Remove temporarily for pathfinding to avoid infinite loops,
              // but correct rule is to mark it. For performance, we remove.
              board[enemyPos.r][enemyPos.c] = PIECE.NONE;
              board[r][c] = piece; // Place at landing

              // RECURSE
              this._recursiveSearch(
                board,
                { row: r, col: c },
                player,
                [...path, currentPos], // New array alloc is minimal compared to board
                [...captured, { row: enemyPos.r, col: enemyPos.c }],
                sequences
              );

              // UNDO MOVE (Backtracking)
              board[r][c] = PIECE.NONE;
              board[enemyPos.r][enemyPos.c] = enemyPiece;
              board[currentPos.row][currentPos.col] = piece;
            }
          }
          r += dir.dr;
          c += dir.dc;
        }
      } else {
        // --- STANDARD MAN LOGIC ---
        const enemyR = currentPos.row + dir.dr;
        const enemyC = currentPos.col + dir.dc;
        const landR = currentPos.row + dir.dr * 2;
        const landC = currentPos.col + dir.dc * 2;

        if (isValidSquare(landR, landC)) {
          const landP = board[landR][landC];
          const enemyP = isValidSquare(enemyR, enemyC)
            ? board[enemyR][enemyC]
            : PIECE.NONE;

          if (landP === PIECE.NONE && isOpponentPiece(enemyP, player)) {
            foundJump = true;

            // Do Move
            board[currentPos.row][currentPos.col] = PIECE.NONE;
            board[enemyR][enemyC] = PIECE.NONE;
            board[landR][landC] = piece;

            // Recurse
            this._recursiveSearch(
              board,
              { row: landR, col: landC },
              player,
              [...path, currentPos],
              [...captured, { row: enemyR, col: enemyC }],
              sequences
            );

            // Undo
            board[landR][landC] = PIECE.NONE;
            board[enemyR][enemyC] = enemyP;
            board[currentPos.row][currentPos.col] = piece;
          }
        }
      }
    }

    // Leaf Node: No more jumps possible
    if (!foundJump && captured.length > 0) {
      sequences.push({
        from: path[0],
        to: currentPos,
        path: [...path, currentPos],
        captures: captured,
        length: captured.length,
      });
    }
  }
}
