/**
 * Draw Detector - Detects all draw conditions
 * Separated for clarity and testability
 * @author codewithheck
 * Refactor Phase 1 - Game Logic Split
 */

import { BOARD_SIZE, PIECE, PLAYER } from "../constants.js";

export class DrawDetector {
  /**
   * Get the reason for a draw, if any
   * Returns: 'repetition', 'fifty-move', 'material', 'blockade', or null
   */
  static getDrawReason(game) {
    if (this.isDrawByRepetition(game)) return "repetition";
    if (this.isDrawBy50MoveRule(game)) return "fifty-move";
    if (this.isDrawByInsufficientMaterial(game)) return "material";
    if (this.isDrawByBlockade(game)) return "blockade";
    return null;
  }

  /**
   * Check draw by threefold repetition
   * Same position appears 3 times
   */
  static isDrawByRepetition(game) {
    if (
      !game.positionRecorder ||
      game.positionRecorder.getPositions().length === 0
    ) {
      return false;
    }

    const currentFEN = game.getFEN();
    const frequency = game.positionRecorder.getFrequency();

    return (frequency[currentFEN] || 0) >= 3;
  }

  /**
   * Check draw by 50-move rule
   * No captures or pawn moves for 50 full moves (100 half-moves)
   */
  static isDrawBy50MoveRule(game) {
    return game.movesSinceCapture >= 50;
  }

  /**
   * Check draw by insufficient material
   * Only kings remaining on board
   */
  static isDrawByInsufficientMaterial(game) {
    let hasWhitePiece = false;
    let hasBlackPiece = false;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = game.getPiece(r, c);

        if (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) {
          hasWhitePiece = true;
        } else if (piece === PIECE.BLACK || piece === PIECE.BLACK_KING) {
          hasBlackPiece = true;
        }
      }
    }

    // Only kings left = insufficient material
    return hasWhitePiece && hasBlackPiece;
  }

  /**
   * Check draw by blockade
   * Current player has no legal moves but not checkmated
   */
  static isDrawByBlockade(game) {
    const moves = game.getLegalMoves();

    // If there are legal moves, not blockade
    if (moves.length > 0) return false;

    // No legal moves - check if both sides have pieces
    const { whiteCount, blackCount } = this.countPieces(game);

    // Both sides have pieces but current player can't move = blockade/draw
    return whiteCount > 0 && blackCount > 0;
  }

  /**
   * Check if position is "drawish" (likely to end in draw)
   * Used for evaluation tuning
   */
  static isDrawish(game) {
    const { totalCount, whiteMaterial, blackMaterial } =
      this.getMaterialBalance(game);

    // Very few pieces remaining
    if (totalCount <= 4) return true;

    // Balanced endgame with few pieces
    if (totalCount <= 8 && Math.abs(whiteMaterial - blackMaterial) <= 100) {
      return true;
    }

    // All pieces are kings (no pawns to push)
    if (this.allKings(game)) return true;

    return false;
  }

  // ============ Helper Methods ============

  static countPieces(game) {
    let whiteCount = 0,
      blackCount = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = game.getPiece(r, c);

        if (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) {
          whiteCount++;
        } else if (piece === PIECE.BLACK || piece === PIECE.BLACK_KING) {
          blackCount++;
        }
      }
    }

    return {
      whiteCount,
      blackCount,
      totalCount: whiteCount + blackCount,
    };
  }

  static getMaterialBalance(game) {
    let whiteMaterial = 0,
      blackMaterial = 0,
      totalCount = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = game.getPiece(r, c);

        if (piece === PIECE.WHITE) {
          whiteMaterial += 100;
          totalCount++;
        } else if (piece === PIECE.WHITE_KING) {
          whiteMaterial += 400;
          totalCount++;
        } else if (piece === PIECE.BLACK) {
          blackMaterial += 100;
          totalCount++;
        } else if (piece === PIECE.BLACK_KING) {
          blackMaterial += 400;
          totalCount++;
        }
      }
    }

    return {
      whiteMaterial,
      blackMaterial,
      totalCount,
      difference: Math.abs(whiteMaterial - blackMaterial),
    };
  }

  static allKings(game) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = game.getPiece(r, c);

        if (piece === PIECE.WHITE || piece === PIECE.BLACK) {
          return false;
        }
      }
    }
    return true;
  }
}
