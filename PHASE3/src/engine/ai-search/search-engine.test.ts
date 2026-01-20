import { describe, it, expect, beforeEach } from 'vitest';
import { SearchEngine } from './search-engine';
import { parseFEN } from '../../utils/fen-parser';

describe('SearchEngine', () => {
  let engine: SearchEngine;

  beforeEach(() => {
    engine = new SearchEngine();
  });

  it('should find a best move for the starting position', async () => {
    const startFEN = 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20';
    const pos = parseFEN(startFEN);
    
    const result = await engine.findBestMove(pos, 4, 2000);
    expect(result.move).not.toBeNull();
    expect(result.stats.nodes).toBeGreaterThan(0);
  });

  it('should use opening book for starting position', async () => {
    const startFEN = 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20';
    const pos = parseFEN(startFEN);
    
    // Pass empty history, should trigger book
    const result = await engine.findBestMove(pos, 4, 2000, []);
    expect(result.formattedStats).toContain('Opening Book');
    expect(result.stats.nodes).toBeGreaterThanOrEqual(0);
  });

  it('should find a forced capture', async () => {
    // White at 32, Black at 27. White MUST capture.
    const fen = 'W:W32:B27';
    const pos = parseFEN(fen);
    
    const result = await engine.findBestMove(pos, 4, 2000);
    // Square 32 is (6,6), Square 21 is (4,8). Coords based on mapping.
    expect(result.move?.from.row).toBe(6);
    expect(result.move?.to.row).toBe(4);
    expect(result.move?.captures.length).toBe(1);
  });

  it('should use PN-Solver for endgames', async () => {
    // White 32, Black 27. 2 pieces total. PN-Solver should find the win.
    const fen = 'W:W32:B27';
    const pos = parseFEN(fen);
    
    const result = await engine.findBestMove(pos, 4, 2000);
    expect(result.formattedStats).toContain('PN-Solver');
    expect(result.score).toBeGreaterThanOrEqual(10000);
  });
});
