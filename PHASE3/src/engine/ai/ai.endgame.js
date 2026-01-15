/**
 * Endgame Evaluator Module - Specialized Endgame Position Evaluation
 * Handles positions with ≤8 pieces using tablebase principles
 * and endgame-specific knowledge
 *
 * @author codewithheck
 * Phase 3 - Endgame Specialist
 */

import { PIECE, PLAYER, BOARD_SIZE } from "../constants.js";
import { countPieces } from "./ai.utils.js";

/**
 * Endgame Evaluator - Specialized evaluation for endgame positions
 */
export class EndgameEvaluator {
  constructor() {
    this.kingDistanceCache = new Map();
    this.maxCacheSize = 500;
  }

  /**
   * Check if position is in endgame (≤8 pieces)
   */
  isEndgame(position) {
    const { whiteCount, blackCount } = countPieces(position);
    return whiteCount + blackCount <= 8;
  }

  /**
   * Evaluate endgame position
   * Returns score with emphasis on strategic factors
   */
  evaluateEndgame(position) {
    if (!this.isEndgame(position)) {
      return 0; // Not an endgame
    }

    const { whiteCount, blackCount, whiteKings, blackKings } =
      countPieces(position);

    let score = 0;

    // King vs King = Draw (0)
    if (whiteCount === 0 && blackCount === 0) {
      return 0;
    }

    // Material evaluation in endgame context
    score = this.evaluateMaterial(
      position,
      whiteCount,
      blackCount,
      whiteKings,
      blackKings
    );

    // If beyond material, consider positional factors
    if (whiteCount > 0 && blackCount > 0) {
      score += this.evaluateKingActivity(position);
      score += this.evaluateOpposition(position);
      score += this.evaluatePawnProgress(position);
    }

    return score;
  }

  /**
   * Material evaluation (more important in endgame)
   */
  evaluateMaterial(position, whiteCount, blackCount, whiteKings, blackKings) {
    // If one side has no pieces, it's lost
    if (whiteCount === 0 && blackCount === 0) {
      return 0; // K vs K draw
    }

    if (whiteCount === 0) {
      return position.currentPlayer === PLAYER.WHITE ? -10000 : 10000;
    }

    if (blackCount === 0) {
      return position.currentPlayer === PLAYER.BLACK ? -10000 : 10000;
    }

    // Material count
    const whiteMaterial = (whiteCount - whiteKings) * 100 + whiteKings * 400;
    const blackMaterial = (blackCount - blackKings) * 100 + blackKings * 400;

    return whiteMaterial - blackMaterial;
  }

  /**
   * King activity bonus in endgame (centralization is important)
   */
  evaluateKingActivity(position) {
    let score = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = position.pieces[r][c];

        if (piece === PIECE.WHITE_KING) {
          // White king centrality
          const whiteDistance = Math.abs(r - 4.5) + Math.abs(c - 4.5);
          score += (9 - whiteDistance) * 5;
        } else if (piece === PIECE.BLACK_KING) {
          // Black king centrality
          const blackDistance = Math.abs(r - 4.5) + Math.abs(c - 4.5);
          score -= (9 - blackDistance) * 5;
        }
      }
    }

    return score;
  }

  /**
   * Opposition principle (critical in king & pawn endgames)
   * The player NOT to move with opposition has advantage
   */
  evaluateOpposition(position) {
    const whiteKing = this.findKing(position, PIECE.WHITE_KING);
    const blackKing = this.findKing(position, PIECE.BLACK_KING);

    if (!whiteKing || !blackKing) {
      return 0;
    }

    // Distance between kings
    const rowDist = Math.abs(whiteKing.row - blackKing.row);
    const colDist = Math.abs(whiteKing.col - blackKing.col);
    const totalDistance = rowDist + colDist;

    // Opposition is most relevant when kings are close
    if (totalDistance <= 4) {
      // Direct opposition (on same file/rank with one square between)
      if (
        (rowDist === 2 && colDist === 0) ||
        (rowDist === 0 && colDist === 2)
      ) {
        if (position.currentPlayer === PLAYER.WHITE) {
          return 30; // White to move with opposition = advantage
        } else {
          return -30;
        }
      }

      // Diagonal opposition
      if (rowDist === 1 && colDist === 1) {
        if (position.currentPlayer === PLAYER.WHITE) {
          return 20;
        } else {
          return -20;
        }
      }
    }

    return 0;
  }

  /**
   * Pawn/Man progress toward promotion
   */
  evaluatePawnProgress(position) {
    let score = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = position.pieces[r][c];

        // White men (non-kings) moving toward row 0
        if (piece === PIECE.WHITE) {
          const progressTowardPromotion = BOARD_SIZE - 1 - r; // 0 is promotion
          score += progressTowardPromotion * 8; // 8 points per row of progress
        }
        // Black men moving toward row 9
        else if (piece === PIECE.BLACK) {
          const progressTowardPromotion = r; // 9 is promotion
          score -= progressTowardPromotion * 8;
        }
      }
    }

    return score;
  }

  /**
   * Evaluate King & Pawn vs King (special case)
   */
  evaluateKingAndPawn(position) {
    const { whiteCount, blackCount, whitePawns, blackPawns } =
      countPieces(position);

    // Only relevant for K+P vs K
    if (whiteCount === 1 && blackCount === 0 && whitePawns === 1) {
      // Find the pawn
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (position.pieces[r][c] === PIECE.WHITE) {
            // Closer to promotion = winning
            const progressTowardPromotion =
              (BOARD_SIZE - 1 - r) / (BOARD_SIZE - 1);
            return progressTowardPromotion * 200;
          }
        }
      }
    }

    if (blackCount === 1 && whiteCount === 0 && blackPawns === 1) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (position.pieces[r][c] === PIECE.BLACK) {
            const progressTowardPromotion = r / (BOARD_SIZE - 1);
            return -progressTowardPromotion * 200;
          }
        }
      }
    }

    return 0;
  }

  /**
   * Find a specific king on the board
   */
  findKing(position, kingPiece) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (position.pieces[r][c] === kingPiece) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  /**
   * Generate cache key
   */
  generateCacheKey(position) {
    let key = "";
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        key += position.pieces[r][c];
      }
    }
    return key + position.currentPlayer;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.kingDistanceCache.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      cacheSize: this.kingDistanceCache.size,
      maxCacheSize: this.maxCacheSize,
    };
  }
}

// Export singleton instance
export const endgameEvaluator = new EndgameEvaluator();
