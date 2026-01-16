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
import { OpeningBook } from "../../utils/opening-book";
import { Move } from "../ai/ai.utils";

export class SearchEngine {
  private negamax: NegamaxSearch;
  private iterative: IterativeDeepening;
  private stats: SearchStats;
  private openingBook: OpeningBook;

  constructor() {
    const evaluator = new PositionEvaluator();
    const tt = new TranspositionTable();
    const orderer = new MoveOrderer();
    
    this.negamax = new NegamaxSearch(evaluator, tt, orderer);
    this.negamax.quiescenceSearch = new QuiescenceSearch(evaluator);
    
    this.iterative = new IterativeDeepening(this.negamax);
    this.stats = new SearchStats(this.negamax, this.iterative);
    this.openingBook = new OpeningBook();
  }

  async findBestMove(position: Position, maxDepth: number, timeLimit: number, history: Move[] | null = null) {
    // Check opening book first
    const bookMove = this.openingBook.findMove(history);
    if (bookMove) {
      console.log('[SearchEngine] Opening Book Hit:', bookMove);
      return {
        move: bookMove,
        score: 0,
        depth: 0,
        stats: { nodes: 0, time: 0, nps: 0, ttHits: 0, selDepth: 0 },
        formattedStats: "Opening Book"
      };
    }

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
