# Track Specification: Legacy Engine & Board Migration

## Overview
This track focuses on migrating the core draughts engine and board logic from the `legacy/src` directory to the modern `src` directory, converting all logic to TypeScript and integrating the board view into React.

## Functional Requirements
- **Engine Migration:** Convert all engine logic (AI, Move Validation, Search, Evaluation) from vanilla JavaScript to strict TypeScript.
- **10x10 Board Component:** Implement a responsive React `Board` component that renders the 10x10 grid.
- **Piece Rendering:** Port the GPU-accelerated piece rendering logic to React, using CSS Transforms for smooth movement.
- **Rule Enforcement:** Ensure the International Draughts rules (Majority Capture, King movement) are correctly enforced in the ported code.
- **Legacy Cleanup:** Remove redundant files (e.g., `.js.backup`, `dom-helpers.js` if replaced by React) and consolidate logic where it makes sense while maintaining the one-to-one mapping for core logic.

## Technical Details
- **Location:** Engine logic moves to `src/engine/`, Board components move to `src/components/board/`.
- **Type Safety:** Define interfaces for `Piece`, `BoardState`, `Move`, and `GameConfiguration`.
- **Performance:** Maintain the "Zero-Reflow" pattern by using absolute positioning and CSS Transforms for pieces.

## Acceptance Criteria
- [ ] All engine files are converted to `.ts` and compile without errors.
- [ ] The React `Board` component renders a 10x10 grid accurately.
- [ ] Pieces can be placed on the board via the new React state.
- [ ] Move validation logic from legacy code correctly identifies valid/invalid moves in the new environment.
- [ ] Redundant legacy files are removed from the migration path.
