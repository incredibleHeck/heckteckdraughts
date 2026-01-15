/**
 * Ruthless Move Orderer
 * The "Reflex System" of the AI.
 * * * Optimizations:
 * - Flattened History Array (No Map overhead)
 * - Killer Heuristic (Instant recall of cutoff moves)
 * - Simplified MVV-LVA (Lightweight capture sorting)
 * - Removed heavy tactical loops (Speed > perfect ordering)
 */

import { BOARD_SIZE } from "../constants.js";
import { isSameMove } from "./ai.utils.js";
import { SEARCH_CONFIG } from "./ai.constants.js";

// Constants for 10x10 Board Indexing
const BOARD_AREA = 100; // 10x10
const HISTORY_SIZE = 10000; // 100 (From) * 100 (To)

export class MoveOrderer {
  constructor() {
    // 1. History Heuristic: Flat Int32Array for instant access
    // Index = (FromRow * 10 + FromCol) * 100 + (ToRow * 10 + ToCol)
    this.history = new Int32Array(HISTORY_SIZE);

    // 2. Killer Moves: Store 2 killer moves per search depth (Max depth 50)
    // Format: killers[ply] = [Move1, Move2]
    this.killers = new Array(64).fill(null).map(() => [null, null]);

    // Pre-calculate MVV-LVA weights for speed
    this.VICTIM_SCORES = { 1: 100, 2: 100, 3: 500, 4: 500 }; // King=500, Man=100
  }

  /**
   * Main Ordering Function
   * Sorts moves to maximize Alpha-Beta cutoffs.
   */
  orderMoves(moves, ttMove, ply, position) {
    // Optimization: Single move needs no sorting
    if (moves.length < 2) return moves;

    const scoredMoves = new Array(moves.length);
    const hashBonus = SEARCH_CONFIG.MOVE_ORDERING.HASH_MOVE || 20000;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      let score = 0;

      // 1. Hash Move (From Transposition Table) - Highest Priority
      if (ttMove && isSameMove(move, ttMove)) {
        score += hashBonus;
      }
      // 2. Captures (MVV-LVA) - High Priority
      else if (move.captures && move.captures.length > 0) {
        score += SEARCH_CONFIG.MOVE_ORDERING.CAPTURE_BASE; // ~2000
        score += move.captures.length * 100; // Quantity

        // Lightweight MVV-LVA (Quality)
        // We only check the first capture to keep it fast
        const victim =
          position.pieces[move.captures[0].row][move.captures[0].col];
        const attacker = position.pieces[move.from.row][move.from.col];
        // Score = Victim Value - (Attacker Value / 10)
        score +=
          (this.VICTIM_SCORES[victim] || 100) -
          (this.VICTIM_SCORES[attacker] || 100) * 0.1;
      }
      // 3. Promotions - Game Changing
      else if (move.to.row === 0 || move.to.row === 9) {
        // Check if it's actually a promotion (man to king)
        const p = position.pieces[move.from.row][move.from.col];
        if (p === 1 || p === 2) {
          // 1=White Man, 2=Black Man (Assuming standard constants)
          score += SEARCH_CONFIG.MOVE_ORDERING.PROMOTION; // ~1000
        }
      }
      // 4. Killer Moves - Refutations
      else {
        if (this.killers[ply]) {
          if (this.killers[ply][0] && isSameMove(move, this.killers[ply][0])) {
            score += SEARCH_CONFIG.MOVE_ORDERING.KILLER_MOVE_1; // ~900
          } else if (
            this.killers[ply][1] &&
            isSameMove(move, this.killers[ply][1])
          ) {
            score += SEARCH_CONFIG.MOVE_ORDERING.KILLER_MOVE_2; // ~800
          }
        }

        // 5. History Heuristic - Historical Success
        const fromIdx = move.from.row * 10 + move.from.col;
        const toIdx = move.to.row * 10 + move.to.col;
        const hIdx = fromIdx * 100 + toIdx;

        let hScore = this.history[hIdx];
        // Cap history to avoid overriding Killers
        if (hScore > 500) hScore = 500;
        score += hScore;

        // 6. Positional Bias (Center & Forward)
        // Center (Rows 4-5, Cols 2-7)
        const centerDist =
          Math.abs(move.to.row - 4.5) + Math.abs(move.to.col - 4.5);
        score -= centerDist; // Closer to center = Higher score
      }

      scoredMoves[i] = { move, score };
    }

    // Sort descending
    scoredMoves.sort((a, b) => b.score - a.score);

    // Unwrap
    const result = new Array(moves.length);
    for (let i = 0; i < moves.length; i++) result[i] = scoredMoves[i].move;

    return result;
  }

  /**
   * Update Killer Moves
   * Called when a move causes a Beta Cutoff (refutation).
   */
  updateKillers(move, ply) {
    if (move.captures && move.captures.length > 0) return; // Don't store captures
    if (ply >= 64) return;

    // Shift Killer 1 -> Killer 2
    if (!this.killers[ply][0] || !isSameMove(move, this.killers[ply][0])) {
      this.killers[ply][1] = this.killers[ply][0];
      this.killers[ply][0] = move;
    }
  }

  /**
   * Update History Heuristic
   * Called when a move is the best move (raises Alpha).
   */
  updateHistory(move, depth) {
    if (move.captures && move.captures.length > 0) return;

    const fromIdx = move.from.row * 10 + move.from.col;
    const toIdx = move.to.row * 10 + move.to.col;
    const hIdx = fromIdx * 100 + toIdx;

    // Bonus based on depth (Deeper = more reliable)
    const bonus = depth * depth;
    this.history[hIdx] += bonus;

    // Aging: Prevent overflow and keep recent relevance
    if (this.history[hIdx] > 100000) {
      for (let i = 0; i < HISTORY_SIZE; i++) this.history[i] >>= 1;
    }
  }

  clear() {
    this.history.fill(0);
    for (let i = 0; i < this.killers.length; i++)
      this.killers[i] = [null, null];
  }
}
