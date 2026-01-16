/**
 * Draw Evaluator (Contempt Mode)
 */

import { countPieces } from "../ai/ai.utils";
import { Position } from "../../utils/fen-parser";

export class DrawEvaluator {
  private CONTEMPT_FACTOR = -15;

  isTheoreticalDraw(position: Position): boolean {
    const { whiteCount, blackCount, whiteKings, blackKings } = countPieces(position);

    if (whiteCount === 0 && blackCount === 0) {
      if (whiteKings === 1 && blackKings === 1) return true;
    }

    return false;
  }

  adjustForDraw(score: number, position: Position): number {
    if (this.isTheoreticalDraw(position)) {
      return 0;
    }

    if (this.isDrawish(position)) {
      if (score > 100) return score * 0.1;
      if (score < -100) return score * 0.5;

      return this.CONTEMPT_FACTOR;
    }
    return score;
  }

  isDrawish(position: Position): boolean {
    const { whiteCount, blackCount, whiteKings, blackKings } = countPieces(position);

    if (whiteCount === 0 && blackCount === 0) {
      if (whiteKings === 2 && blackKings === 2) return true;
    }

    return false;
  }

  capDrawishScore(score: number): number {
    return score;
  }
  
  getDrawLikelihood(): number {
    return 0;
  }
}
