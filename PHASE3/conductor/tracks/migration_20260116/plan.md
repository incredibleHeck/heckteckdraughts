# Implementation Plan - Legacy Engine & Board Migration

## Phase 1: Core Engine & Rule Migration
- [x] Task: Port Constants and Types. (1d8b052)
    - [ ] Create `src/engine/constants.ts` and define shared enums/types (`PIECE`, `PLAYER`, `SQUARE_NUMBERS`).
    - [ ] Write unit tests for coordinate mapping formulas.
- [x] Task: Port FEN Parser. (ecd0369)
    - [ ] Port `legacy/src/utils/fen-parser.js` to `src/utils/fen-parser.ts`.
    - [ ] Write tests for FEN string parsing and generation.
- [x] Task: Port Move Validator. (5c6c755)
    - [ ] Port `legacy/src/engine/game/move-validator.js` to `src/engine/game/move-validator.ts`.
    - [ ] Write comprehensive tests for International Draughts rules (Majority Capture, King movement).
- [ ] Task: Port Game State Logic.
    - [ ] Port `legacy/src/engine/game.js` to `src/engine/game.ts`.
    - [ ] Ensure the "Source of Truth" board state works with the new TypeScript types.
- [ ] Task: Conductor - User Manual Verification 'Core Engine & Rule Migration' (Protocol in workflow.md)

## Phase 2: AI & Evaluation Migration
- [ ] Task: Port Material and Positional Evaluators.
    - [ ] Port files from `legacy/src/engine/ai-evaluation/` to `src/engine/ai-evaluation/`.
    - [ ] Write tests to verify evaluation scores match legacy outputs for specific positions.
- [ ] Task: Port Search Engine (Negamax/Quiescence).
    - [ ] Port files from `legacy/src/engine/ai-search/` to `src/engine/ai-search/`.
    - [ ] Port Search Stats and Engine orchestration.
- [ ] Task: Integrate Web Worker AI.
    - [ ] Update `src/engine/worker/engine.worker.ts` to use the ported AI search logic.
    - [ ] Verify non-blocking AI calculation via the Web Worker bridge.
- [ ] Task: Conductor - User Manual Verification 'AI & Evaluation Migration' (Protocol in workflow.md)

## Phase 3: React Board & View Migration
- [ ] Task: Implement Functional 10x10 Board Component.
    - [ ] Refactor `src/components/board/Board.tsx` to render the 100-square grid using a clean React loop.
    - [ ] Implement square highlighting (Selected, Hint, Last Move) via React state.
- [ ] Task: Implement Piece Renderer.
    - [ ] Create `src/components/board/Piece.tsx`.
    - [ ] Implement CSS Transform-based positioning as defined in the spec.
- [ ] Task: Implement Interaction Logic (Drag & Click).
    - [ ] Add event handlers to the Board and Piece components.
    - [ ] Connect UI events to the Engine's move validation.
- [ ] Task: Conductor - User Manual Verification 'React Board & View Migration' (Protocol in workflow.md)

## Phase 4: Final Integration & Cleanup
- [ ] Task: Sync UI with Engine State.
    - [ ] Connect the `useEngine` hook to the Board and Analysis panels.
    - [ ] Ensure Move History and Evaluation Gauge update in real-time.
- [ ] Task: Final Legacy Cleanup.
    - [ ] Delete `legacy/` files that have been successfully migrated and verified.
    - [ ] Remove any redundant `.backup` or unused helper files.
- [ ] Task: Conductor - User Manual Verification 'Final Integration & Cleanup' (Protocol in workflow.md)
