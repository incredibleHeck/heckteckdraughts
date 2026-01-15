/**
 * Phase Calculator
 * Determines game phase and applies phase-based weighting
 *
 * Handles:
 * - Opening/middlegame/endgame detection
 * - Phase blending between midgame and endgame
 * - Piece count analysis
 *
 * @author codewithheck
 * AI Evaluation Refactor - Modular Architecture
 */

import { PIECE, PLAYER, BOARD_SIZE } from "../../constants.js";
import { countPieces } from "../ai/ai.utils.js";

export class PhaseCalculator {
  constructor() {
    this.openingThreshold = 16; // Pieces remain > this = opening
    this.middlegameThreshold = 10; // Pieces between this and opening = middlegame
    // < middlegameThreshold = endgame
  }

  /**
   * Calculate phase value (0 = endgame, 1 = opening/middlegame)
   * Used for blending midgame and endgame evaluation scores
   */
  getPhase(position) {
    const { whiteCount, blackCount } = countPieces(position);
    const totalPieces = whiteCount + blackCount;

    // Normalized to 0-1 range
    return Math.min(1, Math.max(0, totalPieces / 24));
  }

  /**
   * Get phase name
   */
  getPhaseName(position) {
    const { whiteCount, blackCount } = countPieces(position);
    const totalPieces = whiteCount + blackCount;

    if (totalPieces > this.openingThreshold) {
      return "opening";
    } else if (totalPieces > this.middlegameThreshold) {
      return "middlegame";
    } else {
      return "endgame";
    }
  }

  /**
   * Blend two scores based on game phase
   * mgScore = midgame score, egScore = endgame score
   * phase value 0-1 (0=full endgame, 1=full middlegame)
   */
  blendScores(mgScore, egScore, position) {
    const phase = this.getPhase(position);
    return Math.round(mgScore * phase + egScore * (1 - phase));
  }

  /**
   * Get phase-appropriate weight adjustments
   */
  getPhaseWeights(position) {
    const phase = this.getPhaseName(position);

    switch (phase) {
      case "opening":
        return {
          material: 1.0,
          positional: 0.8,
          mobility: 1.2,
          tactical: 0.5,
          safety: 0.3,
        };
      case "middlegame":
        return {
          material: 1.0,
          positional: 1.0,
          mobility: 1.0,
          tactical: 1.0,
          safety: 0.8,
        };
      case "endgame":
        return {
          material: 1.0,
          positional: 1.2,
          mobility: 1.5,
          tactical: 0.8,
          safety: 1.5,
        };
      default:
        return {
          material: 1.0,
          positional: 1.0,
          mobility: 1.0,
          tactical: 1.0,
          safety: 1.0,
        };
    }
  }

  /**
   * Check if position is likely an endgame
   */
  isEndgame(position) {
    return this.getPhaseName(position) === "endgame";
  }

  /**
   * Check if position is likely opening
   */
  isOpening(position) {
    return this.getPhaseName(position) === "opening";
  }

  /**
   * Check if position is likely middlegame
   */
  isMiddlegame(position) {
    return this.getPhaseName(position) === "middlegame";
  }

  /**
   * Get piece count for phase analysis
   */
  getPieceCount(position) {
    return countPieces(position);
  }

  /**
   * Set phase thresholds
   */
  setThresholds(opening, middlegame) {
    this.openingThreshold = opening;
    this.middlegameThreshold = middlegame;
  }
}
