/**
 * AI Search Engine - The Thinking Engine
 * REFACTORED FOR MODULARITY - Phase 2 Complete
 *
 * This module re-exports the fully modularized SearchEngine
 * which consists of:
 * - NegamaxSearch: Core recursive search with alpha-beta pruning
 * - QuiescenceSearch: Tactical search for quiet positions
 * - IterativeDeepening: Progressive depth with time management
 * - SearchStats: Performance tracking and diagnostics
 *
 * All original logic PRESERVED in specialized modules
 *
 * @author codewithheck
 * Modular Architecture Phase 2 - COMPLETE
 */

export { SearchEngine } from "../ai-search/search-engine.js";
export { NegamaxSearch } from "../ai-search/search-negamax.js";
export { QuiescenceSearch } from "../ai-search/search-quiescence.js";
export { IterativeDeepening } from "../ai-search/search-iterative-deepening.js";
export { SearchStats } from "../ai-search/search-stats.js";
