/**
 * Ruthless Material Evaluator
 */

import { PIECE, PLAYER, BOARD_SIZE } from "../constants";
import { Position } from "../../utils/fen-parser";

export interface MaterialWeights {
  MAN: number;
  KING: number;
}

export interface MaterialEvaluation {
  whiteMaterial: number;
  blackMaterial: number;
  whiteKings: number;
  blackKings: number;
  balance: number;
}

export class MaterialEvaluator {
  private baseWeights: MaterialWeights;

  constructor(materialWeights?: MaterialWeights) {
    this.baseWeights = materialWeights || {
      MAN: 100,
      KING: 450,
    };
  }

  evaluateMaterial(position: Position): MaterialEvaluation {
    let whiteMaterial = 0;
    let blackMaterial = 0;
    let whiteKings = 0;
    let blackKings = 0;
    let whiteMen = 0;
    let blackMen = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = position.pieces[r][c];
        if (piece === PIECE.NONE) continue;

        if (piece === PIECE.WHITE) {
          whiteMaterial += this.baseWeights.MAN;
          whiteMen++;
        } else if (piece === PIECE.WHITE_KING) {
          whiteMaterial += this.baseWeights.KING;
          whiteKings++;
        } else if (piece === PIECE.BLACK) {
          blackMaterial += this.baseWeights.MAN;
          blackMen++;
        } else if (piece === PIECE.BLACK_KING) {
          blackMaterial += this.baseWeights.KING;
          blackKings++;
        }
      }
    }

    const totalPieces = whiteMen + whiteKings + blackMen + blackKings;

    let scale = 1.0;
    if (totalPieces < 15) {
      scale = 1.0 + (15 - totalPieces) * 0.05;
    }

    const rawBalance = whiteMaterial - blackMaterial;

    return {
      whiteMaterial,
      blackMaterial,
      whiteKings,
      blackKings,
      balance: Math.round(rawBalance * scale),
    };
  }

  getMaterialScore(position: Position): number {
    const material = this.evaluateMaterial(position);
    return position.currentPlayer === PLAYER.WHITE
      ? material.balance
      : -material.balance;
  }
}
