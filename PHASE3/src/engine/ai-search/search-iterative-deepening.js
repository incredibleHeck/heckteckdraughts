/**
 * Iterative Deepening Search Controller
 * Orchestrates search at increasing depths with time management
 *
 * Features:
 * - Progressive depth search
 * - Time-aware cutoffs
 * - Best move preservation
 * - Early termination for winning positions
 * - Principal variation tracking
 *
 * @author codewithheck
 * AI Search Refactor - Modular Architecture
 */

import { generateMoves, makeMove } from "../ai/ai.utils.js";
import { SEARCH_CONFIG } from "../ai/ai.constants.js";

export class IterativeDeepening {
  constructor(negamaxSearch, moveOrderer) {
    this.negamaxSearch = negamaxSearch;
    this.moveOrderer = moveOrderer;
    this.searchAborted = false;
  }

  /**
   * Main search interface - Iterative deepening
   * PRESERVES EXACT LOGIC from working version
   */
  async search(position, maxDepth, timeLimit, startTime) {
    let bestMove = null;
    let bestScore = -Infinity;

    const moves = generateMoves(position);
    if (moves.length === 0) return { move: null, score: 0 };
    if (moves.length === 1) return { move: moves[0], score: 0 };

    // Iterative deepening loop - EXACT LOGIC PRESERVED
    for (let depth = 1; depth <= maxDepth; depth++) {
      const timeUsed = Date.now() - startTime;
      if (
        timeUsed >
        timeLimit * SEARCH_CONFIG.TIME_MANAGEMENT.EARLY_EXIT_THRESHOLD
      ) {
        break;
      }

      const result = await this.searchRoot(
        position,
        depth,
        startTime,
        timeLimit
      );

      if (result.timeout || this.searchAborted) {
        break;
      }

      if (result.move) {
        bestMove = result.move;
        bestScore = result.score;

        // Send progress update
        if (typeof postMessage === "function") {
          postMessage({
            type: "evaluation",
            data: {
              score: bestScore,
              depth: depth,
              nodes: this.negamaxSearch.getNodeCount(),
              time: Date.now() - startTime,
              pv: result.principalVariation || [],
            },
          });
        }

        // Early exit for winning positions
        if (Math.abs(bestScore) > 5000) {
          console.log(`Winning position found at depth ${depth}!`);
          break;
        }
      }
    }

    return {
      move: bestMove || moves[0],
      score: bestScore,
      nodes: this.negamaxSearch.getNodeCount(),
      time: Date.now() - startTime,
    };
  }

  /**
   * Root search (first level of search tree)
   * PRESERVES EXACT LOGIC from working version
   */
  async searchRoot(position, depth, startTime, timeLimit) {
    let alpha = -Infinity;
    let beta = Infinity;
    let bestMove = null;
    let bestScore = -Infinity;
    let principalVariation = [];

    const moves = this.moveOrderer.orderMoves(
      generateMoves(position),
      position,
      0
    );

    for (const move of moves) {
      // Time check
      if (Date.now() - startTime > timeLimit || this.searchAborted) {
        return {
          move: bestMove || moves[0],
          score: bestScore,
          timeout: true,
        };
      }

      const newPosition = makeMove(position, move);
      const score = -this.negamaxSearch.negamax(
        newPosition,
        depth - 1,
        -beta,
        -alpha,
        startTime,
        timeLimit,
        1
      );

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
        principalVariation = [move]; // Start of PV
      }

      alpha = Math.max(alpha, score);

      if (alpha >= beta) {
        // Alpha-beta cutoff
        this.moveOrderer.updateKillers(move, 0);
        break;
      }
    }

    return {
      move: bestMove || moves[0],
      score: bestScore,
      timeout: false,
      principalVariation,
    };
  }

  /**
   * Advanced search with multiple techniques
   */
  async advancedSearch(position, depth, timeLimit, startTime) {
    // Reset statistics
    this.negamaxSearch.resetStats();
    let searchTime = 0;

    let bestMove = null;
    let bestScore = -Infinity;

    // Try iterative deepening with aspiration windows
    for (let d = 1; d <= depth; d++) {
      const timeUsed = Date.now() - startTime;
      if (timeUsed > timeLimit * 0.8) break;

      let score;
      if (d <= 4 || bestScore === -Infinity) {
        // Full window search for shallow depths or first iteration
        score = this.negamaxSearch.negamax(
          position,
          d,
          -Infinity,
          Infinity,
          startTime,
          timeLimit,
          0
        );
      } else {
        // Aspiration window search
        score = this.negamaxSearch.aspirationSearch(
          position,
          d,
          bestScore,
          startTime,
          timeLimit
        );
      }

      if (this.searchAborted) break;

      // Extract best move from TT
      const ttKey = this.negamaxSearch.tt.generateKey(position);
      const ttEntry = this.negamaxSearch.tt.getBestMove(ttKey);
      if (ttEntry) {
        bestMove = ttEntry;
        bestScore = score;
      }

      // Early termination for mate scores
      if (Math.abs(score) > 9000) {
        console.log(`Mate found at depth ${d}`);
        break;
      }
    }

    searchTime = Date.now() - startTime;

    return {
      move: bestMove,
      score: bestScore,
      stats: this.getSearchStats(),
      principalVariation: this.negamaxSearch.extractPrincipalVariation(
        position,
        Math.min(depth, 10)
      ),
    };
  }

  /**
   * Get combined search statistics
   */
  getSearchStats() {
    return {
      nodes: this.negamaxSearch.getNodeCount(),
      selectiveDepth: this.negamaxSearch.getSelectiveDepth(),
      transpositionTable: this.negamaxSearch.tt.getStats(),
      nodesPerSecond:
        this.negamaxSearch.getNodeCount() / Math.max(1, this.searchTime / 1000),
    };
  }

  /**
   * Abort current search
   */
  abortSearch() {
    this.searchAborted = true;
    this.negamaxSearch.abortSearch();
  }

  /**
   * Reset search
   */
  reset() {
    this.searchAborted = false;
    this.negamaxSearch.resetStats();
  }
}
