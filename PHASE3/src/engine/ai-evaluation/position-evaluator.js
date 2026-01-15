/**
 * Position Evaluator - Orchestrator
 * Main evaluation interface that coordinates all evaluation components
 *
 * Components orchestrated:
 * - MaterialEvaluator: Piece material counting
 * - PositionalEvaluator: Piece positioning and mobility
 * - PhaseCalculator: Game phase detection and score blending
 * - DrawEvaluator: Draw position detection
 * - PatternEvaluator: Positional patterns
 *
 * @author codewithheck
 * AI Evaluation Refactor - Modular Architecture
 */

import { PIECE, PLAYER, BOARD_SIZE } from "../../constants.js";
import { EVALUATION_CONFIG } from "../ai/ai.constants.js";
import { countPieces } from "../ai/ai.utils.js";
import { MaterialEvaluator } from "./material-evaluator.js";
import { PositionalEvaluator } from "./positional-evaluator.js";
import { PhaseCalculator } from "./phase-calculator.js";
import { DrawEvaluator } from "./draw-evaluator.js";
import { PatternEvaluator } from "./pattern-evaluator.js";

export class PositionEvaluator {
  constructor(weights = EVALUATION_CONFIG, patternTables = null) {
    // Initialize specialized evaluators
    this.materialEvaluator = new MaterialEvaluator(weights.MATERIAL);
    this.positionalEvaluator = new PositionalEvaluator(
      weights.POSITIONAL,
      weights.TACTICAL
    );
    this.phaseCalculator = new PhaseCalculator();
    this.drawEvaluator = new DrawEvaluator();
    this.patternEvaluator = new PatternEvaluator(patternTables);

    this.tacticalWeights = weights.TACTICAL || {};
    this.tacticalWeight = 0.2;
    this.tacticalBonusLimit = 30;
    this.safetyWeight = 0.15;
    this.safetyBonusLimit = 25;

    this.tacticalAnalyzer = null;
    this.useTacticalAnalysis = false;
    this.safetyAnalyzer = null;
    this.useSafetyAnalysis = false;

    // Lazy-load tactical and safety analyzers
    setTimeout(() => {
      this.loadTacticalAnalyzer();
      this.loadSafetyAnalyzer();
    }, 100);
  }

  /**
   * Main position evaluation
   */
  evaluatePosition(position) {
    const { whiteCount, blackCount } = countPieces(position);

    // Terminal positions
    if (whiteCount === 0) {
      return position.currentPlayer === PLAYER.BLACK ? 10000 : -10000;
    }
    if (blackCount === 0) {
      return position.currentPlayer === PLAYER.WHITE ? 10000 : -10000;
    }

    // Material evaluation
    const materialScore = this.materialEvaluator.getMaterialScore(position);

    // Positional evaluation
    const { mgScore: mgPositional, egScore: egPositional } =
      this.positionalEvaluator.evaluatePositional(position);
    const mobilityScore = this.positionalEvaluator.evaluateMobility(position);
    const kingMobilityDiff =
      this.positionalEvaluator.getKingMobilityDifference(position);

    // Combine positional and mobility
    let mgScore = mgPositional + mobilityScore;
    let egScore = egPositional + kingMobilityDiff * 2;

    // Add material
    mgScore += materialScore;
    egScore += materialScore;

    // Pattern evaluation
    const patternScore = this.patternEvaluator.extractPatterns(position);
    mgScore += patternScore;

    // Phase blending
    let score = this.phaseCalculator.blendScores(mgScore, egScore, position);

    // Draw adjustment
    score = this.drawEvaluator.adjustForDraw(score, position);

    // Tactical analysis (if available)
    if (this.useTacticalAnalysis && this.tacticalAnalyzer) {
      try {
        const tacticalBonus = this.evaluateTacticalBonus(position);
        score += tacticalBonus;
      } catch (error) {}
    }

    // Safety analysis (if available)
    if (this.useSafetyAnalysis && this.safetyAnalyzer) {
      try {
        const safetyBonus = this.evaluateSafetyBonus(position);
        score += safetyBonus;
      } catch (error) {}
    }

    // Apply player perspective
    return position.currentPlayer === PLAYER.WHITE ? score : -score;
  }

