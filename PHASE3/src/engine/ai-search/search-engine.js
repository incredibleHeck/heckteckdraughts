/**
 * Search Engine - Orchestrator
 * Main search interface that coordinates all search components
 *
 * Components orchestrated:
 * - NegamaxSearch: Core recursive algorithm
 * - QuiescenceSearch: Quiet position search
 * - IterativeDeepening: Depth iteration and time management
 * - SearchStats: Performance tracking
 *
 * @author codewithheck
 * AI Search Refactor - Modular Architecture
 */

import { NegamaxSearch } from "./search-negamax.js";
import { QuiescenceSearch } from "./search-quiescence.js";
import { IterativeDeepening } from "./search-iterative-deepening.js";
import { SearchStats } from "./search-stats.js";
import { generateMoves } from "../ai/ai.utils.js";

export class SearchEngine {
  constructor(evaluator, transpositionTable, moveOrderer) {
    // Initialize specialized search components
    this.negamaxSearch = new NegamaxSearch(
      evaluator,
      transpositionTable,
      moveOrderer
    );
    this.quiescenceSearch = new QuiescenceSearch(evaluator);
    this.iterativeDeepening = new IterativeDeepening(
      this.negamaxSearch,
      moveOrderer
    );
    this.stats = new SearchStats(this.negamaxSearch, this.iterativeDeepening);

    // Inject quiescence into negamax
    this.negamaxSearch.quiescenceSearch = this.quiescenceSearch;

    console.log("SearchEngine initialized with modular components");
  }

  /**
   * Main entry point - Iterative deepening search
   */
  async search(position, maxDepth, timeLimit, startTime) {
    this.stats.startTimer();
    const result = await this.iterativeDeepening.search(
      position,
      maxDepth,
      timeLimit,
      startTime
    );
    this.stats.stopTimer();
    return result;
  }

  /**
   * Advanced search with full diagnostics
   */
  async advancedSearch(position, depth, timeLimit, startTime) {
    this.stats.startTimer();
    const result = await this.iterativeDeepening.advancedSearch(
      position,
      depth,
      timeLimit,
      startTime
    );
    this.stats.stopTimer();
    return result;
  }

  /**
   * Parallel search simulation (for future enhancement)
   */
  async parallelSearch(position, depth, timeLimit, threads = 1) {
    // For now, just call regular search
    return this.search(position, depth, timeLimit, Date.now());
  }

  /**
   * Get search statistics
   */
  getSearchStats() {
    return this.stats.getStats();
  }

  /**
   * Benchmark search performance
   */
  benchmark(position, depth = 6) {
    return this.stats.benchmark(position, depth);
  }

  /**
   * Get benchmark report for multiple depths
   */
  getBenchmarkReport(position, depths = [4, 6, 8]) {
    return this.stats.getBenchmarkReport(position, depths);
  }

  /**
   * Get efficiency analysis
   */
  getEfficiencyAnalysis() {
    return this.stats.getEfficiencyAnalysis();
  }

  /**
   * Abort current search
   */
  abortSearch() {
    this.iterativeDeepening.abortSearch();
  }

  /**
   * Reset search state
   */
  reset() {
    this.iterativeDeepening.reset();
    this.stats.reset();
  }

  /**
   * Set search parameters
   */
  setSearchParameters(params) {
    this.negamaxSearch.setSearchParameters(params);
  }

  /**
   * Get formatted statistics for display
   */
  getFormattedStats() {
    return this.stats.formatStats();
  }

  /**
   * Get node count
   */
  getNodeCount() {
    return this.negamaxSearch.getNodeCount();
  }

  /**
   * Get selective depth (quiescence depth)
   */
  getSelectiveDepth() {
    return this.negamaxSearch.getSelectiveDepth();
  }
}
