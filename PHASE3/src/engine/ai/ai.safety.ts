/**
 * Ruthless Safety Analyzer
 */

import { PIECE, BOARD_SIZE } from "../constants";
import { isValidSquare, Coordinate } from "./ai.utils";
import { Position } from "../../utils/fen-parser";

export class SafetyAnalyzer {
  private weights: Record<string, number>;

  constructor() {
    this.weights = {
      HANGING_PIECE: -60,
      WEAK_BASE: -40,
      TRAPPED_KING: -80,
      EXPOSED_KING: -30,
      GAP_IN_LINE: -20,
      SUPPORTED_PIECE: 15,
    };
  }

  analyzeSafety(position: Position): { score: number } {
    let score = 0;
    const pieces = position.pieces;

    for (let r = 0; r < BOARD_SIZE; r++) {
      let c = r % 2 === 0 ? 0 : 1;
      for (; c < BOARD_SIZE; c += 2) {
        const piece = pieces[r][c];
        if (piece === PIECE.NONE) continue;

        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;

        let pieceSafety = 0;

        if (!isKing) {
          if (this.isHanging(pieces, r, c, isWhite)) {
            pieceSafety += this.weights.HANGING_PIECE;
          } else if (this.isSupported(pieces, r, c, isWhite)) {
            pieceSafety += this.weights.SUPPORTED_PIECE;
          }
        }

        if (isKing) {
          if (this.isTrapped(pieces, r, c)) {
            pieceSafety += this.weights.TRAPPED_KING;
          }
          if (!this.hasDefenders(pieces, r, c, isWhite)) {
            pieceSafety += this.weights.EXPOSED_KING;
          }
        }

        score += isWhite ? pieceSafety : -pieceSafety;
      }
    }

    score += this.evaluateBaseHoles(pieces);

    return { score };
  }

  private isHanging(pieces: Int8Array[], r: number, c: number, isWhite: boolean): boolean {
    const forward = isWhite ? -1 : 1;
    const backward = isWhite ? 1 : -1;

    let underAttack = false;

    if (isValidSquare(r + forward, c - 1)) {
      const p = pieces[r + forward][c - 1];
      if (p !== PIECE.NONE && this.isEnemy(p, isWhite)) underAttack = true;
    }
    if (!underAttack && isValidSquare(r + forward, c + 1)) {
      const p = pieces[r + forward][c + 1];
      if (p !== PIECE.NONE && this.isEnemy(p, isWhite)) underAttack = true;
    }

    if (!underAttack) return false;

    if (isValidSquare(r + backward, c - 1)) {
      const p = pieces[r + backward][c - 1];
      if (p !== PIECE.NONE && !this.isEnemy(p, isWhite)) return false;
    }
    if (isValidSquare(r + backward, c + 1)) {
      const p = pieces[r + backward][c + 1];
      if (p !== PIECE.NONE && !this.isEnemy(p, isWhite)) return false;
    }

    return true;
  }

  private isSupported(pieces: Int8Array[], r: number, c: number, isWhite: boolean): boolean {
    const backward = isWhite ? 1 : -1;
    let support = false;
    if (isValidSquare(r + backward, c - 1) && !this.isEnemy(pieces[r + backward][c - 1], isWhite) && pieces[r + backward][c - 1] !== PIECE.NONE)
      support = true;
    if (!support && isValidSquare(r + backward, c + 1) && !this.isEnemy(pieces[r + backward][c + 1], isWhite) && pieces[r + backward][c + 1] !== PIECE.NONE)
      support = true;
    return support;
  }

  private isEnemy(piece: PIECE, isWhite: boolean): boolean {
    if (piece === PIECE.NONE) return false;
    if (isWhite) return piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
    return piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
  }

  private isTrapped(pieces: Int8Array[], r: number, c: number): boolean {
    const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (let d of dirs) {
      if (isValidSquare(r + d[0], c + d[1]) && pieces[r + d[0]][c + d[1]] === PIECE.NONE)
        return false;
    }
    return true;
  }

  private hasDefenders(pieces: Int8Array[], r: number, c: number, isWhite: boolean): boolean {
    const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (let d of dirs) {
      const nr = r + d[0], nc = c + d[1];
      if (isValidSquare(nr, nc)) {
        const p = pieces[nr][nc];
        if (p !== PIECE.NONE && !this.isEnemy(p, isWhite)) return true;
      }
    }
    return false;
  }

  private evaluateBaseHoles(pieces: Int8Array[]): number {
    let score = 0;
    if (pieces[9][4] === PIECE.NONE) score -= 20;
    if (pieces[9][6] === PIECE.NONE) score -= 20;
    if (pieces[0][3] === PIECE.NONE) score += 20;
    if (pieces[0][5] === PIECE.NONE) score += 20;
    return score;
  }
}

export const safetyAnalyzer = new SafetyAnalyzer();
