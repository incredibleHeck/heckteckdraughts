import { describe, it, expect } from 'vitest';
import { generateMoves, getAvailableCaptures, makeMove } from './ai.utils';
import { PIECE, PLAYER, BOARD_SIZE } from '../constants';
import { parseFEN } from '../../utils/fen-parser';

describe('AI Utilities', () => {
  it('should correctly identify valid squares', () => {
    // Note: I'll need to export isValidSquare or test it via other functions
  });

  describe('Move Generation', () => {
    it('should generate quiet moves for a man', () => {
      // White man at 32 (6, 6)
      const fen = 'W:W32:B1'; 
      const pos = parseFEN(fen);
      const moves = generateMoves(pos);
      // Square 32 is (6, 6). 
      // Row 5 dark squares: (5, 7) is 27, (5, 5) is 28.
      expect(moves.length).toBe(2);
      expect(moves.some(m => m.to.row === 5 && m.to.col === 7)).toBe(true); // Square 27
      expect(moves.some(m => m.to.row === 5 && m.to.col === 5)).toBe(true); // Square 28
    });

    it('should prioritize captures over quiet moves', () => {
      // White man at 32 (6, 6), Black man at 27 (5, 7).
      // White MUST jump 32x21.
      // Square 21 is (4, 8).
      const fen = 'W:W32:B27';
      const pos = parseFEN(fen);
      const moves = generateMoves(pos);
      expect(moves.length).toBe(1);
      expect(moves[0].captures.length).toBe(1);
      expect(moves[0].to.row === 4 && moves[0].to.col === 8).toBe(true); // Square 21
    });

    it('should enforce the maximum capture rule', () => {
      // White at 47.
      // Black at 42, 32.
      // Black at 38.
      // Path 1: 47x38 (1 capture)
      // Path 2: 47x33x22 (2 captures)
      // Max rule: MUST take path 2.
      const fen = 'W:W47:B42,32,38';
      const pos = parseFEN(fen);
      const captures = getAvailableCaptures(pos);
      expect(captures.every(c => c.captures.length === 2)).toBe(true);
    });
  });

  describe('King Logic', () => {
    it('should allow flying king moves', () => {
      const fen = 'W:W1K:B'; // White king at square 1 (0, 8)
      const pos = parseFEN(fen);
      const moves = generateMoves(pos);
      // From (0, 8), can move along diagonals
      // (1, 7), (2, 6)... (9, 1) [Square 50]
      // (1, 9) [not a dark square since (1+9=10 is even... wait)]
      // row 1: col 9 is dark? 1+9=10. YES.
      // row 1: col 7 is dark? 1+7=8. YES.
      expect(moves.length).toBeGreaterThan(1);
    });
  });
});
