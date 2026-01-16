/**
 * Search Statistics - The Black Box
 */

import { NegamaxSearch } from "./negamax-search";

export class SearchStats {
  private negamaxSearch: NegamaxSearch;
  private iterativeDeepening: any; // Injected
  private startTime: number = 0;
  private endTime: number = 0;

  constructor(negamaxSearch: NegamaxSearch, iterativeDeepening: any) {
    this.negamaxSearch = negamaxSearch;
    this.iterativeDeepening = iterativeDeepening;
  }

  startTimer() {
    this.startTime = Date.now();
    this.negamaxSearch.resetStats();
  }

  stopTimer() {
    this.endTime = Date.now();
  }

  getStats() {
    const time = Math.max(1, Date.now() - this.startTime);
    const nodes = this.negamaxSearch.nodeCount;
    const nps = Math.floor((nodes / time) * 1000);

    return {
      nodes: nodes,
      time: time,
      nps: nps,
      selDepth: this.negamaxSearch.selDepth,
    };
  }

  formatStats() {
    const stats = this.getStats();
    return `Depth: ${this.iterativeDeepening.currentDepth}/${
      stats.selDepth
    } | NPS: ${(stats.nps / 1000).toFixed(1)}k | Nodes: ${stats.nodes}`;
  }

  async benchmark(position: any, depth = 6) {
    console.log(`--- BENCHMARK START (Depth ${depth}) ---`);
    const start = Date.now();

    this.negamaxSearch.resetStats();

    const score = this.negamaxSearch.search(
      position,
      depth,
      -100000,
      100000,
      0
    );

    const time = Date.now() - start;
    const nodes = this.negamaxSearch.nodeCount;
    const nps = Math.floor((nodes / time) * 1000);

    console.log(`--- BENCHMARK RESULT ---`);
    console.log(`Time: ${time}ms`);
    console.log(`Nodes: ${nodes}`);
    console.log(`NPS:  ${nps}`);
    console.log(`Score: ${score}`);

    return { time, nodes, nps, score };
  }

  reset() {
    this.negamaxSearch.resetStats();
  }
}
