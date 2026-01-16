/**
 * Ruthless Tactical Analyzer (Static)
 */

import { PIECE, BOARD_SIZE } from "../constants";
import { isValidSquare, Move } from "./ai.utils";
import { Position } from "../../utils/fen-parser";

export class TacticalAnalyzer {
  private weights: Record<string, number>;

  constructor() {
    this.weights = {
      SHOT_POTENTIAL: 40,
      OUTPOST: 25,
      LOCKED_PIECE: -15,
      STRONG_COLUMN: 10,
      VULNERABLE_GAP: -20,
    };
  }

  analyzeTactics(position: Position): { score: number } {
    let score = 0;
    const pieces = position.pieces;

    for (let r = 0; r < BOARD_SIZE; r++) {
      let c = r % 2 === 0 ? 0 : 1;
      for (; c < BOARD_SIZE; c += 2) {
        const piece = pieces[r][c];
        if (piece === PIECE.NONE) continue;

        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        const multiplier = isWhite ? 1 : -1;

        if (this.hasShotPotential(pieces, r, c, isWhite)) {
          score += this.weights.SHOT_POTENTIAL * multiplier;
        }

        if (!this.isKing(piece)) {
          const rank = isWhite ? 9 - r : r;
          if (rank <= 4 && rank >= 3) {
            if (this.isSupported(pieces, r, c, isWhite)) {
              score += this.weights.OUTPOST * multiplier;
            }
          }
        }

        if (this.isSupported(pieces, r, c, isWhite)) {
          score += this.weights.STRONG_COLUMN * multiplier;
        }
      }
    }

    return { score };
  }

  private hasShotPotential(pieces: Int8Array[], r: number, c: number, isWhite: boolean): boolean {
    const forward = isWhite ? -1 : 1;
    const captureRow = r + forward * 2;

    if (isValidSquare(captureRow, c - 2)) {
      const enemyR = r + forward;
      const enemyC = c - 1;
      if (pieces[captureRow][c - 2] === PIECE.NONE && this.isEnemy(pieces[enemyR][enemyC], isWhite)) {
        return true;
      }
    }

    if (isValidSquare(captureRow, c + 2)) {
      const enemyR = r + forward;
      const enemyC = c + 1;
      if (pieces[captureRow][c + 2] === PIECE.NONE && this.isEnemy(pieces[enemyR][enemyC], isWhite)) {
        return true;
      }
    }

    return false;
  }

  private isSupported(pieces: Int8Array[], r: number, c: number, isWhite: boolean): boolean {
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

  private isEnemy(piece: PIECE, isWhite: boolean): boolean {
    if (piece === PIECE.NONE) return false;
    if (isWhite) return piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
    return piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
  }

  private isKing(piece: PIECE): boolean {
    return piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
  }

  quickTacticalScore(position: Position, move: Move): number {
    const r = move.to.row;
    const c = move.to.col;
    const piece = position.pieces[move.from.row][move.from.col];
    const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;

    if (this.hasShotPotential(position.pieces, r, c, isWhite)) {
      return 50;
    }
    return 0;
  }
}

export const tacticalAnalyzer = new TacticalAnalyzer();
