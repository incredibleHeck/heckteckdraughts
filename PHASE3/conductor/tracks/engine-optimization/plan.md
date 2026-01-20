# Implementation Plan - Engine Optimization

## Phase 1: Foundation - The Mutable Board
We need a new `Board` class that encapsulates the state and supports mutation.

- [x] **Step 1: Create `Board` Class Structure**
    -   Define `Board` class in `src/engine/board.ts` (new file).
    -   Implement 1D `Int8Array` board representation.
    -   Port basic helpers (`getPiece`, `setPiece`, `isValidSquare`) to work with 1D index.
    -   Implement `isDarkSquare` logic for 1D mapping.

- [x] **Step 2: Port Move Logic to Mutable Pattern**
    -   Implement `doMove(move)`: Apply move, handle captures, promotions.
    -   Implement `undoMove(move)`: Reverse the move (requires storing captured pieces/flags).
    -   *Note:* The `Move` interface might need to be augmented or wrapped to store "captured piece type" for undoing.

- [x] **Step 3: Incremental State Updates**
    -   Integrate Zobrist Hashing into `Board` class.
    -   Update hash in `doMove` (XOR out old, XOR in new) and `undoMove`.
    -   Maintain `materialCount` (White/Black pieces/kings) as properties on `Board`, updating them in `do/undo`.

## Phase 2: Integration - Wiring the Engine
Update the core engine components to use the new `Board` class.

- [x] **Step 4: Update AI Utilities**
    -   Refactor `generateMoves` to accept the new `Board` instance.
    -   Refactor `move-validator` and `capture-handler` if necessary (or replace with optimized internal logic).
    -   [checkpoint: 58a562a]

- [x] **Step 5: Refactor Evaluator**
    -   Update `PositionEvaluator` and its components (`Material`, `Positional`, `Pattern`) to read from the new `Board` class API.
    -   Leverage cached `materialCount` from the Board instance instead of counting again.
    -   [checkpoint: 9a2b3c4]

- [x] **Step 6: Refactor Search Engine**
    -   Update `NegamaxSearch` to use `doMove` / `undoMove`.
    -   **CRITICAL:** Ensure `undoMove` perfectly restores the state (hash, material, board) to match the pre-move state.
    -   Update `TranspositionTable` usage (keys are now readily available on the Board).
    -   [checkpoint: 7f8e9d0]

## Phase 3: Cleanup & Optimization

- [x] **Step 7: Connect to Game Controller**
    -   Update the main `Game` class (orchestrator) to use the new `Board` internally.
    -   Ensure the UI still receives the necessary data structure (may need a `to2DArray()` method for React compatibility).
    -   [checkpoint: 615b926]

- [x] **Step 8: Verification & Benchmarking**
    -   Run unit tests to verify move correctness.
    -   Run performance benchmark to measure NPS improvement.
    -   [checkpoint: 01f6071]
