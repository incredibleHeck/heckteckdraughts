import { describe, it, expect } from 'vitest';
import { Board } from './board';
import { SearchEngine } from './search';
import { parseFEN } from '../utils/fen-parser';

describe('SearchEngine (High Performance)', () => {
  const engine = new SearchEngine();

  it('should find a simple winning move (One move mate/win)', async () => {
    // White at 47. Black at 42. (Standard jump)
    // 47x38.
    const fen = 'W:W47:B42'; 
    const board = new Board(parseFEN(fen));
    
    // Depth 3 should be plenty
    const result = await engine.findBestMove(board, 3, 1000);
    
    expect(result.move).toBeDefined();
    // 47 (9, 7) -> 38 (7, 5).
    expect(result.move?.from.row).toBe(9);
    expect(result.move?.from.col).toBe(7);
    expect(result.move?.to.row).toBe(7);
    expect(result.move?.to.col).toBe(5);
  });

  it('should prevent opponent win (Defensive move)', async () => {
     // TODO: Construct a position where Black threatens to win, White must block.
  });
});
