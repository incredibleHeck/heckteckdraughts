/**
 * Ruthless Pattern Evaluator
 * Scans for specific structural weaknesses and formation strengths.
 * * Key Concepts:
 * - Hanging Pieces: Pieces without diagonal support behind them.
 * - Base Holes: Gaps in the back rank that allow enemy Kings.
 * - Trios: Small triangular formations that are hard to penetrate.
 */

import { PIECE, BOARD_SIZE } from "../constants.js";

export class PatternEvaluator {
  constructor() {
    this.weights = {
      HANGING_PIECE: -25, // Major liability
      BASE_HOLE: -30, // Dangerous gap
      TRIO_FORMATION: 10, // Strong structure
      ARROWHEAD: 15, // Offensive structure
    };
  }

  extractPatterns(position) {
    let score = 0;

    // We scan inner board for formations (excluding edges for simplicity in 2D array)
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        // Skip invalid/empty squares
        if ((r + c) % 2 === 0) continue;

        const piece = position.pieces[r][c];
        if (piece === PIECE.NONE) continue;

        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        const multiplier = isWhite ? 1 : -1;
        const dir = isWhite ? 1 : -1; // "Behind" direction

        // 1. Detect Hanging Pieces (No support behind)
        // A piece at (r,c) needs support at (r+1, c-1) or (r+1, c+1) for White
        if (!this.isKing(piece)) {
          const backR = r + dir;
          // If we are not at the back edge
          if (backR >= 0 && backR < BOARD_SIZE) {
            let supported = false;
            // Check Left Back
            if (c - 1 >= 0 && position.pieces[backR][c - 1] !== PIECE.NONE)
              supported = true;
            // Check Right Back
            if (
              c + 1 < BOARD_SIZE &&
              position.pieces[backR][c + 1] !== PIECE.NONE
            )
              supported = true;

            if (!supported) {
              score += this.weights.HANGING_PIECE * multiplier;
            }
          }
        }

        // 2. Base Holes (The "Sieve")
        // Check Row 0 (Black Base) and Row 9 (White Base)
        if (isWhite && r === 9) {
          // White piece on base - Good.
          // Logic handled in PositionalEvaluator, but here we penalize *missing* ones conceptually?
          // Actually, better to check for missing neighbors in the base rank.
        }

        // 3. Formation Detection (Mini-Triangles)
        // A piece at (r,c) supported by two pieces behind it forms a strong triangle.
        if (!this.isKing(piece)) {
          const frontR = r - dir;
          if (frontR >= 0 && frontR < BOARD_SIZE) {
            // Check if this piece is the "tip" of an arrowhead
            const leftBack =
              c - 1 >= 0 && position.pieces[r + dir][c - 1] === piece;
            const rightBack =
              c + 1 < BOARD_SIZE && position.pieces[r + dir][c + 1] === piece;

            if (leftBack && rightBack) {
              score += this.weights.TRIO_FORMATION * multiplier;
            }
          }
        }
      }
    }
    return score;
  }

  isKing(piece) {
    return piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
  }
}
