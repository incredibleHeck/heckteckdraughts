/**
 * Capture Handler - Manages capture sequence logic
 * Handles recursive capture finding and validation
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

export class CaptureHandler {
  /**
   * Find all possible capture sequences from a starting position
   * Uses recursive depth-first search
   */
  static findCaptureSequences(
    pieces,
    currentPos,
    path = [],
    capturedSoFar = []
  ) {
    const sequences = [];
    let foundJump = false;

    const piece = pieces[currentPos.row][currentPos.col];
    if (piece === PIECE.NONE) return sequences;

    const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
    const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
    const currentPlayer = isWhite ? PLAYER.WHITE : PLAYER.BLACK;

    // Determine possible jump directions
    // In International Draughts, all pieces jump in all 4 directions
    const directions = DIRECTIONS.KING_MOVES;

    // Try each direction for a capture
    for (const dir of directions) {
      const jumpOverPos = {
        row: currentPos.row + dir.dy,
        col: currentPos.col + dir.dx,
      };

      const landPos = {
        row: jumpOverPos.row + dir.dy,
        col: jumpOverPos.col + dir.dx,
      };

      // Check if jump is valid
      if (!this.isValidSquare(landPos)) continue;
      if (pieces[landPos.row][landPos.col] !== PIECE.NONE) continue;

      const targetPiece = pieces[jumpOverPos.row][jumpOverPos.col];
      if (!this.isOpponentPiece(targetPiece, currentPlayer)) continue;

      // Check if already captured this piece
      const alreadyCaptured = capturedSoFar.some(
        (c) => c.row === jumpOverPos.row && c.col === jumpOverPos.col
      );
      if (alreadyCaptured) continue;

      foundJump = true;

      // Clone pieces and apply this capture
      const newPieces = pieces.map((row) => [...row]);
      newPieces[currentPos.row][currentPos.col] = PIECE.NONE;
      newPieces[jumpOverPos.row][jumpOverPos.col] = PIECE.NONE;
      newPieces[landPos.row][landPos.col] = piece;

      // Recursively find more captures from new position
      const morePath = path.length === 0 ? [currentPos] : path;
      const moreSequences = this.findCaptureSequences(
        newPieces,
        landPos,
        morePath,
        [...capturedSoFar, jumpOverPos]
      );

      sequences.push(...moreSequences);
    }

    // If no more jumps available, finalize this sequence
    if (!foundJump && capturedSoFar.length > 0) {
      sequences.push({
        from: path.length > 0 ? path[0] : currentPos,
        to: currentPos,
        captures: capturedSoFar,
      });
    }

    return sequences;
  }

  /**
   * Apply a capture sequence to the board
   */
  static applyCaptureSequence(pieces, sequence) {
    const newPieces = pieces.map((row) => [...row]);

    // Remove all captured pieces
    for (const capture of sequence.captures) {
      newPieces[capture.row][capture.col] = PIECE.NONE;
    }

    return newPieces;
  }

  /**
   * Count captured pieces in a move
   */
  static countCapturedPieces(move) {
    return move.captures ? move.captures.length : 0;
  }

  /**
   * Get the actual pieces captured in a move
   */
  static getCapturedPieces(pieces, move) {
    const captured = [];

    if (!move.captures || move.captures.length === 0) return captured;

    for (const pos of move.captures) {
      const piece = pieces[pos.row][pos.col];
      if (piece !== PIECE.NONE) {
        captured.push(piece);
      }
    }

    return captured;
  }

  /**
   * Get material value of captured pieces
   */
  static getCapturedValue(pieces, move) {
    let value = 0;
    const captured = this.getCapturedPieces(pieces, move);

    for (const piece of captured) {
      if (piece === PIECE.WHITE || piece === PIECE.BLACK) {
        value += 100;
      } else if (piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING) {
        value += 400;
      }
    }

    return value;
  }

  // ============ Helper Methods ============

  static isValidSquare(pos) {
    return (
      pos &&
      pos.row >= 0 &&
      pos.row < BOARD_SIZE &&
      pos.col >= 0 &&
      pos.col < BOARD_SIZE &&
      isDarkSquare(pos.row, pos.col)
    );
  }

  static isOpponentPiece(piece, currentPlayer) {
    if (currentPlayer === PLAYER.WHITE) {
      return piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
    }
    return piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
  }
}
