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
    capturedSoFar = [],
    recursionDepth = 0
  ) {
    if (recursionDepth > 20) return []; // Prevent infinite recursion

    const sequences = [];
    let foundJump = false;

    const piece = pieces[currentPos.row][currentPos.col];
    if (piece === PIECE.NONE) return sequences;

    const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
    const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
    const currentPlayer = isWhite ? PLAYER.WHITE : PLAYER.BLACK;

    // All pieces in International Draughts jump in all 4 directions
    const directions = DIRECTIONS.KING_MOVES;

    for (const dir of directions) {
      if (isKing) {
        // Flying king capture logic
        let checkRow = currentPos.row + dir.dy;
        let checkCol = currentPos.col + dir.dx;
        let enemyPos = null;

        while (this.isValidSquare({ row: checkRow, col: checkCol })) {
          const checkPiece = pieces[checkRow][checkCol];

          if (checkPiece !== PIECE.NONE) {
            if (this.isOpponentPiece(checkPiece, currentPlayer)) {
              enemyPos = { row: checkRow, col: checkCol };
              break;
            } else {
              break; // Blocked by own piece
            }
          }
          checkRow += dir.dy;
          checkCol += dir.dx;
        }

        if (enemyPos && !capturedSoFar.some(p => p.row === enemyPos.row && p.col === enemyPos.col)) {
          let landRow = enemyPos.row + dir.dy;
          let landCol = enemyPos.col + dir.dx;

          while (this.isValidSquare({ row: landRow, col: landCol }) && pieces[landRow][landCol] === PIECE.NONE) {
            foundJump = true;
            const newPieces = pieces.map(row => [...row]);
            newPieces[currentPos.row][currentPos.col] = PIECE.NONE;
            newPieces[enemyPos.row][enemyPos.col] = PIECE.NONE;
            newPieces[landRow][landCol] = piece;

            const morePath = path.length === 0 ? [currentPos] : path;
            const moreSequences = this.findCaptureSequences(
              newPieces,
              { row: landRow, col: landCol },
              morePath,
              [...capturedSoFar, enemyPos],
              recursionDepth + 1
            );
            sequences.push(...moreSequences);

            landRow += dir.dy;
            landCol += dir.dx;
          }
        }
      } else {
        // Regular piece capture logic
        const jumpOverPos = {
          row: currentPos.row + dir.dy,
          col: currentPos.col + dir.dx,
        };
        const landPos = {
          row: currentPos.row + 2 * dir.dy,
          col: currentPos.col + 2 * dir.dx,
        };

        if (this.isValidSquare(landPos) && 
            pieces[landPos.row][landPos.col] === PIECE.NONE && 
            this.isOpponentPiece(pieces[jumpOverPos.row][jumpOverPos.col], currentPlayer)) {
          
          const alreadyCaptured = capturedSoFar.some(
            (c) => c.row === jumpOverPos.row && c.col === jumpOverPos.col
          );
          if (!alreadyCaptured) {
            foundJump = true;
            const newPieces = pieces.map((row) => [...row]);
            newPieces[currentPos.row][currentPos.col] = PIECE.NONE;
            newPieces[jumpOverPos.row][jumpOverPos.col] = PIECE.NONE;
            newPieces[landPos.row][landPos.col] = piece;

            const morePath = path.length === 0 ? [currentPos] : path;
            const moreSequences = this.findCaptureSequences(
              newPieces,
              landPos,
              morePath,
              [...capturedSoFar, jumpOverPos],
              recursionDepth + 1
            );
            sequences.push(...moreSequences);
          }
        }
      }
    }

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
