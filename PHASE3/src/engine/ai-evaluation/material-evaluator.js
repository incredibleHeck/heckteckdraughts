/**
 * Material Evaluator
 * Evaluates piece material and material balance
 *
 * Handles:
 * - Piece material counting
 * - Material balance calculation
 * - Material scoring
 *
 * @author codewithheck
 * AI Evaluation Refactor - Modular Architecture
 */

import { PIECE, PLAYER, BOARD_SIZE } from "../constants.js";

export class MaterialEvaluator {
  constructor(materialWeights) {
    this.materialWeights = materialWeights || {
      MAN: 100,
      KING: 400,
    };
  }

  /**
   * Evaluate material on the board
   */
  evaluateMaterial(position) {
    let whiteMaterial = 0;
    let blackMaterial = 0;
    let whiteKings = 0;
    let blackKings = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = position.pieces[r][c];

        if (piece === PIECE.WHITE) {
          whiteMaterial += this.materialWeights.MAN;
        } else if (piece === PIECE.WHITE_KING) {
          whiteMaterial += this.materialWeights.KING;
          whiteKings++;
        } else if (piece === PIECE.BLACK) {
          blackMaterial += this.materialWeights.MAN;
        } else if (piece === PIECE.BLACK_KING) {
          blackMaterial += this.materialWeights.KING;
          blackKings++;
        }
      }
    }

    return {
      whiteMaterial,
      blackMaterial,
      whiteKings,
      blackKings,
      balance: whiteMaterial - blackMaterial,
    };
  }

  /**
   * Get material score for current position
   */
  getMaterialScore(position) {
    const material = this.evaluateMaterial(position);
    return position.currentPlayer === PLAYER.WHITE
      ? material.balance
      : -material.balance;
  }

  /**
   * Set material weights
   */
  setWeights(weights) {
    this.materialWeights = { ...this.materialWeights, ...weights };
  }

  /**
   * Get material weights
   */
  getWeights() {
    return this.materialWeights;
  }
}
