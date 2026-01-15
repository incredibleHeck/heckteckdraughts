/**
 * Quiescence Search
 * * * Logic:
 * - If I stand pat (do nothing), is my score >= Beta? (Cutoff)
 * - If not, check all CAPTURES.
 * - This prevents the "Horizon Effect" where the AI stops search in the middle of a trade.
 */

import { getAvailableCaptures, makeMove } from "../ai/ai.utils.js";

export class QuiescenceSearch {
  constructor(evaluator) {
    this.evaluator = evaluator;
    this.maxQDepth = 10; // Prevent infinite capture loops
  }

  search(position, alpha, beta, qPly = 0) {
    // 1. Stand-Pat (Static Evaluation)
    // "If I do nothing, how good is the position?"
    const standPat = this.evaluator.evaluatePosition(position);

    if (standPat >= beta) return beta; // Beta Cutoff
    if (alpha < standPat) alpha = standPat;

    if (qPly > this.maxQDepth) return standPat;

    // 2. Generate Captures ONLY
    // In optimized utils, getAvailableCaptures handles the "Max Capture" rule internally.
    const captures = getAvailableCaptures(position);

    for (const move of captures) {
      const newPos = makeMove(position, move);
      const score = -this.search(newPos, -beta, -alpha, qPly + 1);

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }

    return alpha;
  }
}
