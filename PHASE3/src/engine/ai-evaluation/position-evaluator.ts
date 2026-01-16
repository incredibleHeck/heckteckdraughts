/**
 * Position Evaluator - The General
 */

import { PLAYER } from "../constants";
import { countPieces, Move } from "../ai/ai.utils";
import { MaterialEvaluator, MaterialWeights } from "./material-evaluator";
import { PositionalEvaluator } from "./positional-evaluator";
import { PhaseCalculator } from "./phase-calculator";
import { DrawEvaluator } from "./draw-evaluator";
import { PatternEvaluator } from "./pattern-evaluator";
import { SafetyAnalyzer } from "../ai/ai.safety";
import { TacticalAnalyzer } from "../ai/ai.tactics";
import { EndgameEvaluator } from "../ai/ai.endgame";
import { Position } from "../../utils/fen-parser";

export interface EvaluationWeights {
  MATERIAL?: MaterialWeights;
}

export class PositionEvaluator {
  private materialEvaluator: MaterialEvaluator;
  private positionalEvaluator: PositionalEvaluator;
  private phaseCalculator: PhaseCalculator;
  private drawEvaluator: DrawEvaluator;
  private patternEvaluator: PatternEvaluator;
  private safetyAnalyzer: SafetyAnalyzer;
  private tacticalAnalyzer: TacticalAnalyzer;
  private endgameEvaluator: EndgameEvaluator;

  constructor(weights: EvaluationWeights = {}, patternTables: any = null) {
    this.materialEvaluator = new MaterialEvaluator(weights.MATERIAL);
    this.positionalEvaluator = new PositionalEvaluator();
    this.phaseCalculator = new PhaseCalculator();
    this.drawEvaluator = new DrawEvaluator();
    this.patternEvaluator = new PatternEvaluator();
    this.safetyAnalyzer = new SafetyAnalyzer();
    this.tacticalAnalyzer = new TacticalAnalyzer();
    this.endgameEvaluator = new EndgameEvaluator();
  }

  evaluatePosition(position: Position): number {
    const { whiteCount, blackCount } = countPieces(position);
    if (whiteCount === 0) return -20000;
    if (blackCount === 0) return 20000;

    // --- RUTHLESS TAPERED EVALUATION ---
    const phase = this.phaseCalculator.getPhase(position);

    // If pieces are very low, use specialized endgame logic
    if (whiteCount + blackCount <= 10) {
      const egScore = this.endgameEvaluator.evaluateEndgame(position);
      return position.currentPlayer === PLAYER.WHITE ? egScore : -egScore;
    }

    const material = this.materialEvaluator.evaluateMaterial(position);
    const positional = this.positionalEvaluator.evaluatePositional(position);
    const patternScore = this.patternEvaluator.extractPatterns(position);
    const safetyScore = this.safetyAnalyzer.analyzeSafety(position).score;
    const tacticalScore = this.tacticalAnalyzer.analyzeTactics(position).score;

    // MG Score
    let mgTotal = material.balance + positional.mgScore + patternScore + safetyScore + tacticalScore;

    // EG Score
    let egTotal = material.balance + positional.egScore + (patternScore * 0.5) + (safetyScore * 0.5);

    let finalScore = mgTotal * phase + egTotal * (1 - phase);

    finalScore = this.drawEvaluator.adjustForDraw(finalScore, position);

    return position.currentPlayer === PLAYER.WHITE ? finalScore : -finalScore;
  }

  quickEval(position: Position, move: Move): number {
    let score = 0;

    if (move.captures && move.captures.length > 0) {
      score += 1000 * move.captures.length;
    }

    const isPromotion =
      (move.to.row === 0 && position.currentPlayer === PLAYER.WHITE) ||
      (move.to.row === 9 && position.currentPlayer === PLAYER.BLACK);
    if (isPromotion) score += 500;

    // Use tactical analyzer for quick move ordering
    score += this.tacticalAnalyzer.quickTacticalScore(position, move);

    const centerDist =
      Math.abs(move.to.row - 4.5) + Math.abs(move.to.col - 4.5);
    score -= centerDist;

    return score;
  }
}