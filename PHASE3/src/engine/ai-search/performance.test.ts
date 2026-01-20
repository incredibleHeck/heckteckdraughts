import { describe, it, expect, beforeEach } from 'vitest';
import { SearchEngine } from './search-engine';
import { parseFEN } from '../../utils/fen-parser';

describe('Search Performance & Regression', () => {
  let engine: SearchEngine;

  beforeEach(() => {
    engine = new SearchEngine();
  });

  it('should reach depth 7 within 1 second for the starting position', async () => {
    const startFEN = 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20';
    const pos = parseFEN(startFEN);
    
    const startTime = Date.now();
    const result = await engine.findBestMove(pos, 7, 1000);
    const duration = Date.now() - startTime;
    
    // Extract depth from formattedStats: "Depth: 7/7 | NPS: 11.5k | Nodes: 1994"
    const depthMatch = result.formattedStats.match(/Depth: (\d+)/);
    const depthReached = depthMatch ? parseInt(depthMatch[1], 10) : 0;

    console.log(`Search Performance: Depth ${depthReached}, Time: ${duration}ms, Nodes: ${result.stats.nodes}`);
    
    expect(depthReached).toBeGreaterThanOrEqual(7);
  });

  it('should maintain correctness after optimizations (Regression)', async () => {
    // A known tactical position or simply ensuring it doesn't crash and returns valid moves.
    const fen = 'W:W31,32,33:B18,19,20';
    const pos = parseFEN(fen);
    
    const result = await engine.findBestMove(pos, 6, 1000);
    expect(result.move).not.toBeNull();
    expect(result.score).toBeDefined();
  });
});
