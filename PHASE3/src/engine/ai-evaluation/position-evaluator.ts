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

  constructor(weights: EvaluationWeights = {}, patternTables: any = null) {
    this.materialEvaluator = new MaterialEvaluator(weights.MATERIAL);
    this.positionalEvaluator = new PositionalEvaluator();
    this.phaseCalculator = new PhaseCalculator();
    this.drawEvaluator = new DrawEvaluator();
    this.patternEvaluator = new PatternEvaluator();
  }

  evaluatePosition(position: Position): number {
    const { whiteCount, blackCount } = countPieces(position);
    if (whiteCount === 0) return -20000;
    if (blackCount === 0) return 20000;

    const phase = this.phaseCalculator.getPhase(position);
    const material = this.materialEvaluator.evaluateMaterial(position);
    const positional = this.positionalEvaluator.evaluatePositional(position);
    const patternScore = this.patternEvaluator.extractPatterns(position);

    const mgTotal = material.balance + positional.mgScore + patternScore;
    const egTotal = material.balance + positional.egScore + patternScore * 0.5;

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

    const centerDist =
      Math.abs(move.to.row - 4.5) + Math.abs(move.to.col - 4.5);
    score -= centerDist;

    return score;
  }
}
