# Implementation Plan - Opening Book & PDN

## Phase 1: The Opening Book
Connect the existing JSON data to the engine.

- [x] **Step 1: Create Opening Book Class**
    -   Create `src/engine/opening-book.ts`.
    -   Implement a Trie or Hash Map structure to load `src/data/openings.json`.
    -   Implement `findMove(history: Move[]): Move | null`.

- [x] **Step 2: Integrate with Search Engine**
    -   Update `src/engine/search.ts` to check the `OpeningBook` before starting the Negamax search.
    -   Ensure it returns a result immediately if a book move is found.

## Phase 2: PDN Support (Import/Export)
Implement the standard for draughts game storage.

- [x] **Step 3: Implement PDN Generator**
    -   Create `src/utils/pdn-generator.ts`.
    -   Function `generatePDN(game: Game): string`.
    -   Include headers (Event, Date, Black, White) and the move list in standard notation (e.g., `1. 32-28 18-23`).

- [x] **Step 4: Implement PDN Parser**
    -   Create `src/utils/pdn-parser.ts`.
    -   Function `parsePDN(pdn: string): Move[]`.
    -   Handle standard headers and move numbering.

## Phase 3: UI Integration

- [x] **Step 5: Add UI Controls**
    -   Update `MainLayout` or `TopNav` to include "Export PDN" and "Import PDN" buttons.
    -   Connect them to the `useGameController` hook.

## Phase 4: Verification

- [x] **Step 6: Verify & Test**
    -   Unit tests for `OpeningBook` and `PDNGenerator`.
    -   Manual test: Play a game, export it, reload the page, and import it.
    -   [checkpoint: 01c47b7]
