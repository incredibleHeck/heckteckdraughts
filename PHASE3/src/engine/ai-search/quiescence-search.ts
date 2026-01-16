/**
 * Quiescence Search
 */

import { getAvailableCaptures, makeMove } from "../ai/ai.utils";
import { PositionEvaluator } from "../ai-evaluation/position-evaluator";
import { Position } from "../../utils/fen-parser";

export class QuiescenceSearch {
  private evaluator: PositionEvaluator;
  private maxQDepth = 10;

  constructor(evaluator: PositionEvaluator) {
    this.evaluator = evaluator;
  }

  search(position: Position, alpha: number, beta: number, qPly = 0): number {
    const standPat = this.evaluator.evaluatePosition(position);

    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;

    if (qPly > this.maxQDepth) return standPat;

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
