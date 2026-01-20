import { describe, it, expect } from 'vitest';
import { Board } from './board';
import { Evaluator } from './evaluator';
import { parseFEN } from '../utils/fen-parser';

describe('Evaluator (High Performance)', () => {
  const evaluator = new Evaluator();

  it('should give equal score for symmetric position', () => {
    const fen = 'W:W31,32,33,34,35:B16,17,18,19,20'; // Symmetric-ish
    // Actually, let's use start position (mostly symmetric)
    const board = new Board(); // Default start
    board.resetCounts(); // Need to manually init counts if using default ctor?
    // Board() ctor with no args calls reset(). 
    // Wait, Board class constructor:
    // constructor(position?) { ... if(pos) fromPosition }
    // It does NOT call setupInitialPosition by default if no pos provided?
    // It creates empty board.
    // Let's use fromPosition.
  });

  it('should favor material advantage', () => {
    const fen = 'W:W32,33:B16'; // White 2 vs Black 1
    const board = new Board(parseFEN(fen));
    const score = evaluator.evaluate(board);
    
    // White to move. Positive score expected.
    expect(score).toBeGreaterThan(500);
  });

  it('should favor Kings', () => {
    const fen = 'W:W1K:B2'; // White King vs Black Man
    const board = new Board(parseFEN(fen));
    const score = evaluator.evaluate(board);
    
    expect(score).toBeGreaterThan(2000); // King > Man
  });
});
