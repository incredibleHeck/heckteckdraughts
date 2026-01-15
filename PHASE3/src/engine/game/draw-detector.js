/**
 * Ruthless Draw Detector
 * * * Optimizations:
 * - Single Pass Scan (Material, Counts, King check combined)
 * - Correct International Draughts Rules (No Blockade Draw)
 * - Instant Repetition Check (Via Hash)
 */

import { BOARD_SIZE, PIECE } from "../constants.js";

export class DrawDetector {
  static getDrawReason(game) {
    // 1. Repetition (Fastest check)
    if (this.isDrawByRepetition(game)) return "repetition";

    // 2. 50-Move Rule (Fast check)
    // Note: International Draughts often uses 25 moves for 3 kings vs 1 king.
    // We stick to standard 50-move (actually 25 moves per player) without capture/pawn move.
    if (this.isDrawBy50MoveRule(game)) return "fifty-move";

    // 3. Material Scan (O(N) - Do this last)
    return this.isDrawByInsufficientMaterial(game) ? "material" : null;
  }

  static isDrawByRepetition(game) {
    if (!game.positionRecorder) return false;
    // Use Hash-based check from Optimized PositionRecorder
    // Assuming game.toPosition() generates the object for hashing
    const count = game.positionRecorder.getRepetitionCount(game.toPosition());
    return count >= 3;
  }

  static isDrawBy50MoveRule(game) {
    // Standard rule: 50 moves (25 each) without pawn move or capture
    // game.movesSinceAction tracks half-moves (plies)
    return game.movesSinceAction >= 50;
  }

  static isDrawByInsufficientMaterial(game) {
    // Single Pass Scan
    let whiteCount = 0,
      blackCount = 0;
    let whiteKings = 0,
      blackKings = 0;
    let whiteMan = 0,
      blackMan = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      let c = r % 2 === 0 ? 1 : 0;
      for (; c < BOARD_SIZE; c += 2) {
        const piece = game.getPiece(r, c);
        if (piece === PIECE.NONE) continue;

        if (piece === PIECE.WHITE) {
          whiteCount++;
          whiteMan++;
        } else if (piece === PIECE.BLACK) {
          blackCount++;
          blackMan++;
        } else if (piece === PIECE.WHITE_KING) {
          whiteCount++;
          whiteKings++;
        } else if (piece === PIECE.BLACK_KING) {
          blackCount++;
          blackKings++;
        }
      }
    }

    // 1 vs 1 King is Draw
    if (
      whiteCount === 1 &&
      blackCount === 1 &&
      whiteKings === 1 &&
      blackKings === 1
    ) {
      return true;
    }

    // 2 Kings vs 1 King is technically not a forced draw until moves expire,
    // but effectively drawn if played perfectly. We usually let 50-move rule handle this.

    return false;
  }

  /**
   * NOTE: "Blockade" (No legal moves) is a LOSS in International Draughts.
   * Do NOT return a draw reason for it.
   */
  static isDrawByBlockade(game) {
    return false;
  }
}
