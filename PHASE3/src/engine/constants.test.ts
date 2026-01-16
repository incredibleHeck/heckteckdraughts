import { describe, it, expect } from 'vitest';
import { isDarkSquare, SQUARE_NUMBERS, BOARD_SIZE } from './constants';

describe('Constants and Mapping', () => {
  it('should correctly identify dark squares', () => {
    // Row 0, Col 0 is dark (0+0=0, even)
    expect(isDarkSquare(0, 0)).toBe(true);
    // Row 0, Col 1 is light
    expect(isDarkSquare(0, 1)).toBe(false);
  });

  it('should have 50 numbered dark squares', () => {
    const numberedSquares = Array.from(SQUARE_NUMBERS).filter(n => n > 0);
    expect(numberedSquares.length).toBe(50);
  });

  it('should map (0, 8) to square 1 (Top-Right-most dark square on flipped board)', () => {
    // row 0, col 8 is the first dark square from the right (col 9 is light)
    expect(SQUARE_NUMBERS[0 * BOARD_SIZE + 8]).toBe(1);
  });

  it('should map (0, 6) to square 2', () => {
    expect(SQUARE_NUMBERS[0 * BOARD_SIZE + 6]).toBe(2);
  });

  it('should map (9, 1) to square 50 (Bottom-Left-most dark square on flipped board)', () => {
    // row 9, col 1 is dark (9+1=10), col 0 is light (9+0=9)
    expect(SQUARE_NUMBERS[9 * BOARD_SIZE + 1]).toBe(50);
  });
});
