/**
 * Phase Calculator (10x10 Optimized)
 */

import { countPieces } from "../ai/ai.utils";
import { Position } from "../../utils/fen-parser";

export class PhaseCalculator {
  private OPENING_LIMIT = 32;
  private ENDGAME_LIMIT = 6;
  private MIDGAME_RANGE = 24;

  getPhase(position: Position): number {
    const { whiteCount, blackCount } = countPieces(position);
    const totalPieces = whiteCount + blackCount;

    let phase = (totalPieces - this.ENDGAME_LIMIT) / this.MIDGAME_RANGE;

    return Math.min(1, Math.max(0, phase));
  }

  blendScores(mgScore: number, egScore: number, position: Position): number {
    const phase = this.getPhase(position);
    return Math.round(mgScore * phase + egScore * (1 - phase));
  }

  getPhaseName(position: Position): "opening" | "middlegame" | "endgame" {
    const phase = this.getPhase(position);
    if (phase > 0.8) return "opening";
    if (phase > 0.2) return "middlegame";
    return "endgame";
  }
}
