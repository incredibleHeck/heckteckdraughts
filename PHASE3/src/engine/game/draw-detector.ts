/**
 * Ruthless Draw Detector
 */

import { BOARD_SIZE, PIECE } from "../constants";
import { Position } from "../../utils/fen-parser";
import { PositionRecorder } from "./position-recorder";

export interface GameLike {
  positionRecorder: PositionRecorder;
  toPosition(): Position;
  movesSinceAction: number;
  getPiece(r: number, c: number): PIECE;
}

export class DrawDetector {
  static getDrawReason(game: GameLike): string | null {
    if (this.isDrawByRepetition(game)) return "repetition";
    if (this.isDrawBy50MoveRule(game)) return "fifty-move";
    return this.isDrawByInsufficientMaterial(game) ? "material" : null;
  }

  static isDrawByRepetition(game: GameLike): boolean {
    if (!game.positionRecorder) return false;
    return game.positionRecorder.isDrawByRepetition(game.toPosition());
  }

  static isDrawBy50MoveRule(game: GameLike): boolean {
    return game.movesSinceAction >= 50;
  }

  static isDrawByInsufficientMaterial(game: GameLike): boolean {
    let whiteCount = 0,
      blackCount = 0;
    let whiteKings = 0,
      blackKings = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      let c = r % 2 === 0 ? 0 : 1;
      for (; c < BOARD_SIZE; c += 2) {
        const piece = game.getPiece(r, c);
        if (piece === PIECE.NONE) continue;

        if (piece === PIECE.WHITE) {
          whiteCount++;
        } else if (piece === PIECE.BLACK) {
          blackCount++;
        } else if (piece === PIECE.WHITE_KING) {
          whiteCount++;
          whiteKings++;
        } else if (piece === PIECE.BLACK_KING) {
          blackCount++;
          blackKings++;
        }
      }
    }

    if (
      whiteCount === 1 &&
      blackCount === 1 &&
      whiteKings === 1 &&
      blackKings === 1
    ) {
      return true;
    }

    return false;
  }
}
