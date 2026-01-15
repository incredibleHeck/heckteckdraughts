/**
 * Move Validator - Validates moves according to draughts rules
 * Separated from core game state for single responsibility
 * @author codewithheck
 * Refactor Phase 1 - Game Logic Split
 */

import {
  BOARD_SIZE,
  PIECE,
  PLAYER,
  DIRECTIONS,
  isDarkSquare,
} from "../constants.js";
import { getAvailableCaptures } from "../ai/ai.utils.js";

export class MoveValidator {
  /**
   * Check if a move is valid in the current position
   */
  static isValidMove(game, move) {
    if (!move || !move.from || !move.to) return false;

    const piece = game.getPiece(move.from.row, move.from.col);

    // Must be a piece of current player
    if (!game.isPieceOfCurrentPlayer(piece)) return false;

    // Get legal moves and check if this move is in the list
    const legalMoves = game.getLegalMoves();
    return legalMoves.some(
      (m) =>
        m.from.row === move.from.row &&
        m.from.col === move.from.col &&
        m.to.row === move.to.row &&
        m.to.col === move.to.col
    );
  }

  /**
   * Check if a piece belongs to the specified player
   */
  static isPieceOfCurrentPlayer(piece, currentPlayer) {
    if (currentPlayer === PLAYER.WHITE) {
      return piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
    }
    return piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
  }

  /**
   * Check if a piece is an opponent's piece
   */
  static isOpponentPiece(piece, currentPlayer) {
    return (
      !this.isPieceOfCurrentPlayer(piece, currentPlayer) && piece !== PIECE.NONE
    );
  }

  /**
   * Check if forced capture rule applies (captures are mandatory)
   */
  static hasForcedCapture(game) {
    return getAvailableCaptures(game.toPosition()).length > 0;
  }

  /**
   * Check if a move is a capture
   */
  static isCapture(move) {
    return move.captures && move.captures.length > 0;
  }

  /**
   * Check if maximum capture rule is violated
   * (Some variants require taking the maximum number of pieces)
   */
  static violatesMaxCaptureRule(game, move) {
    if (!game.maxCaptureRule) return false;

    const availableCaptures = getAvailableCaptures(game.toPosition());

    if (!this.isCapture(move)) return false;

    // Find max capture length among all possible captures
    const maxLength = Math.max(
      ...availableCaptures.map((m) => m.captures?.length || 0)
    );

    // This move captures fewer pieces than the maximum available
    return move.captures.length < maxLength;
  }

  /**
   * Validate move from/to positions are within bounds
   */
  static isValidSquare(row, col) {
    return (
      row >= 0 &&
      row < BOARD_SIZE &&
      col >= 0 &&
      col < BOARD_SIZE &&
      isDarkSquare(row, col)
    );
  }
}
