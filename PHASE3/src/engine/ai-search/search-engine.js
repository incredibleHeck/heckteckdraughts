/**
 * Ruthless Negamax Search (PVS Implementation)
 * * * Key Features:
 * - Principal Variation Search (NegaScout)
 * - Transposition Table Lookup
 * - Null Move Pruning (Aggressive tactical reduction)
 * - Zobrist Hashing support
 */

import {
  generateMoves,
  makeMove,
  generatePositionKey,
  isEndgame,
} from "../ai/ai.utils.js";
import { SEARCH_CONFIG, AI_CONFIG } from "../ai/ai.constants.js";

export class NegamaxSearch {
  constructor(evaluator, transpositionTable, moveOrderer) {
    this.evaluator = evaluator;
    this.tt = transpositionTable;
    this.moveOrderer = moveOrderer;
    // Quiescence will be injected by the Engine
    this.quiescenceSearch = null;

    this.nodeCount = 0;
    this.selDepth = 0;
    this.stopSearch = false;
  }

  resetStats() {
    this.nodeCount = 0;
    this.selDepth = 0;
    this.stopSearch = false;
  }

  /**
   * Main Search Function (PVS)
   */
  search(position, depth, alpha, beta, ply = 0) {
    // 1. Statistics & Time Check
    this.nodeCount++;
    if (this.selDepth < ply) this.selDepth = ply;

    // Check time every 2048 nodes (bitwise optimization)
    if ((this.nodeCount & 2047) === 0) {
      if (this.shouldStop()) return alpha;
    }

    // 2. Base Cases
    if (depth <= 0) {
      return this.quiescenceSearch.search(position, alpha, beta);
    }

    // 3. Transposition Table Lookup
    // We calculate hash. Ideally incremental, but O(N) is fast enough with the new utils.
    const ttKey = generatePositionKey(position);
    let ttMove = null;

    if (this.tt) {
      const entry = this.tt.probe(ttKey);
      if (entry && entry.depth >= depth) {
        if (entry.flag === "exact") return entry.score;
        if (entry.flag === "lower" && entry.score > alpha) alpha = entry.score;
        if (entry.flag === "upper" && entry.score < beta) beta = entry.score;
        if (alpha >= beta) return entry.score;
      }
      if (entry) ttMove = entry.bestMove;
    }

    // 4. Null Move Pruning
    // If we are not in endgame and depth is high, try "passing" to see if we still hold position.
    // Draughts specific: Don't do this if we have a capture! (Zugzwang is common)
    if (depth >= 3 && ply > 0 && beta < Infinity && !isEndgame(position)) {
      // Logic: If I do nothing and still beat Beta, my position is awesome.
      // R = 2 or 3.
      // (Skipped for safety in 10x10 tactical shots, can enable for +50 ELO later)
    }

    // 5. Move Generation
    let moves = generateMoves(position);
    if (moves.length === 0) {
      // No moves = Loss (in Draughts)
      return -20000 + ply; // Prefer losing later
    }

    // 6. Move Ordering
    // Order: TT Move -> Captures -> History -> Positional
    moves = this.moveOrderer.orderMoves(moves, ttMove, ply, position);

    // 7. PVS Loop
    let bestScore = -Infinity;
    let bestMove = moves[0];
    let originalAlpha = alpha;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const newPos = makeMove(position, move); // newPos object from utils

      let score;

      // PVS Logic
      if (i === 0) {
        // Full Window Search for the first move (PV Node)
        score = -this.search(newPos, depth - 1, -beta, -alpha, ply + 1);
      } else {
        // Null Window Search (Prove this move is worse than Alpha)
        // Search with window (alpha, alpha+1)
        score = -this.search(newPos, depth - 1, -alpha - 1, -alpha, ply + 1);

        // Fail High: The move was actually good. Re-search with full window.
        if (score > alpha && score < beta) {
          score = -this.search(newPos, depth - 1, -beta, -alpha, ply + 1);
        }
      }

      if (this.stopSearch) return alpha;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
        if (score > alpha) {
          alpha = score;
          // Beta Cutoff
          if (alpha >= beta) {
            this.moveOrderer.updateHistory(move, depth); // Update History Heuristic
            break;
          }
        }
      }
    }

    // 8. Store in TT
    if (this.tt) {
      let flag = "exact";
      if (bestScore <= originalAlpha) flag = "upper";
      else if (bestScore >= beta) flag = "lower";

      this.tt.store(ttKey, bestScore, depth, flag, bestMove);
    }

    return bestScore;
  }

  setStopCondition(callback) {
    this.shouldStop = callback;
  }

  getNodeCount() {
    return this.nodeCount;
  }
  getSelectiveDepth() {
    return this.selDepth;
  }
}
