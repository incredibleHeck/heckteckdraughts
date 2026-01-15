/**
 * Phase Calculator (10x10 Optimized)
 * Determines game phase for Tapered Evaluation.
 * * Tuning for International Draughts (10x10):
 * - Start: 40 pieces (Phase 1.0)
 * - Critical Transition: 16-20 pieces
 * - Deep Endgame: < 6 pieces (Phase 0.0)
 */

import { countPieces } from "../ai/ai.utils.js";

export class PhaseCalculator {
  constructor() {
    // 10x10 Draughts Thresholds
    this.OPENING_LIMIT = 32; // High piece count
    this.ENDGAME_LIMIT = 6; // Pure endgame calculation starts here
    this.MIDGAME_RANGE = 24; // Divisor for smoothing
  }

  /**
   * Calculate phase factor (0.0 to 1.0)
   * 1.0 = Midgame/Opening (Structure focus)
   * 0.0 = Endgame (King/Promotion focus)
   */
  getPhase(position) {
    const { whiteCount, blackCount } = countPieces(position);
    const totalPieces = whiteCount + blackCount;

    // Linear interpolation between ENDGAME_LIMIT and (ENDGAME_LIMIT + MIDGAME_RANGE)
    // Formula: (Total - 6) / 24.
    // At 30 pieces: (30-6)/24 = 1.0 (Midgame)
    // At 18 pieces: (18-6)/24 = 0.5 (Hybrid)
    // At 6 pieces:  (6-6)/24  = 0.0 (Pure Endgame)

    let phase = (totalPieces - this.ENDGAME_LIMIT) / this.MIDGAME_RANGE;

    // Clamp between 0 and 1
    return Math.min(1, Math.max(0, phase));
  }

  /**
   * Blend scores using the phase
   */
  blendScores(mgScore, egScore, position) {
    const phase = this.getPhase(position);
    // Linear Interpolation: (MG * Phase) + (EG * (1-Phase))
    return Math.round(mgScore * phase + egScore * (1 - phase));
  }

  getPhaseName(position) {
    const phase = this.getPhase(position);
    if (phase > 0.8) return "opening";
    if (phase > 0.2) return "middlegame";
    return "endgame";
  }
}
