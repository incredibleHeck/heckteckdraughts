/**
 * Ruthless Move Validator
 */

import {
  generateMoves,
  isSameMove,
  getAvailableCaptures,
  Move,
} from "../ai/ai.utils";
import { Position } from "../../utils/fen-parser";

export interface GameLike {
  toPosition(): Position;
}

export class MoveValidator {
  static isValidMove(game: GameLike, move: Move): boolean {
    if (!move || !move.from || !move.to) return false;

    const position = game.toPosition();
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

    // Normal Move Logic
    const validMoves = generateMoves(position);
    return validMoves.some((m) => isSameMove(m, move));
  }

  static isCapture(move: Move): boolean {
    return move.captures && move.captures.length > 0;
  }
}
