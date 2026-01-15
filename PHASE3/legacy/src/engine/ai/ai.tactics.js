/**
 * Ruthless Tactical Analyzer (Static)
 * * * Logic:
 * - Geometric Pattern Recognition (O(N) Scan)
 * - Identifies "Shot Potential" (Holes behind enemies)
 * - Detects "Outposts" (Strong forward pieces)
 * - NO Move Generation (Zero lag)
 */

import { PIECE, BOARD_SIZE } from "../constants.js";
import { isValidSquare } from "./ai.utils.js";

export class TacticalAnalyzer {
  constructor() {
    this.weights = {
      SHOT_POTENTIAL: 40, // Empty square behind an enemy
      OUTPOST: 25, // Anchored piece in enemy territory
      LOCKED_PIECE: -15, // Piece unable to move forward
      STRONG_COLUMN: 10, // Two pieces aligned vertically
      VULNERABLE_GAP: -20, // Hole in the defensive line
    };
  }

  /**
   * Fast Static Analysis
   * Returns a score based on tactical features without simulation.
   */
  analyzeTactics(position) {
    let score = 0;
    const pieces = position.pieces;

    for (let r = 0; r < BOARD_SIZE; r++) {
      let c = r % 2 === 0 ? 1 : 0;
      for (; c < BOARD_SIZE; c += 2) {
        const piece = pieces[r][c];
        if (piece === PIECE.NONE) continue;

        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        const multiplier = isWhite ? 1 : -1;

        // 1. Shot Potential (The "Hole" Detection)
        // If an enemy is adjacent, and there is an empty square behind them,
        // we have "Shot Potential".
        if (this.hasShotPotential(pieces, r, c, isWhite)) {
          score += this.weights.SHOT_POTENTIAL * multiplier;
        }

        // 2. Outposts (Squares 22, 23, 24 for White)
        // Pieces advanced deep (Row 3, 4) supported by friends
        if (!this.isKing(piece)) {
          const rank = isWhite ? r : 9 - r;
          if (rank <= 4 && rank >= 3) {
            if (this.isSupported(pieces, r, c, isWhite)) {
              score += this.weights.OUTPOST * multiplier;
            }
          }
        }

        // 3. Column Structure (Strength)
        // A piece at (r,c) with a friend at (r+1, c+/-1) is strong.
        if (this.isSupported(pieces, r, c, isWhite)) {
          score += this.weights.STRONG_COLUMN * multiplier;
        }
      }
    }

    // Relative to perspective
    return {
      score: score,
      details: null, // Details omitted for speed
    };
  }

  /**
   * Checks if this piece is threatening a jump.
   * Geometric check: Is there an enemy diagonal-front, and an empty square behind that enemy?
   */
  hasShotPotential(pieces, r, c, isWhite) {
    const forward = isWhite ? -1 : 1;
    const captureRow = r + forward * 2;

    // Check Left Capture
    if (isValidSquare(captureRow, c - 2)) {
      const enemyR = r + forward;
      const enemyC = c - 1;
      if (
        pieces[captureRow][c - 2] === PIECE.NONE &&
        this.isEnemy(pieces[enemyR][enemyC], isWhite)
      ) {
        return true;
      }
    }

    // Check Right Capture
    if (isValidSquare(captureRow, c + 2)) {
      const enemyR = r + forward;
      const enemyC = c + 1;
      if (
        pieces[captureRow][c + 2] === PIECE.NONE &&
        this.isEnemy(pieces[enemyR][enemyC], isWhite)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if a piece has friendly support behind it.
   */
  isSupported(pieces, r, c, isWhite) {
    const back = isWhite ? 1 : -1;
    const backRow = r + back;

    if (!isValidSquare(backRow, c - 1) && !isValidSquare(backRow, c + 1))
      return false;

    let supported = false;
    if (isValidSquare(backRow, c - 1)) {
      const p = pieces[backRow][c - 1];
      if (p !== PIECE.NONE && !this.isEnemy(p, isWhite)) supported = true;
    }
    if (!supported && isValidSquare(backRow, c + 1)) {
      const p = pieces[backRow][c + 1];
      if (p !== PIECE.NONE && !this.isEnemy(p, isWhite)) supported = true;
    }
    return supported;
  }

  isEnemy(piece, isWhite) {
    if (piece === PIECE.NONE) return false;
    if (isWhite) return piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
    return piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
  }

  isKing(piece) {
    return piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
  }

  // Compatibility for MoveOrderer (Fast version)
  quickTacticalScore(position, move) {
    // Bonus if the move lands on a square that attacks an enemy
    // This is a simplified check
    const r = move.to.row;
    const c = move.to.col;
    const piece = position.pieces[move.from.row][move.from.col];
    const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;

    if (this.hasShotPotential(position.pieces, r, c, isWhite)) {
      return 50; // High priority for moves creating threats
    }
    return 0;
  }
}

export const tacticalAnalyzer = new TacticalAnalyzer();
