/**
 * Iterative Deepening (Aspiration Windows)
 * * * Key Features:
 * - Aspiration Windows: Narrows search window based on previous depth score.
 * - Time Management: Strict checking.
 */

import { generateMoves } from "../ai/ai.utils.js";

export class IterativeDeepening {
  constructor(negamaxSearch, moveOrderer) {
    this.negamaxSearch = negamaxSearch;
    this.moveOrderer = moveOrderer;
    this.stopSearch = false;
  }

  abortSearch() {
    this.stopSearch = true;
    this.negamaxSearch.stopSearch = true;
  }

  reset() {
    this.stopSearch = false;
    this.negamaxSearch.resetStats();
  }

  async search(position, maxDepth, timeLimit, startTime) {
    this.reset();

    // Time Management Hook
    this.negamaxSearch.setStopCondition(() => {
      if (this.stopSearch) return true;
      return Date.now() - startTime > timeLimit;
    });

    let bestMove = null;
    let score = 0;

    // Initial Move Gen check
    const initialMoves = generateMoves(position);
    if (initialMoves.length === 0) return { move: null, score: -20000 };
    if (initialMoves.length === 1) return { move: initialMoves[0], score: 0 }; // Forced move

    // --- ITERATIVE DEEPENING LOOP ---
    for (let depth = 1; depth <= maxDepth; depth++) {
      // Aspiration Window Logic
      // At depth 1, window is infinite.
      // At depth > 1, window is [score - window, score + window]
      let alpha = -Infinity;
      let beta = Infinity;
      const windowSize = 50;

      if (depth > 2) {
        alpha = score - windowSize;
        beta = score + windowSize;
      }

      let currentScore = 0;

      // Search
      currentScore = this.negamaxSearch.search(position, depth, alpha, beta, 0);

      // Fail Low/High Handling (Re-search)
      if (currentScore <= alpha || currentScore >= beta) {
        // Aspiration fail - Search full window
        // console.log(`Aspiration fail at depth ${depth}, re-searching...`);
        currentScore = this.negamaxSearch.search(
          position,
          depth,
          -Infinity,
          Infinity,
          0
        );
      }

      if (Date.now() - startTime > timeLimit || this.stopSearch) {
        // If we timed out during the search, discard this depth's result
        // unless we found no move yet.
        if (bestMove) break;
      }

      score = currentScore;

      // Extract Best Move from TT for result
      const ttKey = this.negamaxSearch.tt.generateKey(position);
      const entry = this.negamaxSearch.tt.probe(ttKey);

      if (entry && entry.bestMove) {
        bestMove = entry.bestMove;
        // console.log(`Depth ${depth} complete. Score: ${score}. Move: ${bestMove.from.row},${bestMove.from.col} -> ${bestMove.to.row},${bestMove.to.col}`);
      } else {
        // Fallback if TT missed (rare)
        bestMove = initialMoves[0];
      }

      // Mate detection
      if (Math.abs(score) > 19000) break;
    }

    return {
      move: bestMove,
      score: score,
      stats: {
        nodes: this.negamaxSearch.getNodeCount(),
        depth: maxDepth,
      },
    };
  }
}
