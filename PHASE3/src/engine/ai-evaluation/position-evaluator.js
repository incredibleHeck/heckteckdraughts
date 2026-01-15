/**
 * Position Evaluator - The General
 * Orchestrates Tapered Evaluation (Midgame -> Endgame interpolation).
 * * "Ruthless" Logic:
 * - Uses PhaseCalculator to determine the exact game state (0.0 to 1.0).
 * - Blends MG and EG scores for smooth play.
 * - Detects "Unwinnable" positions early.
 */

import { PIECE, PLAYER } from "../constants.js";
import { countPieces } from "../ai/ai.utils.js";
import { MaterialEvaluator } from "./material-evaluator.js";
import { PositionalEvaluator } from "./positional-evaluator.js";
import { PhaseCalculator } from "./phase-calculator.js";
import { DrawEvaluator } from "./draw-evaluator.js";
import { PatternEvaluator } from "./pattern-evaluator.js";

export class PositionEvaluator {
  constructor(weights = {}, patternTables = null) {
    this.materialEvaluator = new MaterialEvaluator(weights.MATERIAL);
    this.positionalEvaluator = new PositionalEvaluator(); // Uses internal optimized weights
    this.phaseCalculator = new PhaseCalculator();
    this.drawEvaluator = new DrawEvaluator();
    this.patternEvaluator = new PatternEvaluator(patternTables);
  }

  evaluatePosition(position) {
    // 1. Terminal State Detection (Instant Win/Loss)
    const { whiteCount, blackCount } = countPieces(position);
    if (whiteCount === 0) return -20000; // Absolute loss
    if (blackCount === 0) return 20000; // Absolute win

    // 2. Phase Calculation (0.0 = Endgame, 1.0 = Opening)
    // We use the PhaseCalculator to get a scalar value.
    const phase = this.phaseCalculator.getPhase(position);

    // 3. Component Evaluation
    // Material is constant, but its value relative to position changes.
    const material = this.materialEvaluator.evaluateMaterial(position);

    // Positional returns split scores { mgScore, egScore }
    const positional = this.positionalEvaluator.evaluatePositional(position);

    // Patterns (Tactical weaknesses) - weighted heavily in Midgame
    const patternScore = this.patternEvaluator.extractPatterns(position);

    // 4. Score Blending (Tapered Evaluation)
    // MG Score: Material + Positional(MG) + Patterns
    let mgTotal = material.balance + positional.mgScore + patternScore;

    // EG Score: Material + Positional(EG) + (Patterns / 2)
    // In endgame, specific tactical patterns matter less than King geometry.
    let egTotal = material.balance + positional.egScore + patternScore * 0.5;

    // Interpolate: (MG * phase) + (EG * (1 - phase))
    let finalScore = mgTotal * phase + egTotal * (1 - phase);

    // 5. Drawishness Adjustment
    // If we are winning but the position is theoretically drawn (e.g., 1 King vs 3 pieces logic),
    // reduce the score to prevent the AI from chasing ghosts.
    finalScore = this.drawEvaluator.capDrawishScore(finalScore, position);

    // 6. Perspective Correction
    // Negamax expects the score relative to the player to move.
    return position.currentPlayer === PLAYER.WHITE ? finalScore : -finalScore;
  }

  /**
   * Optimized Quick Eval for Move Ordering (MVV-LVA Lite)
   * Used to sort moves before the expensive search.
   */
  quickEval(position, move) {
    let score = 0;

    // 1. Captures are #1 priority
    if (move.captures && move.captures.length > 0) {
      score += 1000 * move.captures.length;

      // Add value of promoted queens captured (simple check)
      // (Assuming standard notation, 1000+ points per capture ensures these are checked first)
    }

    // 2. Promotion (Creating a King)
    const isPromotion =
      (move.to.row === 0 && position.currentPlayer === PLAYER.WHITE) ||
      (move.to.row === 9 && position.currentPlayer === PLAYER.BLACK);
    if (isPromotion) score += 500;

    // 3. Centralization (Heuristic)
    const centerDist =
      Math.abs(move.to.row - 4.5) + Math.abs(move.to.col - 4.5);
    score -= centerDist; // Closer to 0 is better

    return score;
  }
}
