/**
 * Ruthless Endgame Evaluator
 */

import { PIECE, PLAYER, BOARD_SIZE } from "../constants";
import { Position } from "../../utils/fen-parser";

export class EndgameEvaluator {
  private CENTER = 4.5;

  isEndgame(position: Position): boolean {
    let pieces = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (position.pieces[r][c] !== PIECE.NONE) pieces++;
      }
    }
    return pieces <= 10;
  }

  evaluateEndgame(position: Position): number {
    let score = 0;

    let whiteMaterial = 0, blackMaterial = 0;
    let whiteKingPos: { r: number; c: number } | null = null;
    let blackKingPos: { r: number; c: number } | null = null;
    let whiteCount = 0, blackCount = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      let c = r % 2 === 0 ? 0 : 1;
      for (; c < BOARD_SIZE; c += 2) {
        const piece = position.pieces[r][c];
        if (piece === PIECE.NONE) continue;

        if (piece === PIECE.WHITE) {
          whiteCount++;
          whiteMaterial += 100;
          score += (9 - r) * 10;
        } else if (piece === PIECE.BLACK) {
          blackCount++;
          blackMaterial += 100;
          score -= r * 10;
        } else if (piece === PIECE.WHITE_KING) {
          whiteCount++;
          whiteMaterial += 500;
          whiteKingPos = { r, c };
          const dist = Math.abs(r - this.CENTER) + Math.abs(c - this.CENTER);
          score += (10 - dist) * 5;
        } else if (piece === PIECE.BLACK_KING) {
          blackCount++;
          blackMaterial += 500;
          blackKingPos = { r, c };
          const dist = Math.abs(r - this.CENTER) + Math.abs(c - this.CENTER);
          score -= (10 - dist) * 5;
        }
      }
    }

    score += whiteMaterial - blackMaterial;

    if (whiteMaterial === 500 && blackMaterial === 500 && whiteCount === 1 && blackCount === 1) {
      return 0;
    }

    if (whiteKingPos && blackKingPos) {
      const rDist = Math.abs(whiteKingPos.r - blackKingPos.r);
      const cDist = Math.abs(whiteKingPos.c - blackKingPos.c);

      if ((rDist === 2 && cDist === 0) || (rDist === 0 && cDist === 2)) {
        if (whiteMaterial > blackMaterial) {
          score += 40;
        } else if (blackMaterial > whiteMaterial) {
          score -= 40;
        }
      }
    }

    if (whiteMaterial > blackMaterial + 200 && blackKingPos) {
      const distToEdge = Math.min(blackKingPos.r, 9 - blackKingPos.r, blackKingPos.c, 9 - blackKingPos.c);
      score += (4 - distToEdge) * 10;
    } else if (blackMaterial > whiteMaterial + 200 && whiteKingPos) {
      const distToEdge = Math.min(whiteKingPos.r, 9 - whiteKingPos.r, whiteKingPos.c, 9 - whiteKingPos.c);
      score -= (4 - distToEdge) * 10;
    }

    return score;
  }
}

export const endgameEvaluator = new EndgameEvaluator();
