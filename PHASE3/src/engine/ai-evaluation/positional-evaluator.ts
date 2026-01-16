/**
 * Ruthless Positional Evaluator (Tapered)
 */

import { PIECE, BOARD_SIZE } from "../constants";
import { Position } from "../../utils/fen-parser";

export interface PositionalEvaluation {
  mgScore: number;
  egScore: number;
}

export class PositionalEvaluator {
  private weights: Record<string, [number, number]>;

  constructor() {
    this.weights = {
      CENTER_CONTROL: [15, 5],
      BASE_INTEGRITY: [20, 0],
      ADVANCEMENT: [5, 15],
      KING_CENTRALITY: [0, 30],
      EDGE_WEAKNESS: [-5, -10],
      TRAPPED_KING: [0, -50],
      FORMATION_COLUMN: [5, 0],
    };
  }

  evaluatePositional(position: Position): PositionalEvaluation {
    let mgScore = 0;
    let egScore = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if ((r + c) % 2 !== 0) continue; // Note: My isDarkSquare is (r+c)%2 === 0

        const piece = position.pieces[r][c];
        if (piece === PIECE.NONE) continue;

        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
        const multiplier = isWhite ? 1 : -1;

        if (r >= 4 && r <= 5 && c >= 2 && c <= 7) {
          mgScore += this.weights.CENTER_CONTROL[0] * multiplier;
          egScore += this.weights.CENTER_CONTROL[1] * multiplier;
        }

        if (isWhite && r === 9) mgScore += this.weights.BASE_INTEGRITY[0];
        if (!isWhite && r === 0) mgScore -= this.weights.BASE_INTEGRITY[0];

        if (!isKing) {
          const advancement = isWhite ? 9 - r : r;
          mgScore += advancement * this.weights.ADVANCEMENT[0] * multiplier;
          egScore += advancement * this.weights.ADVANCEMENT[1] * multiplier;

          if (advancement > 7) egScore += 50 * multiplier;
        }

        if (isKing) {
          const centerDist = Math.abs(r - 4.5) + Math.abs(c - 4.5);
          egScore += (10 - centerDist) * this.weights.KING_CENTRALITY[1] * multiplier;

          if ((r === 0 && c === 9) || (r === 9 && c === 0)) {
            egScore += this.weights.TRAPPED_KING[1] * multiplier;
          }
        }
      }
    }

    return { mgScore, egScore };
  }
}
