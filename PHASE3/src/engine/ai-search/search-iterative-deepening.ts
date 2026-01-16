/**
 * Iterative Deepening
 */

import { generateMoves, Move } from "../ai/ai.utils";
import { NegamaxSearch } from "./negamax-search";
import { Position } from "../../utils/fen-parser";

export class IterativeDeepening {
  private negamaxSearch: NegamaxSearch;
  public stopSearch = false;
  public currentDepth = 0;

  constructor(negamaxSearch: NegamaxSearch) {
    this.negamaxSearch = negamaxSearch;
  }

  abortSearch() {
    this.stopSearch = true;
    this.negamaxSearch.stopSearch = true;
  }

  reset() {
    this.stopSearch = false;
    this.negamaxSearch.resetStats();
  }

  async search(position: Position, maxDepth: number, timeLimit: number, startTime: number) {
    this.reset();

    this.negamaxSearch.setStopCondition(() => {
      if (this.stopSearch) return true;
      return Date.now() - startTime > timeLimit;
    });

    let bestMove: Move | null = null;
    let score = 0;

    const initialMoves = generateMoves(position);
    if (initialMoves.length === 0) return { move: null, score: -20000 };
    if (initialMoves.length === 1) return { move: initialMoves[0], score: 0 };

    for (let depth = 1; depth <= maxDepth; depth++) {
      this.currentDepth = depth;
      let alpha = -100000;
      let beta = 100000;
      const windowSize = 50;

      if (depth > 2) {
        alpha = score - windowSize;
        beta = score + windowSize;
      }

      let currentScore = this.negamaxSearch.search(position, depth, alpha, beta, 0);

      if (currentScore <= alpha || currentScore >= beta) {
        currentScore = this.negamaxSearch.search(position, depth, -100000, 100000, 0);
      }

      if (Date.now() - startTime > timeLimit || this.stopSearch) {
        if (bestMove) break;
      }

      score = currentScore;

      // Extract from TT - search-iterative-deepening.ts
      // Accessing private TT through any cast since Negamax has it
      const tt = (this.negamaxSearch as any).tt;
      const ttKey = tt.generateKey(position);
      const entry = tt.probe(ttKey);

      if (entry && entry.bestMove) {
        bestMove = entry.bestMove;
      } else {
        bestMove = initialMoves[0];
      }

      if (Math.abs(score) > 19000) break;
    }

    return {
      move: bestMove,
      score: score,
      stats: {
        nodes: this.negamaxSearch.nodeCount,
        depth: this.currentDepth,
      },
    };
  }
}
