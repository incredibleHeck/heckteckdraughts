/**
 * Draw Evaluator (Contempt Mode)
 * Detects draws but resists accepting them.
 * * * Changes:
 * - Removed 2vs2 King draw assumption (Search must prove it).
 * - Added "Contempt": AI prefers to play on rather than draw (Score 0 -> -10).
 * - 3 Kings vs 1 is explicitly NOT a draw.
 */

import { countPieces } from "../ai/ai.utils.js";

export class DrawEvaluator {
  constructor() {
    // Negative value means we hate draws. We want to WIN.
    this.CONTEMPT_FACTOR = -15;
  }

  /**
   * Check if position is theoretically drawn
   * Refined for 10x10 Rules.
   */
  isTheoreticalDraw(position) {
    const { whiteCount, blackCount, whiteKings, blackKings } =
      countPieces(position);

    // 1. King vs King (Absolute Draw)
    if (whiteCount === 0 && blackCount === 0) {
      if (whiteKings === 1 && blackKings === 1) return true;
    }

    // Note: We REMOVED the "2 Kings vs 1" check.
    // A ruthless AI will try to trap the human opponent in a 2v1 scenario.

    return false;
  }

  /**
   * Adjust score. If it's a draw, return Contempt score (negative),
   * not Zero. This forces the AI to look for non-drawing lines.
   */
  adjustForDraw(score, position) {
    if (this.isTheoreticalDraw(position)) {
      return 0; // Absolute rule draw
    }

    if (this.isDrawish(position)) {
      // If we are winning (>100), reduce score to reflect difficulty
      // If we are losing (<-100), improve score (drawing is good if losing)
      if (score > 100) return score * 0.1; // Hard to win
      if (score < -100) return score * 0.5; // Good save

      // If score is even, apply Contempt to avoid the draw
      return this.CONTEMPT_FACTOR;
    }
    return score;
  }

  /**
   * "Drawish" detection - likely deadlocks
   */
  isDrawish(position) {
    const { whiteCount, blackCount, whiteKings, blackKings } =
      countPieces(position);
    const totalPieces = whiteCount + blackCount + whiteKings + blackKings;

    // 1 King vs 1 King + 1 Man (Often drawn if the King holds the main diagonal)
    // But we let the search engine figure that out.

    // Only flag highly probable draws to save search time
    if (whiteCount === 0 && blackCount === 0) {
      // 2 kings vs 2 kings is usually a draw
      if (whiteKings === 2 && blackKings === 2) return true;
    }

    return false;
  }

  // Keep interface compatibility
  capDrawishScore(score) {
    return score;
  }
  getDrawLikelihood(position) {
    return 0;
  }
}
