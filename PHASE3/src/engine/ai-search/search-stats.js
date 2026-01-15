/**
 * Search Statistics & Diagnostics
 * Tracks performance metrics and search diagnostics
 *
 * Features:
 * - Node counting
 * - Nodes per second calculation
 * - Time tracking
 * - Benchmarking
 * - Search depth analysis
 *
 * @author codewithheck
 * AI Search Refactor - Modular Architecture
 */

export class SearchStats {
  constructor(negamaxSearch, iterativeDeepening) {
    this.negamaxSearch = negamaxSearch;
    this.iterativeDeepening = iterativeDeepening;
    this.searchStartTime = 0;
    this.searchEndTime = 0;
  }

  /**
   * Get comprehensive search statistics
   */
  getStats() {
    const elapsed = this.searchEndTime - this.searchStartTime;
    const nodeCount = this.negamaxSearch.getNodeCount();
    const nps = elapsed > 0 ? Math.floor(nodeCount / (elapsed / 1000)) : 0;

    return {
      nodes: nodeCount,
      time: elapsed,
      nodesPerSecond: nps,
      selectiveDepth: this.negamaxSearch.getSelectiveDepth(),
      transpositionTable: this.negamaxSearch.tt.getStats(),
    };
  }

  /**
   * Benchmark search performance
   */
  benchmark(position, depth = 6) {
    this.searchStartTime = Date.now();
    this.negamaxSearch.resetStats();

    this.negamaxSearch.negamax(
      position,
      depth,
      -Infinity,
      Infinity,
      this.searchStartTime,
      this.searchStartTime + 60000,
      0
    );

    this.searchEndTime = Date.now();

    return this.getStats();
  }

  /**
   * Get benchmark report
   */
  getBenchmarkReport(position, depths = [4, 6, 8]) {
    const report = [];

    for (const depth of depths) {
      const stats = this.benchmark(position, depth);
      report.push({
        depth,
        ...stats,
      });
    }

    return report;
  }

  /**
   * Analyze search efficiency
   */
  getEfficiencyAnalysis() {
    const stats = this.getStats();

    return {
      nodeCount: stats.nodes,
      timeMs: stats.time,
      nodesPerSecond: stats.nodesPerSecond,
      effectiveBranchingFactor: this.calculateEBF(
        stats.nodes,
        stats.selectiveDepth
      ),
      averageTimePerNode: stats.nodes > 0 ? stats.time / stats.nodes : 0,
    };
  }

  /**
   * Calculate effective branching factor
   * EBF ≈ n^(1/d) where n is nodes and d is depth
   */
  calculateEBF(nodes, depth) {
    if (nodes <= 1 || depth <= 0) return 1;
    return Math.pow(nodes, 1 / depth);
  }

  /**
   * Get search progress message
   */
  getProgressMessage(depth, score, nodes, time) {
    const nps = time > 0 ? Math.floor(nodes / (time / 1000)) : 0;

    return `Depth: ${depth} | Score: ${score.toFixed(
      0
    )} | Nodes: ${nodes.toLocaleString()} | NPS: ${nps.toLocaleString()} | Time: ${time}ms`;
  }

  /**
   * Reset statistics
   */
  reset() {
    this.negamaxSearch.resetStats();
    this.searchStartTime = 0;
    this.searchEndTime = 0;
  }

  /**
   * Start timing
   */
  startTimer() {
    this.searchStartTime = Date.now();
  }

  /**
   * Stop timing
   */
  stopTimer() {
    this.searchEndTime = Date.now();
  }

  /**
   * Get elapsed time
   */
  getElapsedTime() {
    return this.searchEndTime - this.searchStartTime;
  }

  /**
   * Format statistics for display
   */
  formatStats() {
    const stats = this.getStats();

    return {
      "Total Nodes": stats.nodes.toLocaleString(),
      "Time (ms)": stats.time,
      "Nodes/sec": stats.nodesPerSecond.toLocaleString(),
      "Selective Depth": stats.selectiveDepth,
      "TT Hits": stats.transpositionTable?.hits || 0,
      "TT Misses": stats.transpositionTable?.misses || 0,
      "Hit Rate": stats.transpositionTable?.hits
        ? (
            (stats.transpositionTable.hits /
              (stats.transpositionTable.hits +
                stats.transpositionTable.misses)) *
            100
          ).toFixed(1) + "%"
        : "N/A",
    };
  }

  /**
   * Compare two search runs
   */
  compareRuns(stats1, stats2) {
    return {
      nodeRatio: stats2.nodes / stats1.nodes,
      timeRatio: stats2.time / stats1.time,
      npsImprovement: (
        ((stats2.nodesPerSecond - stats1.nodesPerSecond) /
          stats1.nodesPerSecond) *
        100
      ).toFixed(1),
      depthImprovement: stats2.selectiveDepth - stats1.selectiveDepth,
    };
  }
}
