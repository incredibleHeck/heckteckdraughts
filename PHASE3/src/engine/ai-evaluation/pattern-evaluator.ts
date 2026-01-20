/**
 * Ruthless Pattern Evaluator
 */

import { PIECE, BOARD_SIZE, isDarkSquare } from "../constants";
import { Position } from "../../utils/fen-parser";

// Generate Square Number to Coordinate Lookup
const SQUARE_COORDS: { r: number; c: number }[] = new Array(51).fill(null);
(function initCoords() {
  let count = 1;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = BOARD_SIZE - 1; c >= 0; c--) {
      if (isDarkSquare(r, c)) {
        SQUARE_COORDS[count] = { r, c };
        count++;
      }
    }
  }
})();

export class PatternEvaluator {
  private weights: Record<string, number>;

  constructor() {
    this.weights = {
      HANGING_PIECE: -25,
      BASE_HOLE: -30,
      TRIO_FORMATION: 10,
      ARROWHEAD: 15,
      BRIDGE: 40,
      HOOK: 30,
      PRESSURE: 15, // Bonus per attacker
      DOUBLE_PRESSURE: 40, // Bonus for >= 2 attackers
    };
  }

  extractPatterns(position: Position): number {
    let score = 0;

    // 1. Static Patterns (Bridge, Hook)
    score += this.evaluateBridge(position);
    score += this.evaluateHook(position);

    // 2. Iterative Patterns (Hanging, Pressure, Trio)
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!isDarkSquare(r, c)) continue;

        const piece = position.pieces[r][c];
        if (piece === PIECE.NONE) continue;

        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        const multiplier = isWhite ? 1 : -1;
        const dir = isWhite ? 1 : -1; // White moves UP (-1), Black DOWN (+1)

        // HANGING PIECE & TRIO (Existing Logic)
        if (!this.isKing(piece)) {
          const backR = r + dir;
          // Hanging Piece: No support behind
          if (backR >= 0 && backR < BOARD_SIZE) {
            let supported = false;
            // Check back-left and back-right
            if (c - 1 >= 0 && position.pieces[backR][c - 1] !== PIECE.NONE)
              supported = true;
            if (c + 1 < BOARD_SIZE && position.pieces[backR][c + 1] !== PIECE.NONE)
              supported = true;

            if (!supported) {
              score += this.weights.HANGING_PIECE * multiplier;
            }
          }

          // Trio Formation: Supported by two pieces behind
          const frontR = r - dir;
          if (frontR >= 0 && frontR < BOARD_SIZE && backR >= 0 && backR < BOARD_SIZE) {
             const leftBack = c - 1 >= 0 && position.pieces[backR][c - 1] === piece;
             const rightBack = c + 1 < BOARD_SIZE && position.pieces[backR][c + 1] === piece;

             if (leftBack && rightBack) {
               score += this.weights.TRIO_FORMATION * multiplier;
             }
          }
        }

        // PRESSURE
        // Check if this piece is attacking an opponent
        // Or simpler: Check if this piece is UNDER pressure (for the test case)
        // The test "Double Pressure": "Black piece under pressure from two White pieces".
        // Let's implement generic pressure: For every piece, count enemies attacking it.
        const attacks = this.countAttackers(position, r, c, piece);
        if (attacks > 0) {
           // If I am being attacked, that's bad for me (good for opponent)
           // If attacks >= 2 (Double Pressure), penalty is higher?
           // Test expects "Score > 0" for White when Black is under pressure.
           // So if Black piece has 2 attackers, Score should increase.
           // multiplier is -1 (Black). We want Score += (Positive).
           // So: score += (attacks * Weight) * (isWhite ? -1 : 1);
           // If Black is attacked (isWhite=false, mult=-1), we want +Score.
           // score += attacks * PRESSURE * -multiplier.
           let pScore = attacks * this.weights.PRESSURE * -multiplier;
           
           if (attacks >= 2) {
               pScore += this.weights.DOUBLE_PRESSURE * -multiplier;
           }

           score += pScore;
        }
      }
    }
    return score;
  }

  private evaluateBridge(position: Position): number {
    let score = 0;
    // White Bridge: 46, 50
    if (this.isPiece(position, 46, PIECE.WHITE) && this.isPiece(position, 50, PIECE.WHITE)) {
      score += this.weights.BRIDGE;
    }
    // Black Bridge: 1, 5
    if (this.isPiece(position, 1, PIECE.BLACK) && this.isPiece(position, 5, PIECE.BLACK)) {
      score -= this.weights.BRIDGE;
    }
    return score;
  }

  private evaluateHook(position: Position): number {
    let score = 0;
    // White Hook: 38, 32, 27
    if (this.isPiece(position, 38, PIECE.WHITE) && 
        this.isPiece(position, 32, PIECE.WHITE) && 
        this.isPiece(position, 27, PIECE.WHITE)) {
      score += this.weights.HOOK;
    }
    // Black Hook: 13, 19, 24
    if (this.isPiece(position, 13, PIECE.BLACK) && 
        this.isPiece(position, 19, PIECE.BLACK) && 
        this.isPiece(position, 24, PIECE.BLACK)) {
      score -= this.weights.HOOK;
    }
    return score;
  }

  // Count enemy pieces that can capture/attack (r, c)
  // Simplified "Pressure": Adjacent enemies in the direction of capture/movement
  private countAttackers(position: Position, r: number, c: number, targetPiece: PIECE): number {
    let attackers = 0;
    const isWhiteTarget = targetPiece === PIECE.WHITE || targetPiece === PIECE.WHITE_KING;
    const enemyMan = isWhiteTarget ? PIECE.BLACK : PIECE.WHITE;
    const enemyKing = isWhiteTarget ? PIECE.BLACK_KING : PIECE.WHITE_KING;
    
    // Attack comes from where?
    // Man attacks forward (diagonal).
    // If I am White (moving UP), Black attacks me from UP (Black moves DOWN).
    // So look at r-1 (Up) for Black pieces that can move DOWN to me?
    // No.
    // White moves r -> r-1. Black moves r -> r+1.
    // If I am White at r. Black at r-1 can attack me (move to r).
    // If I am White at r. Black at r+1 (Behind me) cannot attack me with Man (unless capture backwards allowed? In Int. Draughts YES).
    // International Draughts: Men capture backwards.
    // So any adjacent enemy is a potential attacker.
    
    const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        const neighbor = position.pieces[nr][nc];
        if (neighbor === enemyMan || neighbor === enemyKing) {
          attackers++;
        }
      }
    }
    return attackers;
  }

  private isPiece(position: Position, square: number, type: PIECE): boolean {
    const { r, c } = SQUARE_COORDS[square];
    // Check if simple piece or king of that color
    const p = position.pieces[r][c];
    if (type === PIECE.WHITE) return p === PIECE.WHITE || p === PIECE.WHITE_KING;
    if (type === PIECE.BLACK) return p === PIECE.BLACK || p === PIECE.BLACK_KING;
    return p === type;
  }

  private isKing(piece: PIECE): boolean {
    return piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
  }
}
