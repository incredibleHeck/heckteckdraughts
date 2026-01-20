# Implementation Plan - Project Detox

## Phase 1: The Purge (Housekeeping)
Remove the dead code to clear the path for refactoring.

- [x] **Step 1: Delete Legacy Directories**
    -   Delete `src/engine/ai`
    -   Delete `src/engine/ai-search`
    -   Delete `src/engine/ai-evaluation`
    -   *Verification:* Ensure `npm run build` and `npm test` still pass (verifying no imports point to dead code).
    -   [checkpoint: 21b5856]

## Phase 2: Architectural Decoupling
Break the "God Component" (`App.tsx`) into manageable pieces.

- [x] **Step 2: Create `useGameController` Hook**
    -   Create `src/hooks/useGameController.ts`.
    -   Move state: `game`, `pieces`, `selectedSquare`, `highlights`, `moveHistory`.
    -   Move logic: `handleSquareClick`, `handleMoveAttempt`, `undo`, `reset`.
    -   Move AI integration: `useEngine` connection and `useEffect` triggers for AI moves.

- [x] **Step 3: Refactor `App.tsx`**
    -   Replace inline logic in `App.tsx` with a single call to `useGameController`.
    -   Ensure `App.tsx` is strictly responsible for layout (rendering `MainLayout`, `Board`, `Panels`).

## Phase 3: Visual Polish
Implement true GPU acceleration for piece rendering.

- [~] **Step 4: Optimize `Piece` Rendering**
    -   Update `Piece.tsx` to calculate `transform: translate(...)` strings based on row/col.
    -   Remove `top` / `left` positioning.
    -   Ensure `will-change: transform` is correctly applied.
    -   *Verification:* Animation should feel smoother on mobile/lower-end devices.

## Phase 4: Verification

- [ ] **Step 5: Final System Check**
    -   Run full test suite.
    -   Manual playtest to ensure Game/AI/UI loop is unbroken.
