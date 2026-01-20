import { describe, it, bench } from 'vitest';
import { Board } from './board';
import { SearchEngine } from './search';
import { parseFEN } from '../utils/fen-parser';
import { NegamaxSearch } from './ai-search/negamax-search';
import { PositionEvaluator } from './ai-evaluation/position-evaluator';
import { TranspositionTable as OldTT } from './ai/ai.tt';
import { MoveOrderer as OldOrderer } from './ai/ai.move-ordering';

describe('Performance Benchmark', () => {
  const FEN_START = "W:W31-50:B1-20"; // Standard start
  const FEN_COMPLEX = "W:W32,33,34,35,36,37,38,39,40,42,48:B1,2,3,4,5,6,7,8,9,10,11,12,13,14"; // Randomish
  
  const optimizedEngine = new SearchEngine();
  
  // Setup Legacy Engine for Comparison
  const oldEval = new PositionEvaluator();
  const oldTT = new OldTT();
  const oldOrderer = new OldOrderer();
  const oldNegamax = new NegamaxSearch(oldEval, oldTT, oldOrderer);

  it('New Engine NPS vs Old Engine', async () => {
      const board = new Board(parseFEN(FEN_START));
      const startPos = parseFEN(FEN_START);

      const TIME_LIMIT = 1000;

      // --- OLD ENGINE ---
      const startOld = Date.now();
      let oldNodes = 0;
      // Cannot easily access old engine internals without modifying it, 
      // but we can run a fixed depth search and measure time.
      const depth = 5;
      
      const oldRes = oldNegamax.search(startPos, depth, -Infinity, Infinity);
      const timeOld = Date.now() - startOld;
      const oldNPS = (oldNegamax.nodeCount / timeOld) * 1000;
      console.log(`OLD Engine: Depth ${depth} in ${timeOld}ms. Nodes: ${oldNegamax.nodeCount}. NPS: ${Math.round(oldNPS)}`);

      // --- NEW ENGINE ---
      const startNew = Date.now();
      const newRes = await optimizedEngine.findBestMove(board, depth, Infinity); // Infinity time, fixed depth
      const timeNew = newRes.timeMs;
      const newNPS = (newRes.nodes / timeNew) * 1000;
      console.log(`NEW Engine: Depth ${depth} in ${timeNew}ms. Nodes: ${newRes.nodes}. NPS: ${Math.round(newNPS)}`);
      
      console.log(`Speedup: ${(newNPS / oldNPS).toFixed(2)}x`);
  });
});
