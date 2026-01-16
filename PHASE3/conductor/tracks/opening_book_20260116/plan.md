# Implementation Plan - Implement Opening Book

## Phase 1: Logic Port & Translation [checkpoint: d89ce8a]
- [x] Task: Port `OpeningBook` Class to TypeScript. (e3a7b04)
    - [x] Create `src/utils/opening-book.ts`.
    - [x] Define interfaces for opening data structure.
    - [x] Use static import for `openings.json`.
- [x] Task: Implement Move Translation. (e3a7b04)
    - [x] Port `_translateNotationToMove` logic.
    - [x] Ensure it uses the `SQUARE_NUMBERS` mapping from `src/engine/constants.ts`.
- [x] Task: Write Unit Tests for Opening Book. (e3a7b04)
    - [x] Verify starting move retrieval.
    - [x] Verify variation following (e.g., move 2, 3).
- [ ] Task: Conductor - User Manual Verification 'Logic Port & Translation' (Protocol in workflow.md)

## Phase 2: Engine Integration
- [ ] Task: Integrate Book into `SearchEngine`.
    - [ ] Update `src/engine/ai-search/search-engine.ts` to consult the `OpeningBook` singleton.
    - [ ] Ensure iterative deepening loop is bypassed if a book move is found.
- [ ] Task: Final Verification.
    - [ ] Verify in-browser console that "Opening Book Active" message appears.
    - [ ] Confirm AI plays instantly in the first few moves.
- [ ] Task: Conductor - User Manual Verification 'Engine Integration' (Protocol in workflow.md)
