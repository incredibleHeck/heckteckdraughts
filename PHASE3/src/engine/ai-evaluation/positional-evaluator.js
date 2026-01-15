/**
 * Positional Evaluator
 * Evaluates piece positioning and positional factors
 *
 * Handles:
 * - Piece advancement
 * - Promotion zone bonuses
 * - King centralization
 * - Center control
 * - Edge penalties
 *
 * @author codewithheck
 * AI Evaluation Refactor - Modular Architecture
 */

import { PIECE, PLAYER, BOARD_SIZE } from "../../constants.js";
import { generateMoves } from "../ai/ai.utils.js";

export class PositionalEvaluator {
  constructor(positionalWeights, tacticalWeights) {
    this.positionalWeights = positionalWeights || {
      ADVANCEMENT_BONUS: 10,
      PROMOTION_ZONE_BONUS: 50,
      ABOUT_TO_PROMOTE: 100,
      KING_CENTRALIZATION: 20,
      CENTER_BONUS: 10,
      EDGE_PENALTY: 15,
    };
    this.tacticalWeights = tacticalWeights || {
      MOBILITY_BONUS: 2,
    };
  }

  /**
   * Evaluate positional factors
   */
  evaluatePositional(position) {
    let mgScore = 0; // Midgame score
    let egScore = 0; // Endgame score

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = position.pieces[r][c];
        if (piece === PIECE.NONE) continue;

        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;

        // Advancement bonus for non-kings
        if (!isKing) {
          if (isWhite) {
            mgScore += (9 - r) * this.positionalWeights.ADVANCEMENT_BONUS;

            // Promotion zone bonuses
            if (r <= 2) mgScore += this.positionalWeights.PROMOTION_ZONE_BONUS;
            if (r === 1) mgScore += this.positionalWeights.ABOUT_TO_PROMOTE;
          } else {
            mgScore -= r * this.positionalWeights.ADVANCEMENT_BONUS;

            // Promotion zone bonuses
            if (r >= 7) mgScore -= this.positionalWeights.PROMOTION_ZONE_BONUS;
            if (r === 8) mgScore -= this.positionalWeights.ABOUT_TO_PROMOTE;
          }
        }

        // King centralization (both midgame and endgame)
        if (isKing) {
          const centerDist = Math.abs(r - 4.5) + Math.abs(c - 4.5);
          const centralScore =
            this.positionalWeights.KING_CENTRALIZATION - centerDist;

          mgScore += isWhite ? centralScore : -centralScore;
          egScore += isWhite ? centralScore : -centralScore;
        }

        // Center control bonus
        if (r >= 3 && r <= 6 && c >= 2 && c <= 7) {
          mgScore += isWhite
            ? this.positionalWeights.CENTER_BONUS
            : -this.positionalWeights.CENTER_BONUS;
        }

        // Edge penalty for non-kings
        if (!isKing && (r === 0 || r === 9 || c === 0 || c === 9)) {
          mgScore += isWhite
            ? this.positionalWeights.EDGE_PENALTY
            : -this.positionalWeights.EDGE_PENALTY;
        }
      }
    }

    return { mgScore, egScore };
  }

  /**
   * Evaluate mobility (number of available moves)
   */
  evaluateMobility(position) {
    const moves = generateMoves(position);
    return position.currentPlayer === PLAYER.WHITE
      ? moves.length * this.tacticalWeights.MOBILITY_BONUS
      : -moves.length * this.tacticalWeights.MOBILITY_BONUS;
  }

  /**
   * Evaluate king mobility (endgame factor)
   */
  evaluateKingMobility(position, isWhite) {
    let mobility = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = position.pieces[r][c];
        if (
          (isWhite && piece === PIECE.WHITE_KING) ||
          (!isWhite && piece === PIECE.BLACK_KING)
        ) {
          // Count available squares for this king
          for (const [dr, dc] of [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ]) {
            let nr = r + dr,
              nc = c + dc;
            while (
              nr >= 0 &&
              nr < BOARD_SIZE &&
              nc >= 0 &&
              nc < BOARD_SIZE &&
              position.pieces[nr][nc] === PIECE.NONE
            ) {
              mobility++;
              nr += dr;
              nc += dc;
            }
          }
        }
      }
    }

    return mobility;
  }

  /**
   * Get total king mobility difference
   */
  getKingMobilityDifference(position) {
    const whiteKingMobility = this.evaluateKingMobility(position, true);
    const blackKingMobility = this.evaluateKingMobility(position, false);

    return whiteKingMobility - blackKingMobility;
  }

  /**
   * Set weights
   */
  setWeights(positional, tactical) {
    if (positional)
      this.positionalWeights = { ...this.positionalWeights, ...positional };
    if (tactical)
      this.tacticalWeights = { ...this.tacticalWeights, ...tactical };
  }

  /**
   * Get weights
   */
  getWeights() {
    return {
      positional: this.positionalWeights,
      tactical: this.tacticalWeights,
    };
  }
}
