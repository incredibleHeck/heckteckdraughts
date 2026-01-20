import { describe, it, expect } from 'vitest';
import { Board } from './board';
import { MoveGenerator } from './move-generator';
import { PIECE, BOARD_SIZE } from './constants';
import { parseFEN } from '../utils/fen-parser';

describe('MoveGenerator (High Performance)', () => {
  it('should generate quiet moves for a man', () => {
    const fen = 'W:W32:B1'; 
    const pos = parseFEN(fen);
    const board = new Board(pos);
    
    const moves = MoveGenerator.generateMoves(board);
    
    // Square 32 is (6, 6). 
    // Moves to 27 (5, 7) and 28 (5, 5).
    expect(moves.length).toBe(2);
    expect(moves.some(m => m.to.row === 5 && m.to.col === 7)).toBe(true);
    expect(moves.some(m => m.to.row === 5 && m.to.col === 5)).toBe(true);
  });

  it('should prioritize captures over quiet moves', () => {
    // White man at 32 (6, 6), Black man at 27 (5, 7).
    // White MUST jump to 21 (4, 8).
    const fen = 'W:W32:B27';
    const pos = parseFEN(fen);
    const board = new Board(pos);

    const moves = MoveGenerator.generateMoves(board);
    
    expect(moves.length).toBe(1);
    expect(moves[0].captures.length).toBe(1);
    expect(moves[0].to.row === 4 && moves[0].to.col === 8).toBe(true);
  });

  it('should enforce the maximum capture rule (Corrected)', () => {
    // Setup:
    // White at 47 (9, 7).
    // Path A (2 captures): 
    //   - Capture 42 (8, 6) -> Land 38 (7, 5)
    //   - Capture 33 (6, 4) -> Land 29 (5, 3)
    // Path B (1 capture):
    //   - Capture 41 (8, 8) -> Land 37 (7, 9) -> No more jumps
    //
    // Rule: Must choose Path A.
    
    const fen = 'W:W47:B42,33,41';
    const pos = parseFEN(fen);
    const board = new Board(pos);

    const moves = MoveGenerator.generateMoves(board);
    
    expect(moves.length).toBe(1);
    expect(moves[0].captures.length).toBe(2);
    // Final destination should be 29 (5, 3)
    // 5*10 + 3 = 53? No. Index(5,3)
    // Let's check row/col
    expect(moves[0].to.row).toBe(5);
    expect(moves[0].to.col).toBe(3);
  });

  it('should handle King flying moves', () => {
    const fen = 'W:W1K:B'; // White king at square 1 (0, 9) -- Wait, board map?
    // Square 1 is (0, 9) in standard notation? 
    // Let's check constants.ts logic.
    // Right-to-Left numbering.
    // Row 0, Col 9 (Dark? 0+9=9 odd. No. 0+8=8 Even. Yes).
    // Square 1 is likely (0, 9) or (0, 8).
    // Let's rely on parseFEN to set it up correctly on the board.
    
    const pos = parseFEN(fen);
    const board = new Board(pos);
    
    const moves = MoveGenerator.generateMoves(board);
    expect(moves.length).toBeGreaterThan(5); // Should have many moves along the diagonals
  });
});
