/**
 * Ruthless Pattern Evaluator
 */

import { PIECE, BOARD_SIZE } from "../constants";
import { Position } from "../../utils/fen-parser";

export class PatternEvaluator {
  private weights: Record<string, number>;

  constructor() {
    this.weights = {
      HANGING_PIECE: -25,
      BASE_HOLE: -30,
      TRIO_FORMATION: 10,
      ARROWHEAD: 15,
    };
  }

  extractPatterns(position: Position): number {
    let score = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if ((r + c) % 2 !== 0) continue;

        const piece = position.pieces[r][c];
        if (piece === PIECE.NONE) continue;

        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        const multiplier = isWhite ? 1 : -1;
        const dir = isWhite ? 1 : -1;

        if (!this.isKing(piece)) {
          const backR = r + dir;
          if (backR >= 0 && backR < BOARD_SIZE) {
            let supported = false;
            if (c - 1 >= 0 && position.pieces[backR][c - 1] !== PIECE.NONE)
              supported = true;
            if (c + 1 < BOARD_SIZE && position.pieces[backR][c + 1] !== PIECE.NONE)
              supported = true;

            if (!supported) {
              score += this.weights.HANGING_PIECE * multiplier;
            }
          }
        }

        if (!this.isKing(piece)) {
          const frontR = r - dir;
          const backR = r + dir;
          if (frontR >= 0 && frontR < BOARD_SIZE && backR >= 0 && backR < BOARD_SIZE) {
            const leftBack = c - 1 >= 0 && position.pieces[backR][c - 1] === piece;
            const rightBack = c + 1 < BOARD_SIZE && position.pieces[backR][c + 1] === piece;

            if (leftBack && rightBack) {
              score += this.weights.TRIO_FORMATION * multiplier;
            }
          }
        }
      }
    }
    return score;
  }

  private isKing(piece: PIECE): boolean {
    return piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
  }
}