  /**
   * Evaluate tactical bonus
   */
  evaluateTacticalBonus(position) {
    if (!this.tacticalAnalyzer) return 0;

    try {
      const analysis = this.tacticalAnalyzer.analyzeTactics(position);
      let bonus = analysis.score * this.tacticalWeight;

      if (analysis.details) {
        const current = analysis.details.current;
        if (current.forks?.length > 0) {
          bonus += current.forks.length * 5;
        }
        if (current.hanging?.length > 0) {
          bonus -= current.hanging.length * 10;
        }
      }

      return Math.max(
        -this.tacticalBonusLimit,
        Math.min(this.tacticalBonusLimit, bonus)
      );
    } catch (error) {
      return 0;
    }
  }

  /**
   * Evaluate safety bonus
   */
  evaluateSafetyBonus(position) {
    if (!this.safetyAnalyzer) return 0;

    try {
      const analysis = this.safetyAnalyzer.analyzeSafety(position);
      let bonus = analysis.score * this.safetyWeight;

      if (analysis.forcedCaptures?.tactical_trap) {
        bonus -= 20;
      }
      if (analysis.kingVulnerability < -50) {
        bonus -= 15;
      }

      const totalMoves =
        (analysis.safeMoves?.length || 0) + (analysis.riskyMoves?.length || 0);
      if (totalMoves > 0) {
        const safeRatio = (analysis.safeMoves?.length || 0) / totalMoves;
        if (safeRatio > 0.7) {
          bonus += 10;
        } else if (safeRatio < 0.3) {
          bonus -= 10;
        }
      }

      return Math.max(
        -this.safetyBonusLimit,
        Math.min(this.safetyBonusLimit, bonus)
      );
    } catch (error) {
      return 0;
    }
  }

  /**
   * Quick move evaluation (for move ordering)
   */
  quickEval(position, move) {
    const piece = position.pieces[move.from.row][move.from.col];
    const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;

    let score = 0;

    // Advancement bonus
    if (piece === PIECE.WHITE) {
      score += (move.from.row - move.to.row) * 10;
    } else if (piece === PIECE.BLACK) {
      score += (move.to.row - move.from.row) * 10;
    }

    // Centralization bonus
    const centerDist =
      Math.abs(move.to.row - 4.5) + Math.abs(move.to.col - 4.5);
    score += 10 - centerDist;

    // Capture bonus
    if (move.captures?.length > 0) {
      score += move.captures.length * 100;
    }

    return score;
  }

  /**
   * Load tactical analyzer dynamically
   */
  loadTacticalAnalyzer() {
    try {
      import("../ai/ai.tactics.js")
        .then((module) => {
          if (module.tacticalAnalyzer) {
            this.tacticalAnalyzer = module.tacticalAnalyzer;
            this.useTacticalAnalysis = true;
          } else if (module.TacticalAnalyzer) {
            this.tacticalAnalyzer = new module.TacticalAnalyzer();
            this.useTacticalAnalysis = true;
          }
        })
        .catch((error) => {});
    } catch (error) {}
  }

  /**
   * Load safety analyzer dynamically
   */
  loadSafetyAnalyzer() {
    try {
      import("../ai/ai.safety.js")
        .then((module) => {
          if (module.safetyAnalyzer) {
            this.safetyAnalyzer = module.safetyAnalyzer;
            this.useSafetyAnalysis = true;
          } else if (module.SafetyAnalyzer) {
            this.safetyAnalyzer = new module.SafetyAnalyzer();
            this.useSafetyAnalysis = true;
          }
        })
        .catch((error) => {});
    } catch (error) {}
  }

  /**
   * Get game phase
   */
  getGamePhase(position) {
    return this.phaseCalculator.getPhaseName(position);
  }

  /**
   * Get material balance
   */
  getMaterialBalance(position) {
    return this.materialEvaluator.evaluateMaterial(position);
  }

  /**
   * Get draw likelihood
   */
  getDrawLikelihood(position) {
    return this.drawEvaluator.getDrawLikelihood(position);
  }

  /**
   * Set tactical weight
   */
  setTacticalWeight(weight) {
    this.tacticalWeight = weight;
  }

  /**
   * Set safety weight
   */
  setSafetyWeight(weight) {
    this.safetyWeight = weight;
  }
}
