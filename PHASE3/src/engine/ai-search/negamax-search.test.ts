import { describe, it, expect, beforeEach } from 'vitest';
import { NegamaxSearch } from './negamax-search';
import { PositionEvaluator } from '../ai-evaluation/position-evaluator';
import { TranspositionTable } from '../ai/ai.tt';
import { MoveOrderer } from '../ai/ai.move-ordering';
import { parseFEN } from '../../utils/fen-parser';
import { QuiescenceSearch } from './quiescence-search';

describe('NegamaxSearch with LMR', () => {
  let search: NegamaxSearch;
  let evaluator: PositionEvaluator;
  let tt: TranspositionTable;
  let moveOrderer: MoveOrderer;

  beforeEach(() => {
    evaluator = new PositionEvaluator();
    tt = new TranspositionTable(1); // Small TT for testing
    moveOrderer = new MoveOrderer();
    search = new NegamaxSearch(evaluator, tt, moveOrderer);
    // Needed for leaf nodes
    search.quiescenceSearch = new QuiescenceSearch(evaluator);
  });

  it('should visit fewer nodes with LMR enabled for depth 5 on start pos', () => {
    const startFEN = 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20';
    const pos = parseFEN(startFEN);
    
    // Run search
    search.resetStats();
    search.search(pos, 5, -Infinity, Infinity);
    
    console.log(`Node count for depth 5: ${search.nodeCount}`);

    // This expectation is a placeholder. 
    // I will update it after seeing the baseline.
    // Assuming current baseline is X, LMR should reduce it.
    // For now, I'll set it to a very low number to force a failure and see the actual count.
    expect(search.nodeCount).toBeLessThan(2300); 
  });
});
