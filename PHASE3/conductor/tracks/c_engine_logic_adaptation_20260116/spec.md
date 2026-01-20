# Track Specification: C Engine Logic Adaptation

## Overview
This track focuses on analyzing the provided C draughts engine and adapting its advanced logic—specifically search pruning, pattern evaluation, and endgame solving—into our modern TypeScript `SearchEngine`.

## Functional Requirements
- **Advanced Search Pruning:** Adapt sophisticated pruning techniques (Late Move Reductions, Null Move Pruning improvements) from `search.c`.
- **Endgame Solver (PN-Search):** Implement a Proof Number Search module (based on `PNsearch.c`) to identify forced wins/draws in endgame states with fewer pieces.
- **Pattern-Based Evaluation:** Enhance the `PositionEvaluator` with pattern-recognition heuristics (inspired by `patsearch.c`) to better value strategic formations.
- **Weight Porting:** Extract and normalize the evaluation weights from `eval.c` to replace our current heuristic constants with professionally-tuned values.

## Technical Details
- **Architecture:** Keep logic within `src/engine/ai-search/` and `src/engine/ai-evaluation/`.
- **Translation:** Convert C-style bitwise/pointer logic into idiomatic TypeScript. For 10x10 boards, ensure we handle the 100-square state efficiently (possibly using `BigInt` or specialized arrays if needed for bitboards).
- **Learning Logic:** Port the static weights from `learn.c` / `eval.c` rather than implementing a live learning system to ensure immediate and stable performance gains.

## Acceptance Criteria
- [ ] PN-Search correctly solves known winning/drawing endgame positions.
- [ ] AI shows measurable increase in nodes-per-second or reduction in search time for the same depth.
- [ ] Unit tests verify that ported evaluation weights produce scores consistent with the original C engine's logic.
- [ ] No regression in move validation or basic game rules.

## Out of Scope
- Direct compilation of C code (WASM). This track is for porting and adaptation only.
- Network-based learning or global databases.
