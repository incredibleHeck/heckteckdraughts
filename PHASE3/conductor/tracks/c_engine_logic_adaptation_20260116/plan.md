# Implementation Plan - C Engine Logic Adaptation

## Phase 1: Evaluation & Weights Porting [checkpoint: be46be6]
- [x] Task: Extract and Port Evaluation Weights. (cb89005)
    - [x] Analyze `eval.c` and `learn.c` in the C engine to identify weight tables.
    - [x] Implement a weight normalization utility to map C-engine values to our `PositionEvaluator`.
    - [x] Update `src/engine/ai-evaluation/material-evaluator.ts` with new weights.
- [x] Task: Implement Pattern-Based Evaluation. f02e4ae
    - [x] Study `patsearch.c` to identify key draughts patterns (e.g., bridge, hook, center control).
    - [x] Write failing tests for pattern recognition in `src/engine/ai-evaluation/pattern-evaluator.test.ts`.
    - [x] Implement pattern scoring logic in `src/engine/ai-evaluation/pattern-evaluator.ts`.
- [x] Task: Conductor - User Manual Verification 'Evaluation & Weights Porting' (Protocol in workflow.md)

## Phase 2: Advanced Search Pruning
- [x] Task: Implement Late Move Reductions (LMR). c4f9066
    - [ ] Analyze `search.c` for LMR logic and reduction tables.
    - [ ] Write failing tests in `src/engine/ai-search/negamax-search.test.ts` to verify deeper search at same time limit.
    - [ ] Implement LMR in `NegamaxSearch` within `src/engine/ai-search/negamax-search.ts`.
- [ ] Task: Enhanced Null Move Pruning (NMP).
    - [ ] Extract adaptive null-move R values from C engine logic.
    - [ ] Write failing tests for NMP safety.
    - [ ] Implement NMP in `NegamaxSearch`.
- [ ] Task: Conductor - User Manual Verification 'Advanced Search Pruning' (Protocol in workflow.md)

## Phase 3: Endgame Solver (PN-Search)
- [ ] Task: Port PN-Search Core.
    - [ ] Analyze `PNsearch.c` to understand the node structure and proof/disproof number updates.
    - [ ] Create `src/engine/ai-search/pn-search.ts`.
    - [ ] Write failing tests for simple 3-piece endgame solutions in `src/engine/ai-search/pn-search.test.ts`.
    - [ ] Implement PN-Search logic.
- [ ] Task: Integrate PN-Search into Search Engine.
    - [ ] Update `src/engine/ai-search/search-engine.ts` to trigger PN-search when piece count is low.
    - [ ] Verify seamless transition from Negamax to PN-solver.
- [ ] Task: Conductor - User Manual Verification 'Endgame Solver (PN-Search)' (Protocol in workflow.md)

## Phase 4: Final Integration & Performance Tuning
- [ ] Task: Benchmarking and Regression Testing.
    - [ ] Compare search depth and nps between old and new AI versions.
    - [ ] Verify no regressions in standard move execution.
- [ ] Task: Cleanup and Documentation.
    - [ ] Document the ported algorithms and their origins from the C engine.
- [ ] Task: Conductor - User Manual Verification 'Final Integration & Performance Tuning' (Protocol in workflow.md)
