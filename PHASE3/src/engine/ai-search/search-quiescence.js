/**
 * Quiescence Search Engine
 * Searches until position is "quiet" (no tactical opportunities)
 *
 * Features:
 * - Stand-pat evaluation
 * - Capture-only search
 * - MVV-LVA move ordering
 * - Delta pruning
 * - Selective depth tracking
 *
 * @author codewithheck
 * AI Search Refactor - Modular Architecture
 */

import { SEARCH_CONFIG } from "../ai/ai.constants.js";
import { getAvailableCaptures, makeMove } from "../ai/ai.utils.js";

export class QuiescenceSearch {
  constructor(evaluator) {
    this.evaluator = evaluator;
    this.nodeCount = 0;
  }

  /**
   * Quiescence search - search until position is "quiet"
   * PRESERVES EXACT LOGIC from working version
   */
  search(position, alpha, beta, depth) {
    this.nodeCount++;

    if (depth <= 0) {
      return this.evaluator.evaluatePosition(position);
    }

    // Stand pat evaluation
    const standPat = this.evaluator.evaluatePosition(position);

    // Beta cutoff
    if (standPat >= beta) {
      return beta;
    }

    // Update alpha
    if (alpha < standPat) {
      alpha = standPat;
    }

    // Delta pruning - if we're too far behind, don't search captures
    if (SEARCH_CONFIG.DELTA_PRUNING?.ENABLED) {
      if (standPat < alpha - SEARCH_CONFIG.DELTA_PRUNING.MARGIN) {
        return alpha;
      }
    }

    // Get only capture moves for quiescence
    const captures = getAvailableCaptures(position);

    if (captures.length === 0) {
      return standPat;
    }

    // Order captures (MVV-LVA - Most Valuable Victim, Least Valuable Attacker)
    const orderedCaptures = this.orderCaptures(captures, position);

    for (const move of orderedCaptures) {
      const newPosition = makeMove(position, move);
      const score = -this.search(newPosition, -beta, -alpha, depth - 1);

      if (score >= beta) {
        return beta;
      }

      if (score > alpha) {
        alpha = score;
      }
    }

    return alpha;
  }

  /**
   * Order captures for quiescence search (MVV-LVA)
   * Most Valuable Victim, Least Valuable Attacker
   */
  orderCaptures(captures, position) {
    const pieceValues = { 1: 100, 2: 100, 3: 400, 4: 400 }; // MAN, KING values

    captures.forEach((move) => {
      let score = 0;

      if (move.captures && move.captures.length > 0) {
        // Most Valuable Victim
        for (const capture of move.captures) {
          const victimPiece = position.pieces[capture.row][capture.col];
          score += pieceValues[victimPiece] || 0;
        }

        // Least Valuable Attacker
        const attackerPiece = position.pieces[move.from.row][move.from.col];
        score -= (pieceValues[attackerPiece] || 0) / 10; // Small penalty for valuable attackers

        // Multiple captures bonus
        score += move.captures.length * 50;
      }

      move.captureScore = score;
    });

    return captures.sort(
      (a, b) => (b.captureScore || 0) - (a.captureScore || 0)
    );
  }

  /**
   * Get node count
   */
  getNodeCount() {
    return this.nodeCount;
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.nodeCount = 0;
  }
}
