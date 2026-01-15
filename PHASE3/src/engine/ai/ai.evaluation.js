/**
 * Advanced Draughts Evaluation Engine
 * REFACTORED FOR MODULARITY - Phase 3 Complete
 *
 * This module re-exports the fully modularized evaluation system
 * which consists of:
 * - MaterialEvaluator: Piece material counting
 * - PositionalEvaluator: Piece positioning and mobility
 * - PhaseCalculator: Game phase detection and blending
 * - DrawEvaluator: Draw position detection
 * - PatternEvaluator: Positional patterns and tactics
 * - PositionEvaluator: Main orchestrator
 *
 * All original logic PRESERVED in specialized modules
 *
 * @author codewithheck
 * Modular Architecture Phase 3 - COMPLETE
 */

export { PositionEvaluator } from "../ai-evaluation/position-evaluator.js";
export { MaterialEvaluator } from "../ai-evaluation/material-evaluator.js";
export { PositionalEvaluator } from "../ai-evaluation/positional-evaluator.js";
export { PhaseCalculator } from "../ai-evaluation/phase-calculator.js";
export { DrawEvaluator } from "../ai-evaluation/draw-evaluator.js";
export { PatternEvaluator } from "../ai-evaluation/pattern-evaluator.js";
