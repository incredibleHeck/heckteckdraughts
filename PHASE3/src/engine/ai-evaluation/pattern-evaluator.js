/**
 * Pattern Evaluator
 * Evaluates positional patterns and structure
 *
 * Handles:
 * - Pattern extraction (SCAN-style stub)
 * - Protected/hanging piece detection
 * - King safety calculation
 *
 * @author codewithheck
 * AI Evaluation Refactor - Modular Architecture
 */

import { PIECE, PLAYER, BOARD_SIZE } from "../constants.js";

export class PatternEvaluator {
  constructor(patternTables = null) {
    this.patternTables = patternTables;
    this.PATTERN_SIZE = 12;
    this.PERM_0 = [11, 10, 7, 6, 3, 2, 9, 8, 5, 4, 1, 0];
    this.PERM_1 = [0, 1, 4, 5, 8, 9, 2, 3, 6, 7, 10, 11];
  }

  /**
   * Extract patterns from position (SCAN-style)
   */
  extractPatterns(position) {
    let index = 0;
    let pos = 0;

    for (let r = 0; r < BOARD_SIZE && pos < this.PATTERN_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE && pos < this.PATTERN_SIZE; c++) {
        if ((r + c) % 2 === 1) {
          const piece = position.pieces[r][c];
          index *= 3;

          if (piece === PIECE.NONE) {
            index += 0;
          } else if (piece === PIECE.WHITE || piece === PIECE.BLACK) {
            index += 1;
          } else {
            index += 2; // King
          }
          pos++;
        }
      }
    }

    const tritIndex0 = this.permuteIndex(
      index,
      this.PATTERN_SIZE,
      3,
      3,
      this.PERM_0
    );
    const tritIndex1 = this.permuteIndex(
      index,
      this.PATTERN_SIZE,
      3,
      3,
      this.PERM_1
    );

    let score = 0;

    // Use pattern tables if available
    if (this.patternTables) {
      score += this.getPatternScore(tritIndex0);
      score += this.getPatternScore(tritIndex1);
    }

    return score;
  }

  /**
   * Permute index for pattern evaluation
   */
  permuteIndex(index, size, bf, bt, perm) {
    let from = index;
    let to = 0;

    for (let i = 0; i < size; i++) {
      const digit = from % bf;
      from = Math.floor(from / bf);
      const j = perm[i];
      to += digit * Math.pow(bt, j);
    }

    return to;
  }

  /**
   * Get pattern score from table
   */
  getPatternScore(index) {
    if (!this.patternTables) return 0;

    // Stub - would look up in actual pattern tables
    return 0;
  }

  /**
   * Count hanging pieces (undefended pieces under attack)
   */
  countHangingPieces(position, isWhite) {
    let hanging = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = position.pieces[r][c];

        // Check if it's a piece of the color we're evaluating
        if (
          (isWhite && (piece === PIECE.WHITE || piece === PIECE.WHITE_KING)) ||
          (!isWhite && (piece === PIECE.BLACK || piece === PIECE.BLACK_KING))
        ) {
          // Check if piece is under attack
          if (this.isPieceUnderAttack(position, r, c)) {
            // Check if piece is defended
            if (!this.isPieceDefended(position, r, c)) {
              hanging++;
            }
          }
        }
      }
    }

    return hanging;
  }

  /**
   * Count protected pieces
   */
  countProtectedPieces(position, isWhite) {
    let protected_count = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = position.pieces[r][c];

        // Check if it's a piece of the color we're evaluating
        if (
          (isWhite && (piece === PIECE.WHITE || piece === PIECE.WHITE_KING)) ||
          (!isWhite && (piece === PIECE.BLACK || piece === PIECE.BLACK_KING))
        ) {
          if (this.isPieceDefended(position, r, c)) {
            protected_count++;
          }
        }
      }
    }

    return protected_count;
  }

  /**
   * Check if piece is under attack
   */
  isPieceUnderAttack(position, r, c) {
    // Check adjacent squares for enemy pieces (simplified check)
    const directions = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        const attackerPiece = position.pieces[nr][nc];
        if (attackerPiece !== PIECE.NONE) {
          // Check if it's an enemy piece
          const myPiece = position.pieces[r][c];
          const myIsWhite =
            myPiece === PIECE.WHITE || myPiece === PIECE.WHITE_KING;
          const attackerIsWhite =
            attackerPiece === PIECE.WHITE || attackerPiece === PIECE.WHITE_KING;

          if (myIsWhite !== attackerIsWhite) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Check if piece is defended (protected by friendly piece)
   */
  isPieceDefended(position, r, c) {
    // Check adjacent squares for friendly pieces (simplified check)
    const directions = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        const defenderPiece = position.pieces[nr][nc];
        if (defenderPiece !== PIECE.NONE) {
          // Check if it's a friendly piece
          const myPiece = position.pieces[r][c];
          const myIsWhite =
            myPiece === PIECE.WHITE || myPiece === PIECE.WHITE_KING;
          const defenderIsWhite =
            defenderPiece === PIECE.WHITE || defenderPiece === PIECE.WHITE_KING;

          if (myIsWhite === defenderIsWhite) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Calculate king safety for a specific king position
   */
  calculateKingSafety(position, kingR, kingC, isWhite) {
    let safety = 0;

    // Check adjacent squares
    const directions = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    let safeMoves = 0;
    let threatenedSquares = 0;

    for (const [dr, dc] of directions) {
      let nr = kingR + dr,
        nc = kingC + dc;

      while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        if (position.pieces[nr][nc] === PIECE.NONE) {
          // Check if this square is threatened
          if (!this.isSquareThreatened(position, nr, nc, !isWhite)) {
            safeMoves++;
          } else {
            threatenedSquares++;
          }
        } else {
          break; // Blocked by piece
        }

        nr += dr;
        nc += dc;
      }
    }

    safety = safeMoves * 2 - threatenedSquares * 1;
    return safety;
  }

  /**
   * Check if a square is threatened by enemy
   */
  isSquareThreatened(position, r, c, byWhite) {
    // Simplified: check adjacent enemy pieces
    const directions = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        const piece = position.pieces[nr][nc];
        const isWhiteP = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;

        if (piece !== PIECE.NONE && isWhiteP === byWhite) {
          return true;
        }
      }
    }

    return false;
  }
}
