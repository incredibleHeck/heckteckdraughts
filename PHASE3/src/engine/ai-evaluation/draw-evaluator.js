/**
 * Draw Evaluator
 * Detects draw positions and adjusts evaluation accordingly
 *
 * Handles:
 * - King-only positions (draw)
 * - Insufficient material
 * - Drawish position detection
 * - Draw score capping
 *
 * @author codewithheck
 * AI Evaluation Refactor - Modular Architecture
 */

import { PIECE, PLAYER } from "../constants.js";
import { countPieces } from "../ai/ai.utils.js";

export class DrawEvaluator {
  /**
   * Check if position is drawish (likely to be drawn)
   */
  isDrawish(position) {
    const { whiteCount, blackCount, whiteKings, blackKings } =
      countPieces(position);

    // Kings only - draw
    if (whiteCount === whiteKings && blackCount === blackKings) {
      if (whiteKings <= 2 && blackKings <= 2) {
        return true;
      }
    }

    // Single king vs limited pawns - likely draw
    if (
      (whiteKings === 1 && blackCount <= 2) ||
      (blackKings === 1 && whiteCount <= 2)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Cap score for drawish positions
   * Prevents AI from playing too aggressively in likely draws
   */
  capDrawishScore(score) {
    return Math.sign(score) * Math.min(Math.abs(score), 50);
  }

  /**
   * Apply draw evaluation adjustments
   */
  adjustForDraw(score, position) {
    if (this.isDrawish(position)) {
      return this.capDrawishScore(score);
    }
    return score;
  }

  /**
   * Check for insufficient material draw
   */
  isInsufficientMaterial(position) {
    const { whiteCount, blackCount, whiteKings, blackKings } =
      countPieces(position);

    // Both sides have only kings
    if (whiteCount === 0 && blackCount === 0) {
      return true;
    }

    // Single king vs single king
    if (
      whiteCount === 0 &&
      blackCount === 0 &&
      whiteKings === 1 &&
      blackKings === 1
    ) {
      return true;
    }

    // King and single piece each is not necessarily a draw (e.g., K+P vs K)
    return false;
  }

  /**
   * Evaluate draw likelyhood (0 = not likely, 1 = very likely)
   */
  getDrawLikelihood(position) {
    const { whiteCount, blackCount, whiteKings, blackKings } =
      countPieces(position);
    const totalPieces = whiteCount + blackCount + whiteKings + blackKings;

    // Very few pieces = likely draw
    if (totalPieces <= 4) {
      if (whiteKings === 1 && blackKings === 1) {
        return 0.9; // King vs King = draw
      }
      if (whiteKings + blackCount <= 2 || blackKings + whiteCount <= 2) {
        return 0.7; // King vs limited pieces
      }
    }

    // Kings only
    if (
      whiteCount === 0 &&
      blackCount === 0 &&
      whiteKings <= 2 &&
      blackKings <= 2
    ) {
      return 0.8;
    }

    return 0.1;
  }

  /**
   * Get draw position type name
   */
  getDrawType(position) {
    const { whiteCount, blackCount, whiteKings, blackKings } =
      countPieces(position);

    if (whiteCount === 0 && blackCount === 0) {
      if (whiteKings === 1 && blackKings === 1) return "king_vs_king";
      if (whiteKings <= 2 && blackKings <= 2) return "kings_only";
    }

    if (
      (whiteKings === 1 && blackCount <= 2) ||
      (blackKings === 1 && whiteCount <= 2)
    ) {
      return "insufficient_material";
    }

    if (this.isDrawish(position)) return "drawish";

    return null;
  }

  /**
   * Check if position is a theoretical draw
   */
  isTheoreticalDraw(position) {
    const { whiteCount, blackCount, whiteKings, blackKings } =
      countPieces(position);

    // King vs King = draw
    if (
      whiteKings === 1 &&
      blackKings === 1 &&
      whiteCount === 0 &&
      blackCount === 0
    ) {
      return true;
    }

    // King vs King+Man = draw (but need to verify with tablebase logic)
    if (whiteKings === 1 && blackCount + blackKings === 1 && whiteCount === 0) {
      return true;
    }
    if (blackKings === 1 && whiteCount + whiteKings === 1 && blackCount === 0) {
      return true;
    }

    return false;
  }

  /**
   * Evaluate terminal draw position
   */
  evaluateTerminalDraw(position) {
    if (this.isTheoreticalDraw(position)) {
      return 0; // Draw = 0 evaluation
    }
    return null; // Not a terminal draw
  }
}
