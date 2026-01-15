/**
 * Ruthless Material Evaluator
 * Evaluates material with Endgame Amplification.
 * * * Logic:
 * - Non-Linear Scaling: Material advantage is worth MORE as the board clears.
 * - King Dominance: Kings are weighted heavily to encourage promotion.
 */

import { PIECE, PLAYER, BOARD_SIZE } from "../constants.js";

export class MaterialEvaluator {
  constructor(materialWeights) {
    this.baseWeights = materialWeights || {
      MAN: 100,
      KING: 450, // Increased from 400 to prioritize promotion aggression
    };
  }

  evaluateMaterial(position) {
    let whiteMaterial = 0;
    let blackMaterial = 0;
    let whiteKings = 0;
    let blackKings = 0;
    let whiteMen = 0;
    let blackMen = 0;

    // Single pass scan
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

    // --- RUTHLESS OPTIMIZATION: Endgame Amplification ---
    // As pieces disappear, the remaining pieces become more valuable.
    // Standard game starts with 40 pieces.
    const totalPieces = whiteMen + whiteKings + blackMen + blackKings;

    // Scale factor: 1.0 at start, rising to 1.5 as pieces drop below 10
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
      // Apply scaling to the difference, not the total
      balance: Math.round(rawBalance * scale),
    };
  }

  getMaterialScore(position) {
    const material = this.evaluateMaterial(position);
    return position.currentPlayer === PLAYER.WHITE
      ? material.balance
      : -material.balance;
  }
}
