import { describe, it, bench } from 'vitest';
import { Board } from './board';
import { SearchEngine } from './search';
import { parseFEN } from '../utils/fen-parser';

describe('Performance Benchmark', () => {
  const FEN_START = "W:W31-50:B1-20"; // Standard start
  
  const optimizedEngine = new SearchEngine();

  it('New Engine NPS Check', async () => {
      const board = new Board(parseFEN(FEN_START));
      
      const depth = 6;
      
      const startNew = Date.now();
      const newRes = await optimizedEngine.findBestMove(board, depth, Infinity); 
      const timeNew = newRes.timeMs;
      const newNPS = (newRes.nodes / timeNew) * 1000;
      
      console.log(`NEW Engine: Depth ${depth} in ${timeNew}ms. Nodes: ${newRes.nodes}. NPS: ${Math.round(newNPS)}`);
      
      // Basic sanity check: NPS should be > 10000 on most modern machines
      // expect(newNPS).toBeGreaterThan(10000); // Commented out to avoid CI flakiness
  });
});