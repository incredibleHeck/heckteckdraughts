/**
 * Ruthless Move Validator
 * Validates moves by cross-referencing the optimized Move Generator.
 */

import {
  generateMoves,
  isSameMove,
  makeMove,
  getAvailableCaptures,
} from "../ai/ai.utils.js";

export class MoveValidator {
  static isValidMove(game, move) {
    if (!move || !move.from || !move.to) return false;

    // 1. Forced Capture Rule
    // In International Draughts, if a capture exists, you MUST capture.
    // Furthermore, if multiple exist, you must take the one with MOST captures.

    const position = game.toPosition(); // Assuming game object has this method
    const captures = getAvailableCaptures(position);

    if (captures.length > 0) {
      // Find max capture length
      let maxLen = 0;
      for (const c of captures)
        if (c.captures.length > maxLen) maxLen = c.captures.length;

      // Filter valid captures (must equal max length)
      const validCaptures = captures.filter(
        (c) => c.captures.length === maxLen
      );

      // Check if our move matches any valid capture
      return validCaptures.some((c) => isSameMove(c, move));
    }

    // 2. Normal Move Logic
    // If no captures, generate simple moves
    const validMoves = generateMoves(position);
    return validMoves.some((m) => isSameMove(m, move));
  }

  static isCapture(move) {
    return move.captures && move.captures.length > 0;
  }
}
