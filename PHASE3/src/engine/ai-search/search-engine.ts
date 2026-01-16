/**
 * AI Search Engine Orchestrator
 */

import { PositionEvaluator } from "../ai-evaluation/position-evaluator";
import { TranspositionTable } from "../ai/ai.tt";
import { MoveOrderer } from "../ai/ai.move-ordering";
import { NegamaxSearch } from "./negamax-search";
import { QuiescenceSearch } from "./quiescence-search";
import { IterativeDeepening } from "./search-iterative-deepening";
import { SearchStats } from "./search-stats";
import { Position } from "../../utils/fen-parser";

export class SearchEngine {
  private negamax: NegamaxSearch;
  private iterative: IterativeDeepening;
  private stats: SearchStats;

  constructor() {
    const evaluator = new PositionEvaluator();
    const tt = new TranspositionTable();
    const orderer = new MoveOrderer();
    
    this.negamax = new NegamaxSearch(evaluator, tt, orderer);
    this.negamax.quiescenceSearch = new QuiescenceSearch(evaluator);
    
    this.iterative = new IterativeDeepening(this.negamax);
    this.stats = new SearchStats(this.negamax, this.iterative);
  }

  async findBestMove(position: Position, maxDepth: number, timeLimit: number) {
    this.stats.startTimer();
    const result = await this.iterative.search(position, maxDepth, timeLimit, Date.now());
    this.stats.stopTimer();
    
    return {
      ...result,
      stats: this.stats.getStats(),
      formattedStats: this.stats.formatStats()
    };
  }

  abort() {
    this.iterative.abortSearch();
  }
}
