import { describe, it, expect, beforeEach } from 'vitest';
import { PNSearch } from './pn-search';
import { parseFEN } from '../../utils/fen-parser';

describe('PNSearch', () => {
  let search: PNSearch;

  beforeEach(() => {
    search = new PNSearch();
  });

  it('should solve a simple 1-move win', () => {
    // White to move, can capture Black's only piece
    // W:W32:B27 -> White 32x21 (win)
    const fen = 'W:W32:B27';
    const pos = parseFEN(fen);
    
    const result = search.solve(pos);
    expect(result.score).toBeGreaterThan(0); // Win for White
    expect(result.bestMove).not.toBeNull();
  });

  it('should solve a simple 1-move loss', () => {
    // White to move, White is trapped.
    // 48(9,5) is blocked by 42(8,4) and 43(8,6).
    // Jumps to 37(7,3) and 39(7,7) are blocked by Black pieces there.
    const fen = 'W:W48:B42,43,37,39'; 
    const pos = parseFEN(fen);
    
    const result = search.solve(pos);
    expect(result.score).toBeLessThan(0); // Loss for White
  });
});
