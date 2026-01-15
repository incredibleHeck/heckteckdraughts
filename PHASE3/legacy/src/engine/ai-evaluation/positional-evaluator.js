/**
 * Ruthless Positional Evaluator (Tapered)
 * * Calculates Midgame (MG) and Endgame (EG) scores separately.
 * MG: Focuses on Golden Squares (22, 23, 27, 28) and formation.
 * EG: Focuses on breakthrough and King activity.
 */

import { PIECE, BOARD_SIZE } from "../constants.js";

export class PositionalEvaluator {
  constructor() {
    // Weights are now split [MG, EG]
    this.weights = {
      CENTER_CONTROL: [15, 5], // Critical in MG, less so in EG
      BASE_INTEGRITY: [20, 0], // Guarding base is for opening
      ADVANCEMENT: [5, 15], // Pushing is vital in endgame
      KING_CENTRALITY: [0, 30], // Kings must centralize in EG
      EDGE_WEAKNESS: [-5, -10], // Edges are bad
      TRAPPED_KING: [0, -50], // Penalize kings stuck on edges
      FORMATION_COLUMN: [5, 0], // Structural strength
    };
  }

  evaluatePositional(position) {
    let mgScore = 0;
    let egScore = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if ((r + c) % 2 === 0) continue; // Skip light squares

        const piece = position.pieces[r][c];
        if (piece === PIECE.NONE) continue;

        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
        const multiplier = isWhite ? 1 : -1;

        // 1. Center Control (Golden Squares: 22, 23, 27, 28)
        // Coords: (4,2), (4,4)... roughly rows 4-5, cols 2-7
        if (r >= 4 && r <= 5 && c >= 2 && c <= 7) {
          mgScore += this.weights.CENTER_CONTROL[0] * multiplier;
          egScore += this.weights.CENTER_CONTROL[1] * multiplier;
        }

        // 2. Base Integrity (Rows 0 and 9)
        if (isWhite && r === 9) mgScore += this.weights.BASE_INTEGRITY[0];
        if (!isWhite && r === 0) mgScore -= this.weights.BASE_INTEGRITY[0];

        // 3. Advancement (The race to King)
        if (!isKing) {
          const advancement = isWhite ? 9 - r : r;
          mgScore += advancement * this.weights.ADVANCEMENT[0] * multiplier;
          egScore += advancement * this.weights.ADVANCEMENT[1] * multiplier;

          // Bonus for "Runner" (piece with clear path to king)
          // This is a simplified check; a full search handles the reality.
          if (advancement > 7) egScore += 50 * multiplier; // About to crown
        }

        // 4. King Logic
        if (isKing) {
          // Kings dominate the Endgame
          const centerDist = Math.abs(r - 4.5) + Math.abs(c - 4.5);

          // Centralization
          egScore +=
            (10 - centerDist) * this.weights.KING_CENTRALITY[1] * multiplier;

          // Penalty for being trapped on the main diagonal ends (corners)
          if ((r === 0 && c === 9) || (r === 9 && c === 0)) {
            egScore += this.weights.TRAPPED_KING[1] * multiplier;
          }
        }
      }
    }

    return { mgScore, egScore };
  }
}
